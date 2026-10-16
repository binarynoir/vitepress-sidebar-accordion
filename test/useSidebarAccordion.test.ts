import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, nextTick, reactive } from 'vue';
import { byId, openGroupIds, renderSidebar } from './testUtils.js';

const route = reactive({ path: '/' });
const vitepress = vi.hoisted(() => ({ inBrowser: true }));

vi.mock('vitepress', () => ({
  get inBrowser() {
    return vitepress.inBrowser;
  },
  useRoute: () => route,
}));

const { handleSidebarClick, useSidebarAccordion } = await import('../src/useSidebarAccordion.js');

/** A click as the reader makes it; dispatched events are never trusted. */
function readerClick(target: Element): MouseEvent {
  return { isTrusted: true, target } as unknown as MouseEvent;
}

function mountAccordion(options?: Parameters<typeof useSidebarAccordion>[0]) {
  const app = createApp(defineComponent({ setup: () => useSidebarAccordion(options), render: () => null }));
  app.mount(document.createElement('div'));
  return app;
}

const twoGroups = [
  { id: 'guide', open: true, items: [{ id: 'guide-intro' }] },
  { id: 'api', items: [{ id: 'api-intro' }] },
];

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(callback));
  vitepress.inBrowser = true;
  route.path = '/';
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('handleSidebarClick', () => {
  it('closes the open siblings of a group the reader opened', () => {
    renderSidebar(twoGroups);
    byId('api').classList.remove('collapsed');
    handleSidebarClick(readerClick(byId('api').querySelector('.caret')!));
    vi.runAllTimers();
    expect(openGroupIds()).toEqual(['api']);
  });

  it('reacts to a click anywhere on the group header', () => {
    renderSidebar(twoGroups);
    byId('api').classList.remove('collapsed');
    handleSidebarClick(readerClick(byId('api').querySelector('.text')!));
    vi.runAllTimers();
    expect(openGroupIds()).toEqual(['api']);
  });

  it('leaves siblings alone when the reader closed a group', () => {
    renderSidebar(twoGroups);
    handleSidebarClick(readerClick(byId('api').querySelector('.caret')!));
    vi.runAllTimers();
    expect(openGroupIds()).toEqual(['guide']);
  });

  it('ignores untrusted clicks and clicks outside a group', () => {
    renderSidebar(twoGroups);
    byId('api').classList.remove('collapsed');
    handleSidebarClick(new MouseEvent('click'));
    handleSidebarClick(readerClick(byId('guide-intro')));
    handleSidebarClick(readerClick(document.body));
    vi.runAllTimers();
    expect(openGroupIds()).toEqual(['guide', 'api']);
  });
});

describe('useSidebarAccordion', () => {
  it('listens for clicks while mounted', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const app = mountAccordion();
    expect(add).toHaveBeenCalledWith('click', handleSidebarClick, true);
    app.unmount();
    expect(remove).toHaveBeenCalledWith('click', handleSidebarClick, true);
  });

  it('keeps only the active branch open after navigating', async () => {
    renderSidebar([
      { id: 'guide', open: true, items: [{ id: 'guide-intro' }] },
      { id: 'api', items: [{ id: 'api-intro', active: true }] },
    ]);
    const app = mountAccordion();
    route.path = '/api/intro';
    await nextTick();
    await nextTick();
    vi.runAllTimers();
    expect(openGroupIds()).toEqual(['api']);
    app.unmount();
  });

  it('leaves other groups open after navigating when closeOthers is false', async () => {
    renderSidebar([
      { id: 'guide', open: true, items: [{ id: 'guide-intro' }] },
      { id: 'api', items: [{ id: 'api-intro', active: true }] },
    ]);
    const app = mountAccordion({ closeOthers: false });
    route.path = '/api/intro';
    await nextTick();
    await nextTick();
    vi.runAllTimers();
    expect(openGroupIds()).toEqual(['guide', 'api']);
    app.unmount();
  });

  it('does not listen for clicks when closeOthers is false', () => {
    const add = vi.spyOn(document, 'addEventListener');
    mountAccordion({ closeOthers: false }).unmount();
    expect(add).not.toHaveBeenCalledWith('click', handleSidebarClick, true);
  });

  it('does nothing outside the browser', () => {
    vitepress.inBrowser = false;
    const add = vi.spyOn(document, 'addEventListener');
    mountAccordion().unmount();
    expect(add).not.toHaveBeenCalledWith('click', handleSidebarClick, true);
  });
});
