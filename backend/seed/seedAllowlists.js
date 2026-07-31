const connectDB = require('../config/db');
const { disconnectDB } = connectDB;
const CapabilityAllowlist = require('../models/CapabilityAllowlist');

/**
 * Declares what each EXISTING agent is actually observed to use today
 * (read from the real agent source, not aspirational): intakeAgent.js calls
 * Gemini (LLM) and Nominatim (geocoding); routingAgent.js calls Gemini and
 * reads the Department model; draftingAgent.js only calls Gemini;
 * escalationAgent.js only calls Gemini (its REST fallback is the same LLM
 * capability, not a separate external API); trackingAgent.js is pure
 * deterministic logic (no capabilities/services/external APIs); nodes.js's
 * Translation Agent calls Gemini for translation.
 */
const allowlists = [
  {
    agent_type: 'intake_agent',
    capabilities: ['LLM'],
    services: [],
    external_apis: ['Nominatim Reverse Geocoding']
  },
  {
    agent_type: 'routing_agent',
    capabilities: ['LLM'],
    services: [{ service: 'DepartmentRepository', operations: ['findOne'] }],
    external_apis: []
  },
  {
    agent_type: 'drafting_agent',
    capabilities: ['LLM'],
    services: [],
    external_apis: []
  },
  {
    agent_type: 'escalation_agent',
    capabilities: ['LLM'],
    services: [],
    external_apis: []
  },
  {
    agent_type: 'submission_&_tracking_agent',
    capabilities: [],
    services: [],
    external_apis: []
  },
  {
    agent_type: 'translation_agent',
    capabilities: ['LLM', 'Translation'],
    services: [],
    external_apis: []
  },

  // Phase 3 (new agents, all optional/flag-gated)
  {
    agent_type: 'understanding_agent',
    capabilities: ['LLM'],
    services: [],
    external_apis: []
  },
  {
    agent_type: 'classification_agent',
    capabilities: ['LLM'],
    services: [],
    external_apis: []
  },
  {
    agent_type: 'priority_agent',
    // Deterministic weighted scoring model — no LLM call decides the
    // priority value itself (see agents/priorityAgent.js doc comment).
    capabilities: [],
    services: [],
    external_apis: []
  },
  {
    agent_type: 'policy_validation_agent',
    // Deterministic regex-based checks, not an LLM call, by design.
    capabilities: ['PII Detection'],
    services: [],
    external_apis: []
  },
  {
    agent_type: 'duplicate_detection_agent',
    capabilities: [],
    services: [{ service: 'ComplaintRepository', operations: ['find'] }],
    external_apis: []
  },
  {
    agent_type: 'quality_review_agent',
    capabilities: [],
    services: [],
    external_apis: []
  }
];

const seedAllowlists = async () => {
  try {
    await connectDB();

    for (const entry of allowlists) {
      await CapabilityAllowlist.findOneAndUpdate(
        { agent_type: entry.agent_type },
        entry,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[Seed] Upserted capability_allowlists entry for '${entry.agent_type}'`);
    }

    console.log(`[Seed] Successfully seeded ${allowlists.length} capability_allowlists entries.`);

    await disconnectDB();
    console.log('[Seed] Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Error seeding capability allowlists: ${error.message}`);
    process.exit(1);
  }
};

seedAllowlists();
