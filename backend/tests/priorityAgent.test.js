const priorityAgent = require('../agents/priorityAgent');

describe('priorityAgent', () => {
  it('should assign low priority when no signals are provided', async () => {
    const result = await priorityAgent();
    expect(result.priority).toBe('low');
    expect(result.score).toBeLessThan(0.3);
    expect(result.missing_factors).toEqual(expect.arrayContaining(['routingSeverityHint', 'locationProximitySignal', 'selfReportedPrioritySignal']));
  });

  it('should exclude null signals and renormalize weights correctly', async () => {
    const input = {
      intakeResult: { description: 'pothole on the street', location: { address: 'Unknown' } },
      routingResult: { severity: 'low' } // 0.15 weight 0.25
    };
    const result = await priorityAgent(input);
    // locationProximitySignal should be null
    // selfReportedPrioritySignal should be null
    expect(result.missing_factors).toContain('locationProximitySignal');
    expect(result.missing_factors).toContain('selfReportedPrioritySignal');
    // score should just be normalized from available.
    // safety=0 (0.35), routingSeverity=0.15 (0.25), recurrence=0 (0.15)
    // Sum weights = 0.35 + 0.25 + 0.15 = 0.75
    // Score = (0 * 0.35/0.75) + (0.15 * 0.25/0.75) + (0 * 0.15/0.75) = 0.05
    expect(result.score).toBeCloseTo(0.05, 2);
  });

  it('should increase score and assign critical priority with safety keywords and high severity', async () => {
    const input = {
      intakeResult: { 
        description: 'this is the third time huge gas leak and explosion danger!',
        location: { address: 'Main St' },
        priority: 'critical'
      },
      routingResult: { severity: 'critical' }
    };
    
    const result = await priorityAgent(input);
    
    expect(result.missing_factors).toHaveLength(0);
    expect(result.score).toBeGreaterThanOrEqual(0.75);
    expect(result.priority).toBe('critical');
    expect(result.evidence.length).toBe(5); // all 5 factors present
  });

  it('should handle recurrence keywords', async () => {
    const input = {
      intakeResult: { description: 'I have reported this before and it is still not fixed again' }
    };
    const result = await priorityAgent(input);
    expect(result.reasoning).toMatch(/Recurrence signals/);
    expect(result.missing_factors.length).toBeGreaterThan(0);
  });
});
