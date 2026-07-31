const { assertAllowed, getAllowlist, invalidateCache } = require('../agents/runtime/AllowlistEnforcer');
const CapabilityAllowlist = require('../models/CapabilityAllowlist');

jest.mock('../models/CapabilityAllowlist');

describe('AllowlistEnforcer', () => {
  beforeEach(() => {
    invalidateCache();
    jest.clearAllMocks();
  });

  it('should allow an agent type if it exists in the capability allowlist', async () => {
    const mockDoc = { agent_type: 'test_agent' };
    CapabilityAllowlist.find.mockResolvedValue([mockDoc]);

    const doc = await assertAllowed('test_agent');
    expect(doc).toEqual(mockDoc);
    expect(CapabilityAllowlist.find).toHaveBeenCalledTimes(1);
  });

  it('should deny (throw CAPABILITY_DENIED) if agent type is missing', async () => {
    CapabilityAllowlist.find.mockResolvedValue([]);

    await expect(assertAllowed('test_agent')).rejects.toMatchObject({
      code: 'CAPABILITY_DENIED'
    });
  });

  it('should cache allowlist to avoid redundant DB queries', async () => {
    const mockDoc = { agent_type: 'test_agent' };
    CapabilityAllowlist.find.mockResolvedValue([mockDoc]);

    await assertAllowed('test_agent');
    await assertAllowed('test_agent');
    
    // DB query should only run once
    expect(CapabilityAllowlist.find).toHaveBeenCalledTimes(1);
  });
});
