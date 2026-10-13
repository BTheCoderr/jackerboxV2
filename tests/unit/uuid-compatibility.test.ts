import { v4 as uuidv4, validate as validateUUID, version as uuidVersion } from 'uuid';

describe('patched UUID dependency compatibility', () => {
  test('server-side IDs remain valid random version 4 identifiers', () => {
    const values = Array.from({ length: 100 }, () => uuidv4());
    expect(new Set(values).size).toBe(values.length);
    for (const value of values) {
      expect(validateUUID(value)).toBe(true);
      expect(uuidVersion(value)).toBe(4);
    }
  });
});
