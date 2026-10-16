import { describe, expect, it } from 'vitest';
import {
  closeOpenSiblings,
  getSiblingItems,
  isOpenGroup,
  keepActiveBranchOnly,
  openActiveBranch,
  toggleGroup,
} from '../src/accordion.js';
import { byId, openGroupIds, renderSidebar } from './testUtils.js';

const guide = { id: 'guide', items: [{ id: 'guide-intro' }] };

describe('getSiblingItems', () => {
  it('finds top-level siblings across their .group wrappers', () => {
    renderSidebar([guide, { id: 'api', items: [{ id: 'api-intro' }] }, { id: 'faq', items: [{ id: 'faq-intro' }] }]);
    expect(getSiblingItems(byId('api')).map((element) => element.id)).toEqual(['guide', 'faq']);
  });

  it('finds nested siblings in the same list', () => {
    renderSidebar([
      {
        id: 'guide',
        items: [
          { id: 'basics', items: [{ id: 'basics-1' }] },
          { id: 'advanced', items: [{ id: 'advanced-1' }] },
        ],
      },
      { id: 'api', items: [{ id: 'api-intro' }] },
    ]);
    expect(getSiblingItems(byId('basics')).map((element) => element.id)).toEqual(['advanced']);
  });
});

describe('toggleGroup and isOpenGroup', () => {
  it('opens and closes a group through its caret', () => {
    renderSidebar([guide]);
    expect(isOpenGroup(byId('guide'))).toBe(false);
    toggleGroup(byId('guide'));
    expect(isOpenGroup(byId('guide'))).toBe(true);
    toggleGroup(byId('guide'));
    expect(isOpenGroup(byId('guide'))).toBe(false);
  });

  it('does nothing to an item without a caret', () => {
    renderSidebar([guide]);
    expect(() => toggleGroup(byId('guide-intro'))).not.toThrow();
  });
});

describe('closeOpenSiblings', () => {
  it('closes open siblings and the open groups inside them', () => {
    renderSidebar([
      { id: 'guide', open: true, items: [{ id: 'basics', open: true, items: [{ id: 'basics-1' }] }] },
      { id: 'api', open: true, items: [{ id: 'api-intro' }] },
    ]);
    closeOpenSiblings(byId('api'));
    expect(openGroupIds()).toEqual(['api']);
  });

  it('leaves groups at other levels alone', () => {
    renderSidebar([
      {
        id: 'guide',
        open: true,
        items: [
          { id: 'basics', open: true, items: [{ id: 'basics-1' }] },
          { id: 'advanced', open: true, items: [{ id: 'advanced-1' }] },
        ],
      },
      { id: 'api', open: true, items: [{ id: 'api-intro' }] },
    ]);
    closeOpenSiblings(byId('advanced'));
    expect(openGroupIds()).toEqual(['guide', 'advanced', 'api']);
  });
});

describe('keepActiveBranchOnly', () => {
  it("opens the current page's branch and closes the rest", () => {
    renderSidebar([
      { id: 'guide', open: true, items: [{ id: 'guide-intro' }] },
      {
        id: 'api',
        items: [
          { id: 'core', items: [{ id: 'core-page', active: true }] },
          { id: 'extras', open: true, items: [{ id: 'extras-page' }] },
        ],
      },
    ]);
    keepActiveBranchOnly();
    expect(openGroupIds()).toEqual(['api', 'core']);
  });

  it('keeps an open active branch open', () => {
    renderSidebar([
      { id: 'guide', open: true, items: [{ id: 'guide-intro', active: true }] },
      { id: 'api', items: [{ id: 'api-intro' }] },
    ]);
    keepActiveBranchOnly();
    expect(openGroupIds()).toEqual(['guide']);
  });

  it('closes every other group beside an active top-level page', () => {
    renderSidebar([
      { id: 'home', active: true },
      { id: 'guide', open: true, items: [{ id: 'guide-intro' }] },
    ]);
    keepActiveBranchOnly();
    expect(openGroupIds()).toEqual([]);
  });
});

describe('openActiveBranch', () => {
  it("opens the current page's branch and leaves other open groups alone", () => {
    renderSidebar([
      { id: 'guide', open: true, items: [{ id: 'guide-intro' }] },
      { id: 'api', items: [{ id: 'advanced', items: [{ id: 'api-advanced', active: true }] }] },
    ]);
    openActiveBranch();
    expect(openGroupIds()).toEqual(['guide', 'api', 'advanced']);
  });
});
