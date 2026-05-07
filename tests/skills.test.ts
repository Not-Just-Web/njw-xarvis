import { describe, expect, it } from 'vitest';
import { defaultSkills, isDefaultSkill } from '../extension/shared/skills';

describe('default skills', () => {
  it('contains required slash skills', () => {
    expect(defaultSkills).toEqual([
      '/screenshot',
      '/select-element',
      '/test-section',
      '/test-feature'
    ]);
  });

  it('validates known skills', () => {
    expect(isDefaultSkill('/screenshot')).toBe(true);
    expect(isDefaultSkill('/unknown')).toBe(false);
  });
});
