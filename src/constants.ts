/** A sidebar group the reader can open and close. */
export const GROUP_SELECTOR = '.VPSidebarItem.collapsible';

/** A sidebar group that is currently open. */
export const OPEN_GROUP_SELECTOR = `${GROUP_SELECTOR}:not(.collapsed)`;

/** The current page's link and each group above it. */
export const ACTIVE_BRANCH_SELECTOR = '.VPSidebar .VPSidebarItem.has-active, .VPSidebar .VPSidebarItem.is-active';

/** The clickable header row of a sidebar item. */
export const ITEM_HEADER_SELECTOR = '.VPSidebar .VPSidebarItem > .item';
