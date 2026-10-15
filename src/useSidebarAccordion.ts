// A namespace import, not named ones: during the server-side build Node loads
// VitePress's node entry, which has no `inBrowser` or `useRoute`. Named imports
// would fail to link there; on the namespace they are just `undefined`.
import * as vitepress from 'vitepress';
import { nextTick, onMounted, onUnmounted, watch } from 'vue';
import { closeOpenSiblings, isOpenGroup, keepActiveBranchOnly } from './accordion.js';
import { GROUP_SELECTOR, ITEM_HEADER_SELECTOR } from './constants.js';

/**
 * A group was toggled open by the reader: close the others at its level.
 * Clicks made by the accordion itself are not trusted, so they are skipped.
 * The caret stops its click from bubbling, so this listens in the capture
 * phase and checks the group once the click (and Vue's update) is done.
 */
export function handleSidebarClick(event: MouseEvent): void {
  if (!event.isTrusted || !(event.target instanceof Element)) return;
  const item = event.target.closest(ITEM_HEADER_SELECTOR)?.parentElement;
  if (!item?.matches(GROUP_SELECTOR)) return;
  setTimeout(() => {
    if (isOpenGroup(item)) closeOpenSiblings(item);
  });
}

/**
 * Makes the VitePress sidebar an accordion, as the VuePress sidebar behaved:
 * one open group per level. Opening a group closes its open siblings, and
 * after navigating only the branch holding the current page stays open.
 *
 * Call it from your theme's `setup`, and give the sidebar groups a
 * `collapsed` value so they have a caret to toggle:
 *
 * ```ts
 * // .vitepress/theme/index.ts
 * import DefaultTheme from 'vitepress/theme';
 * import { useSidebarAccordion } from '@binarynoir/vitepress-sidebar-accordion';
 *
 * export default {
 *   extends: DefaultTheme,
 *   setup() {
 *     useSidebarAccordion();
 *   },
 * };
 * ```
 *
 * Does nothing during the server-side build.
 */
export function useSidebarAccordion(): void {
  if (!vitepress.inBrowser) return;
  const route = vitepress.useRoute();

  onMounted(() => document.addEventListener('click', handleSidebarClick, true));
  onUnmounted(() => document.removeEventListener('click', handleSidebarClick, true));
  watch(
    () => route.path,
    // VitePress opens the active branch on its own next tick; run after it.
    () => nextTick(() => requestAnimationFrame(() => keepActiveBranchOnly())),
  );
}
