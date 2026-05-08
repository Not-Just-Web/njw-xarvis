// .playwright/test-exclude.js
// Exclude all .test.ts(x) files from Playwright, only run .spec.ts(x) in integration/e2e
module.exports = (testPath) => {
  return /\.test\.(ts|tsx|js|jsx)$/.test(testPath);
};
