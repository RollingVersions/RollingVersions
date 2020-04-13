import {checkGitHubReleaseStatus} from '../github';

test('checkGitHubReleaseStatus', async () => {
  const status = await checkGitHubReleaseStatus(
    {
      owner: 'FakeOwner',
      name: 'single',
      dirname: '/repositories/single',
      deployBranch: null,
    },
    null as any,
  );
  expect(status).toMatchInlineSnapshot(`
    Object {
      "ok": true,
      "tags": Array [
        "single-package@1.0.0",
      ],
    }
  `);
});
