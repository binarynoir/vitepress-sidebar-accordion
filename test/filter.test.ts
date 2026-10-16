import { describe, expect, it } from 'vitest';
import { clearSidebarFilter, filterSidebar, foldText, parseQuery } from '../src/filter.js';
import { byId, openGroupIds, renderSidebar, type SidebarNode } from './testUtils.js';

const docs: SidebarNode[] = [
  {
    id: 'guide',
    text: 'Guide',
    items: [
      { id: 'intro', text: 'Introduction' },
      { id: 'plugins', text: 'Plugins' },
      { id: 'advanced', text: 'Advanced', items: [{ id: 'theming', text: 'Theming' }] },
    ],
  },
  {
    id: 'reference',
    text: 'Reference',
    items: [
      { id: 'config', text: 'Site Config' },
      { id: 'api', text: 'Plugin API' },
    ],
  },
  { id: 'resume', text: 'Résumé', items: [{ id: 'cv', text: 'CV' }] },
];

/** The ids of the items the filter leaves shown. */
function shownIds(): string[] {
  return Array.from(document.querySelectorAll('.VPSidebarItem:not([data-filter-hidden])')).map((element) => element.id);
}

describe('foldText', () => {
  it('lowercases and strips accents, keeping where each character came from', () => {
    expect(foldText('Résumé')).toEqual({ folded: 'resume', indexes: [0, 1, 2, 3, 4, 5] });
  });
});

describe('parseQuery', () => {
  it('splits a query into distinct folded words', () => {
    expect(parseQuery('  Guide  PLUGINS guide ')).toEqual(['guide', 'plugins']);
    expect(parseQuery('   ')).toEqual([]);
  });
});

describe('filterSidebar', () => {
  it('shows each match and the groups above it, and hides the rest', () => {
    const sidebar = renderSidebar(docs);
    const matches = filterSidebar(sidebar, 'theming');
    expect(matches.map((match) => match.id)).toEqual(['theming']);
    expect(shownIds()).toEqual(['guide', 'advanced', 'theming']);
    expect(byId('guide').hasAttribute('data-filter-open')).toBe(true);
    expect(byId('advanced').hasAttribute('data-filter-open')).toBe(true);
    expect(sidebar.classList.contains('is-filtering')).toBe(true);
  });

  it('matches words against the groups above an item', () => {
    const sidebar = renderSidebar(docs);
    expect(filterSidebar(sidebar, 'guide plug').map((match) => match.id)).toEqual(['plugins']);
    expect(filterSidebar(sidebar, 'plug').map((match) => match.id)).toEqual(['plugins', 'api']);
    expect(filterSidebar(sidebar, 'reference plug').map((match) => match.id)).toEqual(['api']);
  });

  it('shows everything inside a matching group', () => {
    const sidebar = renderSidebar(docs);
    filterSidebar(sidebar, 'guide');
    expect(shownIds()).toEqual(['guide', 'intro', 'plugins', 'advanced', 'theming']);
    expect(byId('advanced').hasAttribute('data-filter-open')).toBe(false);
  });

  it('ignores case and accents', () => {
    const sidebar = renderSidebar(docs);
    expect(filterSidebar(sidebar, 'RESUME').map((match) => match.id)).toEqual(['resume']);
  });

  it('hides top-level groups with no matches and marks the first one shown', () => {
    const sidebar = renderSidebar(docs);
    filterSidebar(sidebar, 'config');
    const groups = Array.from(sidebar.querySelectorAll('.group'));
    expect(groups.map((group) => group.hasAttribute('data-filter-hidden'))).toEqual([true, false, true]);
    expect(groups[1]!.hasAttribute('data-filter-first')).toBe(true);
  });

  it('returns no matches for an empty query, and filters nothing', () => {
    const sidebar = renderSidebar(docs);
    expect(filterSidebar(sidebar, '  ')).toEqual([]);
    expect(sidebar.classList.contains('is-filtering')).toBe(false);
    expect(shownIds()).toHaveLength(10);
  });

  it('never opens or closes a group itself', () => {
    const sidebar = renderSidebar(docs);
    filterSidebar(sidebar, 'theming');
    expect(openGroupIds()).toEqual([]);
    clearSidebarFilter(sidebar);
    expect(sidebar.querySelectorAll('[data-filter-hidden], [data-filter-open], [data-filter-match]')).toHaveLength(0);
    expect(sidebar.classList.contains('is-filtering')).toBe(false);
  });
});
