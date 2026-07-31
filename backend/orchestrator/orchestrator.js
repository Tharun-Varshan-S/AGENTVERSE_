const Incident = require('../models/Incident');
const PipelineLog = require('../models/PipelineLog');
const KnowledgeBase = require('../models/KnowledgeBase');
const intakeAgent = require('../agents/intakeAgent');
const routingAgent = require('../agents/routingAgent');
const draftingAgent = require('../agents/draftingAgent');
const escalationAgent = require('../agents/escalationAgent');
const trackingAgent = require('../agents/trackingAgent');
const orchestratorEngine = require('./orchestratorEngine');
const { broadcastEvent } = require('../websocket/socketServer');
const featureFlags = require('../config/featureFlags');

// Phase 3 (CivicResolve v2): new, optional agents — each individually
// flag-gated (see config/featureFlags.js), all off by default.
const understandingAgent = require('../agents/understandingAgent');
const classificationAgent = require('../agents/classificationAgent');
const priorityAgent = require('../agents/priorityAgent');
const policyValidationAgent = require('../agents/policyValidationAgent');
const duplicateDetectionAgent = require('../agents/duplicateDetectionAgent');
const qualityReviewAgent = require('../agents/qualityReviewAgent');

/**
 * Runs one of the Phase 3 optional agents through the same
 * orchestratorEngine.executeAgentStep() path as the 5 mandatory stages
 * (identical logging/WS/event-bus/agent-runtime instrumentation), but never
 * lets a failure here reach the outer pipeline try/catch: these stages are
 * additive enhancements, not requirements, so a bug or timeout in one of
 * them must never fail a citizen's complaint submission. Returns null when
 * the flag is off (no-op, no DB round-trip) or when the stage itself fails.
 */
async function runOptionalStage(flagName, incidentId, agentName, agentFn, logInput, onHumanProgressCallback, customLogs) {
  if (!featureFlags.isEnabled(flagName)) return null;
  try {
    return await orchestratorEngine.executeAgentStep(incidentId, agentName, agentFn, logInput, onHumanProgressCallback, customLogs);
  } catch (err) {
    console.warn(`[Central Orchestrator] Optional stage '${agentName}' failed non-fatally: ${err.message}`);
    return null;
  }
}

/**
 * Primary Central Multi-Agent Orchestrator Engine.
 * Agents NEVER call each other directly. Only the Orchestrator sequences execution.
 */
