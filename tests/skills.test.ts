import { describe, expect, it } from 'vitest';
import { defaultSkills, isDefaultSkill } from '../extension/shared/skills';

describe('Skills', () => {
  describe('defaultSkills', () => {
    it('should contain exactly 4 default skills', () => {
      expect(defaultSkills).toHaveLength(4);
    });

    it('should have correct skills in order', () => {
      expect(defaultSkills).toEqual([
        '/screenshot',
        '/select-element',
        '/test-section',
        '/test-feature'
      ]);
    });

    it('should contain screenshot skill', () => {
      expect(defaultSkills).toContain('/screenshot');
    });

    it('should contain select-element skill', () => {
      expect(defaultSkills).toContain('/select-element');
    });

    it('should contain test-section skill', () => {
      expect(defaultSkills).toContain('/test-section');
    });

    it('should contain test-feature skill', () => {
      expect(defaultSkills).toContain('/test-feature');
    });
  });

  describe('isDefaultSkill type guard', () => {
    it('should validate all default skills', () => {
      expect(isDefaultSkill('/screenshot')).toBe(true);
      expect(isDefaultSkill('/select-element')).toBe(true);
      expect(isDefaultSkill('/test-section')).toBe(true);
      expect(isDefaultSkill('/test-feature')).toBe(true);
    });

    it('should reject unknown skills', () => {
      expect(isDefaultSkill('/unknown')).toBe(false);
      expect(isDefaultSkill('/custom')).toBe(false);
    });

    it('should reject skills without slash', () => {
      expect(isDefaultSkill('screenshot')).toBe(false);
      expect(isDefaultSkill('select-element')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isDefaultSkill('')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isDefaultSkill('/Screenshot')).toBe(false);
      expect(isDefaultSkill('/SCREENSHOT')).toBe(false);
    });

    it('should handle non-string inputs safely', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isDefaultSkill(null as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isDefaultSkill(undefined as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isDefaultSkill(123 as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isDefaultSkill({} as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isDefaultSkill([] as any)).toBe(false);
    });
  });
});
