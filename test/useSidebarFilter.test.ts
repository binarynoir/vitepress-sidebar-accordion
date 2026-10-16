import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, nextTick, reactive } from 'vue';
import { byId, renderSidebar, type SidebarNode } from './testUtils.js';

const route = reactive({ path: '/' });

vi.mock('vitepress', () => ({ inBrowser: true, useRoute: () => route }));

const { useSidebarFilter } = await import('../src/useSidebarFilter.js');

function mountFilter(options?: Parameters<typeof useSidebarFilter>[0]) {
  const app = createApp(defineComponent({ setup: () => useSidebarFilter(options), render: () => null }));
  app.mount(document.createElement('div'));
  return app;
}

const docs: SidebarNode[] = [
  {
    id: 'guide',
    text: 'Guide',
    items: [
      { id: 'intro', text: 'Introduction' },
      { id: 'plugins', text: 'Plugins' },
    ],
  },
  { id: 'reference', text: 'Reference', items: [{ id: 'api', text: 'Plugin API' }] },
];

const input = () => document.querySelector<HTMLInputElement>('.VPSidebarFilter-input')!;

function type(value: string): void {
  input().value = value;
  input().dispatchEvent(new Event('input'));
}

function press(key: string, type: 'keydown' | 'keyup' = 'keydown'): KeyboardEvent {
  const event = new KeyboardEvent(type, { key, bubbles: true, cancelable: true });
  input().dispatchEvent(event);
  return event;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(callback));
  route.path = '/';
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.head.innerHTML = '';
});

describe('useSidebarFilter', () => {
  it('adds the field above the sidebar nav, with its styles', () => {
    const sidebar = renderSidebar(docs);
    const app = mountFilter({ minItems: 0 });
    const field = sidebar.querySelector('.VPSidebarFilter')!;
    expect(field.nextElementSibling?.tagName).toBe('NAV');
    expect(input().placeholder).toBe('Filter pages');
    expect(document.getElementById('vp-sidebar-filter-style')).not.toBeNull();
    app.unmount();
    expect(sidebar.querySelector('.VPSidebarFilter')).toBeNull();
  });

  it('leaves out the field when the sidebar is shorter than minItems', () => {
    const sidebar = renderSidebar(docs);
    const app = mountFilter();
    expect(sidebar.querySelector('.VPSidebarFilter')).toBeNull();
    app.unmount();
  });

  it('filters as the reader types, and reports the matches', () => {
    const sidebar = renderSidebar(docs);
    const app = mountFilter({ minItems: 0 });
    type('plug');
    expect(byId('intro').hasAttribute('data-filter-hidden')).toBe(true);
    expect(sidebar.querySelector('.VPSidebarFilter-count')!.textContent).toBe('2');
    expect(sidebar.querySelector('[role="status"]')!.textContent).toBe('2 matches');
    type('nothing here');
    expect(sidebar.querySelector<HTMLElement>('.VPSidebarFilter-empty')!.hidden).toBe(false);
    app.unmount();
  });

  it('clears on Escape without letting VitePress close the sidebar', () => {
    const sidebar = renderSidebar(docs);
    const app = mountFilter({ minItems: 0 });
    type('plug');
    press('Escape');
    expect(input().value).toBe('');
    expect(sidebar.classList.contains('is-filtering')).toBe(false);
    const keyup = vi.fn();
    window.addEventListener('keyup', keyup);
    press('Escape', 'keyup');
    expect(keyup).not.toHaveBeenCalled();
    window.removeEventListener('keyup', keyup);
    app.unmount();
  });

  it('opens the first match on Enter', () => {
    renderSidebar(docs);
    const app = mountFilter({ minItems: 0 });
    const click = vi.fn((event: Event) => event.preventDefault());
    byId('plugins').querySelector('a')!.addEventListener('click', click);
    type('plug');
    press('Enter');
    expect(click).toHaveBeenCalledOnce();
    app.unmount();
  });

  it('keeps the filter on the new sidebar after navigating', async () => {
    renderSidebar(docs);
    const app = mountFilter({ minItems: 0 });
    type('api');
    const sidebar = renderSidebar(docs);
    route.path = '/reference/api';
    await nextTick();
    await nextTick();
    vi.runAllTimers();
    expect(sidebar.querySelector('.VPSidebarFilter')).not.toBeNull();
    expect(byId('guide').hasAttribute('data-filter-hidden')).toBe(true);
    app.unmount();
  });

  it('blocks a reader toggling a group the filter holds open', () => {
    renderSidebar(docs);
    const app = mountFilter({ minItems: 0 });
    type('plug');
    const caret = byId('guide').querySelector<HTMLElement>('.caret')!;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'isTrusted', { value: true });
    caret.dispatchEvent(event);
    expect(byId('guide').classList.contains('collapsed')).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    app.unmount();
  });

  it('uses the labels it is given', () => {
    renderSidebar(docs);
    const app = mountFilter({
      minItems: 0,
      labels: { placeholder: 'Filtrer', results: (count) => `${count} résultats` },
    });
    expect(input().placeholder).toBe('Filtrer');
    type('plug');
    expect(document.querySelector('[role="status"]')!.textContent).toBe('2 résultats');
    app.unmount();
  });
});
