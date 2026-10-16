/**
 * A sidebar shaped like VitePress's: each top-level group sits in its own
 * `.group` wrapper, and nested items sit side by side in one `<li>`.
 */
export interface SidebarNode {
  id: string;
  /** The item's title; its id when not given. */
  text?: string;
  open?: boolean;
  active?: boolean;
  items?: SidebarNode[];
}

function renderItem(node: SidebarNode, depth: number): string {
  const isGroup = Boolean(node.items?.length);
  const classes = [
    'VPSidebarItem',
    `level-${depth}`,
    isGroup && 'collapsible',
    isGroup && !node.open && 'collapsed',
    !isGroup && 'is-link',
    !isGroup && node.active && 'is-active',
  ].filter(Boolean);
  const text = `<p class="text">${node.text ?? node.id}</p>`;
  const header = isGroup ? text : `<a class="link" href="/${node.id}">${text}</a>`;
  const caret = isGroup ? '<button type="button" class="caret"></button>' : '';
  const items = isGroup
    ? `<ul class="items"><li>${node.items!.map((child) => renderItem(child, depth + 1)).join('')}</li></ul>`
    : '';
  return `<section id="${node.id}" class="${classes.join(' ')}"><div class="item">${header}${caret}</div>${items}</section>`;
}

/** Marks every group above an active page with `has-active`, as VitePress does. */
function markActiveBranch(root: Element): void {
  for (const active of root.querySelectorAll('.is-active')) {
    let group = active.parentElement?.closest('.VPSidebarItem');
    while (group) {
      group.classList.add('has-active');
      group = group.parentElement?.closest('.VPSidebarItem');
    }
  }
}

/** Renders `nodes` into the document. Each caret toggles its group, as VitePress's does. */
export function renderSidebar(nodes: SidebarNode[]): HTMLElement {
  document.body.innerHTML = `<aside class="VPSidebar"><div class="curtain"></div><nav>${nodes
    .map((node) => `<div class="group">${renderItem(node, 0)}</div>`)
    .join('')}</nav></aside>`;
  const sidebar = document.querySelector<HTMLElement>('.VPSidebar')!;
  markActiveBranch(sidebar);
  for (const caret of sidebar.querySelectorAll('.caret')) {
    caret.addEventListener('click', (event) => {
      event.stopPropagation();
      caret.closest('.VPSidebarItem')!.classList.toggle('collapsed');
    });
  }
  return sidebar;
}

export function byId(id: string): HTMLElement {
  return document.getElementById(id)!;
}

/** The ids of the groups that are open, in document order. */
export function openGroupIds(): string[] {
  return Array.from(document.querySelectorAll('.VPSidebarItem.collapsible:not(.collapsed)')).map(
    (element) => element.id,
  );
}
