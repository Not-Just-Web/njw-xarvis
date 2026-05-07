import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock chrome extension APIs globally
vi.stubGlobal('chrome', {
  runtime: {
    id: 'test-extension-id',
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn(), removeListener: vi.fn() }
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined)
    },
    onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
  },
  tabs: {
    query: vi.fn().mockResolvedValue([{ windowId: 1, id: 1 }]),
    captureVisibleTab: vi.fn().mockResolvedValue('data:image/png;base64,abc')
  },
  sidePanel: {
    open: vi.fn().mockResolvedValue(undefined)
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: { addListener: vi.fn() }
  }
});
