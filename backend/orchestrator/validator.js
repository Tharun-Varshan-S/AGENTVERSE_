const schemaMap = {
  intakeAgent: {
    raw_input_type: { type: "enum", allowed: ["photo", "text", "voice"] },
    description: { type: "string" },
    issue_category: { type: "enum", allowed: ["pothole", "garbage", "streetlight", "water_leak", "other"] },
    location: {
      type: "object",
      fields: {
        lat: { type: "number" },
        lng: { type: "number" },
        address: { type: "string" }
      }
    },
    image_url: { type: "string", optional: true },
    confidence: { type: "number" }
  },

  routingAgent: {
    department: { type: "string" },
    department_contact: { type: "string" },
    severity: { type: "enum", allowed: ["low", "medium", "high", "critical"] },
    sla_hours: { type: "number" }
  },

  draftingAgent: {
    complaint_text: { type: "string" },
    reference_number: { type: "string" },
    format: { type: "enum", allowed: ["letter", "pdf_url"] }
  },

  trackingAgent: {
    submitted_at: { type: "date" },
    current_status: { type: "enum", allowed: ["submitted", "acknowledged", "in_progress", "resolved"] },
    last_updated: { type: "date" }
  },

  escalationAgent: {
    escalated: { type: "boolean" },
    escalated_at: { type: "date" },
    escalation_text: { type: "string" },
    escalated_to: { type: "string" }
  }
};

function validateField(fieldName, value, rule, agentName) {
  if (value === undefined || value === null) {
    if (rule.optional) return;
    throw new Error(`Validation failed for ${agentName}: missing field '${fieldName}'`);
  }

  if (rule.type === "string") {
    if (typeof value !== "string") {
      throw new Error(`Validation failed for ${agentName}: invalid type for field '${fieldName}' (expected string)`);
    }
  } else if (rule.type === "number") {
    if (typeof value !== "number" || isNaN(value)) {
      throw new Error(`Validation failed for ${agentName}: invalid type for field '${fieldName}' (expected number)`);
    }
  } else if (rule.type === "boolean") {
    if (typeof value !== "boolean") {
      throw new Error(`Validation failed for ${agentName}: invalid type for field '${fieldName}' (expected boolean)`);
    }
  } else if (rule.type === "date") {
    const isValidDate = value instanceof Date || (!isNaN(Date.parse(value)));
    if (!isValidDate) {
      throw new Error(`Validation failed for ${agentName}: invalid type for field '${fieldName}' (expected Date)`);
    }
  } else if (rule.type === "enum") {
    if (typeof value !== "string" || !rule.allowed.includes(value)) {
      throw new Error(`Validation failed for ${agentName}: invalid enum value '${value}' for field '${fieldName}'`);
    }
  } else if (rule.type === "object") {
    if (typeof value !== "object" || Array.isArray(value) || value === null) {
      throw new Error(`Validation failed for ${agentName}: invalid type for field '${fieldName}' (expected object)`);
    }
    if (rule.fields) {
      for (const [subKey, subRule] of Object.entries(rule.fields)) {
        validateField(`${fieldName}.${subKey}`, value[subKey], subRule, agentName);
      }
    }
  }
}

function validateAgentOutput(agentName, output) {
  const schema = schemaMap[agentName];
  if (!schema) {
    throw new Error(`Unknown agent: ${agentName}`);
  }

  if (!output || typeof output !== "object" || Array.isArray(output)) {
    throw new Error(`Validation failed for ${agentName}: output must be an object`);
  }

  for (const [fieldName, rule] of Object.entries(schema)) {
    validateField(fieldName, output[fieldName], rule, agentName);
  }

  return true;
}

module.exports = { validateAgentOutput };
