import {
  addContextToChangeSet,
  changesToMarkdown,
  createChangeSet,
  extractChanges,
  isEmptyChangeSet,
  mergeChangeSets,
} from '../';

test('createChangeSet', () => {
  expect(
    createChangeSet(
      {
        type: 'breaking',
        title: 'Old code no longer works',
        body: `Example using old code:\n\n    oldCode();\n\nExample using new code:\n\n    newCode()`,
        pr: 2,
      },
      {
        type: 'breaking',
        title: 'Errors are now strings instead of numbers',
        body: '',
        pr: 3,
      },
      {
        type: 'fix',
        title: 'Library no longer crashes your app',
        body: '',
        pr: 1,
      },
    ),
  ).toEqual([
    {
      type: 'breaking',
      title: 'Old code no longer works',
      body: `Example using old code:\n\n    oldCode();\n\nExample using new code:\n\n    newCode()`,
      pr: 2,
    },
    {
      type: 'breaking',
      title: 'Errors are now strings instead of numbers',
      body: '',
      pr: 3,
    },
    {
      type: 'fix',
      title: 'Library no longer crashes your app',
      body: '',
      pr: 1,
    },
  ]);
});

test('isEmptyChangeSet', () => {
  expect(isEmptyChangeSet([])).toBe(true);
  expect(
    isEmptyChangeSet([
      {
        type: 'breaking',
        title: 'Old code no longer works',
        body: `Example using old code:\n\n    oldCode();\n\nExample using new code:\n\n    newCode()`,
      },
      {
        type: 'breaking',
        title: 'Errors are now strings instead of numbers',
        body: '',
      },
    ]),
  ).toBe(false);
});

test('mergeChangeSets', () => {
  expect(
    mergeChangeSets(
      [
        {
          type: 'breaking',
          title: 'Old code no longer works',
          body: `Example using old code:\n\n    oldCode();\n\nExample using new code:\n\n    newCode()`,
          pr: 2,
        },
      ],
      [
        {
          type: 'breaking',
          title: 'Errors are now strings instead of numbers',
          body: '',
          pr: 3,
        },
      ],
      [
        {
          type: 'fix',
          title: 'Library no longer crashes your app',
          body: '',
          pr: 1,
        },
      ],
    ),
  ).toEqual([
    {
      type: 'breaking',
      title: 'Old code no longer works',
      body: `Example using old code:\n\n    oldCode();\n\nExample using new code:\n\n    newCode()`,
      pr: 2,
    },
    {
      type: 'breaking',
      title: 'Errors are now strings instead of numbers',
      body: '',
      pr: 3,
    },
    {
      type: 'fix',
      title: 'Library no longer crashes your app',
      body: '',
      pr: 1,
    },
  ]);
});

test('addContextToChangeSet', () => {
  expect(
    addContextToChangeSet(
      [
        {
          type: 'breaking',
          title: 'Old code no longer works',
          body: `Example using old code:\n\n    oldCode();\n\nExample using new code:\n\n    newCode()`,
        },
        {
          type: 'breaking',
          title: 'Errors are now strings instead of numbers',
          body: '',
        },
        {
          type: 'fix',
          title: 'Library no longer crashes your app',
          body: '',
        },
      ],
      {pr: 4},
    ),
  ).toEqual([
    {
      type: 'breaking',
      title: 'Old code no longer works',
      body: `Example using old code:\n\n    oldCode();\n\nExample using new code:\n\n    newCode()`,
      pr: 4,
    },
    {
      type: 'breaking',
      title: 'Errors are now strings instead of numbers',
      body: '',
      pr: 4,
    },
    {
      type: 'fix',
      title: 'Library no longer crashes your app',
      body: '',
      pr: 4,
    },
  ]);
});

test('extractChanges', () => {
  expect(
    extractChanges(
      [
        {
          type: 'breaking',
          title: 'Old code no longer works',
          body: `Example using old code:\n\n    oldCode();\n\nExample using new code:\n\n    newCode()`,
          pr: 2,
        },
        {
          type: 'breaking',
          title: 'Errors are now strings instead of numbers',
          body: '',
          pr: 3,
        },
        {
          type: 'fix',
          title: 'Library no longer crashes your app',
          body: '',
          pr: 1,
        },
      ],
      'fix',
    ),
  ).toEqual([
    {
      type: 'fix',
      title: 'Library no longer crashes your app',
      body: '',
      pr: 1,
    },
  ]);
});

test('changesToMarkdown', () => {
  expect(
    changesToMarkdown(
      [
        {
          type: 'breaking',
          title: 'Old code no longer works',
          body: `Example using old code:\n\n    oldCode();\n\nExample using new code:\n\n    newCode()`,
          pr: 2,
        },
        {
          type: 'breaking',
          title: 'Errors are now strings instead of numbers',
          body: '',
          pr: 3,
        },
        {
          type: 'fix',
          title: 'Library no longer crashes your app',
          body: '',
          pr: 1,
        },
      ],
      {
        headingLevel: 3,
        changeTypes: [
          {id: 'breaking', plural: 'Breaking Changes'},
          {id: 'feat', plural: 'New Features'},
          {id: 'fix', plural: 'Bug Fixes'},
        ],
        renderContext: (change) => ` (#${change.pr})`,
      },
    ),
  ).toMatchInlineSnapshot(`
    "### Breaking Changes

    - Old code no longer works (#2)

      Example using old code:
      
          oldCode();
      
      Example using new code:
      
          newCode()

    - Errors are now strings instead of numbers (#3)

    ### Bug Fixes

    - Library no longer crashes your app (#1)"
  `);
});
