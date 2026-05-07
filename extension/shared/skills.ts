export const defaultSkills = [
  '/screenshot',
  '/select-element',
  '/test-section',
  '/test-feature'
] as const;

export type DefaultSkill = (typeof defaultSkills)[number];

export const isDefaultSkill = (value: string): value is DefaultSkill => {
  return defaultSkills.includes(value as DefaultSkill);
};
