# vitepress-sidebar-accordion

[![npm version](https://img.shields.io/npm/v/@binarynoir/vitepress-sidebar-accordion.svg)](https://www.npmjs.com/package/@binarynoir/vitepress-sidebar-accordion)
[![CI](https://github.com/binarynoir/vitepress-sidebar-accordion/actions/workflows/ci.yml/badge.svg)](https://github.com/binarynoir/vitepress-sidebar-accordion/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@binarynoir/vitepress-sidebar-accordion.svg)](LICENSE)

A [VitePress](https://vitepress.dev) plugin that turns the default theme's
sidebar into an accordion: one open group per level. Opening a group closes the
groups beside it, and after navigating, only the branch holding the current
page stays open.

That is how the VuePress sidebar behaved, so a site moving to VitePress keeps
the same feel. On a large docs site it also keeps the sidebar short.

[Documentation and live demo](https://binarynoir.tech/plugins/sidebar-accordion)

[![Support me on Buy Me a Coffee](https://img.shields.io/badge/Support%20me-Buy%20Me%20a%20Coffee-orange?style=for-the-badge&logo=buy-me-a-coffee)](https://buymeacoffee.com/binarynoir)
[![Support me on Ko-fi](https://img.shields.io/badge/Support%20me-Ko--fi-blue?style=for-the-badge&logo=ko-fi)](https://ko-fi.com/binarynoir)
[![More tools](https://img.shields.io/badge/Website-binarynoir.tech-8c8c8c?style=for-the-badge)](https://binarynoir.tech)

## What this does

| Reader does                        | Default VitePress                     | With the accordion                             |
| ---------------------------------- | ------------------------------------- | ---------------------------------------------- |
| Opens a group                      | Every group they opened stays open    | Open groups at the same level close            |
| Opens a group inside another group | Its siblings stay open                | Only its siblings close; the parent stays open |
| Follows a link to another page     | Groups opened along the way stay open | Only the new page's branch is left open        |
| Closes the current page's group    | It stays closed on the next page      | It opens again on the next page in that branch |

## Install

```sh
npm install @binarynoir/vitepress-sidebar-accordion
```

## Usage

**1. Theme.** Call `useSidebarAccordion()` from your theme's `setup`:

```ts
// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme';
import { useSidebarAccordion } from '@binarynoir/vitepress-sidebar-accordion';

export default {
  extends: DefaultTheme,
  setup() {
    useSidebarAccordion();
  },
};
```

**2. Sidebar.** Give each group a `collapsed` value. VitePress only draws the
caret that opens and closes a group when `collapsed` is set, and the accordion
works through that caret. `collapsed: true` starts the groups closed, which is
what an accordion usually wants; VitePress opens the current page's branch on
load.

```ts
// .vitepress/config.mts
export default defineConfig({
  themeConfig: {
    sidebar: [
      {
        text: 'Guide',
        collapsed: true,
        items: [
          { text: 'Introduction', link: '/guide/' },
          { text: 'Advanced', collapsed: true, items: [{ text: 'Plugins', link: '/guide/plugins' }] },
        ],
      },
      { text: 'Reference', collapsed: true, items: [{ text: 'API', link: '/reference/api' }] },
    ],
  },
});
```

Groups without `collapsed` are always open, and the accordion leaves them
alone.

### With vitepress-auto-sidebar

[vitepress-auto-sidebar](https://github.com/binarynoir/vitepress-auto-sidebar)
sets `collapsed` on every group it generates through its `collapsed` option:

```ts
sidebar: generateSidebar(path.resolve(import.meta.dirname, '../docs'), {
  collapsed: true,
}),
```

### With a custom Layout

If your theme replaces `Layout`, `setup` still works. You can also call
`useSidebarAccordion()` from the `setup` of your own Layout component instead.

## How it works

VitePress keeps each group's open state inside its sidebar item component and
offers no API to change it. So the accordion clicks the group's caret, the same
button a reader would press, and VitePress's own state stays in sync.

- A click the reader makes on a group header or caret is caught in the capture
  phase (the caret stops its click from bubbling). Once Vue has updated, if the
  group is now open, the open groups beside it and any open groups inside those
  are closed, innermost first.
- Clicks the accordion makes itself are not trusted events, so they never
  start another round.
- After each route change, once VitePress has opened the new page's branch,
  the accordion opens any group in that branch the reader had closed, and
  closes the branches beside it.
- During the server-side build, `useSidebarAccordion()` does nothing.

It reads VitePress's own class names (`.VPSidebarItem`, `.collapsible`,
`.collapsed`, `.has-active`, `.is-active`, `.caret`), so it works with the
default theme's sidebar, or a custom one that renders the same markup.

## Exports

```ts
import {
  useSidebarAccordion,
  handleSidebarClick,
  closeOpenSiblings,
  getSiblingItems,
  isOpenGroup,
  keepActiveBranchOnly,
  toggleGroup,
  GROUP_SELECTOR,
  OPEN_GROUP_SELECTOR,
  ACTIVE_BRANCH_SELECTOR,
  ITEM_HEADER_SELECTOR,
} from '@binarynoir/vitepress-sidebar-accordion';
```

`useSidebarAccordion()` is all most sites need. The rest are the pieces it is
built from, for a theme that wants to wire them up its own way, for example
`keepActiveBranchOnly()` after its own navigation hook.

## Related projects

| Project                                                                        | What it does                         |
| ------------------------------------------------------------------------------ | ------------------------------------ |
| [vitepress-auto-sidebar](https://github.com/binarynoir/vitepress-auto-sidebar) | Sidebar built from your docs folders |
| [vitepress-auto-navbar](https://github.com/binarynoir/vitepress-auto-navbar)   | Navbar built from your docs folders  |
| [vitepress-readme-index](https://github.com/binarynoir/vitepress-readme-index) | `README.md` index pages, as VuePress |

## Releasing

Releases are tag-triggered. From a clean `main` that's in sync with
`origin/main`:

```sh
npm run release:patch   # or release:minor / release:major
```

This runs typecheck/lint/test/build locally, then `npm version <bump>` and
`git push --follow-tags`. Pushing the tag triggers
[`.github/workflows/release.yml`](.github/workflows/release.yml), which re-runs
the checks, publishes to npm, and creates a GitHub release.

## License

MIT

---

## Feedback and support

Bug reports, feature requests and questions are all welcome. Please open them on this project's [GitHub issue tracker](https://github.com/binarynoir/vitepress-sidebar-accordion/issues):

- **Found a bug?** [Report it](https://github.com/binarynoir/vitepress-sidebar-accordion/issues/new?labels=bug&title=Bug%3A%20). Include your version and the steps to reproduce it.
- **Have an idea?** [Request a feature](https://github.com/binarynoir/vitepress-sidebar-accordion/issues/new?labels=enhancement&title=Feature%20request%3A%20). Tell us what you are trying to do.
- **Something else?** [Browse open issues](https://github.com/binarynoir/vitepress-sidebar-accordion/issues) to see if it has already been raised.

Pull requests are welcome too.

## More from BinaryNoir

<p align="center">
  <a href="https://binarynoir.tech">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://binarynoir.tech/logo-wide-dark.svg">
      <img alt="BinaryNoir" src="https://binarynoir.tech/logo-wide-light.svg" width="320">
    </picture>
  </a>
</p>

Sidebar Accordion is one of a family of open-source VitePress plugins, editor extensions and command-line tools from BinaryNoir. Browse them all, with documentation and live demos, at **[binarynoir.tech](https://binarynoir.tech)**.

**VitePress plugins**

- [Auto Sidebar](https://binarynoir.tech/plugins/auto-sidebar): sidebar built from your folders
- [Auto Navbar](https://binarynoir.tech/plugins/auto-navbar): navbar built from your folders
- [Text Style](https://binarynoir.tech/plugins/text-style): color and size text inline
- [Markdown Tags](https://binarynoir.tech/plugins/markdown-tags/): inline status badges
- [Reading Time Tag](https://binarynoir.tech/plugins/reading-time-tag): reading-time estimates
- [Glossary Tooltips](https://binarynoir.tech/plugins/glossary/): hover definitions from one glossary file
- [Downloads](https://binarynoir.tech/plugins/downloads): downloadable files next to your pages
- [Exclude](https://binarynoir.tech/plugins/exclude/): keep pages out of the build with a `.exclude` file
- [README Index](https://binarynoir.tech/plugins/readme-index/): `README.md` index pages for VuePress migrations
- [HTML Escape](https://binarynoir.tech/plugins/html-escape/): stray `<tags>` and `{{ }}` shown as text, not build errors
- [Broken Links](https://binarynoir.tech/plugins/broken-links): dead links shown as text, not build errors

**Vite plugins**

- [Optimize Images](https://binarynoir.tech/plugins/optimize-images): smaller images in the build output
- [Image Fallback](https://binarynoir.tech/plugins/image-fallback): a placeholder instead of a failed build

**Editor extensions**

- [Tags for Markdown for VS Code](https://binarynoir.tech/plugins/markdown-tags/vscode): status badges in the VS Code Markdown preview
- [Tags for Markdown for Obsidian](https://binarynoir.tech/plugins/markdown-tags/obsidian): status badges in Obsidian

**Command-line tools**

- [NoirWatch](https://binarynoir.tech/apps/noirwatch): get notified when a web page changes
- [NoirCon](https://binarynoir.tech/apps/noircon): get notified when a site, server or port goes down
- [callrx](https://binarynoir.tech/apps/callrx): amateur radio callsign lookup

Website, docs and demos: **[binarynoir.tech](https://binarynoir.tech)**

## Author

John Smith III, [BinaryNoir](https://binarynoir.tech). Thanks to all contributors and users for their support and feedback.
