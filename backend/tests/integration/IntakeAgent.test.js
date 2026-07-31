const intakeAgent = require('../../agents/understandingAgent'); // understandingAgent is used as intake in pipeline

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: jest.fn().mockResolvedValue({
            text: JSON.stringify({
              incident_type: 'pothole',
              urgency_level: 'high',
              confidence: 0.85
            })
          })
        }
      };
    })
  };
});

describe('IntakeAgent (understandingAgent) Integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process text and map to structure using mocked LLM', async () => {
    const result = await intakeAgent({ description: 'There is a large pothole on Main Street near the park' });
    
    expect(result).toBeDefined();
    expect(result.incident_type).toBe('pothole');
    expect(result.urgency_level).toBe('high');
    expect(result.confidence).toBe(0.85);
  });

  it('should fallback to regex if LLM throws error', async () => {
    const { GoogleGenAI } = require('@google/genai');
    GoogleGenAI.mockImplementationOnce(() => ({
      models: { generateContent: jest.fn().mockRejectedValue(new Error('API error')) }
    }));

    const result = await intakeAgent({ description: 'There is a large pothole on Main Street near the park', issue_category: 'pothole' });
    
    // Check fallback logic mapped it to pothole
    expect(result.incident_type).toBe('pothole');
    expect(result.confidence).toBe(0.75); // Fallback sets 0.75 if no missing context
  });
});
