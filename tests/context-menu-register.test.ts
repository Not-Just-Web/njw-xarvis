import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerContextMenus, CONTEXT_MENU_IDS } from '@ai/extension/context-menu/register';

describe('context-menu register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CONTEXT_MENU_IDS', () => {
    it('has correct id values', () => {
      expect(CONTEXT_MENU_IDS.OPEN_CHAT).toBe('ai_open_chat');
      expect(CONTEXT_MENU_IDS.SEND_SELECTED).toBe('ai_send_selected');
      expect(CONTEXT_MENU_IDS.SEND_URL).toBe('ai_send_url');
      expect(CONTEXT_MENU_IDS.SEND_ELEMENT).toBe('ai_send_element');
    });

    it('has exactly 4 menu ids', () => {
      expect(Object.keys(CONTEXT_MENU_IDS)).toHaveLength(4);
    });
  });

  describe('registerContextMenus', () => {
    it('creates four context menu items', () => {
      registerContextMenus();
      expect(chrome.contextMenus.create).toHaveBeenCalledTimes(4);
    });

    it('creates OPEN_CHAT item with "all" context', () => {
      registerContextMenus();
      expect(chrome.contextMenus.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: CONTEXT_MENU_IDS.OPEN_CHAT,
          contexts: ['all']
        })
      );
    });

    it('creates SEND_SELECTED item with selection context', () => {
      registerContextMenus();
      expect(chrome.contextMenus.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: CONTEXT_MENU_IDS.SEND_SELECTED,
          contexts: ['selection']
        })
      );
    });

    it('creates SEND_URL item with page context', () => {
      registerContextMenus();
      expect(chrome.contextMenus.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: CONTEXT_MENU_IDS.SEND_URL,
          contexts: expect.arrayContaining(['page'])
        })
      );
    });
  });
});
