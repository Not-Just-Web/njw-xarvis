import { isRuntimeMessage } from '../../shared/types/runtime-messages';
import { routeRuntimeMessage } from './router';
import { registerContextMenus } from '../context-menu/register';
import { handleContextMenuClick } from '../context-menu/handlers';

chrome.runtime.onInstalled.addListener(() => {
  console.info('NJW Xarvis extension installed');
  registerContextMenus();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  handleContextMenuClick(info, tab).catch(console.error);
});

chrome.commands?.onCommand.addListener((command) => {
  if (command !== 'open-sidepanel') return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab?.windowId !== undefined && chrome.sidePanel?.open) {
      chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {
        console.error('Failed to open sidepanel from keyboard shortcut');
      });
    }
  });
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
