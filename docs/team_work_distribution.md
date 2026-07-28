# Team Implementation Strategy & Work Distribution

Based on the architectural analysis of the Civic Complaint Management System, the remaining development work is split across 3 specialized roles to maximize parallel productivity, minimize git merge conflicts, and accelerate completion within the 2-day hackathon timeline.

---

## Member 1 — AI Workflow & Architecture Lead

**Goal:** Own everything related to the multi-agent system itself.

### Task 1: LangGraph Workflow
* Replace or wrap the current `pipeline.js` workflow with LangGraph.
* Define nodes for each agent.
* Define edges.
* Introduce shared workflow state.

**Target Files:**
* `backend/orchestrator/pipeline.js`
* `backend/orchestrator/workflow.js` (New)
* `backend/orchestrator/state.js` (New)

### Task 2: Structured Outputs
Transition from free-text JSON regex parsing to schema-enforced structured LLM responses:
```
Gemini → Schema → Validated Object
```

**Target Files:**
* `backend/agents/intakeAgent.js`
* `backend/agents/draftingAgent.js`
* `backend/orchestrator/validator.js`

### Task 3: Shared Workflow State
Introduce centralized workflow state management across agent nodes:
```
WorkflowState → Agent1 Updates → Agent2 Updates → Agent3 Updates
```

### Task 4: Structured Logging
Replace raw `console.log()` calls with structured workflow logging:
```
Pipeline Started → Intake Completed → Routing Completed → Drafting Completed → Tracking Updated
```

### Task 5: Retry Policy & Fallbacks
Enhance LLM exception resilience:
```
LLM Call Failed → Exponential Retry → Graceful Fallback Template
```

### Task 6: System Documentation
Generate technical documentation for competition judges:
* `docs/architecture.md`
* `docs/workflow.md`
* `docs/agent_flow.md`

---

## Member 2 — Backend & Business Logic Lead

**Goal:** Own business domain functionality, database models, and API endpoints without requiring LangGraph knowledge.

### Routing Agent (`routingAgent.js` & `Department.js`)
* Replace hardcoded stub with real database query logic matching complaint category and ward location to the `Department` MongoDB collection.

### Tracking Agent (`trackingAgent.js`)
* Implement real status progression history, audit timestamps, and lifecycle updates beyond static `"submitted"` status.

### Escalation Agent (`escalationAgent.js`)
* Implement dynamic SLA target calculation, breach detection logic, and custom escalation messages based on severity.

### Admin APIs (`admin.js`)
* Improve status advancement endpoints, manual escalation triggers, and payload validation.

### Complaint APIs (`complaints.js`)
* Enhance input validation, file upload MIME type handling, and standardized error responses.

### Database Optimizations (`models/Incident.js` & `models/Department.js`)
* Add schema indexes, validation constraints, and helper methods.

---

## Member 3 — Testing & Quality Assurance Lead

**Goal:** Own system quality, edge case verification, and end-to-end reliability.

### Functional & API Testing
* Test every agent in isolation and verify all HTTP API endpoints under normal and failure modes.

### Edge Case Verification
* Test empty complaint strings, large payloads, regional language input (Tamil), missing or corrupt images, and invalid GPS coordinates.

### LLM Reliability Testing
* Verify category misclassification handling, malformed JSON recovery, retry loops, and static fallback behaviors.

### Structured Bug Reporting
* File bug reports using the standard format:
```
Steps to Reproduce → Expected Behavior → Actual Behavior → Screenshots / Logs
```

---

## Responsibility Matrix

| Feature / Responsibility | Member 1 (AI & Arch) | Member 2 (Backend) | Member 3 (QA & Testing) |
| :--- | :---: | :---: | :---: |
| **LangGraph Orchestration** | ✅ Lead | ❌ | ❌ |
| **Workflow Architecture & State** | ✅ Lead | ❌ | ❌ |
| **Structured Outputs & Schema** | ✅ Lead | ❌ | ❌ |
| **Structured Logging & Retries** | ✅ Lead | ❌ | ❌ |
| **Routing Agent Implementation** | Review | ✅ Lead | Test |
| **Tracking Agent Implementation** | Review | ✅ Lead | Test |
| **Escalation Agent Implementation**| Review | ✅ Lead | Test |
| **API Endpoints & Controllers** | Review | ✅ Lead | Test |
| **Database Models & Schemas** | Review | ✅ Lead | Test |
| **Functional & Edge Case Testing**| ❌ | ❌ | ✅ Lead |
| **LLM Reliability & Bug Reports** | ❌ | ❌ | ✅ Lead |
| **System Documentation** | Architecture Docs | Business Logic Docs | QA & Test Report |

---

## Value of This Work Split

1. **Clear Ownership & Zero Merge Conflicts:** Decouples core AI orchestration (Member 1) from business domain endpoints (Member 2) and quality assurance (Member 3).
2. **Accelerated Learning Curve:** Allows Member 1 to specialize in LangGraph and Agentic AI systems while Member 2 builds production-grade Node.js/MongoDB logic.
3. **Demo & Hackathon Readiness:** Member 3 ensures zero critical bugs or unexpected LLM crashes during live evaluation.
