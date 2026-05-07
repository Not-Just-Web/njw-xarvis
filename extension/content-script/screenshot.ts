import type { CapturedContext } from './selection';

const MAX_SCREENSHOT_BYTES = 1_000_000;
const SCREENSHOT_QUALITY = 0.7;

export const captureTabScreenshot = async (): Promise<string> => {
  const dataUrl = await chrome.tabs.captureVisibleTab({ format: 'jpeg', quality: Math.round(SCREENSHOT_QUALITY * 100) });
  return dataUrl;
};

export const buildScreenshotContext = async (): Promise<CapturedContext | null> => {
  try {
    const dataUrl = await captureTabScreenshot();

    if (dataUrl.length > MAX_SCREENSHOT_BYTES) {
      console.warn('[capture] Screenshot exceeds limit, skipping');
      return null;
    }

    return {
      type: 'screenshot',
      label: 'Tab Screenshot',
      payload: dataUrl
    };
  } catch (error) {
    console.error('[capture] Screenshot failed', error);
    return null;
  }
};
