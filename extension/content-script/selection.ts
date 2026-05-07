export type CapturedContext = {
  type: 'url' | 'selection' | 'element' | 'screenshot' | 'image';
  label: string;
  payload: string;
};

export const captureCurrentUrl = (): CapturedContext => ({
  type: 'url',
  label: 'Page URL',
  payload: window.location.href
});

export const captureSelectedText = (): CapturedContext | null => {
  const selection = window.getSelection();
  const text = selection?.toString().trim() ?? '';

  if (!text) {
    return null;
  }

  return {
    type: 'selection',
    label: 'Selected Text',
    payload: text
  };
};
