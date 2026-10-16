/** A sidebar group the reader can open and close. */
export const GROUP_SELECTOR = '.VPSidebarItem.collapsible';

/** A sidebar group that is currently open. */
export const OPEN_GROUP_SELECTOR = `${GROUP_SELECTOR}:not(.collapsed)`;

/** The current page's link and each group above it. */
export const ACTIVE_BRANCH_SELECTOR = '.VPSidebar .VPSidebarItem.has-active, .VPSidebar .VPSidebarItem.is-active';

/** The clickable header row of a sidebar item. */
export const ITEM_HEADER_SELECTOR = '.VPSidebar .VPSidebarItem > .item';

/** Set on the sidebar while a filter is applied. */
export const FILTERING_CLASS = 'is-filtering';

/** Set on sidebar items, and top-level `.group` wrappers, the filter hides. */
export const FILTER_HIDDEN_ATTR = 'data-filter-hidden';

/** Set on groups the filter holds open: those above a match, and matching groups. */
export const FILTER_OPEN_ATTR = 'data-filter-open';

/** Set on sidebar items that match the filter. */
export const FILTER_MATCH_ATTR = 'data-filter-match';

/** Set on the first top-level `.group` wrapper the filter leaves shown. */
export const FILTER_FIRST_ATTR = 'data-filter-first';

/** The name of the CSS highlight that marks matching words. */
export const FILTER_HIGHLIGHT = 'vp-sidebar-filter';
