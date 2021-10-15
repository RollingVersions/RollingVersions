import * as t from 'funtypes';

import {
  ChangeSetEntry,
  ChangeTypeID,
  MarkdownString,
  PackageManifestCodec,
  VersionTagCodec,
} from '@rollingversions/types';

import {PermissionCodec} from './server/permissions/Permission';

export const ChangeTypeIDCodec: t.Codec<ChangeTypeID> = t.String;
export const MarkdownCodec: t.Codec<MarkdownString> = t.String;
export const ChangeSetEntryCodec: t.Codec<ChangeSetEntry> = t.Named(
  `ChangeSetEntry`,
  t.Readonly(
    t.Object({
      type: ChangeTypeIDCodec,
      title: MarkdownCodec,
      body: MarkdownCodec,
    }),
  ),
);

export const PullRequestPackageCodec = t.Named(
  `PullRequestPackage`,
  t.Object({
    manifest: PackageManifestCodec,
    currentVersion: t.Union(t.Null, VersionTagCodec),
    changeSet: t.Readonly(t.Array(ChangeSetEntryCodec)),
    released: t.Boolean,
  }),
);
export type PullRequestPackage = t.Static<typeof PullRequestPackageCodec>;
export const PullRequestPackagesCodec = t
  .Array(t.Tuple(t.String, PullRequestPackageCodec))
  .withParser<Map<string, PullRequestPackage>>({
    parse(array) {
      return {success: true, value: new Map(array)};
    },
    serialize(map) {
      return {success: true, value: [...map]};
    },
  });
export type PullRequestPackages = t.Static<typeof PullRequestPackagesCodec>;

export const PullRequestResponseCodec = t.Named(
  'PullRequestResponse',
  t.Readonly(
    t.Object({
      headSha: t.Union(t.Null, t.String),
      permission: PermissionCodec,
      closed: t.Boolean,
      merged: t.Boolean,
      packages: PullRequestPackagesCodec,
      packageErrors: t.Readonly(
        t.Array(t.Readonly(t.Object({filename: t.String, error: t.String}))),
      ),
    }),
  ),
);
export type PullRequestResponse = t.Static<typeof PullRequestResponseCodec>;

export const UpdatePullRequestBodyCodec = t.Named(
  `UpdatePullRequestBody`,
  t.Readonly(
    t.Object({
      headSha: t.Union(t.String, t.Null),
      updates: t.Readonly(
        t.Array(
          t.Named(
            `Update`,
            t.Readonly(
              t.Object({
                packageName: t.String,
                changes: t.Readonly(t.Array(ChangeSetEntryCodec)),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);

export type UpdatePullRequestBody = t.Static<typeof UpdatePullRequestBodyCodec>;
