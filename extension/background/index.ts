import { isRuntimeMessage } from '../../shared/types/runtime-messages';
import { routeRuntimeMessage } from './router';

chrome.runtime.onInstalled.addListener(() => {
  console.info('AI Assistant extension installed');
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isRuntimeMessage(message)) {
    sendResponse({ ok: false, error: 'Invalid runtime envelope' });
    return false;
  }

  routeRuntimeMessage(message)
    .then((response) => sendResponse(response))
    .catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown router error';
      sendResponse({ ok: false, error: errorMessage });
    });

  return true;
});
