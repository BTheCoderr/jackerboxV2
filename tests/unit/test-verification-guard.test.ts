import { canUseTestVerification } from '../../src/lib/test-utils';

describe('test verification cannot bypass production security', () => {
  it('never allows a test code in production even with a public flag', () => {
    expect(canUseTestVerification('production', 'true')).toBe(false);
    expect(canUseTestVerification('production', 'false')).toBe(false);
  });
  it('requires an explicit flag in development', () => {
    expect(canUseTestVerification('development', 'true')).toBe(true);
    expect(canUseTestVerification('development', undefined)).toBe(false);
    expect(canUseTestVerification('development', 'false')).toBe(false);
  });
  it('allows isolated unit tests', () => {
    expect(canUseTestVerification('test', undefined)).toBe(true);
    expect(canUseTestVerification(undefined, 'true')).toBe(false);
  });
});
