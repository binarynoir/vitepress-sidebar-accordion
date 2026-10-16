// A namespace import, as in useSidebarAccordion: VitePress's node entry has no
// `inBrowser` or `useRoute`.
import * as vitepress from 'vitepress';
import { nextTick, onMounted, onUnmounted, watch } from 'vue';
import {
  FILTER_FIRST_ATTR,
  FILTER_HIDDEN_ATTR,
  FILTER_HIGHLIGHT,
  FILTER_OPEN_ATTR,
  FILTERING_CLASS,
} from './constants.js';
import { clearSidebarFilter, filterSidebar } from './filter.js';

/** The words the filter shows and reads out. Pass your own to translate it. */
export interface SidebarFilterLabels {
  /** @default 'Filter pages' */
  placeholder: string;
  /** The field's accessible name. @default 'Filter the sidebar' */
  label: string;
  /** The clear button's accessible name. @default 'Clear filter' */
  clear: string;
  /** Shown when nothing matches. */
  noResults: (query: string) => string;
  /** Read out by screen readers as the matches change. */
  results: (count: number) => string;
}

/** Options for {@link useSidebarFilter}, or the `filter` option of `useSidebarAccordion`. */
export interface SidebarFilterOptions {
  /**
   * Only show the filter when the sidebar has at least this many links, so a
   * short sidebar is not cluttered by it. Set it to `0` to always show it.
   * @default 20
   */
  minItems?: number;
  /** Your own wording, for example to translate it. */
  labels?: Partial<SidebarFilterLabels>;
}

const defaultLabels: SidebarFilterLabels = {
  placeholder: 'Filter pages',
  label: 'Filter the sidebar',
  clear: 'Clear filter',
  noResults: (query) => `No pages match “${query}”.`,
  results: (count) => (count === 1 ? '1 match' : `${count} matches`),
};

const STYLE_ID = 'vp-sidebar-filter-style';

const STYLES = `
.VPSidebarFilter {
  position: sticky;
  top: 0;
  z-index: 2;
  margin: -0.5rem -2rem 0;
  padding: 0.5rem 2rem 0.5rem;
  background-color: var(--vp-sidebar-bg-color);
}
.VPSidebarFilter-field {
  display: flex;
  align-items: center;
  height: 2.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background-color: var(--vp-c-bg);
  transition: border-color 0.25s;
}
.VPSidebarFilter-field:hover { border-color: var(--vp-c-gray-1); }
.VPSidebarFilter-field:focus-within { border-color: var(--vp-c-brand-1); }
.VPSidebarFilter-icon {
  flex-shrink: 0;
  margin-left: 0.625rem;
  width: 0.875rem;
  height: 0.875rem;
  color: var(--vp-c-text-3);
}
.VPSidebarFilter-input {
  flex-grow: 1;
  min-width: 0;
  height: 100%;
  padding: 0 0.5rem;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 16px;
  -webkit-appearance: none;
  appearance: none;
}
.VPSidebarFilter-input::placeholder { color: var(--vp-c-text-3); }
.VPSidebarFilter-input::-webkit-search-cancel-button { display: none; }
.VPSidebarFilter-count {
  flex-shrink: 0;
  color: var(--vp-c-text-3);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}
.VPSidebarFilter-clear {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  margin: 0 0.25rem;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 6px;
  color: var(--vp-c-text-3);
  transition: color 0.25s, background-color 0.25s;
}
.VPSidebarFilter-clear:hover { color: var(--vp-c-text-1); background-color: var(--vp-c-default-soft); }
.VPSidebarFilter-clear svg { width: 0.875rem; height: 0.875rem; }
.VPSidebarFilter-count[hidden], .VPSidebarFilter-clear[hidden], .VPSidebarFilter-empty[hidden] { display: none; }
.VPSidebarFilter-empty {
  margin: 0.75rem 0 0;
  color: var(--vp-c-text-2);
  font-size: 0.8125rem;
  line-height: 1.5;
}
@media (min-width: 960px) {
  .VPSidebarFilter { top: var(--vp-nav-height); margin-top: 0; padding-top: 1rem; }
  .VPSidebarFilter-input { font-size: 0.875rem; }
}
.VPSidebar.${FILTERING_CLASS} [${FILTER_HIDDEN_ATTR}] { display: none !important; }
.VPSidebar.${FILTERING_CLASS} .VPSidebarItem:is([${FILTER_OPEN_ATTR}], :not(.collapsed)) > .items { display: block !important; }
.VPSidebar.${FILTERING_CLASS} [${FILTER_OPEN_ATTR}] > .item { cursor: default !important; }
.VPSidebar.${FILTERING_CLASS} [${FILTER_OPEN_ATTR}] > .item > .caret { opacity: 0.4; cursor: default; }
.VPSidebar.${FILTERING_CLASS} [${FILTER_OPEN_ATTR}] > .item > .caret .caret-icon { transform: rotate(90deg) !important; }
.VPSidebar.${FILTERING_CLASS} .VPSidebarItem.level-0[${FILTER_OPEN_ATTR}] { padding-bottom: 1.5rem; }
.VPSidebar.${FILTERING_CLASS} .group[${FILTER_FIRST_ATTR}] { border-top: 0; }
::highlight(${FILTER_HIGHLIGHT}) { background-color: var(--vp-c-yellow-soft); color: var(--vp-c-text-1); }
`;

