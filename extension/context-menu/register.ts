export const CONTEXT_MENU_IDS = {
  OPEN_CHAT: 'ai_open_chat',
  SEND_SELECTED: 'ai_send_selected',
  SEND_URL: 'ai_send_url',
  SEND_ELEMENT: 'ai_send_element'
} as const;

export const registerContextMenus = (): void => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.OPEN_CHAT,
    title: 'Open AI Chat',
    contexts: ['all']
  });

  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.SEND_SELECTED,
    title: 'Send selected text to AI',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.SEND_URL,
    title: 'Send page URL to AI',
    contexts: ['page', 'frame', 'link']
  });

  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.SEND_ELEMENT,
    title: 'Send element snapshot to AI',
    contexts: ['all']
  });
};
