import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleContextMenuClick } from '@ai/extension/context-menu/handlers';
import { CONTEXT_MENU_IDS } from '@ai/extension/context-menu/register';

type MenuInfo = chrome.contextMenus.OnClickData;
type Tab = chrome.tabs.Tab;

describe('context-menu handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleContextMenuClick', () => {
    it('opens sidepanel on OPEN_CHAT action', async () => {
      const info = { menuItemId: CONTEXT_MENU_IDS.OPEN_CHAT, pageUrl: 'https://example.com' } as MenuInfo;
      const tab = { windowId: 1 } as Tab;

      await handleContextMenuClick(info, tab);

      expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 1 });
    });

    it('opens sidepanel and sends selection on SEND_SELECTED action', async () => {
      const info = {
        menuItemId: CONTEXT_MENU_IDS.SEND_SELECTED,
        selectionText: 'some selected text',
        pageUrl: 'https://example.com'
      } as MenuInfo;
      const tab = { windowId: 1 } as Tab;

      await handleContextMenuClick(info, tab);

      expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 1 });
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'context.quick-send',
          context: expect.objectContaining({
            type: 'selection',
            payload: 'some selected text'
          })
        })
      );
    });

    it('does not send selection when no selectionText', async () => {
      const info = {
        menuItemId: CONTEXT_MENU_IDS.SEND_SELECTED,
        pageUrl: 'https://example.com'
      } as MenuInfo;
      const tab = { windowId: 1 } as Tab;

      await handleContextMenuClick(info, tab);

      expect(chrome.sidePanel.open).toHaveBeenCalled();
      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('opens sidepanel and sends URL on SEND_URL action', async () => {
      const info = {
        menuItemId: CONTEXT_MENU_IDS.SEND_URL,
        pageUrl: 'https://example.com/test'
      } as MenuInfo;
      const tab = { windowId: 1 } as Tab;

      await handleContextMenuClick(info, tab);

      expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 1 });
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'context.quick-send',
          context: expect.objectContaining({
            type: 'url',
            payload: 'https://example.com/test'
          })
        })
      );
    });

    it('handles undefined windowId gracefully', async () => {
      const info = { menuItemId: CONTEXT_MENU_IDS.OPEN_CHAT, pageUrl: 'https://x.com' } as MenuInfo;
      const tab = { windowId: undefined } as unknown as Tab;

      await handleContextMenuClick(info, tab);

      expect(chrome.sidePanel.open).not.toHaveBeenCalled();
    });
  });
});
