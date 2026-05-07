import { CONTEXT_MENU_IDS } from './register';

const openSidepanel = async (windowId: number | undefined): Promise<void> => {
  if (windowId !== undefined && chrome.sidePanel?.open) {
    await chrome.sidePanel.open({ windowId });
  }
};

const sendContextToSidepanel = (type: string, payload: string, label: string): void => {
  chrome.runtime.sendMessage({
    type: 'context.quick-send',
    context: { type, label, payload }
  });
};

export const handleContextMenuClick = async (
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined
): Promise<void> => {
  const windowId = tab?.windowId;

  switch (info.menuItemId) {
    case CONTEXT_MENU_IDS.OPEN_CHAT:
      await openSidepanel(windowId);
      break;

    case CONTEXT_MENU_IDS.SEND_SELECTED:
      await openSidepanel(windowId);
      if (info.selectionText) {
        sendContextToSidepanel('selection', info.selectionText, 'Selected Text');
      }
      break;

    case CONTEXT_MENU_IDS.SEND_URL:
      await openSidepanel(windowId);
      sendContextToSidepanel('url', info.pageUrl ?? tab?.url ?? '', 'Page URL');
      break;

    case CONTEXT_MENU_IDS.SEND_ELEMENT:
      await openSidepanel(windowId);
      if (tab?.id !== undefined) {
        await chrome.tabs.sendMessage(tab.id, { type: 'capture.element' });
      }
      break;

    default:
      break;
  }
};
