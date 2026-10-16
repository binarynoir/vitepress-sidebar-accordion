import {
  FILTER_FIRST_ATTR,
  FILTER_HIDDEN_ATTR,
  FILTER_HIGHLIGHT,
  FILTER_MATCH_ATTR,
  FILTER_OPEN_ATTR,
  FILTERING_CLASS,
} from './constants.js';

/**
 * The DOM side of the sidebar filter. It never opens or closes a group
 * through VitePress: matches are revealed with attributes and CSS, so the
 * groups the reader had open come back as they were once the filter is
 * cleared.
 */

const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * `text` lowercased and stripped of accents, for matching, with the index in
 * `text` that each folded character came from.
 */
export function foldText(text: string): { folded: string; indexes: number[] } {
  let folded = '';
  const indexes: number[] = [];
  for (let index = 0; index < text.length; index++) {
    for (const char of text[index]!.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase()) {
      folded += char;
      indexes.push(index);
    }
  }
  return { folded, indexes };
}

/** The distinct words of `query`, folded for matching. */
export function parseQuery(query: string): string[] {
  return [...new Set(foldText(query).folded.split(/\s+/).filter(Boolean))];
}

function itemTextElement(item: Element): Element | null {
  return item.querySelector(':scope > .item .text');
}

/** The sidebar items above `item`, nearest first. */
function ancestorItems(item: Element): Element[] {
  const ancestors: Element[] = [];
  let parent = item.parentElement?.closest('.VPSidebarItem');
  while (parent) {
    ancestors.push(parent);
    parent = parent.parentElement?.closest('.VPSidebarItem');
  }
  return ancestors;
}

/** A range over each place a word of the query appears in `element`'s text. */
function matchRanges(element: Element, words: string[]): Range[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  // Where each text node starts in the element's text as a whole.
  const starts: number[] = [];
  let length = 0;
  for (const node of nodes) {
    starts.push(length);
    length += node.length;
  }
  const { folded, indexes } = foldText(nodes.map((node) => node.data).join(''));
  const locate = (index: number): [Text, number] => {
    let at = nodes.length - 1;
    while (at > 0 && starts[at]! > index) at--;
    return [nodes[at]!, index - starts[at]!];
  };

  const ranges: Range[] = [];
  for (const word of words) {
    for (let found = folded.indexOf(word); found !== -1; found = folded.indexOf(word, found + word.length)) {
      const range = document.createRange();
      range.setStart(...locate(indexes[found]!));
      range.setEnd(...locate(indexes[found + word.length - 1]! + 1));
      ranges.push(range);
    }
  }
  return ranges;
}

function setHighlight(ranges: Range[]): void {
  if (typeof CSS === 'undefined' || !('highlights' in CSS) || typeof Highlight === 'undefined') return;
  if (ranges.length) CSS.highlights.set(FILTER_HIGHLIGHT, new Highlight(...ranges));
  else CSS.highlights.delete(FILTER_HIGHLIGHT);
}

/** Removes the filter from `sidebar`, leaving every group as the reader had it. */
export function clearSidebarFilter(sidebar: Element): void {
  sidebar.classList.remove(FILTERING_CLASS);
  for (const attribute of [FILTER_HIDDEN_ATTR, FILTER_OPEN_ATTR, FILTER_MATCH_ATTR, FILTER_FIRST_ATTR]) {
    for (const element of sidebar.querySelectorAll(`[${attribute}]`)) element.removeAttribute(attribute);
  }
  setHighlight([]);
}

/**
 * Filters `sidebar` down to the items matching `query`, and returns them in
 * document order.
 *
 * An item matches when its own text holds at least one word of the query,
 * and its text or the groups above it hold the rest, so `guide plugins`
 * finds "Plugins" under "Guide". The groups above each match are shown and
 * held open around it; a group that matches shows everything inside it.
 * Each word is highlighted where it appears, in browsers that support the
 * CSS Custom Highlight API.
 */
export function filterSidebar(sidebar: Element, query: string): Element[] {
  clearSidebarFilter(sidebar);
  const words = parseQuery(query);
  if (!words.length) return [];

  const items = Array.from(sidebar.querySelectorAll('.VPSidebarItem'));
  const texts = new Map(items.map((item) => [item, foldText(itemTextElement(item)?.textContent ?? '').folded]));
  const matches = items.filter((item) => {
    const text = texts.get(item)!;
    const above = ancestorItems(item).map((ancestor) => texts.get(ancestor) ?? '');
    return (
      words.some((word) => text.includes(word)) &&
      words.every((word) => text.includes(word) || above.some((ancestorText) => ancestorText.includes(word)))
    );
  });

  const shown = new Set<Element>();
  const open = new Set<Element>();
  for (const match of matches) {
    shown.add(match);
    if (match.querySelector(':scope > .items')) open.add(match);
    for (const ancestor of ancestorItems(match)) {
      shown.add(ancestor);
      open.add(ancestor);
    }
    for (const descendant of match.querySelectorAll('.VPSidebarItem')) shown.add(descendant);
  }

  sidebar.classList.add(FILTERING_CLASS);
  for (const item of items) if (!shown.has(item)) item.setAttribute(FILTER_HIDDEN_ATTR, '');
  for (const item of open) item.setAttribute(FILTER_OPEN_ATTR, '');
  for (const item of matches) item.setAttribute(FILTER_MATCH_ATTR, '');

  // Top-level groups each sit in a `.group` wrapper with a divider above
  // every one but the first, so the first one still shown loses its divider.
  let first = true;
  for (const group of sidebar.querySelectorAll('.group')) {
    const top = group.querySelector(':scope > .VPSidebarItem');
    if (top && !shown.has(top)) {
      group.setAttribute(FILTER_HIDDEN_ATTR, '');
    } else if (first) {
      group.setAttribute(FILTER_FIRST_ATTR, '');
      first = false;
    }
  }

  setHighlight(
    Array.from(shown).flatMap((item) => {
      const element = itemTextElement(item);
      return element ? matchRanges(element, words) : [];
    }),
  );
  return matches;
}