async function executeOrchestrationPipeline(rawInput, onHumanProgressCallback = null) {
  const pipelineStartTime = Date.now();
  console.log("=======================================================================");
  console.log("[Central Orchestrator] Starting Sequential Multi-Agent Execution...");
  console.log("=======================================================================");

  // 1. Initialize Incident Record in MongoDB
  let incident = new Incident({ status: "intake" });
  await incident.save();
  console.log(`[Central Orchestrator] Initialized Incident Document: '${incident.incident_id}'`);

  // Create Pipeline Audit Log in Event Store
  const pipelineLog = new PipelineLog({
    incident_id: incident.incident_id,
    pipeline_id: `PIPE-${Date.now()}`,
    status: 'started',
    started_at: new Date(),
    agent_traces: []
  });
  await pipelineLog.save().catch(() => null);

  const emitHumanStep = (stepText, isDone = false) => {
    if (typeof onHumanProgressCallback === 'function') {
      onHumanProgressCallback('human_progress', { text: stepText, isDone });
    }
    broadcastEvent('human_progress', { text: stepText, isDone }, incident.incident_id);
  };

  try {
    // -------------------------------------------------------------------
    // STAGE 1: INTAKE AGENT
    // -------------------------------------------------------------------
    emitHumanStep("Understanding your issue...");

    const intakeResult = await orchestratorEngine.executeAgentStep(
      incident.incident_id,
      "Intake Agent",
      async () => await intakeAgent(incident, rawInput),
      rawInput,
      onHumanProgressCallback,
      ["Parsing multi-modal text and location...", "Extracting intent, category & urgency...", "Evaluating duplicate complaint risks..."]
    );

    incident.intake = intakeResult;
    incident.status = "intake";
    await incident.save();
    emitHumanStep("✓ Complaint Understood", true);

    // -------------------------------------------------------------------
    // OPTIONAL (Phase 3): UNDERSTANDING & CLASSIFICATION AGENTS
    // Both off by default; each independently flag-gated; failures here
    // never fail the citizen's submission (see runOptionalStage above).
    // -------------------------------------------------------------------
    const understandingResult = await runOptionalStage(
      'ENABLE_UNDERSTANDING_AGENT', incident.incident_id, 'Understanding Agent',
      async () => await understandingAgent(intakeResult),
      { description: intakeResult.description, category: intakeResult.issue_category },
      onHumanProgressCallback,
      ['Analyzing incident type & stakeholders...', 'Assessing urgency & sentiment...']
    );

    const classificationResult = await runOptionalStage(
      'ENABLE_CLASSIFICATION_AGENT', incident.incident_id, 'Classification Agent',
      async () => await classificationAgent(intakeResult),
      { description: intakeResult.description, intakeCategory: intakeResult.issue_category },
      onHumanProgressCallback,
      ['Generating candidate categories...', 'Ranking alternatives...']
    );

    // -------------------------------------------------------------------
    // STAGE 2: ROUTING AGENT & MUNICIPAL KNOWLEDGE BASE SEARCH
    // -------------------------------------------------------------------
    emitHumanStep("Finding responsible department...");

    // Query Knowledge Base for exact category match
    const kbMatch = await KnowledgeBase.findOne({ category: intakeResult.issue_category }).catch(() => null);

    const routingResult = await orchestratorEngine.executeAgentStep(
      incident.incident_id,
      "Routing Agent",
      async () => await routingAgent(incident),
      { category: intakeResult.issue_category, address: intakeResult.location?.address, kb: kbMatch },
      onHumanProgressCallback,
      ["Querying Municipal Knowledge Base...", "Matching jurisdictional ward & officer role...", "Calculating SLA deadlines & official portal references..."]
    );

    incident.routing = routingResult;
    incident.status = "routed";
    await incident.save();
    emitHumanStep("✓ Department Matched", true);

    // -------------------------------------------------------------------
    // OPTIONAL (Phase 3): PRIORITY, POLICY VALIDATION & DUPLICATE DETECTION
    // Off by default; each independently flag-gated; failures here never
    // fail the citizen's submission (see runOptionalStage above).
    // -------------------------------------------------------------------
    const priorityResult = await runOptionalStage(
      'ENABLE_PRIORITY_AGENT', incident.incident_id, 'Priority Agent',
      async () => await priorityAgent({ intakeResult, routingResult }),
      { category: intakeResult.issue_category, routingSeverity: routingResult.severity },
      onHumanProgressCallback,
      ['Scoring weighted priority signals...', 'Renormalizing for unavailable signals...']
    );

    const policyValidationResult = await runOptionalStage(
      'ENABLE_POLICY_VALIDATION_AGENT', incident.incident_id, 'Policy Validation Agent',
      async () => await policyValidationAgent(intakeResult),
      { description: intakeResult.description },
      onHumanProgressCallback,
      ['Validating required fields...', 'Checking for PII & prompt injection...', 'Checking content-safety keywords...']
    );

    const duplicateDetectionResult = await runOptionalStage(
      'ENABLE_DUPLICATE_DETECTION_AGENT', incident.incident_id, 'Duplicate Detection Agent',
      async () => await duplicateDetectionAgent({ intakeResult, incidentId: incident.incident_id }),
      { category: intakeResult.issue_category },
      onHumanProgressCallback,
      ['Querying same-category recent complaints...', 'Scoring signal agreement...']
    );

    // -------------------------------------------------------------------
    // STAGE 3: DRAFTING AGENT (GOVERNMENT NOTICE FORMULATION)
    // -------------------------------------------------------------------
    emitHumanStep("Preparing official complaint...");

    const draftResult = await orchestratorEngine.executeAgentStep(
      incident.incident_id,
      "Drafting Agent",
      async () => await draftingAgent(incident),
      { category: intakeResult.issue_category, department: routingResult.department, severity: routingResult.severity },
      onHumanProgressCallback,
      ["Formulating government-tone complaint notice...", "Injecting SLA target directives...", "Extracting key location entities..."]
    );

    incident.draft = draftResult;
    incident.status = "drafted";
    await incident.save();
    emitHumanStep("✓ Official Notice Drafted", true);

    // -------------------------------------------------------------------
    // STAGE 4: ESCALATION AGENT (EMERGENCY SCORING & ZONAL DIRECTIVE)
    // -------------------------------------------------------------------
    emitHumanStep("Checking urgency & safety rules...");

    const escalationResult = await orchestratorEngine.executeAgentStep(
      incident.incident_id,
      "Escalation Agent",
      async () => await escalationAgent(incident),
      { category: intakeResult.issue_category, severity: routingResult.severity, description: intakeResult.description },
      onHumanProgressCallback,
      ["Evaluating emergency keyword triggers (fire, hospital, flood, hazard)...", "Determining supervisory escalation authority...", "Structuring zonal notice directive..."]
    );

    incident.escalation = escalationResult;
    await incident.save();
    emitHumanStep("✓ Urgency Assessed", true);

    // -------------------------------------------------------------------
    // OPTIONAL (Phase 3): QUALITY REVIEW AGENT
    // Off by default; failures here never fail the citizen's submission
    // (see runOptionalStage above). Informational only in this phase — does
    // not block submission (that requires the Workflow Engine's
    // HUMAN_REVIEW routing, introduced in a later phase).
    // -------------------------------------------------------------------
    const qualityReviewResult = await runOptionalStage(
      'ENABLE_QUALITY_REVIEW_AGENT', incident.incident_id, 'Quality Review Agent',
      async () => await qualityReviewAgent({ intakeResult, routingResult, draftResult, policyValidationResult }),
      { department: routingResult.department },
      onHumanProgressCallback,
      ['Checking completeness & consistency...', 'Checking policy, formatting & confidence...']
    );

    // -------------------------------------------------------------------
    // STAGE 5 & 6: SUBMISSION SERVICE & TRACKING AGENT
    // -------------------------------------------------------------------
    emitHumanStep("Submitting complaint...");

    const trackingResult = await orchestratorEngine.executeAgentStep(
      incident.incident_id,
      "Submission & Tracking Agent",
      async () => await trackingAgent(incident),
      { incident_id: incident.incident_id, reference_number: draftResult.reference_number },
      onHumanProgressCallback,
      ["Simulating submission to Municipal Grievance Portal...", "Assigning Tracking ID & QR payload...", "Activating Swiggy/Amazon-style progress timeline..."]
    );

    incident.tracking = trackingResult;
    if (trackingResult.qr_code_data) {
      incident.qr_code_data = trackingResult.qr_code_data;
    }
    incident.status = "submitted";
    await incident.save();
    emitHumanStep("✓ Complaint Registered", true);

    // Finalize Pipeline Event Log
    const totalMs = Date.now() - pipelineStartTime;
    pipelineLog.status = 'completed';
    pipelineLog.completed_at = new Date();
    pipelineLog.total_duration_ms = totalMs;
    await pipelineLog.save().catch(() => null);

    console.log("=======================================================================");
    console.log(`[Central Orchestrator Success] Execution Complete (${totalMs}ms) for '${incident.incident_id}'`);
    console.log("=======================================================================\n");

    return incident;

  } catch (err) {
    console.error(`[Central Orchestrator Critical Error] Pipeline halted: ${err.message}`);
    incident.status = "failed";
    await incident.save();

    pipelineLog.status = 'failed';
    pipelineLog.completed_at = new Date();
    await pipelineLog.save().catch(() => null);

    throw err;
  }
}

module.exports = {
  executeOrchestrationPipeline
};
