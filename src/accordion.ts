import { ACTIVE_BRANCH_SELECTOR, GROUP_SELECTOR, OPEN_GROUP_SELECTOR } from './constants.js';

/**
 * The DOM side of the accordion. Each group's open state lives inside
 * VitePress's `VPSidebarItem`, so groups are opened and closed by clicking
 * their caret, which keeps that state in sync.
 */

/** Whether `item` is a group that is currently open. */
export function isOpenGroup(item: Element): boolean {
  return item.matches(OPEN_GROUP_SELECTOR);
}

/** The sidebar items at the same level as `item`. */
export function getSiblingItems(item: Element): Element[] {
  // Top-level groups are each wrapped in their own `.group` element.
  const scope = item.classList.contains('level-0')
    ? item.closest('.VPSidebar')?.querySelectorAll('.group > .VPSidebarItem')
    : item.parentElement?.children;
  return Array.from(scope ?? []).filter((element) => element !== item);
}

/** Opens or closes `group` by clicking its caret. */
export function toggleGroup(group: Element): void {
  group.querySelector<HTMLButtonElement>(':scope > .item > .caret')?.click();
}

/** Closes the open groups beside `item`, and any open groups inside them. */
export function closeOpenSiblings(item: Element): void {
  for (const sibling of getSiblingItems(item)) {
    const openGroups = [sibling, ...sibling.querySelectorAll(GROUP_SELECTOR)].filter(isOpenGroup);
    // Innermost first, so each caret is clicked while its group is laid out.
    for (const group of openGroups.reverse()) toggleGroup(group);
  }
}

/**
 * Opens any group in the current page's branch the reader had closed, and
 * leaves every other group as it is. VitePress only opens the branch itself
 * when the page moves into a different one.
 */
export function openActiveBranch(root: ParentNode = document): void {
  for (const item of root.querySelectorAll(ACTIVE_BRANCH_SELECTOR)) {
    if (item.matches(GROUP_SELECTOR) && !isOpenGroup(item)) toggleGroup(item);
  }
}

/**
 * Opens the current page's branch and closes the branches left open beside
 * it. VitePress only opens the branch itself when the page moves into a
 * different one, not when the reader had closed the one it is in.
 */
export function keepActiveBranchOnly(root: ParentNode = document): void {
  for (const item of root.querySelectorAll(ACTIVE_BRANCH_SELECTOR)) {
    if (item.matches(GROUP_SELECTOR) && !isOpenGroup(item)) toggleGroup(item);
    closeOpenSiblings(item);
  }
}
