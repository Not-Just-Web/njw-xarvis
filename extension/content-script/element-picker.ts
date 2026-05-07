import type { CapturedContext } from './selection';

export type ElementSnapshot = {
  tag: string;
  id: string;
  classNames: string[];
  role: string;
  textExcerpt: string;
  selector: string;
  boundingBox: { top: number; left: number; width: number; height: number };
};

const buildSelector = (el: Element): string => {
  if (el.id) {
    return `#${el.id}`;
  }

  const tag = el.tagName.toLowerCase();
  const classes = Array.from(el.classList)
    .slice(0, 2)
    .join('.');

  return classes ? `${tag}.${classes}` : tag;
};

let pickerActive = false;
let highlightOverlay: HTMLDivElement | null = null;

const createOverlay = (): HTMLDivElement => {
  const div = document.createElement('div');
  div.style.cssText =
    'position:fixed;pointer-events:none;z-index:2147483647;outline:2px solid #006d77;background:rgba(0,109,119,0.08);transition:all 0.1s';
  document.body.appendChild(div);
  return div;
};

const positionOverlay = (target: Element): void => {
  if (!highlightOverlay) return;
  const rect = target.getBoundingClientRect();
  highlightOverlay.style.top = `${rect.top}px`;
  highlightOverlay.style.left = `${rect.left}px`;
  highlightOverlay.style.width = `${rect.width}px`;
  highlightOverlay.style.height = `${rect.height}px`;
};

const snapshotElement = (el: Element): ElementSnapshot => {
  const rect = el.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id,
    classNames: Array.from(el.classList),
    role: el.getAttribute('role') ?? '',
    textExcerpt: (el.textContent ?? '').trim().slice(0, 200),
    selector: buildSelector(el),
    boundingBox: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
  };
};

export const startElementPicker = (
  onPick: (snapshot: CapturedContext) => void
): void => {
  if (pickerActive) return;
  pickerActive = true;
  highlightOverlay = createOverlay();

  const onMouseMove = (event: MouseEvent) => {
    const target = document.elementFromPoint(event.clientX, event.clientY);
    if (target && target !== highlightOverlay) {
      positionOverlay(target);
    }
  };

  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const target = document.elementFromPoint(event.clientX, event.clientY);
    if (!target || target === highlightOverlay) return;

    const snapshot = snapshotElement(target);
    const payload = JSON.stringify(snapshot);

    cleanup();
    onPick({ type: 'element', label: `Element: ${snapshot.selector}`, payload });
  };

  const cleanup = () => {
    pickerActive = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('click', onClick, true);
    highlightOverlay?.remove();
    highlightOverlay = null;
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('click', onClick, true);
};
