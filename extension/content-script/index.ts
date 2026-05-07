import { captureCurrentUrl, captureSelectedText } from './selection';
import { startElementPicker } from './element-picker';

console.debug('NJW Xarvis content script active');

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false;

  const msg = message as { type?: string };

  switch (msg.type) {
    case 'capture.url':
      sendResponse({ ok: true, context: captureCurrentUrl() });
      break;

    case 'capture.selection':
      sendResponse({ ok: true, context: captureSelectedText() });
      break;

    case 'capture.element':
      startElementPicker((snapshot) => {
        chrome.runtime.sendMessage({ type: 'context.captured', context: snapshot });
      });
      sendResponse({ ok: true });
      break;

    default:
      return false;
  }

  return false;
});
