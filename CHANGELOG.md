# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-10-16

### Added

- `closeOthers` option for `useSidebarAccordion()`. Set it to `false` and opening a group no longer closes the others, and navigating no longer closes the branches beside the current page. The current page's branch is still opened after each navigation.
- `openActiveBranch()` export: opens the current page's branch without closing anything else.
- `SidebarAccordionOptions` type export.

## [0.1.0] - 2026-10-15

### Added

- Initial release: `useSidebarAccordion()` turns the VitePress sidebar into an accordion with one open group per level. Opening a group closes its open siblings, and after navigating only the current page's branch stays open. The DOM helpers it is built from (`closeOpenSiblings`, `keepActiveBranchOnly`, `toggleGroup`, and others) are exported too.