const FILTER_ICON =
  '<svg class="VPSidebarFilter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M7 12h10M10 18h4"/></svg>';
const CLEAR_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.append(style);
}

/** The sidebar links a reader can see right now, in document order. */
function visibleLinks(sidebar: Element): HTMLElement[] {
  return Array.from(sidebar.querySelectorAll<HTMLElement>('.VPSidebarItem > .item > .link')).filter(
    (link) => link.getClientRects().length > 0,
  );
}

/**
 * Adds a filter field to the top of the VitePress sidebar. Typing narrows the
 * sidebar to the pages and groups that match, holding open the groups above
 * each match; clearing it puts every group back as the reader had it.
 *
 * - Several words narrow the match, and may match the groups above a page:
 *   `guide plugins` finds "Plugins" under "Guide". Case and accents are
 *   ignored.
 * - <kbd>Enter</kbd> opens the first match, <kbd>↓</kbd> and <kbd>↑</kbd> move
 *   through the matches, and <kbd>Esc</kbd> clears the filter.
 * - The filter is kept while moving between pages, until it is cleared.
 *
 * `useSidebarAccordion({ filter: true })` calls it for you; call it on its
 * own from your theme's `setup` to filter a sidebar without the accordion.
 *
 * Does nothing during the server-side build.
 */
