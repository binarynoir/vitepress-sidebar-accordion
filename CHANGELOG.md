# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.1] - 2026-10-16

### Fixed

- The filter field covered the top of the sidebar, hiding matches behind it when only a few were left. It sat a navbar's height too low on wide screens, and half a rem too low on small ones.
- More room between the filter field and the sidebar's first link, most of all on small screens, where the two touched.

### Changed

- A divider appears under the filter field once the sidebar's links scroll beneath it.

## [0.3.0] - 2026-10-16

### Added

- `filter` option for `useSidebarAccordion()`, and `useSidebarFilter()` to use it on its own: a filter field at the top of the sidebar. It narrows the sidebar to the matching pages, holding open the groups above each one, and puts every group back as it was once cleared. Words can match the groups above a page, case and accents are ignored, and matches are highlighted. It only appears on sidebars with at least `minItems` links (20 by default), and its wording can be changed through `labels`.
- `filterSidebar()`, `clearSidebarFilter()`, `foldText()` and `parseQuery()` exports, with the filter's class, attribute and highlight names.

## [0.2.0] - 2026-10-16

### Added

- `closeOthers` option for `useSidebarAccordion()`. Set it to `false` and opening a group no longer closes the others, and navigating no longer closes the branches beside the current page. The current page's branch is still opened after each navigation.
- `openActiveBranch()` export: opens the current page's branch without closing anything else.
- `SidebarAccordionOptions` type export.

## [0.1.0] - 2026-10-15

### Added

- Initial release: `useSidebarAccordion()` turns the VitePress sidebar into an accordion with one open group per level. Opening a group closes its open siblings, and after navigating only the current page's branch stays open. The DOM helpers it is built from (`closeOpenSiblings`, `keepActiveBranchOnly`, `toggleGroup`, and others) are exported too.
