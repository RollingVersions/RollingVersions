import {renderReleaseNotes} from '../Rendering';

test('renderReleaseNotes', () => {
  expect(
    renderReleaseNotes([
      {
        type: 'fix',
        title: 'Library no longer crashes your app',
        body: '',
        pr: 1,
      },
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
      },
    ] as const),
  ).toMatchInlineSnapshot(`
    "### Breaking Changes

    - Old code no longer works (#2)

      Example using old code:
      
          oldCode();
      
      Example using new code:
      
          newCode()

    - Errors are now strings instead of numbers

    ### Bug Fixes

    - Library no longer crashes your app (#1)"
  `);
});