export function useSidebarFilter(options: SidebarFilterOptions = {}): void {
  if (!vitepress.inBrowser) return;
  const { minItems = 20 } = options;
  const labels = { ...defaultLabels, ...options.labels };
  const route = vitepress.useRoute();

  const root = document.createElement('div');
  root.className = 'VPSidebarFilter';
  root.setAttribute('role', 'search');
  root.innerHTML = `
    <div class="VPSidebarFilter-field">
      ${FILTER_ICON}
      <input class="VPSidebarFilter-input" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" aria-controls="VPSidebarNav">
      <span class="VPSidebarFilter-count" aria-hidden="true" hidden></span>
      <button class="VPSidebarFilter-clear" type="button" hidden>${CLEAR_ICON}</button>
    </div>
    <p class="VPSidebarFilter-status visually-hidden" role="status"></p>
    <p class="VPSidebarFilter-empty" hidden></p>`;
  const input = root.querySelector('input')!;
  const count = root.querySelector<HTMLElement>('.VPSidebarFilter-count')!;
  const clearButton = root.querySelector('button')!;
  const status = root.querySelector('[role="status"]')!;
  const empty = root.querySelector<HTMLElement>('.VPSidebarFilter-empty')!;
  input.placeholder = labels.placeholder;
  input.setAttribute('aria-label', labels.label);
  clearButton.setAttribute('aria-label', labels.clear);

  let matches: Element[] = [];
  let clearedOnEscape = false;

  const getSidebar = () => document.querySelector<HTMLElement>('.VPSidebar');

  function apply(): void {
    const sidebar = getSidebar();
    if (!sidebar || !root.isConnected) return;
    const query = input.value.trim();
    matches = filterSidebar(sidebar, query);
    count.hidden = clearButton.hidden = !query;
    count.textContent = String(matches.length);
    empty.hidden = !query || matches.length > 0;
    empty.textContent = query ? labels.noResults(query) : '';
    status.textContent = query ? labels.results(matches.length) : '';
  }

  /** Puts the field in the current sidebar, or takes it out of a short one. */
  function mount(): void {
    const sidebar = getSidebar();
    const nav = sidebar?.querySelector(':scope > nav');
    if (!sidebar || !nav || sidebar.querySelectorAll('.VPSidebarItem.is-link').length < minItems) {
      if (sidebar) clearSidebarFilter(sidebar);
      root.remove();
      return;
    }
    if (root.parentElement !== sidebar) sidebar.insertBefore(root, nav);
    apply();
  }

  function clear(): void {
    input.value = '';
    apply();
    getSidebar()?.querySelector('.VPSidebarItem.is-active')?.scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', () => {
    apply();
    getSidebar()?.scrollTo({ top: 0 });
  });

  input.addEventListener('keydown', (event) => {
    if (event.isComposing) return;
    if (event.key === 'Escape') {
      // Clear first; the next Escape is left to VitePress, which closes the
      // sidebar on small screens.
      clearedOnEscape = Boolean(input.value);
      if (clearedOnEscape) {
        event.preventDefault();
        clear();
      } else {
        input.blur();
      }
    } else if (event.key === 'Enter') {
      const first = matches.map((match) => match.querySelector<HTMLElement>(':scope > .item > .link')).find(Boolean);
      if (first) {
        event.preventDefault();
        first.click();
      }
    } else if (event.key === 'ArrowDown') {
      const sidebar = getSidebar();
      const first = sidebar && visibleLinks(sidebar)[0];
      if (first) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // VitePress closes the sidebar on Escape's keyup; not when Escape cleared the filter.
  input.addEventListener('keyup', (event) => {
    if (event.key === 'Escape' && clearedOnEscape) event.stopPropagation();
  });

  clearButton.addEventListener('click', () => {
    clear();
    input.focus();
  });

  /** Arrow keys move between the matches, and Escape goes back to the field. */
  function onSidebarKeydown(event: KeyboardEvent): void {
    const sidebar = getSidebar();
    const target = event.target;
    if (!sidebar?.classList.contains(FILTERING_CLASS) || !(target instanceof HTMLElement)) return;
    if (!target.matches('.VPSidebarItem > .item > .link')) return;
    if (event.key === 'Escape') {
      input.focus();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const links = visibleLinks(sidebar);
    const next = links[links.indexOf(target) + (event.key === 'ArrowDown' ? 1 : -1)];
    (next ?? (event.key === 'ArrowUp' ? input : target)).focus();
  }

  /**
   * The filter holds groups open over their matches, so a reader's click on
   * one of their headers would toggle a group they can't see change. Links
   * in those headers still work.
   */
  function onSidebarClick(event: MouseEvent): void {
    if (!event.isTrusted || !(event.target instanceof Element)) return;
    const header = event.target.closest(`.VPSidebar.${FILTERING_CLASS} [${FILTER_OPEN_ATTR}] > .item`);
    if (header && !event.target.closest('a')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  onMounted(() => {
    injectStyles();
    document.addEventListener('keydown', onSidebarKeydown);
    document.addEventListener('click', onSidebarClick, true);
    mount();
  });
  onUnmounted(() => {
    document.removeEventListener('keydown', onSidebarKeydown);
    document.removeEventListener('click', onSidebarClick, true);
    const sidebar = getSidebar();
    if (sidebar) clearSidebarFilter(sidebar);
    root.remove();
  });
  // A new page may bring a new sidebar, or none; run after VitePress renders it.
  watch(
    () => route.path,
    () => nextTick(() => requestAnimationFrame(mount)),
  );
}
