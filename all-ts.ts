import {
  addContextToChangeSet,
  changesToMarkdown,
  createChangeSet,
  extractChanges,
  isEmptyChangeSet,
  mergeChangeSets,
} from '..';

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
import {DEFAULT_CHANGE_TYPES} from '@rollingversions/config';
import type {
  ChangeTypeID,
  ChangeType,
  ChangeSetEntry,
  ChangeSet as CS,
  MarkdownString,
} from '@rollingversions/types';

export type {ChangeSetEntry};
type ChangeSet<TContext = {}> = CS<TContext>;
export default ChangeSet;

export function createChangeSet<TContext = {}>(
  ...changes: ChangeSet<TContext>
): ChangeSet<TContext> {
  return changes;
}

export function isEmptyChangeSet(changes: ChangeSet) {
  return changes.length === 0;
}

export function mergeChangeSets<T>(
  ...sets: readonly ChangeSet<T>[]
): ChangeSet<T> {
  return sets.reduce((a, b) => [...a, ...b], []);
}

export function addContextToChangeSet<TNewContext, TOldContext = {}>(
  changeSet: ChangeSet<TOldContext>,
  newContext: TNewContext,
): ChangeSet<TOldContext & TNewContext> {
  return changeSet.map((c) => ({...c, ...newContext}));
}

export function extractChanges<TExtra>(
  changeSet: ChangeSet<TExtra>,
  changeType: ChangeTypeID,
): ChangeSet<TExtra> {
  return changeSet.filter((c) => c.type === changeType);
}

export function changesToMarkdown<TContext = {}>(
  changeSet: ChangeSet<TContext>,
  {
    changeTypes = DEFAULT_CHANGE_TYPES,
    headingLevel,
    renderContext,
  }: {
    changeTypes?: readonly ChangeType[];
    headingLevel: number;
    renderContext?: (
      changeLogEntry: ChangeSetEntry<TContext>,
    ) => MarkdownString;
  },
) {
  const headingPrefix = '#'.repeat(headingLevel);
  return changeTypes
    .map((changeType) => {
      const changes = extractChanges(changeSet, changeType.id);
      if (changes.length === 0) return '';
      return `${headingPrefix} ${changeType.plural}\n\n${changes
        .map(
          (c) =>
            `- ${c.title}${renderContext ? renderContext(c) : ``}${
              c.body.length ? `\n\n${c.body.replace(/^/gm, '  ')}` : ``
            }`,
        )
        .join('\n\n')}`;
    })
    .filter((c) => c !== '')
    .join('\n\n');
}
import {PackageManifest, PublishTargetConfig} from '@rollingversions/types';
import type VersionNumber from '@rollingversions/version-number';

import {NewVersionToBePublished} from '../types/PackageStatus';
import type PrePublishResult from '../types/PrePublishResult';
import type {PublishConfig} from '../types/publish';

export interface BaseTargetConfig<T extends PublishTargetConfig> {
  type: T['type'];
  pathMayContainPackage(filename: string): boolean;
  getPackageManifest(
    path: string,
    content: string,
  ): Promise<
    {ok: true; manifest: PackageManifest | null} | {ok: false; reason: string}
  >;
  prepublish(
    config: PublishConfig,
    pkg: NewVersionToBePublished,
    targetConfig: T,
    packageVersions: Map<string, VersionNumber | null>,
  ): Promise<PrePublishResult>;
  publish(
    config: PublishConfig,
    pkg: NewVersionToBePublished,
    targetConfig: T,
    packageVersions: Map<string, VersionNumber | null>,
  ): Promise<void>;
}

export interface BaseTarget {
  pathMayContainPackage(filename: string): boolean;
  getPackageManifest(
    path: string,
    content: string,
  ): Promise<
    {ok: true; manifest: PackageManifest | null} | {ok: false; reason: string}
  >;
  prepublish(
    config: PublishConfig,
    pkg: NewVersionToBePublished,
    targetConfig: PublishTargetConfig,
    packageVersions: Map<string, VersionNumber | null>,
  ): Promise<PrePublishResult | null>;
  publish(
    config: PublishConfig,
    pkg: NewVersionToBePublished,
    targetConfig: PublishTargetConfig,
    packageVersions: Map<string, VersionNumber | null>,
  ): Promise<null | true>;
}

export default function createPublishTargetAPI<T extends PublishTargetConfig>(
  target: BaseTargetConfig<T>,
): BaseTarget {
  function isTargetConfig(config: PublishTargetConfig): config is T {
    return config.type === target.type;
  }
  return {
    pathMayContainPackage: (filename) => target.pathMayContainPackage(filename),
    getPackageManifest: (filename, content) =>
      target.getPackageManifest(filename, content),
    prepublish: (config, pkg, targetConfig, packageVersions) => {
      return isTargetConfig(targetConfig)
        ? target.prepublish(config, pkg, targetConfig, packageVersions)
        : Promise.resolve(null);
    },
    publish: async (config, pkg, targetConfig, packageVersions) => {
      if (isTargetConfig(targetConfig)) {
        await target.publish(config, pkg, targetConfig, packageVersions);
        return true;
      }
      return null;
    },
  };
}
import {dirname, resolve} from 'path';

import {execBuffered} from 'modern-spawn';
import * as toml from 'toml';

import {parseRollingConfigOptions} from '@rollingversions/config';
import {printTag} from '@rollingversions/tag-format';
import {
  CustomScriptTargetConfig,
  PackageManifest,
  PublishTarget,
  RollingConfigOptions,
} from '@rollingversions/types';
import type VersionNumber from '@rollingversions/version-number';
import {printString} from '@rollingversions/version-number';

import isObject from '../ts-utils/isObject';
import {NewVersionToBePublished} from '../types/PackageStatus';
import {PublishConfig} from '../types/publish';
import createPublishTargetAPI from './baseTarget';

const KEYS_TO_CONFIG: [keyof RollingConfigOptions, string][] = [
  ['baseVersion', 'base_version'],
  ['changeTypes', 'change_types'],
  ['tagFormat', 'tag_format'],
  ['versioningMode', 'versioning_mode'],
  ['versionSchema', 'version_schema'],
];

const MANIFEST_NAME = 'rolling-package';
// TODO: better error messages
type ParseResult = {ok: true; value: unknown} | {ok: false; reason: string};
const failed = (reason: string): {ok: false; reason: string} => ({
  ok: false,
  reason,
});
const MANIFEST_EXTENSIONS = {
  '.json': (str: string): ParseResult => {
    try {
      return {ok: true, value: JSON.parse(str)};
    } catch (ex: any) {
      return failed(ex.message);
    }
  },
  '.toml': (str: string): ParseResult => {
    try {
      return {ok: true, value: toml.parse(str)};
    } catch (ex: any) {
      return failed(ex.message);
    }
  },
};
const filenames = Object.keys(MANIFEST_EXTENSIONS).map(
  (ext) => `${MANIFEST_NAME}${ext}`,
);

function dependencyNameToEnvVar(name: string) {
  return `DEPENDENCY_${name
    .replace(/\@/g, '')
    .replace(/[^a-z0-9]/gi, '_')
    .toUpperCase()}`;
}

function parsePackage(path: string, content: string) {
  for (const [ext, parser] of Object.entries(MANIFEST_EXTENSIONS)) {
    if (path.endsWith(ext)) {
      return parser(content);
    }
  }
  return undefined;
}

export default createPublishTargetAPI<CustomScriptTargetConfig>({
  type: PublishTarget.custom_script,
  pathMayContainPackage(filename) {
    return filenames.some((f) => filename === f || filename.endsWith(`/${f}`));
  },

  async getPackageManifest(
    path,
    content,
  ): Promise<
    {ok: true; manifest: PackageManifest | null} | {ok: false; reason: string}
  > {
    const parseResult = parsePackage(path, content);
    if (!parseResult) return {ok: true, manifest: null};
    if (!parseResult.ok) return parseResult;

    const result = parseResult.value;

    if (!isObject(result)) {
      return failed(`Expected config to be an object`);
    }
    if (typeof result.name !== 'string') {
      return failed('Expected "name" to be a string');
    }

    if (!isObject(result.scripts)) {
      return failed('Expected "scripts" to be an object');
    }
    if (
      result.scripts.prepublish !== undefined &&
      typeof result.scripts.prepublish !== 'string'
    ) {
      return failed(
        'Expected "scripts"."prepublish" to be a string or undefined',
      );
    }

    if (
      result.scripts.publish_dry_run !== undefined &&
      typeof result.scripts.publish_dry_run !== 'string'
    ) {
      return failed(
        'Expected "scripts"."publish_dry_run" to be a string or undefined',
      );
    }

    if (typeof result.scripts.publish !== 'string') {
      return failed('Expected "scripts"."publish" to be a string');
    }

    if (
      result.dependencies !== undefined &&
      !(
        Array.isArray(result.dependencies) &&
        result.dependencies.every((value) => typeof value === 'string')
      )
    ) {
      return failed(
        'Expected "dependencies" to be undefined or an array of strings',
      );
    }

    const customized: (keyof RollingConfigOptions)[] = [];
    const rawConfig: {
      -readonly [k in keyof RollingConfigOptions]?: unknown;
    } = {};
    for (const [configKey, pkgKey] of KEYS_TO_CONFIG) {
      const value = result[pkgKey];
      if (value !== undefined) {
        rawConfig[configKey] = value;
        customized.push(configKey);
      }
    }
    if (rawConfig.versioningMode === undefined) {
      const value = result.versioning;
      if (value !== undefined) {
        rawConfig.versioningMode = value;
        customized.push(`versioningMode`);
      }
    }
    const config = parseRollingConfigOptions(rawConfig);

    if (!config.success) {
      let reason = config.reason;
      for (const [configKey, pkgKey] of KEYS_TO_CONFIG) {
        reason = reason.split(configKey).join(pkgKey);
      }
      return failed(reason);
    }

    return {
      ok: true,
      manifest: {
        packageName: result.name,
        ...config.value,
        customized,
        targetConfigs: [
          {
            type: PublishTarget.custom_script,
            path,
            prepublish: result.scripts.prepublish,
            publish_dry_run: result.scripts.publish_dry_run,
            publish: result.scripts.publish,
          },
        ],
        dependencies: {
          required: result.dependencies || [],
          optional: [],
          development: [],
        },
      },
    };
  },

  async prepublish(config, pkg, targetConfig, packageVersions) {
    const env = getEnv(config, pkg, packageVersions);

    if (targetConfig.prepublish) {
      const result = await execBuffered(targetConfig.prepublish, {
        env,
        cwd: dirname(resolve(config.dirname, targetConfig.path)),
      });
      if (result.status) {
        return {ok: false, reason: result.stderr.toString('utf8')};
      }
    }

    return {ok: true};
  },

  async publish(config, pkg, targetConfig, packageVersions) {
    const env = getEnv(config, pkg, packageVersions);
    if (config.dryRun) {
      if (targetConfig.publish_dry_run) {
        const result = await execBuffered(targetConfig.publish_dry_run, {
          env,
          debug: true,
        });
        // getResult throws if the command failed
        result.getResult();
      }
    } else {
      const result = await execBuffered(targetConfig.publish, {
        env,
        cwd: dirname(resolve(config.dirname, targetConfig.path)),
        debug: true,
      });
      // getResult throws if the command failed
      result.getResult();
    }
  },
});

function getEnv(
  config: PublishConfig,
  pkg: NewVersionToBePublished,
  packageVersions: Map<string, VersionNumber | null>,
) {
  const env: {[key: string]: string | undefined} = {...process.env};
  if (config.canary) {
    env.CANARY = config.canary;
  }
  if (config.deployBranch) {
    env.DEPLOY_BRANCH = config.deployBranch;
  }
  if (config.dryRun) {
    env.DRY_RUN = 'TRUE';
  }
  env.GITHUB_REPOSITORY = `${config.owner}/${config.name}`;
  env.GITHUB_REPOSITORY_OWNER = config.owner;
  env.GITHUB_REPOSITORY_NAME = config.name;

  if (pkg.currentVersion) env.CURRENT_VERSION = printString(pkg.currentVersion);
  if (pkg.currentTagName) env.CURRENT_TAG = pkg.currentTagName;

  env.NEW_VERSION = printString(pkg.newVersion);
  env.NEW_TAG = printTag(pkg.newVersion, {
    packageName: pkg.packageName,
    oldTagName: pkg.currentTagName,
    tagFormat: pkg.manifest.tagFormat,
    versionSchema: pkg.manifest.versionSchema,
  });

  for (const [name, version] of packageVersions) {
    if (version !== null) {
      env[dependencyNameToEnvVar(name)] = printString(version);
    }
  }
  return env;
}
import {changesToMarkdown} from '@rollingversions/change-set';
import {printTag} from '@rollingversions/tag-format';

import {getHeadSha} from '../services/git';
import type {GitHubClient} from '../services/github';
import {getRepositoryViewerPermissions, getViewer} from '../services/github';
import {NewVersionToBePublished} from '../types/PackageStatus';
import type PrePublishResult from '../types/PrePublishResult';
import {PublishConfig} from '../types/publish';

export async function checkGitHubReleaseStatus(
  {
    owner,
    name,
    deployBranch,
    allowNonLatestCommit,
    allowAnyBranch,
  }: Pick<
    PublishConfig,
    | 'owner'
    | 'name'
    | 'deployBranch'
    | 'allowNonLatestCommit'
    | 'allowAnyBranch'
  >,
  branches: {
    headSha: string;
    defaultBranch: {headSha: string | null; name: string};
    deployBranch: {headSha: string | null; name: string};
  },
  client: GitHubClient,
): Promise<{ok: true} | {ok: false; reason: string}> {
  const expectedBranchName = deployBranch ?? branches.defaultBranch.name;
  const [viewer, permission] = await Promise.all([
    getViewer(client),
    getRepositoryViewerPermissions(client, {
      owner,
      name,
    }),
  ]);
  if (
    viewer.login !== 'github-actions[bot]' &&
    (!permission || !['ADMIN', 'MAINTAIN', 'WRITE'].includes(permission))
  ) {
    return {
      ok: false,
      reason: `This GitHub token does not have permission to publish tags/releases to GitHub. It has viewerPermission ${permission} but needs one of ADMIN, MAINTAIN or WRITE`,
    };
  }
  if (!allowAnyBranch) {
    if (expectedBranchName !== branches.deployBranch.name) {
      return {
        ok: false,
        reason: `This build is running on branch "${branches.deployBranch.name}" but the deployment branch is "${expectedBranchName}". You can specify a different deployment branch by adding --deploy-branch "${branches.deployBranch.name}" when calling the Rolling Versions CLI, or you can disable this check entirely by passing --allow-any-branch.`,
      };
    }
  }
  if (!allowNonLatestCommit) {
    if (branches.headSha !== branches.deployBranch.headSha) {
      return {
        ok: false,
        reason: `This build is not running against commit "${branches.headSha}" but the latest commit in "${branches.deployBranch.name}" is "${branches.deployBranch.headSha}". To avoid awkward race conditions we'll skip publishing here and leave publishing to the newer commit. You can disable this warning and publish anyway by passing the "--allow-non-latest-commit" flag when calling the Rolling Versions CLI.`,
      };
    }
  }

  return {ok: true};
}

export function checkGitHubTagAvailable(
  {canary}: PublishConfig,
  pkg: NewVersionToBePublished,
  allTagNames: Set<string>,
): PrePublishResult {
  if (canary === null) {
    const tagName = printTag(pkg.newVersion, {
      packageName: pkg.packageName,
      oldTagName: pkg.currentTagName,
      tagFormat: pkg.manifest.tagFormat,
      versionSchema: pkg.manifest.versionSchema,
    });
    if (allTagNames.has(tagName)) {
      return {ok: false, reason: `The tag name ${tagName} already exists.`};
    }
  }
  return {ok: true};
}

export async function createGitHubRelease(
  {owner, name: repo, dirname, dryRun, canary, logger}: PublishConfig,
  client: GitHubClient,
  pkg: NewVersionToBePublished,
) {
  const headSha = await getHeadSha(dirname);
  if (canary) {
    logger.onCanaryGitHubRelease?.({pkg, dryRun});
  } else {
    const tagName = printTag(pkg.newVersion, {
      packageName: pkg.packageName,
      oldTagName: pkg.currentTagName,
      tagFormat: pkg.manifest.tagFormat,
      versionSchema: pkg.manifest.versionSchema,
    });
    logger.onPublishGitHubRelease?.({pkg, tagName, dryRun});
    let response;
    if (!dryRun) {
      response = (
        await client.rest.repos.createRelease({
          draft: false,
          prerelease: false,
          owner,
          repo,

          body: changesToMarkdown(pkg.changeSet, {
            headingLevel: 2,
            renderContext: ({pr}) => ` (#${pr})`,
            changeTypes: pkg.manifest.changeTypes,
          }),
          name: tagName,
          tag_name: tagName,
          target_commitish: headSha,
        })
      ).data;
    }
    logger.onPublishedGitHubRelease?.({pkg, tagName, dryRun, response});
  }
}
import {PackageManifest} from '@rollingversions/types';
import type VersionNumber from '@rollingversions/version-number';

import type {GitHubClient} from '../services/github';
import isTruthy from '../ts-utils/isTruthy';
import {NewVersionToBePublished} from '../types/PackageStatus';
import PrePublishResult from '../types/PrePublishResult';
import {PublishConfig} from '../types/publish';
import custom_script from './custom_script';
import * as github from './github';
import npm from './npm';

const targets = [npm, custom_script];

export function pathMayContainPackage(filename: string): boolean {
  return targets.some((p) => p.pathMayContainPackage(filename));
}

export async function getPackageManifests(
  filename: string,
  content: string,
): Promise<{
  manifests: PackageManifest[];
  errors: string[];
}> {
  const manifests: PackageManifest[] = [];
  const errors: string[] = [];
  await Promise.all(
    targets
      .filter((p) => p.pathMayContainPackage(filename))
      .map(async (p) => {
        const result = await p.getPackageManifest(filename, content);
        if (result.ok && result.manifest) {
          manifests.push(result.manifest);
        } else if (!result.ok) {
          errors.push(result.reason);
        }
      }),
  );
  return {manifests, errors};
}

export async function prepublish(
  config: PublishConfig,
  pkg: NewVersionToBePublished,
  packageVersions: Map<string, VersionNumber | null>,
  allTagNames: Set<string>,
): Promise<PrePublishResult[]> {
  const results = await Promise.all(
    pkg.manifest.targetConfigs.map((targetConfig) =>
      Promise.all(
        targets.map((t) =>
          t.prepublish(config, pkg, targetConfig, packageVersions),
        ),
      ),
    ),
  );
  return results
    .reduce((a, b) => a.concat(b), [
      github.checkGitHubTagAvailable(config, pkg, allTagNames),
    ])
    .filter(isTruthy);
}

export async function publish(
  config: PublishConfig,
  pkg: NewVersionToBePublished,
  packageVersions: Map<string, VersionNumber | null>,
  client: GitHubClient,
) {
  for (const target of pkg.manifest.targetConfigs) {
    config.logger.onPublishTargetRelease?.({
      pkg,
      target,
      dryRun: config.dryRun,
    });
    for (const targetAPI of targets) {
      await targetAPI.publish(config, pkg, target, packageVersions);
    }
    config.logger.onPublishedTargetRelease?.({
      pkg,
      target,
      dryRun: config.dryRun,
    });
  }

  await github.createGitHubRelease(config, client, pkg);
}
import {gt, prerelease} from 'semver';

import {parseRollingConfigOptions} from '@rollingversions/config';
import {
  NpmPublishTargetConfig,
  PackageManifest,
  PublishTarget,
  RollingConfigOptions,
} from '@rollingversions/types';
import type VersionNumber from '@rollingversions/version-number';
import {printString} from '@rollingversions/version-number';

import {readRepoFile, writeRepoFile} from '../services/git';
import {
  getProfile,
  getOwners,
  getVersions,
  getOrgRoster,
  publish as npmPublish,
} from '../services/npm';
import isObject from '../ts-utils/isObject';
import {PublishConfig} from '../types/publish';
import createPublishTargetAPI from './baseTarget';

const detectIndent = require('detect-indent');
const detectNewline = require('detect-newline').graceful;
const stringifyPackage = require('stringify-package');

const CONFIG_KEYS: (keyof RollingConfigOptions)[] = [
  'baseVersion',
  'changeTypes',
  'tagFormat',
  'versioningMode',
  'versionSchema',
];

function versionPrefix(oldVersion: string, {canary}: {canary: boolean}) {
  if (canary) return '';
  switch (oldVersion[0]) {
    case '^':
    case '~':
      return oldVersion[0];
    default:
      return '';
  }
}

async function withNpmVersion<T>(
  config: PublishConfig,
  target: NpmPublishTargetConfig,
  newVersion: string,
  packageVersions: Map<string, VersionNumber | null>,
  fn: () => Promise<T>,
) {
  const original = await readRepoFile(config.dirname, target.path, 'utf8');
  const pkgData = JSON.parse(original);
  pkgData.version = newVersion;
  function setVersions(obj: any) {
    if (obj) {
      for (const key of Object.keys(obj)) {
        const version = packageVersions.get(key);
        if (version) {
          obj[key] = `${versionPrefix(obj[key], {
            canary: config.canary !== null,
          })}${printString(version)}`;
        }
      }
    }
  }
  // N.B. we are not doing anything with peer dependencies here
  setVersions(pkgData.dependencies);
  setVersions(pkgData.optionalDependencies);
  setVersions(pkgData.devDependencies);
  const str = stringifyPackage(
    pkgData,
    detectIndent(original).indent,
    detectNewline(original),
  );
  try {
    await writeRepoFile(config.dirname, target.path, str);
    return await fn();
  } finally {
    await writeRepoFile(config.dirname, target.path, original);
  }
}

function getConfigValue(
  name: string,
  config: {
    [key: string]: unknown;
  },
) {
  if (config[`@rollingversions/${name}`] !== undefined) {
    return config[`@rollingversions/${name}`];
  } else if (
    isObject(config['@rollingversions']) &&
    config['@rollingversions'][name] !== undefined
  ) {
    return config['@rollingversions'][name];
  }
  return undefined;
}

function getConfigName(
  name: string,
  config: {
    [key: string]: unknown;
  },
) {
  if (config[`@rollingversions/${name}`] !== undefined) {
    return `pkg["@rollingversions/${name}"]`;
  }
  return `pkg["@rollingversions"]["${name}"]`;
}

const failed = (reason: string): {ok: false; reason: string} => ({
  ok: false,
  reason,
});

export default createPublishTargetAPI<NpmPublishTargetConfig>({
  type: PublishTarget.npm,
  pathMayContainPackage(filename) {
    return filename === 'package.json' || filename.endsWith('/package.json');
  },
  async getPackageManifest(
    path,
    content,
  ): Promise<
    {ok: true; manifest: PackageManifest | null} | {ok: false; reason: string}
  > {
    let pkgData: unknown;
    try {
      pkgData = JSON.parse(content);
    } catch (ex: any) {
      return failed(ex.message);
    }
    if (!isObject(pkgData)) {
      return failed(`Expected package.json to be an object`);
    }

    if (!pkgData.name) {
      return {ok: true, manifest: null};
    }

    if (typeof pkgData.name !== 'string') {
      return failed(`Expected "name" to be a string`);
    }

    const pkgName = pkgData.name;
    if (getConfigValue('ignore', pkgData)) {
      return {ok: true, manifest: null};
    }

    const customized: (keyof RollingConfigOptions)[] = [];
    const rawConfig: {
      -readonly [k in keyof RollingConfigOptions]?: unknown;
    } = {};
    for (const configKey of CONFIG_KEYS) {
      const value = getConfigValue(configKey, pkgData);
      if (value !== undefined) {
        rawConfig[configKey] = value;
        customized.push(configKey);
      }
    }
    if (rawConfig.versioningMode === undefined) {
      const value = getConfigValue(`versioning`, pkgData);
      if (value !== undefined) {
        rawConfig.versioningMode = value;
        customized.push(`versioningMode`);
      }
    }

    const config = parseRollingConfigOptions(rawConfig);

    if (!config.success) {
      let reason = config.reason;
      for (const configKey of CONFIG_KEYS) {
        reason = reason
          .split(configKey)
          .join(getConfigName(configKey, pkgData));
      }
      return failed(reason);
    }

    const required = [
      ...(isObject(pkgData) && isObject(pkgData.dependencies)
        ? Object.keys(pkgData.dependencies)
        : []),
      ...(isObject(pkgData) && isObject(pkgData.peerDependencies)
        ? Object.keys(pkgData.peerDependencies)
        : []),
    ];

    const optional =
      isObject(pkgData) && isObject(pkgData.optionalDependencies)
        ? Object.keys(pkgData.optionalDependencies)
        : [];

    const development =
      isObject(pkgData) && isObject(pkgData.devDependencies)
        ? Object.keys(pkgData.devDependencies)
        : [];

    return {
      ok: true,
      manifest: {
        packageName: pkgName,
        ...config.value,
        customized,
        targetConfigs: [
          {
            type: PublishTarget.npm,
            packageName: pkgName,
            path,
            private: pkgData.private === true,
            publishConfigAccess: pkgName.startsWith('@')
              ? isObject(pkgData.publishConfig) &&
                pkgData.publishConfig.access === 'public'
                ? 'public'
                : 'restricted'
              : 'public',
          },
        ],
        dependencies: {required, optional, development},
      },
    };
  },
  async prepublish(config, pkg, targetConfig, packageVersions) {
    if (targetConfig.private) return {ok: true};
    const [auth, owners, versions] = await Promise.all([
      getProfile(),
      getOwners(targetConfig.packageName),
      getVersions(targetConfig.packageName),
    ] as const);

    if (!auth.authenticated) {
      return {
        ok: false,
        reason: 'Could not authenticate to npm: ' + auth.message,
      };
    }

    const profile = auth.profile;

    if (profile.tfaOnPublish) {
      return {
        ok: false,
        reason:
          'This user requires 2fa on publish to npm, which is not supported',
      };
    }

    if (!owners) {
      const orgName = targetConfig.packageName.split('/')[0].substr(1);
      if (
        targetConfig.packageName.startsWith('@') &&
        profile.name !== orgName
      ) {
        const orgRoster = await getOrgRoster(orgName);
        if (!orgRoster[profile.name]) {
          return {
            ok: false,
            reason: `@${profile.name} does not appear to have permission to publish new packages to @${orgName} on npm`,
          };
        }
      }
    } else {
      if (!owners.some((m) => m.name === profile.name)) {
        return {
          ok: false,
          reason: `The user @${profile.name} is not listed as a maintainer of ${targetConfig.packageName} on npm`,
        };
      }
    }
    const semverVersion = printString(pkg.newVersion);
    if (versions) {
      const max = [...versions]
        .filter((v) => !prerelease(v))
        .reduce((a, b) => (gt(a, b) ? a : b), '0.0.0');
      if (gt(max, semverVersion)) {
        return {
          ok: false,
          reason: `${
            pkg.packageName
          } already has a version ${max} on npm, which is greater than the version that would be published (${printString(
            pkg.newVersion,
          )}). Please add a tag/release in GitHub called "${
            pkg.packageName
          }@${max}" that points at the correct commit for ${max}`,
        };
      }
      if (versions.has(semverVersion)) {
        return {
          ok: false,
          reason: `${
            targetConfig.packageName
          } already has a version ${printString(pkg.newVersion)} on npm`,
        };
      }
    }

    await withNpmVersion(
      config,
      targetConfig,
      semverVersion,
      packageVersions,
      async () => {
        await npmPublish(config.dirname, targetConfig.path, {
          dryRun: true,
          canary: config.canary !== null,
        });
      },
    );

    return {ok: true};
  },
  async publish(config, pkg, targetConfig, packageVersions) {
    if (targetConfig.private) return;
    await withNpmVersion(
      config,
      targetConfig,
      printString(pkg.newVersion),
      packageVersions,
      async () => {
        await npmPublish(config.dirname, targetConfig.path, {
          dryRun: config.dryRun,
          canary: config.canary !== null,
        });
      },
    );
  },
});
#!/usr/bin/env node

import {URL} from 'url';

import chalk from 'chalk';
import {parse, startChain, param} from 'parameter-reducers';

import {changesToMarkdown} from '@rollingversions/change-set';
import {printTag} from '@rollingversions/tag-format';
import {printString} from '@rollingversions/version-number';

import printHelp from './commands/help';
import publish, {PublishResultKind} from './commands/publish';
import PackageStatus, {
  NewVersionToBePublished,
  NoUpdateRequired,
} from './types/PackageStatus';

const CI_ENV = require('env-ci')();

const DIRNAME = process.cwd();

const COMMAND = process.argv[2];
const PARAMS = process.argv.slice(3);

const helpParams = startChain().addParam(param.flag(['-h', '--help'], 'help'));

switch (COMMAND) {
  case 'publish': {
    const publishParams = helpParams
      .addParam(param.flag(['-d', '--dry-run'], 'dryRun'))
      .addParam(param.flag(['--supress-errors'], 'supressErrors'))
      .addParam(param.string(['-r', '--repo'], 'repoSlug'))
      .addParam(param.string(['-g', '--github-token'], 'githubToken'))
      .addParam(param.string(['-b', '--deploy-branch'], 'deployBranch'))
      .addParam(param.string(['--backend'], 'backend'))
      .addParam(param.flag([`--allow-any-branch`], `allowAnyBranch`))
      .addParam(
        param.flag([`--allow-non-latest-commit`], `allowNonLatestCommit`),
      )
      .addParam(
        param.parsedString(['--canary'], 'canary', (value) => {
          if (!value) {
            return {
              valid: false,
              reason: `When using the "--canary" flag, you *must* provide a build number as the parameter.`,
            };
          }
          return {valid: true, value};
        }),
      );
    const parserResult = parse(publishParams, PARAMS);
    if (!parserResult.valid) {
      console.error(parserResult.reason);
      process.exit(1);
    }
    if (parserResult.parsed.help) {
      printHelp();
      process.exit(0);
    }
    if (parserResult.rest.length) {
      console.error(`Unrecognized parameter "${parserResult.rest[0]}"`);
      process.exit(1);
    }
    const {
      dryRun = false,
      supressErrors = false,
      // env-ci does not support GitHub actions, which uses GITHUB_REPOSITORY
      repoSlug = CI_ENV.slug || process.env.GITHUB_REPOSITORY,
      githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
      deployBranch,
      canary,
      allowAnyBranch = false,
      allowNonLatestCommit = false,
      backend,
    } = parserResult.parsed;

    if (!githubToken) {
      console.error(
        'You must specify a GitHub token, either in the "GITHUB_TOKEN" env var or by passing "--github-token <some_token>" on the CLI.',
      );
      process.exit(supressErrors ? 0 : 1);
    }

    if (!repoSlug) {
      console.error(
        'You must specify a GitHub repo by passing "--repo <owner>/<name>" on the CLI. This can normally be automatically determined on CI systems.',
      );
      process.exit(supressErrors ? 0 : 1);
    }

    const slug = repoSlug.split('/');
    if (slug.length !== 2) {
      console.error('Expected repo slug to be of the form <owner>/<name>');
      process.exit(supressErrors ? 0 : 1);
    }
    const [owner, name] = slug;

    publish({
      backend: new URL(backend ?? `https://rollingversions.com`),
      dirname: DIRNAME,
      owner,
      name,
      accessToken: githubToken,
      deployBranch: deployBranch || null,
      dryRun,
      canary: canary || null,
      allowAnyBranch,
      allowNonLatestCommit,
      logger: {
        onValidatedPackages({packages}) {
          const hasUpdates = packages.some(
            (p) => p.status === PackageStatus.NewVersionToBePublished,
          );
          const hasPkgsWithoutUpdates = packages.some(
            (p) => p.status === PackageStatus.NoUpdateRequired,
          );

          if (hasPkgsWithoutUpdates) {
            console.warn(
              hasUpdates
                ? chalk.blue(`# Packages without updates`)
                : chalk.blue(`None of the packages require updates:`),
            );
            console.warn(``);
            for (const p of packages.filter(
              (p): p is NoUpdateRequired =>
                p.status === PackageStatus.NoUpdateRequired,
            )) {
              console.warn(
                p.currentVersion
                  ? `  - ${p.packageName}@${printString(p.currentVersion)}`
                  : `  - ${p.packageName}`,
              );
            }
            console.warn(``);
          }

          if (hasUpdates) {
            console.warn(chalk.blue(`# Packages to publish`));
            console.warn(``);
            for (const p of packages.filter(
              (p): p is NewVersionToBePublished =>
                p.status === PackageStatus.NewVersionToBePublished,
            )) {
              console.warn(
                chalk.yellow(
                  `## ${p.packageName} (${
                    p.currentVersion && p.currentTagName
                      ? p.manifest.tagFormat
                        ? p.currentTagName
                        : printString(p.currentVersion)
                      : 'unreleased'
                  } → ${
                    p.manifest.tagFormat
                      ? printTag(p.newVersion, {
                          packageName: p.packageName,
                          oldTagName: p.currentTagName,
                          tagFormat: p.manifest.tagFormat,
                          versionSchema: p.manifest.versionSchema,
                        })
                      : printString(p.newVersion)
                  })`,
                ),
              );
              console.warn(``);
              console.warn(
                changesToMarkdown(p.changeSet, {
                  headingLevel: 3,
                  renderContext: ({pr}) => ` (#${pr})`,
                  changeTypes: p.manifest.changeTypes,
                }),
              );
              console.warn(``);
            }
            console.warn(``);
          }
        },
        onCanaryGitHubRelease({pkg}) {
          console.warn(
            `not publishing ${chalk.yellow(pkg.packageName)} to ${chalk.blue(
              'GitHub Releases',
            )} as ${chalk.yellow(
              printTag(pkg.newVersion, {
                packageName: pkg.packageName,
                oldTagName: pkg.currentTagName,
                tagFormat: pkg.manifest.tagFormat,
                versionSchema: pkg.manifest.versionSchema,
              }),
            )} in ${chalk.red(`canary mode`)}`,
          );
        },
        onPublishGitHubRelease({pkg, dryRun}) {
          console.warn(
            `publishing ${chalk.yellow(pkg.packageName)} to ${chalk.blue(
              'GitHub Releases',
            )} as ${chalk.yellow(
              printTag(pkg.newVersion, {
                packageName: pkg.packageName,
                oldTagName: pkg.currentTagName,
                tagFormat: pkg.manifest.tagFormat,
                versionSchema: pkg.manifest.versionSchema,
              }),
            )}${dryRun ? ` ${chalk.red(`(dry run)`)}` : ''}`,
          );
        },
        onPublishTargetRelease({pkg, target, dryRun}) {
          console.warn(
            `publishing ${chalk.yellow(pkg.packageName)} to ${chalk.blue(
              target.type,
            )} @ ${chalk.yellow(printString(pkg.newVersion))}${
              dryRun ? ` ${chalk.red(`(dry run)`)}` : ''
            }`,
          );
        },
      },
    })
      .then((result) => {
        switch (result.kind) {
          case PublishResultKind.CircularPackageDependencies:
            console.error(`Detected circular dependency:`);
            console.error(``);
            console.error(`  ${result.packageNames.join(' -> ')}`);
            console.error(``);
            console.error(
              `There is no safe order to publish packages in when there is a circular dependency, therefore none of your packages were published.`,
            );
            console.error(``);
            return process.exit(supressErrors ? 0 : 1);
          case PublishResultKind.PackageManifestErrors:
            console.error(
              `Errors were encountered while parsing some package manifests:`,
            );
            console.error(``);
            for (const {filename, error} of result.errors) {
              console.error(filename);
              console.error(``);
              for (const line of error.split(`\n`)) {
                console.error(`  ${line}`);
              }
              console.error(``);
            }
            return process.exit(supressErrors ? 0 : 1);
          case PublishResultKind.GitHubAuthCheckFail:
            console.error(`GitHub pre-release steps failed:`);
            console.error(``);
            console.error(`  ${result.reason}`);
            console.error(``);
            return process.exit(supressErrors ? 0 : 1);
          case PublishResultKind.PrepublishFailures:
            for (const {pkg, reasons} of result.failures) {
              console.error(
                `Pre-release steps failed for ${pkg.packageName}@${printString(
                  pkg.newVersion,
                )}:`,
              );
              console.error(``);
              if (reasons.length === 1) {
                console.error(`  ${reasons[0]}`);
              } else {
                for (const reason of reasons) {
                  console.error(`  - ${reason}`);
                }
              }
              console.error(``);
            }
            return process.exit(supressErrors ? 0 : 1);
          case PublishResultKind.NoUpdatesRequired:
            return process.exit(0);
          case PublishResultKind.UpdatesPublished:
            console.warn(chalk.green(`Updates published`));
            return process.exit(0);
        }
      })
      .catch((ex: any) => {
        console.error(ex.stack);
        process.exit(1);
      });
    break;
  }
  default: {
    printHelp();
    process.exit(COMMAND === 'help' ? 0 : 1);
    break;
  }
}
export default function printHelp() {
  console.warn(`Usage: rollingversions publish <options>`);
  console.warn(``);
  console.warn(`options:

 -h --help                      View these options
 -d --dry-run                   Run without actually publishing packages
    --supress-errors            Always exit with "0" status code, even
                                if publishing fails
 -r --repo           owner/slug The repo being published, can be detected
                                automatically on most CI systems.
 -g --github-token   token      A GitHub access token with at least "repo"
                                scope. Used to read changelogs and write
                                git tags/releases. You can alternatively
                                just set the GITHUB_TOKEN environment variable.
 -b --deploy-branch  branch     The branch to deploy from. This will default
                                to your default branch on GitHub.
    --canary         build_no   Create a canary release with the provided build
                                number.
    --allow-any-branch          Always publish from the current branch, even if
                                it does not match the --deploy-branch
    --allow-non-latest-commit   Always publish the current commit, even if there
                                is a newer commit on the same branch.`);
  console.warn(``);
}
import {URL} from 'url';

import fetch from 'cross-fetch';

import {
  GetRepositoryApiResponse,
  VersioningMode,
  VersionTag,
} from '@rollingversions/types';
import {printString} from '@rollingversions/version-number';

import {prepublish, publish as publishTarget} from '../PublishTargets';
import {checkGitHubReleaseStatus} from '../PublishTargets/github';
import {getCurrentBranchName, getHeadSha} from '../services/git';
import {GitHubClient, auth} from '../services/github';
import PackageStatus, {
  NewVersionToBePublished,
  NoUpdateRequired,
  PackageStatusDetail,
} from '../types/PackageStatus';
import {PublishConfig} from '../types/publish';

export enum PublishResultKind {
  NoUpdatesRequired = 0,
  UpdatesPublished = 1,
  CircularPackageDependencies = 2,
  GitHubAuthCheckFail = 3,
  PrepublishFailures = 4,
  PackageManifestErrors = 5,
}
export interface NoUpdatesRequired {
  readonly kind: PublishResultKind.NoUpdatesRequired;
  readonly packages: readonly NoUpdateRequired[];
}
export interface UpdatesPublished {
  readonly kind: PublishResultKind.UpdatesPublished;
  readonly packages: readonly PackageStatusDetail[];
}
export interface CircularPackageDependencies {
  readonly kind: PublishResultKind.CircularPackageDependencies;
  readonly packageNames: readonly string[];
}
export interface GitHubAuthCheckFail {
  readonly kind: PublishResultKind.GitHubAuthCheckFail;
  readonly reason: string;
}
export interface PackageManifestErrors {
  readonly kind: PublishResultKind.PackageManifestErrors;
  readonly errors: {filename: string; error: string}[];
}
export interface PrepublishFailures {
  readonly kind: PublishResultKind.PrepublishFailures;
  readonly failures: readonly {
    readonly pkg: NewVersionToBePublished;
    readonly reasons: string[];
  }[];
}

export type Result =
  | NoUpdatesRequired
  | UpdatesPublished
  | CircularPackageDependencies
  | GitHubAuthCheckFail
  | PrepublishFailures
  | PackageManifestErrors;

export default async function publish(config: PublishConfig): Promise<Result> {
  const client = new GitHubClient({
    auth: auth.createTokenAuth(config.accessToken),
  });
  const url = new URL(`/api/${config.owner}/${config.name}`, config.backend);

  const headSha = await getHeadSha(config.dirname);
  const currentBranchName = await getCurrentBranchName(config.dirname);
  url.searchParams.set(`commit`, headSha);
  url.searchParams.set(`branch`, currentBranchName);

  const res = await fetch(url.href, {
    headers: {Authorization: `Bearer ${config.accessToken}`},
  });
  if (!res.ok) {
    return {
      kind: PublishResultKind.GitHubAuthCheckFail,
      reason: await res.text(),
    };
  }
  const response: GetRepositoryApiResponse = await res.json();

  if (response.cycleDetected?.length) {
    return {
      kind: PublishResultKind.CircularPackageDependencies,
      packageNames: response.cycleDetected,
    };
  }

  if (response.packageErrors?.length) {
    return {
      kind: PublishResultKind.PackageManifestErrors,
      errors: response.packageErrors,
    };
  }

  const packages = response.packages.map(
    (pkg): PackageStatusDetail => {
      if (pkg.currentVersion?.ok === false) {
        // TODO: report this error properly
        console.error(
          `${pkg.manifest.packageName} has a different version in the current branch vs. the latest published version overall.`,
        );
        console.error(
          `Current branch: ${
            pkg.currentVersion.branchVersion
              ? printString(pkg.currentVersion.branchVersion.version)
              : `unpublished`
          }`,
        );
        console.error(
          `Latest version: ${
            pkg.currentVersion.maxVersion
              ? printString(pkg.currentVersion.maxVersion.version)
              : `unpublished`
          }`,
        );
        console.error(
          `If you would like to base your next version number off the largest overall version, you can add the following to your package manifest:`,
        );
        console.error(`versioning="${VersioningMode.AlwaysIncreasing}"`);
        console.error(
          `If you would like to be able to publish patch versions on branches, you can add the following to your package manifest:`,
        );
        console.error(`versioning="${VersioningMode.ByBranch}"`);
        return process.exit(1);
      }
      const currentVersion: VersionTag | null = pkg.currentVersion?.ok
        ? pkg.currentVersion
        : null;
      if (pkg.newVersion) {
        return {
          status: PackageStatus.NewVersionToBePublished,
          packageName: pkg.manifest.packageName,
          currentTagName: currentVersion?.name ?? null,
          currentVersion: currentVersion?.version ?? null,
          newVersion: pkg.newVersion,
          changeSet: pkg.changeSet,
          manifest: pkg.manifest,
        };
      } else {
        return {
          status: PackageStatus.NoUpdateRequired,
          packageName: pkg.manifest.packageName,
          currentVersion: currentVersion?.version ?? null,
          newVersion: currentVersion?.version ?? null,
          manifest: pkg.manifest,
        };
      }
    },
  );
  if (config.canary !== null) {
    for (const pkg of packages) {
      if (pkg.status === PackageStatus.NewVersionToBePublished) {
        pkg.newVersion = {
          ...pkg.newVersion,
          prerelease: [`canary-${config.canary}`],
        };
      }
    }
  }

  config.logger.onValidatedPackages?.({
    packages,
    dryRun: config.dryRun,
  });

  if (
    !packages.some(
      (pkg) => pkg.status === PackageStatus.NewVersionToBePublished,
    )
  ) {
    return {
      kind: PublishResultKind.NoUpdatesRequired,
      packages: packages as NoUpdateRequired[],
    };
  }

  // prepublish checks
  const gitHubPrepublishInfo = await checkGitHubReleaseStatus(
    config,
    {
      headSha,
      defaultBranch: response.defaultBranch,
      deployBranch: response.deployBranch,
    },
    client,
  );
  if (!gitHubPrepublishInfo.ok) {
    return {
      kind: PublishResultKind.GitHubAuthCheckFail,
      reason: gitHubPrepublishInfo.reason,
    };
  }

  const packageVersions = new Map(
    packages.map((p) => [p.packageName, p.newVersion]),
  );
  const allTagNames = new Set(response.allTagNames);

  const failures: PrepublishFailures['failures'][number][] = [];
  for (const pkg of packages) {
    if (pkg.status === PackageStatus.NewVersionToBePublished) {
      const reasons = [];
      for (const prepublishResult of await prepublish(
        config,
        pkg,
        packageVersions,
        allTagNames,
      )) {
        if (!prepublishResult.ok) {
          reasons.push(prepublishResult.reason);
        }
      }
      if (reasons.length) {
        failures.push({pkg, reasons});
      }
    }
  }

  if (failures.length) {
    return {
      kind: PublishResultKind.PrepublishFailures,
      failures,
    };
  }

  for (const pkg of packages) {
    if (pkg.status === PackageStatus.NewVersionToBePublished) {
      await publishTarget(config, pkg, packageVersions, client);
    }
  }
  return {
    kind: PublishResultKind.UpdatesPublished,
    packages,
  };
}
import {readFile, writeFile} from 'fs';
import {resolve} from 'path';

import {spawnBuffered} from '../../utils/spawn';

export async function getCurrentBranchName(dirname: string) {
  const data = await spawnBuffered(
    'git',
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    {
      cwd: dirname,
    },
  );
  return data.toString('utf8').trim();
}

export async function getHeadSha(dirname: string) {
  const data = await spawnBuffered('git', ['rev-parse', 'HEAD'], {
    cwd: dirname,
  });
  return data.toString('utf8').trim();
}

export async function readRepoFile(
  dirname: string,
  filename: string,
): Promise<Buffer>;
export async function readRepoFile(
  dirname: string,
  filename: string,
  encoding: 'utf8',
): Promise<string>;
export async function readRepoFile(
  dirname: string,
  filename: string,
  encoding?: 'utf8',
) {
  if (encoding) {
    return await new Promise<string>((fulfill, reject) => {
      readFile(resolve(dirname, filename), encoding, (err, res) => {
        if (err) reject(err);
        else fulfill(res);
      });
    });
  } else {
    return new Promise<Buffer>((fulfill, reject) => {
      readFile(resolve(dirname, filename), (err, res) => {
        if (err) reject(err);
        else fulfill(res);
      });
    });
  }
}

export async function writeRepoFile(
  dirname: string,
  filename: string,
  data: Buffer | string,
) {
  return await new Promise<void>((fulfill, reject) => {
    writeFile(resolve(dirname, filename), data, (err) => {
      if (err) reject(err);
      else fulfill();
    });
  });
}
export default async function* batchIterable<TEntry>(
  source: AsyncGenerator<TEntry, void, unknown>,
  batchSize: number,
) {
  let batch: TEntry[] = [];
  for await (const entry of source) {
    batch.push(entry);
    if (batch.length >= batchSize) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length) {
    yield batch;
  }
}
/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import {getMethod, gql} from '@github-graph/api';

/**
 * An ISO-8601 encoded date string
 */
export type Date = string;
/**
 * An ISO-8601 encoded UTC date string
 */
export type DateTime = string;
/**
 * A Git object ID
 */
export type GitObjectID = string;
/**
 * A fully qualified reference name (e.g. "refs/heads/master")
 */
export type GitRefname = string;
/**
 * Git SSH string
 */
export type GitSSHRemote = string;
/**
 * An ISO-8601 encoded date string. Unlike the DateTime type, GitTimestamp is not converted in UTC.
 */
export type GitTimestamp = string;
/**
 * A string containing HTML code.
 */
export type HTML = string;
/**
 * An ISO-8601 encoded UTC date string with millisecond precison.
 */
export type PreciseDateTime = string;
/**
 * An RFC 3986, RFC 3987, and RFC 6570 (level 4) compliant URI string.
 */
export type URI = string;
/**
 * A valid x509 certificate string
 */
export type X509Certificate = string;

//==============================================================
// START Enums and Input Objects
//==============================================================

/**
 * The access level to a repository
 */
export enum RepositoryPermission {
  ADMIN = 'ADMIN',
  MAINTAIN = 'MAINTAIN',
  READ = 'READ',
  TRIAGE = 'TRIAGE',
  WRITE = 'WRITE',
}

//==============================================================
// END Enums and Input Objects
//==============================================================

// ====================================================
// GraphQL query operation: GetViewer
// ====================================================

export interface GetViewer_viewer {
  __typename: 'User';
  /**
   * The username used to login.
   */
  login: string;
}

export interface GetViewer {
  /**
   * The currently authenticated user.
   */
  viewer: GetViewer_viewer;
}

export const getViewer = getMethod<GetViewer, {}>(gql`
  query GetViewer {
    viewer {
      __typename
      login
    }
  }
`);

// ====================================================
// GraphQL query operation: GetRepositoryViewerPermissions
// ====================================================

export interface GetRepositoryViewerPermissions_repository {
  /**
   * The users permission level on the repository. Will return null if authenticated as an GitHub App.
   */
  viewerPermission: RepositoryPermission | null;
}

export interface GetRepositoryViewerPermissions {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetRepositoryViewerPermissions_repository | null;
}

export interface GetRepositoryViewerPermissionsVariables {
  owner: string;
  name: string;
}

export const getRepositoryViewerPermissions = getMethod<
  GetRepositoryViewerPermissions,
  GetRepositoryViewerPermissionsVariables
>(gql`
  query GetRepositoryViewerPermissions($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      viewerPermission
    }
  }
`);
import GitHubClient, {auth} from '@github-graph/api';
import {withRetry} from 'then-retry';

import {Repository} from '@rollingversions/types';

import * as gh from './github-graph';

export {GitHubClient, auth};

export const getViewer = withRetry(async (client: GitHubClient) => {
  return (await gh.getViewer(client)).viewer;
});

export const getRepositoryViewerPermissions = withRetry(
  async (client: GitHubClient, repo: Repository) => {
    return (
      (await gh.getRepositoryViewerPermissions(client, repo)).repository
        ?.viewerPermission || null
    );
  },
  {
    shouldRetry: (_e, failedAttempts) => failedAttempts < 3,
    retryDelay: () => 100,
  },
);
import {resolve, dirname} from 'path';

import {spawnBuffered} from '../../utils/spawn';

// Could use libnpmpublish to publish, but probably best to just use CLI

function tryJsonParse(str: string) {
  try {
    return JSON.parse(str);
  } catch (ex) {
    return null;
  }
}
function npmError(err: {code: string; summary: string; detail: string}) {
  const e: any = new Error(err.summary);
  e.code = err.code;
  e.summary = err.summary;
  e.detail = err.detail;
  return e;
}
async function parseNPM<T = any>(
  result: Promise<Buffer>,
  parseSuccess: (str: string) => T = (v) => JSON.parse(v),
) {
  return result.then(
    (buffer) => {
      try {
        return {
          ok: true as const,
          value: parseSuccess(buffer.toString('utf8')),
        };
      } catch (ex) {
        return {
          ok: false as const,
          code: 'JSONPARSEFAIL' as const,
          summary: 'Unable to parse the response from npm as JSON',
          detail: buffer.toString('utf8'),
        };
      }
    },
    (ex) => {
      if (ex.stdout) {
        const parsed = tryJsonParse(ex.stdout.toString('utf8'));
        if (parsed?.error) {
          const {error} = parsed;
          const code: unknown = error.code;
          const summary: string = error.summary;
          const detail: string = error.detail;
          switch (code) {
            case 'E404':
            case 'ENEEDAUTH':
              return {
                ok: false as const,
                code,
                summary,
                detail,
              };
          }
          if (summary) {
            throw npmError(error);
          }
        }
      }
      throw ex;
    },
  );
}
export async function getOrgRoster(
  orgName: string,
): Promise<Partial<Record<string, 'admin' | 'owner' | 'developer'>>> {
  const result = await parseNPM(
    spawnBuffered('npm', ['org', 'ls', orgName, '--json'], {}),
  );
  if (!result.ok) {
    throw npmError(result);
  }
  return result.value;
}
export async function getProfile(): Promise<
  | {
      authenticated: true;
      profile: {
        name: string;
        email: string;
        tfaOnPublish: boolean;
      };
    }
  | {authenticated: false; message: string}
> {
  try {
    const result = await parseNPM(
      spawnBuffered('npm', ['profile', 'get', '--json'], {}),
    );
    if (!result.ok) return {authenticated: false, message: result.summary};
    return {
      authenticated: true,
      profile: {
        name: result.value.name,
        email: result.value.email,
        tfaOnPublish: !!(
          result.value.tfa && result.value.tfa.mode !== 'auth-only'
        ),
      },
    };
  } catch (ex) {
    return {authenticated: false, message: ex.message};
  }
}

export async function getVersions(
  packageName: string,
): Promise<Set<string> | null> {
  const result = await parseNPM(
    spawnBuffered('npm', ['view', packageName, '--json'], {}),
  );
  if (!result.ok) {
    if (result.code === 'E404') {
      return null;
    }
    throw npmError(result);
  }
  const p = result.value;
  return new Set(p.versions);
}

export async function getOwners(
  packageName: string,
): Promise<{name: string; email?: string}[] | null> {
  const result = await parseNPM(
    spawnBuffered('npm', ['owner', 'ls', packageName, '--json'], {}),
    (str) =>
      str
        .split('\n')
        .filter(Boolean)
        .map((m: string) => {
          const [username, ...emailish] = m.split(' ');
          return {
            name: username,
            email:
              emailish
                .join(' ')
                .trim()
                .replace(/^\<(.*)\>$/, '$1')
                .trim() || undefined,
          };
        }),
  );
  if (!result.ok) {
    if (result.code === 'E404') {
      return null;
    }
    throw npmError(result);
  }
  return result.value;
}

export async function publish(
  repoDirname: string,
  path: string,
  {dryRun, canary}: {dryRun: boolean; canary: boolean},
) {
  await spawnBuffered(
    'npm',
    [
      'publish',
      ...(canary ? ['--tag', 'canary'] : []),
      ...(dryRun ? ['--dry-run'] : []),
    ],
    {
      cwd: dirname(resolve(repoDirname, path)),
    },
  );
}
export default function arrayEvery<TInput, TOutput extends TInput>(
  arr: TInput[],
  fn: (v: TInput, index: number, array: readonly TInput[]) => v is TOutput,
): arr is TOutput[];
export default function arrayEvery<TInput, TOutput extends TInput>(
  arr: readonly TInput[],
  fn: (v: TInput, index: number, array: readonly TInput[]) => v is TOutput,
): arr is readonly TOutput[];
export default function arrayEvery<TInput, TOutput extends TInput>(
  arr: readonly TInput[],
  fn: (v: TInput, index: number, array: readonly TInput[]) => v is TOutput,
): arr is TOutput[] {
  return arr.every(fn);
}
export default function groupBy<T, TKey>(values: T[], getKey: (v: T) => TKey) {
  const grouped = new Map<TKey, T[]>(
    [...new Set(values.map((v) => getKey(v)))].map((key) => [key, []]),
  );
  values.forEach((v) => {
    grouped.get(getKey(v))!.push(v);
  });
  return grouped;
}
export default function isObject(
  value: unknown,
): value is {[key: string]: unknown} {
  return !!value && typeof value === 'object';
}
export default function isString<T>(v: T): v is Extract<T, string> {
  return typeof v === 'string';
}
export default function isTruthy<T>(
  v: T,
): v is Exclude<T, undefined | void | null | 0 | '' | false> {
  return !!v;
}
export default function notFn<TInput, TOutput extends TInput>(
  fn: (v: TInput) => v is TOutput,
) {
  return (v: TInput): v is Exclude<TInput, TOutput> => !fn(v);
}
export default function orFn<
  TInput,
  TOutputA extends TInput,
  TOutputB extends TInput
>(fnA: (v: TInput) => v is TOutputA, fnB: (v: TInput) => v is TOutputB) {
  return (v: TInput): v is TOutputA | TOutputB => fnA(v) || fnB(v);
}
export default function throwErr(msg: string, other: any = {}): never {
  throw Object.assign(new Error(msg), other);
}
import ChangeSet from '@rollingversions/change-set';
import {PackageManifest} from '@rollingversions/types';
import VersionNumber from '@rollingversions/version-number';

enum PackageStatus {
  NoUpdateRequired = 1,
  NewVersionToBePublished = 2,
}
export default PackageStatus;

export interface NoUpdateRequired {
  status: PackageStatus.NoUpdateRequired;
  packageName: string;
  currentVersion: VersionNumber | null;
  newVersion: VersionNumber | null;
  manifest: PackageManifest;
}

export interface NewVersionToBePublished {
  status: PackageStatus.NewVersionToBePublished;
  packageName: string;
  currentTagName: string | null;
  currentVersion: VersionNumber | null;
  newVersion: VersionNumber;
  changeSet: ChangeSet<{pr: number}>;
  manifest: PackageManifest;
}

export type PackageStatusDetail = NoUpdateRequired | NewVersionToBePublished;
type PrePublishResult = {ok: true} | {ok: false; reason: string};
export default PrePublishResult;
import {URL} from 'url';

import {PublishTargetConfig} from '@rollingversions/types';

import {NewVersionToBePublished, PackageStatusDetail} from './PackageStatus';

export interface PublishConfig {
  dryRun: boolean;
  dirname: string;
  owner: string;
  name: string;
  accessToken: string;
  deployBranch: string | null;
  logger: PublishEventHandlers;
  canary: string | null;
  allowNonLatestCommit: boolean;
  allowAnyBranch: boolean;
  backend: URL;
}

export interface PublishEvents {
  onValidatedPackages: {
    packages: readonly PackageStatusDetail[];
    dryRun: boolean;
  };

  onCanaryGitHubRelease: {
    pkg: NewVersionToBePublished;
    dryRun: boolean;
  };

  onPublishGitHubRelease: {
    pkg: NewVersionToBePublished;
    tagName: string;
    dryRun: boolean;
  };
  onPublishedGitHubRelease: {
    pkg: NewVersionToBePublished;
    tagName: string;
    dryRun: boolean;
    response?: unknown;
  };

  onPublishTargetRelease: {
    pkg: NewVersionToBePublished;
    target: PublishTargetConfig;
    dryRun: boolean;
  };
  onPublishedTargetRelease: {
    pkg: NewVersionToBePublished;
    target: PublishTargetConfig;
    dryRun: boolean;
  };
}

export type PublishEventHandlers = {
  [name in keyof PublishEvents]?: (e: PublishEvents[name]) => void;
};
// TODO: replace with execa if possible

import type {ChildProcess, SpawnOptionsWithoutStdio} from 'child_process';
import {spawn} from 'child_process';
import type {Readable} from 'stream';

async function getBuffer(stream: Readable) {
  const result: Buffer[] = [];
  await new Promise((resolve, reject) => {
    stream.on('data', (d) => result.push(d));
    stream.on('error', reject);
    stream.on('end', resolve);
  });
  return Buffer.concat(result);
}
async function getStatusCode(cp: ChildProcess) {
  return await new Promise<number | null>((resolve, reject) => {
    cp.on('error', reject);
    cp.on('exit', (v) => resolve(v));
  });
}
export async function spawnBuffered(
  command: string,
  args: string[],
  options: SpawnOptionsWithoutStdio,
) {
  const childProcess = spawn(command, args, options);
  const [stdout, stderr, status] = await Promise.all<
    Buffer,
    Buffer,
    number | null
  >([
    getBuffer(childProcess.stdout),
    getBuffer(childProcess.stderr),
    getStatusCode(childProcess),
  ]);
  if (status !== 0) {
    const err: any = new Error(
      `${[command, ...args]
        .map((arg) =>
          arg.includes(' ')
            ? arg.includes('"')
              ? `'${arg}'`
              : `"${arg}"`
            : arg,
        )
        .join(' ')} exited with code ${status}:\n${stderr.toString('utf8')}`,
    );
    err.code = 'NON_ZERO_EXIT_CODE';
    err.status = status;
    err.stdout = stdout;
    err.stderr = stderr;
    err.command = command;
    err.args = args;
    err.options = options;
    throw err;
  }
  return stdout;
}
import * as t from 'funtypes';

import {
  BaseVersionCodec,
  ChangeType,
  ChangeTypeCodec,
  ChangeTypeID,
  RollingConfigOptions,
  TagFormatCodec,
  VersionBumpType,
  VersioningMode,
  VersioningModeCodec,
  VersionSchema,
  VersionSchemaCodec,
} from '@rollingversions/types';

export const DEFAULT_VERSION_SCHEMA: VersionSchema = [
  'MAJOR',
  'MINOR',
  'PATCH',
];
export const DEFAULT_CHANGE_TYPES = [
  ct('breaking', 'MAJOR', 'Breaking Changes'),
  ct('feat', 'MINOR', 'New Features'),
  ct('refactor', 'MINOR', 'Refactors'),
  ct('fix', 'PATCH', 'Bug Fixes'),
  ct('perf', 'PATCH', 'Performance Improvements'),
];
export const DEFAULT_BASE_VERSION = (vs: VersionSchema): readonly number[] =>
  vs.map((_, i) => (i === 0 ? 1 : 0));

export default RollingConfigOptions;

const RollingConfigOptionsCodec: t.Codec<RollingConfigOptions> = t
  .Partial({
    tagFormat: TagFormatCodec,
    changeTypes: t.ReadonlyArray(ChangeTypeCodec),
    versioningMode: VersioningModeCodec,
    versionSchema: VersionSchemaCodec,
    baseVersion: BaseVersionCodec,
  })
  .withParser({
    parse: ({
      tagFormat,
      changeTypes = DEFAULT_CHANGE_TYPES,
      versioningMode = VersioningMode.Unambiguous,
      versionSchema = DEFAULT_VERSION_SCHEMA,
      baseVersion = DEFAULT_BASE_VERSION(versionSchema),
    }): t.Result<RollingConfigOptions> => {
      if (baseVersion.length !== versionSchema.length) {
        return {
          success: false,
          message: `If you specify a custom versionSchema and a custom baseVersion, they must be the same length.`,
        };
      }
      const parts = new Set(versionSchema);
      const changeTypeWithMissingBump = changeTypes.find(
        (changeType) =>
          changeType.bumps !== null && !parts.has(changeType.bumps),
      );
      if (changeTypeWithMissingBump) {
        return {
          success: false,
          message: `The change type "${changeTypeWithMissingBump.id}" is set to bump "${changeTypeWithMissingBump.bumps}" but that string does not exist in the versionSchema. Set bumps to null if you don't want changes of this type to trigger a release.`,
        };
      }
      return {
        success: true,
        value: {
          tagFormat,
          changeTypes,
          versioningMode,
          versionSchema,
          baseVersion,
        },
      };
    },
    name: 'RollingConfigOptions',
  });

export const DEFAULT_CONFIG = {
  tagFormat: undefined,
  changeTypes: DEFAULT_CHANGE_TYPES,
  versioningMode: VersioningMode.Unambiguous,
  versionSchema: DEFAULT_VERSION_SCHEMA,
  baseVersion: DEFAULT_BASE_VERSION(DEFAULT_VERSION_SCHEMA),
};
export function parseRollingConfigOptions(
  value: Partial<{[key in keyof RollingConfigOptions]: unknown}>,
):
  | {success: true; value: RollingConfigOptions}
  | {success: false; reason: string} {
  const res = RollingConfigOptionsCodec.safeParse(value);
  return res.success ? res : {success: false, reason: t.showError(res)};
}

function ct(
  id: ChangeTypeID,
  bumps: VersionBumpType,
  plural: string,
): ChangeType {
  return {id, bumps, plural};
}
/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: +O3v4ZIhqi5eZ3vCy/4mFtzoIhgVY6KGZBiCqSNdvCtu4H20DHYLUYtzyPOrHlrrKeBHu2OTeKI7yOzPaEe/IQ==
 */

// eslint:disable
// tslint:disable

import type DbPullRequest from './pull_requests';

interface DbChangeLogEntry {
  body: string;
  /**
   * @default nextval('change_log_entries_id_seq'::regclass)
   */
  id: number & {readonly __brand?: 'change_log_entries_id'};
  kind: string;
  package_name: string;
  pull_request_id: DbPullRequest['id'];
  sort_order_weight: number;
  title: string;
}
export default DbChangeLogEntry;

interface ChangeLogEntries_InsertParameters {
  body: string;
  /**
   * @default nextval('change_log_entries_id_seq'::regclass)
   */
  id?: number & {readonly __brand?: 'change_log_entries_id'};
  kind: string;
  package_name: string;
  pull_request_id: DbPullRequest['id'];
  sort_order_weight: number;
  title: string;
}
export type {ChangeLogEntries_InsertParameters};
/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: FMCC1uYF84IPLrj/aW/sVd1bp+SAsKYXsFDVDFhd+RRxhX4ohwjgF9uN7mxbybuYYIZxSJ/sXnjQtwhQJLfRNw==
 */

// eslint:disable
// tslint:disable

interface DbDbMigrationsApplied {
  migration_name: string & {
    readonly __brand?: 'db_migrations_applied_migration_name';
  };
}
export default DbDbMigrationsApplied;

interface DbMigrationsApplied_InsertParameters {
  migration_name: string & {
    readonly __brand?: 'db_migrations_applied_migration_name';
  };
}
export type {DbMigrationsApplied_InsertParameters};
/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: Bpg3guFg98p0PF3PWsHP95UlFLA9+cbdqy8ZEukaLUV/GMH/Qta3LAZtQulX95IuLZdKB+NszGgM6hNBYq5Tdw==
 */

// eslint:disable
// tslint:disable

import DbGitRepository from './git_repositories';

interface DbGitCommit {
  cherry_picked_from: Array<string | null> | null;
  commit_sha: string & {readonly __brand?: 'git_commits_commit_sha'};
  git_repository_id: DbGitRepository['id'];
  message: string;
  parents: Array<string | null>;
}
export default DbGitCommit;

interface GitCommits_InsertParameters {
  cherry_picked_from?: Array<string | null> | null;
  commit_sha: string & {readonly __brand?: 'git_commits_commit_sha'};
  git_repository_id: DbGitRepository['id'];
  message: string;
  parents: Array<string | null>;
}
export type {GitCommits_InsertParameters};
/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: FhdqMs+pMKbnaSi+MX/uLuV6iS+vN2A9iUlGdGTusr7rZf2RrhY2TCm+agk7MBUJyHRCNtggNBwwCTztYM9LIw==
 */

// eslint:disable
// tslint:disable

import DbGitRepository from './git_repositories';

interface DbGitRef {
  commit_sha: string;
  git_repository_id: DbGitRepository['id'];
  kind: string & {readonly __brand?: 'git_refs_kind'};
  name: string & {readonly __brand?: 'git_refs_name'};
  pr_number: number | null;
  pr_ref_kind: string | null;
}
export default DbGitRef;

interface GitRefs_InsertParameters {
  commit_sha: string;
  git_repository_id: DbGitRepository['id'];
  kind: string & {readonly __brand?: 'git_refs_kind'};
  name: string & {readonly __brand?: 'git_refs_name'};
  pr_number?: number | null;
  pr_ref_kind?: string | null;
}
export type {GitRefs_InsertParameters};
/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: VLY/ckXNC/CR1UwiidKplKn4B1h7s0ytTl+jRDR8c2Bc6pN9wJy+lcci0RZXGflKCynDe6uTh/xtQjvGv16VFQ==
 */

// eslint:disable
// tslint:disable

interface DbGitRepository {
  default_branch_name: string;
  graphql_id: string;
  /**
   * The databaseId from GitHub
   */
  id: number & {readonly __brand?: 'git_repositories_id'};
  /**
   * @default 0
   */
  local_git_version: number;
  name: string;
  owner: string;
  /**
   * @default 1
   */
  remote_git_version: number;
}
export default DbGitRepository;

interface GitRepositories_InsertParameters {
  default_branch_name: string;
  graphql_id: string;
  /**
   * The databaseId from GitHub
   */
  id: number & {readonly __brand?: 'git_repositories_id'};
  /**
   * @default 0
   */
  local_git_version?: number;
  name: string;
  owner: string;
  /**
   * @default 1
   */
  remote_git_version?: number;
}
export type {GitRepositories_InsertParameters};
/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: bDXTPDkXAQylvzMKxHCdvNiVR0nGhFB08iSMQg0hYm9wX+1nFLHJYBSOcKN19OB44CUpHL1OzGdp/XAIWs149w==
 */

// eslint:disable
// tslint:disable

import DbChangeLogEntry, {
  ChangeLogEntries_InsertParameters,
} from './change_log_entries';
import DbDbMigrationsApplied, {
  DbMigrationsApplied_InsertParameters,
} from './db_migrations_applied';
import DbGitCommit, {GitCommits_InsertParameters} from './git_commits';
import DbGitRef, {GitRefs_InsertParameters} from './git_refs';
import DbGitRepository, {
  GitRepositories_InsertParameters,
} from './git_repositories';
import DbPullRequest, {PullRequests_InsertParameters} from './pull_requests';

interface DatabaseSchema {
  change_log_entries: {
    record: DbChangeLogEntry;
    insert: ChangeLogEntries_InsertParameters;
  };
  db_migrations_applied: {
    record: DbDbMigrationsApplied;
    insert: DbMigrationsApplied_InsertParameters;
  };
  git_commits: {record: DbGitCommit; insert: GitCommits_InsertParameters};
  git_refs: {record: DbGitRef; insert: GitRefs_InsertParameters};
  git_repositories: {
    record: DbGitRepository;
    insert: GitRepositories_InsertParameters;
  };
  pull_requests: {record: DbPullRequest; insert: PullRequests_InsertParameters};
}
export default DatabaseSchema;

function serializeValue(
  _tableName: string,
  _columnName: string,
  value: unknown,
): unknown {
  return value;
}
export {serializeValue};
/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: CwHN90TDa6JbpYCo2Fcop5v5O9FVWzPFmep3w6W5HUg7/fXfFMZWVCaKRM93J73cmVH0vI4I9hTPPx3ajtuH8Q==
 */

// eslint:disable
// tslint:disable

import DbGitRepository from './git_repositories';

interface DbPullRequest {
  base_ref_name: string | null;
  change_set_submitted_at_git_commit_sha: string | null;
  comment_id: number | null;
  comment_updated_at_commit_sha: string | null;
  git_repository_id: DbGitRepository['id'];
  graphql_id: string;
  head_ref_name: string | null;
  /**
   * The databaseId from GitHub
   */
  id: number & {readonly __brand?: 'pull_requests_id'};
  /**
   * @default false
   */
  is_closed: boolean;
  /**
   * @default false
   */
  is_merged: boolean;
  merge_commit_sha: string | null;
  pr_number: number;
  status_updated_at_commit_sha: string | null;
  title: string;
}
export default DbPullRequest;

interface PullRequests_InsertParameters {
  base_ref_name?: string | null;
  change_set_submitted_at_git_commit_sha?: string | null;
  comment_id?: number | null;
  comment_updated_at_commit_sha?: string | null;
  git_repository_id: DbGitRepository['id'];
  graphql_id: string;
  head_ref_name?: string | null;
  /**
   * The databaseId from GitHub
   */
  id: number & {readonly __brand?: 'pull_requests_id'};
  /**
   * @default false
   */
  is_closed?: boolean;
  /**
   * @default false
   */
  is_merged?: boolean;
  merge_commit_sha?: string | null;
  pr_number: number;
  status_updated_at_commit_sha?: string | null;
  title: string;
}
export type {PullRequests_InsertParameters};
import connect, {sql, Queryable, SQLQuery} from '@databases/pg';
import createTyped, {anyOf, greaterThan} from '@databases/pg-typed';

import type DatabaseSchema from './__generated__';
import {serializeValue} from './__generated__';

export type {Queryable, SQLQuery};

export type LogMethod = (
  event_type: string,
  message: string,
  context?: {
    [key: string]: unknown;
  },
) => void;
export interface Logger {
  readonly debug: LogMethod;
  readonly info: LogMethod;
  readonly notice: LogMethod;
  readonly warning: LogMethod;
  readonly error: LogMethod;
  readonly crit: LogMethod;
  readonly alert: LogMethod;
  readonly emerg: LogMethod;
}
let logger: Logger | undefined;
export function setDatabaseLogger(l: Logger) {
  logger = l;
}
export const q = {anyOf, greaterThan};
export {sql};
const db = connect({
  bigIntMode: 'number',
  onConnectionOpened() {
    logger?.info(`connection_opened`, `Postgres connection opened`);
  },
  onConnectionClosed() {
    logger?.info(`connection_opened`, `Postgres connection opened`);
  },
  onError(err) {
    logger?.error(`db_error`, err.stack ?? err.message);
  },
  onQueryStart(_query, {text, values}) {
    logger?.info(`query_start`, text, {values});
  },
  onQueryResults(_query, {text}, results) {
    logger?.info(`query_end`, text, {count: results.length});
  },
  onQueryError(_query, _, err) {
    logger?.error(`query_fail`, err.message);
  },
});
export default db;

export const tables = createTyped<DatabaseSchema>({
  defaultConnection: db,
  serializeValue,
});
import {URL} from 'url';

function string(name: string) {
  const value = process.env[name];
  if (value !== undefined) return value;
  throw new Error(`Missing required config value "${name}"`);
}

function optional<T>(name: string, kind: (name: string) => T): T | undefined {
  return process.env[name] !== undefined ? kind(name) : undefined;
}

function integer(name: string) {
  const str = string(name);
  if (str.length > 6 || !/^\d+$/.test(str)) {
    throw new Error(
      `Config value "${name}" should be an integer between 0 and 999,999`,
    );
  }
  return parseInt(str, 10);
}

function url(name: string) {
  const urlString = string(name);
  try {
    return new URL(urlString);
  } catch (ex) {
    throw new Error(`Config value "${name}" should be an absolute URL`);
  }
}
function oneOf<T extends readonly [string, ...string[]]>(
  name: string,
  options: T,
): T[number] {
  const str = string(name);
  if (!options.includes(str)) {
    throw new Error(
      `Expected ${name} to be one of: ${options
        .map((o) => `'${o}'`)
        .join(' | ')}`,
    );
  }
  return str;
}

export const APP_ID = integer('APP_ID');
export const APP_URL = url('APP_URL');
export const PRIVATE_KEY = string('PRIVATE_KEY').replace(/\\n/gm, '\n');
export const WEBHOOK_SECRET = string('WEBHOOK_SECRET');
export const ENVIRONMENT = oneOf('ENVIRONMENT', [
  'development',
  'staging',
  'production',
] as const);

const APEX_LOGS_URL = optional('APEX_LOGS_URL', url);
export const APEX_LOGS_CONFIG = APEX_LOGS_URL
  ? {
      url: APEX_LOGS_URL.href,
      authToken: string('APEX_LOGS_AUTH_TOKEN'),
      projectId: string('APEX_LOGS_PROJECT_ID'),
    }
  : {json: true};
import {Repository} from '@rollingversions/types';

import isObject from '../utils/isObject';
import withCache from '../utils/withCache';
import {APP_ID, PRIVATE_KEY} from './environment';
import type {Logger} from './logger';
import logger from './logger';
import {GitHubClient, auth} from './services/github';
import type {GitHubOptions} from './services/github';

function addLogging(
  options: Omit<
    GitHubOptions,
    'rateLimitOptions' | 'onBatchRequest' | 'onBatchResponse' | 'onResponse'
  >,
): GitHubOptions {
  const starts = new WeakMap<
    {
      query: string;
      variables: any;
    },
    Logger
  >();
  return {
    ...options,
    rateLimitOptions: {
      maxSize: 300,
      interval: 2000,
    },
    onBatchRequest(req) {
      starts.set(req, logger.withTimer());
    },
    onBatchResponse(req, res) {
      const timer = starts.get(req) || logger;
      if (res.data.errors?.length) {
        timer.error(
          'graphql_batch_error',
          `GraphQL Batch Error: ${res.data.errors[0]?.message}`,
          {
            query: req.query,
            variables: req.variables,
            errors: res.data.errors,
          },
        );
      } else {
        timer.info('graphql_batch_response', `GraphQL Batch Response`, {
          query: req.query,
          variables: req.variables,
          errors: res.data.errors,
        });
      }
    },
    onResponse({query, variables}, {errors}) {
      if (errors?.length) {
        logger.error('graphql_error', `GraphQL Error: ${errors[0].message}`, {
          query,
          variables,
          errors,
        });
      }
    },
  };
}
export function getClientForEvent(event: {
  readonly id: string;
  readonly name: string;
  readonly payload: unknown;
}) {
  if (
    isObject(event.payload) &&
    isObject(event.payload.installation) &&
    typeof event.payload.installation.id === 'number' &&
    (event.name !== 'installation' || event.payload.action !== 'deleted')
  ) {
    return getClient(event.payload.installation.id);
  } else {
    return getClient();
  }
}
export default function getClient(installationId?: number) {
  return new GitHubClient(
    addLogging({
      auth: auth.createAppAuth({
        id: APP_ID,
        privateKey: PRIVATE_KEY,
        installationId,
      }),
    }),
  );
}

export const getTokenForRepo = withCache(
  async function getTokenForRepo({owner, name}: Repository) {
    const installation = await getClient().rest.apps.getRepoInstallation({
      owner,
      repo: name,
    });
    if (installation.status !== 200) {
      throw new Error(
        `Rolling Versions does not seem to be installed for ${owner}`,
      );
    }
    const installationId = installation.data.id;
    const appAuth = auth.createAppAuth({
      id: APP_ID,
      privateKey: PRIVATE_KEY,
      installationId,
    });
    return {
      result: (await appAuth({type: `installation`, installationId})).token,
      expiry: Date.now() + 60 * 60_000,
    };
  },
  ({owner, name}) => `${owner}/${name}`,
);
export const getClientForRepo = withCache(
  async function getClientForRepo({owner, name}: Repository) {
    const installation = await getClient().rest.apps.getRepoInstallation({
      owner,
      repo: name,
    });
    if (installation.status !== 200) {
      throw new Error(
        `Rolling Versions does not seem to be installed for ${owner}`,
      );
    }
    const installationID = installation.data.id;
    return {
      result: getClient(installationID),
      expiry: Date.now() + 60 * 60_000,
    };
  },
  ({owner, name}) => `${owner}/${name}`,
);

export function getClientForToken(token: string) {
  return new GitHubClient(
    addLogging({
      auth: auth.createTokenAuth(token),
    }),
  );
}
import {json} from 'body-parser';
import express from 'express';

import {errorLoggingMiddlware, expressMiddlewareLogger} from './logger';
import apiMiddleware from './middleware/api';
import appMiddleware from './middleware/app';
import authMiddleware from './middleware/auth';
import staticMiddleware from './middleware/static';
import webhooks from './webhooks';

const app = express();
type EventSource = typeof EventSource;
const WEBHOOK_PROXY_URL = process.env.WEBHOOK_PROXY_URL;
if (WEBHOOK_PROXY_URL) {
  const EventSource: EventSource = require('eventsource');
  const source = new EventSource(WEBHOOK_PROXY_URL);
  source.onmessage = (event) => {
    console.info(event.data);
    const webhookEvent = JSON.parse(event.data);
    webhooks
      .verifyAndReceive({
        id: webhookEvent['x-request-id'],
        name: webhookEvent['x-github-event'],
        signature: webhookEvent['x-hub-signature'],
        payload: webhookEvent.body,
      })
      .catch((err) => console.error(err.stack || err));
  };
}

webhooks.on('error', (error) => {
  console.error(
    `Error occured in "${
      (error as {event?: {name: string}}).event?.name
    } handler: ${error.stack}"`,
  );
});

app.use(expressMiddlewareLogger());

app.use((req, res, next) => webhooks.middleware(req, res, next));

app.use(authMiddleware);
app.use(json());
app.use(apiMiddleware);
app.use(appMiddleware);
// https://github.com/Mottie/github-reserved-names/blob/master/oddballs.json has the names that are available to use
app.use(staticMiddleware);

app.use(errorLoggingMiddlware());

export default app.listen(process.env.PORT || 3000);
import cuid from 'cuid';
import type {Request, Response, NextFunction} from 'express';
import onFinished from 'on-finished';
import onHeaders from 'on-headers';
import * as winston from 'winston';

import {setDatabaseLogger} from '@rollingversions/db';

import {APEX_LOGS_CONFIG, ENVIRONMENT} from './environment';

const ApexLogsTransport = require('apex-logs-winston');

type levels =
  | 'debug'
  | 'info'
  | 'notice'
  | 'warning'
  | 'error'
  | 'crit'
  | 'alert'
  | 'emerg';
const levels = winston.config.syslog.levels;
const transport =
  ENVIRONMENT === 'development'
    ? new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({level: true}),
          winston.format.printf((info) => {
            return `${info.level} ${info.message}`;
          }),
        ),
      })
    : new ApexLogsTransport(APEX_LOGS_CONFIG);

const winLogger = winston.createLogger({
  levels: winston.config.syslog.levels,
  transports: [transport],
  defaultMeta: {
    environment: ENVIRONMENT,
  },
});

export {Logger};
class Logger {
  private readonly _win: winston.Logger;
  private readonly _txids: readonly string[];
  private readonly _startTime: number | undefined;
  constructor(
    win: winston.Logger,
    txids: readonly string[],
    startTime?: number,
  ) {
    this._win = win;
    this._txids = txids;
    this._startTime = startTime;
  }
  private _getMethod(level: levels) {
    return (
      event_type: string,
      message: string,
      context: {[key: string]: unknown} = {},
    ) => {
      this._win[level](message, {
        ...(this._startTime ? {duration: Date.now() - this._startTime} : {}),
        ...context,
        event_type,
      });
    };
  }

  public withContext(context: {[key: string]: unknown}) {
    return new Logger(this._win.child(context), this._txids);
  }
  public withTransaction(
    context: {txid?: string; [key: string]: unknown} = {},
  ) {
    const txid = context.txid || cuid();
    const txids = [...this._txids, txid];
    return new Logger(
      this._win.child({...context, txid: txids.join(':')}),
      txids,
    );
  }
  public withTimer() {
    return new Logger(this._win, this._txids, Date.now());
  }

  public async withLogging<T>(
    fn: Promise<T> | ((logger: Logger) => Promise<T>),
    {
      success,
      successMessage,
      failure,
    }: {success: string; successMessage: string; failure: string},
  ): Promise<T> {
    const timer = this.withTimer();
    let result;
    try {
      result = await (typeof fn === 'function' ? fn(this) : fn);
      timer.info(success, successMessage);
    } catch (ex) {
      timer.error(failure, ex.stack);
      throw ex;
    }
    return result;
  }

  public readonly debug = this._getMethod('debug');
  public readonly info = this._getMethod('info');
  public readonly notice = this._getMethod('notice');
  public readonly warning = this._getMethod('warning');
  public readonly error = this._getMethod('error');
  public readonly crit = this._getMethod('crit');
  public readonly alert = this._getMethod('alert');
  public readonly emerg = this._getMethod('emerg');
}

const logger = new Logger(winLogger, []);
setDatabaseLogger(logger);
export default logger;

const expressLoggerKey = '@rollingversions/logger';
export function expressLogger(req: Request, res: Response): Logger {
  return (
    res.locals[expressLoggerKey] ??
    (res.locals[expressLoggerKey] = logger.withTransaction({
      method: req.method,
      url: req.url,
    }))
  );
}

export function expressMiddlewareLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const reqStartAt = process.hrtime();
    const logger = expressLogger(req, res);
    logger.info('request_start', `request start: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
    });
    let resStartElapsed: typeof reqStartAt | null = null;
    onHeaders(res, () => {
      resStartElapsed = process.hrtime(reqStartAt);
    });
    onFinished(res, (err, res) => {
      if (!resStartElapsed) {
        resStartElapsed = process.hrtime(reqStartAt);
      }

      const responseTimeMs =
        resStartElapsed[0] * 1e3 + resStartElapsed[1] * 1e-6;
      const resEndElapsed = process.hrtime(reqStartAt);
      const totalTimeMs = resEndElapsed[0] * 1e3 + resEndElapsed[1] * 1e-6;

      const message = `request end: ${req.method} ${req.url} ${
        res.statusCode
      } (${Math.round(responseTimeMs)} ms)${
        err ? `:\n\n${err.stack || err.message || err}` : ``
      }`;
      const ctxLogger = logger.withContext({
        method: req.method,
        url: req.url,
        status_code: res.statusCode,
        duration: Math.round(responseTimeMs),
        total_time: Math.round(totalTimeMs),
      });
      if (err || res.statusCode >= 500) {
        ctxLogger.error('response', message);
      } else if (res.statusCode >= 400) {
        ctxLogger.warning('response', message);
      } else {
        ctxLogger.info('response', message);
      }
    });
    next();
  };
}

export function errorLoggingMiddlware() {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    const logger = expressLogger(req, res);
    logger.error('response_error', `${err.stack || err.message || err}`);
    next(err);
  };
}
import {Router} from 'express';

import db, {tables} from '@rollingversions/db';

import {getClientForRepo, getClientForToken} from '../getClient';
import {expressLogger} from '../logger';
import getRepository from './api/getRepository';
import {validateRepoParams, parseRepoParams} from './utils/validateParams';

const apiMiddleware = Router();

apiMiddleware.get(
  `/api/:owner/:repo`,
  validateRepoParams(),
  async (req, res, next) => {
    try {
      if (
        typeof req.headers[`authorization`] !== 'string' ||
        !req.headers[`authorization`].startsWith(`Bearer `)
      ) {
        res
          .status(403)
          .send(`You must provide an authorization token to use the API`);
        return;
      }
      const authToken = req.headers[`authorization`].substr(`Bearer `.length);

      const {owner, repo, commit, branch} = parseRepoParams(req);

      const tokenClient = getClientForToken(authToken);
      const r = await tokenClient.rest.repos
        .get({owner, repo})
        .catch(() => null);
      if (r?.status !== 200) {
        res
          .status(404)
          .send(
            `The provided auth token does not have permission to access the repo, or it does not exist.`,
          );
        return;
      }
      const dbRepo = await tables
        .git_repositories(db)
        .findOne({owner, name: repo});
      if (!dbRepo) {
        res
          .status(404)
          .send(`This repository has not been added to Rolling Versions.`);
        return;
      }

      const client = await getClientForRepo({owner, name: repo});
      const response = await getRepository(
        client,
        {owner, name: repo},
        {commit, branch},
        expressLogger(req, res),
      );
      if (!response) {
        res.status(404).send(`Unable to find the repository/branch`);
      } else {
        res.json(response);
      }
    } catch (ex) {
      next(ex);
    }
  },
);

export default apiMiddleware;
import db from '@rollingversions/db';
import {PullRequest} from '@rollingversions/types';

import type {PullRequestResponse} from '../../../types';
import type {Logger} from '../../logger';
import {getPullRequestHeadCommit} from '../../models/git';
import {getDetailedPackageManifestsForPullRequest} from '../../models/PackageManifests';
import {getPullRequestFromRestParams} from '../../models/PullRequests';
import {getRepositoryFromRestParams} from '../../models/Repositories';
import type {GitHubClient} from '../../services/github';
import type {Permission, User} from '../utils/checkPermissions';

export default async function getPullRequest(
  client: GitHubClient,
  user: User,
  pullRequest: PullRequest,
  permission: Permission,
  logger: Logger,
): Promise<PullRequestResponse | null> {
  const repo = await getRepositoryFromRestParams(db, client, pullRequest.repo);
  if (!repo) {
    return null;
  }
  const pr = await getPullRequestFromRestParams(
    db,
    client,
    repo,
    pullRequest.number,
    logger,
  );
  if (!pr) {
    return null;
  }
  const getPackagesResult = await getDetailedPackageManifestsForPullRequest(
    db,
    client,
    repo,
    pr,
    logger,
  );
  if (!getPackagesResult) {
    return null;
  }
  const {packages, packageErrors} = getPackagesResult;
  const headCommit = await getPullRequestHeadCommit(
    db,
    client,
    repo,
    pr,
    logger,
  );
  logger.info('loaded_change_set', `Loaded change set`, {
    packages_count: packages.size,
    closed: pr.is_closed,
    merged: pr.is_merged,
    repo_owner: repo.owner,
    repo_name: repo.name,
    pull_number: pr.pr_number,
    ...user,
  });

  return {
    permission,
    headSha: headCommit?.commit_sha ?? `unknown_commit`,
    packages,
    packageErrors,
    closed: pr.is_closed,
    merged: pr.is_merged,
  };
}
import ChangeSet from '@rollingversions/change-set';
import db from '@rollingversions/db';
import sortPackagesByDependencies from '@rollingversions/sort-by-dependencies';
import {
  ApiPackageResponse,
  GetRepositoryApiResponse,
} from '@rollingversions/types';
import {getNextVersion} from '@rollingversions/version-number';

import type {Logger} from '../../logger';
import {
  getBranchHeadCommit,
  getAllTags,
  getCommitBySha,
  getAllTagsOnBranch,
  getUnreleasedChanges,
  getAllBranches,
} from '../../models/git';
import {
  getCurrentVersion,
  getPackageManifests,
  getPackageVersions,
} from '../../models/PackageManifests';
import {getRepositoryFromRestParams} from '../../models/Repositories';
import type {GitHubClient} from '../../services/github';

export default async function getRepository(
  client: GitHubClient,
  repository: {
    owner: string;
    name: string;
  },
  {commit, branch}: {commit?: string; branch?: string},
  logger: Logger,
): Promise<GetRepositoryApiResponse | null> {
  const repo = await getRepositoryFromRestParams(db, client, repository);
  if (!repo) return null;

  const [
    requestedHeadCommit,
    defaultBranchHeadCommit,
    deployBranchHeadCommit,
  ] = await Promise.all([
    commit ? getCommitBySha(db, client, repo, commit, logger) : null,
    getBranchHeadCommit(db, client, repo, repo.default_branch_name, logger),
    branch ? getBranchHeadCommit(db, client, repo, branch, logger) : null,
  ]);
  if (commit && !requestedHeadCommit) {
    return null;
  }
  if (branch && !deployBranchHeadCommit) {
    return null;
  }
  const headCommit =
    requestedHeadCommit ?? deployBranchHeadCommit ?? defaultBranchHeadCommit;
  if (!headCommit) {
    return null;
  }

  const [
    allBranches,
    allTags,
    branchTags,
    getPackageManifestsResult,
  ] = await Promise.all([
    getAllBranches(db, client, repo, logger),
    getAllTags(db, client, repo, logger),
    getAllTagsOnBranch(db, headCommit),
    getPackageManifests(
      db,
      client,
      repo,
      {type: 'commit', commit: headCommit},
      logger,
    ),
  ]);

  if (!getPackageManifestsResult) return null;

  const {packages: packagesByName, packageErrors} = getPackageManifestsResult;

  const sortResult = sortPackagesByDependencies(
    packagesByName,
    (pkg) => pkg.dependencies,
  );

  const packages = sortResult.circular
    ? [...packagesByName.values()].sort((a, b) =>
        a.packageName < b.packageName ? -1 : 1,
      )
    : sortResult.packages;

  return {
    headSha: headCommit.commit_sha,
    defaultBranch: {
      name: repo.default_branch_name,
      headSha: defaultBranchHeadCommit?.commit_sha ?? null,
    },
    deployBranch: branch
      ? {
          name: branch,
          headSha: deployBranchHeadCommit?.commit_sha ?? null,
        }
      : {
          name: repo.default_branch_name,
          headSha: defaultBranchHeadCommit?.commit_sha ?? null,
        },
    allBranchNames: allBranches.map((b) => b.name),
    allTagNames: allTags.map((t) => t.name),
    packages: await Promise.all(
      packages.map(
        async (manifest, _, manifests): Promise<ApiPackageResponse> => {
          const allVersions = getPackageVersions({
            allowTagsWithoutPackageName: manifests.length <= 1,
            allTags,
            manifest,
          });
          const branchVersions = getPackageVersions({
            allowTagsWithoutPackageName: manifests.length <= 1,
            allTags: branchTags,
            manifest,
          });
          const currentVersion = getCurrentVersion({
            allVersions,
            branchVersions,
            versioningMode: manifest.versioningMode,
            branchName: branch ?? repo.default_branch_name,
          });
          const changeSet: ChangeSet<{pr: number}> = (
            await getUnreleasedChanges(db, repo, {
              packageName: manifest.packageName,
              headCommitSha: headCommit.commit_sha,
              releasedCommits: new Set(allVersions.map((v) => v.commitSha)),
            })
          )
            .sort((a, b) => a.sort_order_weight - b.sort_order_weight)
            .map((c) => ({
              type: c.kind,
              title: c.title,
              body: c.body,
              pr: c.pr_number,
            }));
          return {
            manifest,
            changeSet,
            currentVersion,
            newVersion: getNextVersion(
              currentVersion?.ok ? currentVersion.version : null,
              changeSet,
              {
                changeTypes: manifest.changeTypes,
                versionSchema: manifest.versionSchema,
                baseVersion: manifest.baseVersion,
              },
            ),
          };
        },
      ),
    ),
    cycleDetected: sortResult.circular ? sortResult.packageNames : null,
    packageErrors,
  };
}
import db, {q, tables} from '@rollingversions/db';
import {ChangeLogEntries_InsertParameters} from '@rollingversions/db/change_log_entries';
import {PullRequest} from '@rollingversions/types';

import type {UpdatePullRequestBody} from '../../../types';
import type {Logger} from '../../logger';
import {updatePullRequestComment} from '../../models/PullRequestComment';
import {getPullRequestFromRestParams} from '../../models/PullRequests';
import {updatePullRequestStatus} from '../../models/PullRequestStatus';
import {getRepositoryFromRestParams} from '../../models/Repositories';
import type {GitHubClient} from '../../services/github';
import type {User} from '../utils/checkPermissions';

export default async function updatePullRequest(
  client: GitHubClient,
  user: User,
  pr: PullRequest,
  body: UpdatePullRequestBody,
  logger: Logger,
) {
  logger.info('submitted_change_set', `Submitted change set`, {
    changes_count: body.updates
      .map((u) => u.changes.length)
      .reduce((a, b) => a + b, 0),
    repo_owner: pr.repo.owner,
    repo_name: pr.repo.name,
    pull_number: pr.number,
    ...user,
  });

  const repo = await getRepositoryFromRestParams(db, client, {
    owner: pr.repo.owner,
    name: pr.repo.name,
  });
  if (!repo) return false;

  const pullRequest = await getPullRequestFromRestParams(
    db,
    client,
    repo,
    pr.number,
    logger,
  );
  if (!pullRequest) return false;

  const updatedPullRequest = await db.tx(async (db) => {
    await tables.change_log_entries(db).delete({
      pull_request_id: pullRequest.id,
      package_name: q.anyOf(body.updates.map((u) => u.packageName)),
    });
    await tables.change_log_entries(db).insert(
      ...body.updates
        .flatMap(({packageName, changes}) =>
          changes.map(
            (
              change,
            ): Omit<
              ChangeLogEntries_InsertParameters,
              'sort_order_weight'
            > => ({
              kind: change.type,
              title: change.title,
              body: change.body,
              package_name: packageName,
              pull_request_id: pullRequest.id,
            }),
          ),
        )
        .map((change, sort_order_weight) => ({...change, sort_order_weight})),
    );
    const [updatedPullRequest] = await tables.pull_requests(db).update(
      {id: pullRequest.id},
      {
        change_set_submitted_at_git_commit_sha:
          body.headSha ?? `unknown_commit`,
        comment_updated_at_commit_sha: null,
        status_updated_at_commit_sha: null,
      },
    );
    return updatedPullRequest;
  });

  await Promise.all([
    updatePullRequestComment(db, client, repo, updatedPullRequest, logger),
    updatePullRequestStatus(db, client, repo, updatedPullRequest, logger),
  ]);
  return true;
}
import {Router} from 'express';

import db from '@rollingversions/db';

import {PullRequestResponseCodec} from '../../types';
import {getClientForRepo, getClientForToken} from '../getClient';
import {expressLogger} from '../logger';
import {getRepositoryFromRestParams} from '../models/Repositories';
import getPullRequest from './api/getPullRequest';
import getRepository from './api/getRepository';
import updatePullRequest from './api/updatePullRequest';
import {requiresAuth, getGitHubAccessToken} from './auth';
import checkPermissions, {
  getPermission,
  getUser,
  checkRepoPermissions,
} from './utils/checkPermissions';
import validateBody, {getBody} from './utils/validateBody';
import validateParams, {
  parseParams,
  validateRepoParams,
  parseRepoParams,
} from './utils/validateParams';

const appMiddleware = Router();

appMiddleware.get(
  `/:owner/:repo/json`,
  requiresAuth({api: true}),
  validateRepoParams(),
  checkRepoPermissions(['view', 'edit']),
  async (req, res, next) => {
    try {
      const {owner, repo, commit, branch} = parseRepoParams(req);
      const client = await getClientForRepo({owner, name: repo});
      const dbRepo = await getRepositoryFromRestParams(db, client, {
        owner,
        name: repo,
      });
      if (!dbRepo) {
        res.status(404).send(`Unable to find the repository/branch`);
      }
      const response = await getRepository(
        client,
        {owner, name: repo},
        {commit, branch},
        expressLogger(req, res),
      );
      if (!response) {
        res.status(404).send(`Unable to find the repository/branch`);
      } else {
        res.json(response);
      }
    } catch (ex) {
      next(ex);
    }
  },
);

appMiddleware.post(
  `/:owner/:repo/dispatch/rollingversions_publish_approved`,
  requiresAuth({api: true}),
  validateRepoParams(),
  checkRepoPermissions(['edit']),
  async (req, res, next) => {
    try {
      const repo = parseRepoParams(req);
      const token = getGitHubAccessToken(req, res);
      const client = getClientForToken(token);
      await client.rest.repos.createDispatchEvent({
        owner: repo.owner,
        repo: repo.repo,
        event_type: 'rollingversions_publish_approved',
        // TODO: include parameters for branch name and commit sha
      });
      await new Promise((resolve) => setTimeout(resolve, 4000));
      res.redirect(
        `https://github.com/${repo.owner}/${repo.repo}/actions?query=event%3Arepository_dispatch`,
      );
    } catch (ex) {
      next(ex);
    }
  },
);

appMiddleware.get(
  `/:owner/:repo/pull/:pull_number/json`,
  requiresAuth({api: true}),
  validateParams(),
  checkPermissions(['view', 'edit']),
  async (req, res, next) => {
    try {
      const pullRequest = parseParams(req);
      const client = await getClientForRepo(pullRequest.repo);
      const response = await getPullRequest(
        client,
        getUser(req),
        pullRequest,
        getPermission(req),
        expressLogger(req, res),
      );

      if (!response) {
        res.status(404).send(`Unable to find the pull request`);
      } else {
        res.json(PullRequestResponseCodec.serialize(response));
      }
    } catch (ex) {
      next(ex);
    }
  },
);

appMiddleware.post(
  `/:owner/:repo/pull/:pull_number`,
  requiresAuth({api: true}),
  validateParams(),
  checkPermissions(['edit']),
  validateBody(),
  async (req, res, next) => {
    try {
      const pullRequest = parseParams(req);
      const client = await getClientForRepo(pullRequest.repo);
      const body = getBody(req);

      const updated = await updatePullRequest(
        client,
        getUser(req),
        pullRequest,
        body,
        expressLogger(req, res),
      );

      if (!updated) {
        res.status(404).send(`Unable to find the pull request`);
      } else {
        res.status(200).send('ok');
      }
    } catch (ex) {
      next(ex);
    }
  },
);

export default appMiddleware;
// tslint:disable-next-line: no-implicit-dependencies
import Cookie from '@authentication/cookie';
import GitHubAuthentication from '@authentication/github';
import type {Request, Response, NextFunction} from 'express';
import {Router} from 'express';

const authMiddleware = Router();

const githubTokenCookie = new Cookie<{accessToken: string}>('github_account', {
  maxAge: '1 days',
});

const gitHubAuthentication = new GitHubAuthentication<{path: string}>({
  callbackURL: '/__/auth/github',
});

authMiddleware.get(
  gitHubAuthentication.callbackPath,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (gitHubAuthentication.userCancelledLogin(req)) {
        res.send('Authentication Failed');
        return;
      }
      const {
        accessToken,
        state,
      } = await gitHubAuthentication.completeAuthenticationWithoutProfile(
        req,
        res,
      );
      githubTokenCookie.set(req, res, {accessToken});
      res.redirect(state!.path);
    } catch (ex) {
      next(ex);
    }
  },
);

export function requiresAuth({api}: {api?: boolean} = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userAuth = githubTokenCookie.get(req, res);
    if (userAuth) {
      next();
    } else if (api) {
      res.status(401).send('You must be authenticated to use this API');
    } else {
      gitHubAuthentication.redirectToProvider(req, res, next, {
        state: {path: req.url},
        scope: ['read:user'],
      });
    }
  };
}

export function getGitHubAccessToken(req: Request, res: Response) {
  const accessToken = getOptionalGitHubAccessToken(req, res);
  if (!accessToken) {
    throw new Error('Missing access token');
  }
  return accessToken;
}

export function getOptionalGitHubAccessToken(req: Request, res: Response) {
  const userAuth = githubTokenCookie.get(req, res);
  if (!userAuth) {
    return null;
  }
  return userAuth.accessToken;
}

export default authMiddleware;
import {readFileSync} from 'fs';

import {Router, static as expressStatic} from 'express';

import {requiresAuth} from './auth';
import checkPermissions, {checkRepoPermissions} from './utils/checkPermissions';
import validateParams, {validateRepoParams} from './utils/validateParams';

const staticMiddleware = Router();

staticMiddleware.use(
  '/static',
  expressStatic(`${__dirname}/../../../dist/static`, {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    immutable: true,
    index: false,
  }),
);
staticMiddleware.use(
  expressStatic(`${__dirname}/../../../favicon`, {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    immutable: true,
    index: false,
  }),
);

const getHtml = () => {
  const src = readFileSync(`${__dirname}/../../../dist/index.html`, 'utf8');
  const scriptStart = '<script';
  const [start, ...rest] = src.split(scriptStart);
  const end = scriptStart + rest.join(scriptStart);
  return (extra: string) => `${start}${extra}${end}`;
};

const htmlCache = process.env.NODE_ENV !== 'production' ? null : getHtml();

staticMiddleware.get('/help/:help_page', async (_req, res, _next) => {
  const html = htmlCache || getHtml();
  res.send(
    html(
      '',
      // you can insert variables here via: `<script></script>`
    ),
  );
});

staticMiddleware.get(
  `/:owner/:repo`,
  requiresAuth(),
  validateRepoParams(),
  checkRepoPermissions(['view', 'edit']),
);

staticMiddleware.get(`/:owner/:repo/pulls/:pull_number`, (req, res) => {
  res.redirect(
    `/${req.params.owner}/${req.params.repo}/pull/${req.params.pull_number}`,
  );
});
staticMiddleware.get(
  `/:owner/:repo/pull/:pull_number`,
  requiresAuth(),
  validateParams(),
  checkPermissions(['view', 'edit']),
);

staticMiddleware.get('/*', async (req, res, next) => {
  if (req.path.startsWith('/static/')) {
    next();
    return;
  }
  const html = htmlCache || getHtml();
  res.send(
    html(
      '',
      // you can insert variables here via: `<script></script>`
    ),
  );
});

export default staticMiddleware;
import type {Response, Request} from 'express';

import {expressLogger} from '../../logger';
import getPermissionLevel, {
  Permission,
  getRepoPermissionLevel,
  getViewer,
} from '../../permissions/getPermissionLevel';
import {getGitHubAccessToken} from '../auth';
import {parseParams, parseRepoParams} from './validateParams';

export type {Permission};

const permissionInfoMap = new WeakMap<
  Request,
  {permission: Permission; login: string}
>();
export function getPermission(req: Request) {
  return permissionInfoMap.get(req)?.permission || 'none';
}
export interface User {
  login: string;
}
export function getUser(req: Request): User {
  const pi = permissionInfoMap.get(req) || repoPermissionInfoMap.get(req);
  return {
    login: pi?.login || 'unknown',
  };
}
export default function checkPermissions(allowedPermissions: Permission[]) {
  return async (req: Request, res: Response, next: (err?: any) => void) => {
    try {
      const userAuth = getGitHubAccessToken(req, res);
      const pullRequest = parseParams(req);

      const logger = expressLogger(req, res);
      const timer = logger.withTimer();
      const permissionInfo = await getPermissionLevel(
        pullRequest,
        userAuth,
        logger,
      );
      timer.info('loaded_permission_level', 'Loaded permission level', {
        allowed_permissions: allowedPermissions,
        permission: permissionInfo.permission,
        reason: permissionInfo.reason,
        login: permissionInfo.login,
        repo_owner: pullRequest.repo.owner,
        repo_name: pullRequest.repo.name,
        pull_number: pullRequest.number,
      });
      permissionInfoMap.set(req, permissionInfo);
      if (!allowedPermissions.includes(permissionInfo.permission)) {
        logger.warning(
          'permission_denied',
          `${permissionInfo.login} does not have access to ${pullRequest.repo.owner}/${pullRequest.repo.name}#${pullRequest.number}`,
          {
            allowed_permissions: allowedPermissions,
            permission: permissionInfo.permission,
            reason: permissionInfo.reason,
            login: permissionInfo.login,
            repo_owner: pullRequest.repo.owner,
            repo_name: pullRequest.repo.name,
            pull_number: pullRequest.number,
          },
        );
        res
          .status(404)
          .send(
            'Either this PR does not exist, you do not have access to it, or Rolling Versions is not installed on this repository.',
          );
      } else {
        next();
      }
    } catch (ex) {
      next(ex || new Error('Permissions check failed'));
    }
  };
}

const repoPermissionInfoMap = new WeakMap<
  Request,
  {permission: Permission; login: string}
>();
export function getRepoPermission(req: Request) {
  return repoPermissionInfoMap.get(req)?.permission || 'none';
}
export function checkRepoPermissions(allowedPermissions: Permission[]) {
  return async (req: Request, res: Response, next: (err?: any) => void) => {
    try {
      const userAuth = getGitHubAccessToken(req, res);
      const repo = parseRepoParams(req);
      const logger = expressLogger(req, res);
      const timer = logger.withTimer();
      const permissionInfo = await getRepoPermissionLevel(
        {owner: repo.owner, name: repo.repo},
        userAuth,
        logger,
      );
      timer.info('loaded_permission_level', 'Loaded permission level', {
        allowed_permissions: allowedPermissions,
        permission: permissionInfo.permission,
        reason: permissionInfo.reason,
        login: permissionInfo.login,
        repo_owner: repo.owner,
        repo_name: repo.repo,
      });
      repoPermissionInfoMap.set(req, permissionInfo);
      if (!allowedPermissions.includes(permissionInfo.permission)) {
        logger.warning(
          'permission_denied',
          `${permissionInfo.login} does not have access to ${repo.owner}/${repo.repo}`,
          {
            allowed_permissions: allowedPermissions,
            permission: permissionInfo.permission,
            reason: permissionInfo.reason,
            login: permissionInfo.login,
            repo_owner: repo.owner,
            repo_name: repo.repo,
          },
        );
        res
          .status(404)
          .send(
            'Either this repository does not exist, you do not have access to it, or Rolling Versions is not installed on this repository.',
          );
      } else {
        next();
      }
    } catch (ex) {
      next(ex || new Error('Permissions check failed'));
    }
  };
}

export function checkAdminPermissions() {
  return async (req: Request, res: Response, next: (err?: any) => void) => {
    try {
      const userAuth = getGitHubAccessToken(req, res);
      const logger = expressLogger(req, res);
      const timer = logger.withTimer();
      const {login} = await getViewer(userAuth);
      timer.info('loaded_admin_permission_level', 'Loaded permission level', {
        login,
      });
      repoPermissionInfoMap.set(req, {
        login,
        permission: login === 'ForbesLindesay' ? 'edit' : 'none',
      });
      if (login !== 'ForbesLindesay') {
        logger.warning(
          'permission_denied',
          `${login} does not have access to access admin screens`,
          {login},
        );
        res
          .status(403)
          .send('You do not have admin permissions on RollingVersions.');
      } else {
        next();
      }
    } catch (ex) {
      next(ex || new Error('Permissions check failed'));
    }
  };
}
import type {Response, Request} from 'express';
import {showError} from 'funtypes';

import {
  UpdatePullRequestBody,
  UpdatePullRequestBodyCodec,
} from '../../../types';

export default function validateBody() {
  return (req: Request, res: Response, next: (err?: any) => void) => {
    const result = UpdatePullRequestBodyCodec.safeParse(req.body);
    if (result.success) next();
    else res.status(400).send(`${showError(result)}\n`);
  };
}
export function getBody(req: Request): UpdatePullRequestBody {
  return UpdatePullRequestBodyCodec.parse(req.body);
}
import type {Response, Request} from 'express';

import {PullRequest} from '@rollingversions/types';

const validRequests = new WeakSet<Request>();
export default function validateParams() {
  return (req: Request, res: Response, next: (err?: any) => void) => {
    const {owner, repo, pull_number} = req.params;
    if (!owner) {
      res.status(400).send('Expected a owner parameter');
    } else if (!repo) {
      res.status(400).send('Expected a repo parameter');
    } else if (!pull_number) {
      res.status(400).send('Expected a pull_number parameter');
    } else if (!/^\d+$/.test(pull_number) || pull_number.length > 6) {
      res.status(404).send('This is not a valid pull request number');
    } else {
      validRequests.add(req);
      next();
    }
  };
}
export function parseParams(req: Request): PullRequest {
  if (!validRequests.has(req)) {
    throw new Error(
      'This request has not been passed through the validation middleware',
    );
  }
  const {owner, repo, pull_number} = req.params;
  return {repo: {owner, name: repo}, number: parseInt(pull_number, 10)};
}

const validRepoRequests = new WeakSet<Request>();
export function validateRepoParams() {
  return (req: Request, res: Response, next: (err?: any) => void) => {
    const {owner, repo} = req.params;
    if (!owner) {
      res.status(400).send('Expected a owner parameter');
    } else if (!repo) {
      res.status(400).send('Expected a repo parameter');
    } else if (
      req.query.commit !== undefined &&
      typeof req.query.commit !== 'string'
    ) {
      res.status(400).send('Expected commit to be a string, if specified.');
    } else if (
      req.query.branch !== undefined &&
      typeof req.query.branch !== 'string'
    ) {
      res.status(400).send('Expected branch to be a string, if specified.');
    } else {
      validRepoRequests.add(req);
      next();
    }
  };
}
export function parseRepoParams(
  req: Request,
): {
  owner: string;
  repo: string;
  commit?: string;
  branch?: string;
} {
  if (!validRepoRequests.has(req)) {
    throw new Error(
      'This request has not been passed through the validation middleware',
    );
  }
  const {owner, repo} = req.params;
  return {
    owner,
    repo,
    commit: req.query.commit ?? undefined,
    branch: req.query.branch ?? undefined,
  };
}
import minimatch from 'minimatch';
import Cache from 'quick-lru';

import ChangeSet from '@rollingversions/change-set';
import {DEFAULT_CONFIG} from '@rollingversions/config';
import {Queryable, tables} from '@rollingversions/db';
import DbGitCommit from '@rollingversions/db/git_commits';
import DbGitRef from '@rollingversions/db/git_refs';
import DbGitRepository from '@rollingversions/db/git_repositories';
import DbPullRequest from '@rollingversions/db/pull_requests';
import {parseTag} from '@rollingversions/tag-format';
import {
  CurrentVersionTag,
  PackageManifest,
  VersioningMode,
  VersioningModeConfig,
  VersionTag,
} from '@rollingversions/types';
import {isPrerelease, max} from '@rollingversions/version-number';
import {eq as versionsEqual} from '@rollingversions/version-number';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';

import {PullRequestPackage} from '../../types';
import groupByKey from '../../utils/groupByKey';
import type {Logger} from '../logger';
import {GitHubClient} from '../services/github';
import {
  fetchTree,
  getAllTags,
  getAllTagsOnBranch,
  getBranchHeadCommit,
  getPullRequestHeadCommit,
  isCommitReleased,
  updateRepoIfChanged,
} from './git';
import listPackages from './PackageManifests/listPackages';

export type PackageManifests = Map<string, PackageManifest>;

// `${git_repository_id}:${commit_sha}`
type CommitID = string;

type GetPackageManifestsResult = {
  oid: string;
  packages: Map<string, PackageManifest>;
  packageErrors: {filename: string; error: string}[];
};
const cache = new Cache<CommitID, Promise<GetPackageManifestsResult | null>>({
  maxSize: 30,
});
async function getPackageManifestsUncached(
  _client: GitHubClient,
  repo: DbGitRepository,
  _source:
    | {type: 'branch'; name: string}
    | {type: 'pull_request'; pullRequest: DbPullRequest}
    | {type: 'commit'; commit: DbGitCommit},
  commit: DbGitCommit,
  logger: Logger,
): Promise<null | GetPackageManifestsResult> {
  const commitFiles = {
    entries: await fetchTree(repo, commit.commit_sha, logger),
    oid: commit.commit_sha,
  };
  const {packages, packageErrors} = await listPackages(commitFiles.entries);

  return {oid: commitFiles.oid, packages, packageErrors};
}

export async function getPackageManifests(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  source:
    | {type: 'branch'; name: string}
    | {type: 'pull_request'; pullRequest: DbPullRequest}
    | {type: 'commit'; commit: DbGitCommit},
  logger: Logger,
) {
  const commit =
    source.type === 'commit'
      ? source.commit
      : source.type === `branch`
      ? await getBranchHeadCommit(db, client, repo, source.name, logger)
      : await getPullRequestHeadCommit(
          db,
          client,
          repo,
          source.pullRequest,
          logger,
        );
  if (!commit) {
    return null;
  }
  const id: CommitID = `${repo.id}:${commit.commit_sha}`;
  const cached = cache.get(id);
  if (cached) {
    return await cached;
  }
  try {
    const fresh = getPackageManifestsUncached(
      client,
      repo,
      source,
      commit,
      logger,
    );
    cache.set(id, fresh);
    const result = await fresh;
    if (result?.oid !== commit.commit_sha) {
      cache.delete(id);
    }
    return result;
  } catch (ex) {
    cache.delete(id);
    throw ex;
  }
}

async function getPackageManifestsForPullRequest(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pullRequest: DbPullRequest,
  logger: Logger,
) {
  return (
    (await getPackageManifests(
      db,
      client,
      repo,
      {type: 'pull_request', pullRequest},
      logger,
    )) ||
    (await getPackageManifests(
      db,
      client,
      repo,
      {type: 'branch', name: repo.default_branch_name},
      logger,
    ))
  );
}

async function getChangeLogEntriesForPR(
  db: Queryable,
  pullRequest: DbPullRequest,
) {
  return await tables
    .change_log_entries(db)
    .find({pull_request_id: pullRequest.id})
    .orderByAsc(`sort_order_weight`)
    .all();
}
export function getPackageVersions({
  allowTagsWithoutPackageName,
  allTags,
  manifest,
}: {
  allowTagsWithoutPackageName: boolean;
  allTags: DbGitRef[];
  manifest: PackageManifest;
}) {
  return allTags
    .map((tag): VersionTag | null => {
      const version = parseTag(tag.name, {
        allowTagsWithoutPackageName,
        packageName: manifest.packageName,
        tagFormat: manifest.tagFormat,
        versionSchema: manifest.versionSchema,
      });
      return version && !isPrerelease(version)
        ? {commitSha: tag.commit_sha, name: tag.name, version}
        : null;
    })
    .filter(isTruthy);
}

async function mapMapValuesAsync<TKey, TValue, TMappedValue>(
  map: Map<TKey, TValue>,
  fn: (value: TValue) => Promise<TMappedValue>,
): Promise<Map<TKey, TMappedValue>> {
  return new Map(
    await Promise.all(
      [...map].map(async ([k, v]) => [k, await fn(v)] as const),
    ),
  );
}

export async function getDetailedPackageManifestsForPullRequest(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pullRequest: DbPullRequest,
  logger: Logger,
): Promise<null | {
  packageErrors: {filename: string; error: string}[];
  packages: Map<string, PullRequestPackage>;
}> {
  await updateRepoIfChanged(db, client, repo.id, logger);

  const [
    getPackageManifestsResult,
    allTags,
    branchTags,
    changeLogEntries,
  ] = await Promise.all([
    getPackageManifestsForPullRequest(db, client, repo, pullRequest, logger),
    getAllTags(db, client, repo, logger),
    pullRequest.base_ref_name
      ? getBranchHeadCommit(
          db,
          client,
          repo,
          pullRequest.base_ref_name,
          logger,
        ).then(async (headCommit) =>
          headCommit ? await getAllTagsOnBranch(db, headCommit) : null,
        )
      : null,
    getChangeLogEntriesForPR(db, pullRequest),
  ]);
  if (!getPackageManifestsResult) {
    return null;
  }

  const {packages: manifests, packageErrors} = getPackageManifestsResult;

  const changes = groupByKey(changeLogEntries, (e) => e.package_name);

  const detailedManifests = await mapMapValuesAsync(
    manifests,
    async (manifest): Promise<PullRequestPackage> => {
      const allVersions = getPackageVersions({
        allowTagsWithoutPackageName: manifests.size <= 1,
        allTags,
        manifest,
      });
      const branchVersions = branchTags
        ? getPackageVersions({
            allowTagsWithoutPackageName: manifests.size <= 1,
            allTags: branchTags,
            manifest,
          })
        : null;
      const released =
        pullRequest.merge_commit_sha !== null &&
        (await isCommitReleased(db, repo, {
          commitShaToCheck: pullRequest.merge_commit_sha,
          releasedCommits: new Set(allVersions.map((v) => v.commitSha)),
        }));
      const changeSet: ChangeSet = (
        changes.get(manifest.packageName) ?? []
      ).map((c) => ({type: c.kind, title: c.title, body: c.body}));

      const currentVersion =
        branchVersions && pullRequest.base_ref_name
          ? getCurrentVersion({
              allVersions,
              branchVersions,
              versioningMode: manifest.versioningMode,
              branchName: pullRequest.base_ref_name,
            })
          : {ok: false as const};
      return {
        manifest: {...manifest},
        currentVersion:
          currentVersion === null
            ? null
            : currentVersion.ok
            ? currentVersion
            : getMaxVersion(allVersions),
        changeSet,
        released,
      };
    },
  );

  for (const [packageName, changeLogEntries] of changes) {
    if (!detailedManifests.has(packageName)) {
      const changeSet: ChangeSet = changeLogEntries.map((c) => ({
        type: c.kind,
        title: c.title,
        body: c.body,
      }));
      detailedManifests.set(packageName, {
        manifest: {
          ...DEFAULT_CONFIG,
          customized: [],
          packageName,
          targetConfigs: [],
          dependencies: {development: [], required: [], optional: []},
        },
        currentVersion: null,
        changeSet,
        released: false,
      });
    }
  }

  return {packageErrors, packages: detailedManifests};
}

function getVersioningMode(
  versioningMode: VersioningModeConfig,
  branchName: string,
): VersioningMode {
  if (typeof versioningMode === 'string') {
    return versioningMode;
  }

  for (const {branch: branchPattern, mode} of versioningMode) {
    if (minimatch(branchName, branchPattern)) {
      return mode;
    }
  }

  return VersioningMode.Unambiguous;
}

function getMaxVersion(versions: readonly VersionTag[]) {
  return max(versions, (tag) => tag.version) ?? null;
}

export function getCurrentVersion({
  allVersions,
  branchVersions,
  branchName,
  versioningMode,
}: {
  allVersions: VersionTag[];
  branchVersions: VersionTag[];
  branchName: string;
  versioningMode: VersioningModeConfig;
}): CurrentVersionTag | null {
  const mode = getVersioningMode(versioningMode, branchName);
  const maxVersion = getMaxVersion(allVersions);
  const branchVersion = getMaxVersion(branchVersions);
  switch (mode) {
    case VersioningMode.AlwaysIncreasing:
      return maxVersion && {ok: true, ...maxVersion};
    case VersioningMode.ByBranch:
      return branchVersion && {ok: true, ...branchVersion};
    case VersioningMode.Unambiguous:
      if (
        branchVersion === maxVersion ||
        (branchVersion &&
          maxVersion &&
          versionsEqual(branchVersion.version, maxVersion.version))
      ) {
        return maxVersion && {ok: true, ...maxVersion};
      } else {
        return {ok: false, maxVersion, branchVersion};
      }
  }
}
import type {PackageManifest} from '@rollingversions/types';
import {
  pathMayContainPackage,
  getPackageManifests,
} from 'rollingversions/lib/PublishTargets';

import mergePackageManifests from './mergePackageManifests';

export default async function listPackages(
  files:
    | {
        path: string;
        getContents: () => Promise<string>;
      }[]
    | AsyncGenerator<
        {
          path: string;
          getContents: () => Promise<string>;
        },
        any,
        any
      >,
) {
  const packageErrors: {filename: string; error: string}[] = [];
  const packagesWithErrors = new Set<string>();
  const packages = new Map<string, PackageManifest>();
  const pending: Promise<void>[] = [];
  async function pushFile(file: {
    path: string;
    getContents: () => Promise<string>;
  }) {
    const contents = await file.getContents();
    const {manifests, errors} = await getPackageManifests(file.path, contents);
    for (const error of errors) {
      packageErrors.push({filename: file.path, error});
    }
    for (const newManifest of manifests) {
      if (packagesWithErrors.has(newManifest.packageName)) {
        // do not look at additional occurrences of a package name if we
        // already found errors merging it
        continue;
      }
      const existingManifest = packages.get(newManifest.packageName);
      if (existingManifest) {
        const mergeResult = mergePackageManifests(
          existingManifest,
          newManifest,
        );
        if (mergeResult.ok) {
          packages.set(newManifest.packageName, mergeResult.manifest);
        } else {
          packages.delete(newManifest.packageName);
          packageErrors.push({filename: file.path, error: mergeResult.reason});
          packagesWithErrors.add(newManifest.packageName);
        }
      } else {
        packages.set(newManifest.packageName, newManifest);
      }
    }
  }
  for await (const file of files) {
    if (pathMayContainPackage(file.path)) {
      pending.push(pushFile(file));
    }
  }

  await Promise.all(pending);

  return {packages, packageErrors};
}
import {PackageDependencies} from '@rollingversions/types';

export default function mergePackageDependencies(
  a: PackageDependencies,
  b: PackageDependencies,
): PackageDependencies {
  return {
    required: [...new Set([...a.required, ...b.required])],
    optional: [...new Set([...a.optional, ...b.optional])],
    development: [...new Set([...a.development, ...b.development])],
  };
}
import {inspect} from 'util';

import deepEqual from 'deep-equal';

import {parseRollingConfigOptions} from '@rollingversions/config';
import {PackageManifest} from '@rollingversions/types';

import mergePackageDependencies from './mergePackageDependencies';

const failed = (reason: string): {ok: false; reason: string} => ({
  ok: false,
  reason,
});
export default function mergePackageManifests(
  a: PackageManifest,
  b: PackageManifest,
): {ok: true; manifest: PackageManifest} | {ok: false; reason: string} {
  if (a.packageName !== b.packageName) {
    return failed(
      `Cannot merge two package manifests with different names: "${a.packageName}" and "${b.packageName}"`,
    );
  }
  const customized = [...new Set([...a.customized, ...b.customized])];
  const rawConfig: any = {};
  for (const key of customized) {
    if (a.customized.includes(key) && b.customized.includes(key)) {
      if (deepEqual(a[key], b[key])) {
        rawConfig[key] = a[key];
      } else {
        return failed(
          `Cannot use two different ${key} for "${a.packageName}": "${inspect(
            a[key],
          )}" and "${inspect(b[key])}"`,
        );
      }
    } else if (a.customized.includes(key)) {
      rawConfig[key] = a[key];
    } else {
      rawConfig[key] = b[key];
    }
  }
  const config = parseRollingConfigOptions(rawConfig);
  if (!config.success) {
    return {ok: false, reason: config.reason};
  }
  return {
    ok: true,
    manifest: {
      ...config.value,
      customized,
      packageName: a.packageName,
      dependencies: mergePackageDependencies(a.dependencies, b.dependencies),
      targetConfigs: [...a.targetConfigs, ...b.targetConfigs],
    },
  };
}
import {Queryable, tables} from '@rollingversions/db';
import DbGitCommit from '@rollingversions/db/git_commits';
import DbGitRepository from '@rollingversions/db/git_repositories';
import DbPullRequest from '@rollingversions/db/pull_requests';

import {renderComment, renderInitialComment} from '../../utils/Rendering';
import {APP_URL} from '../environment';
import {Logger} from '../logger';
import {deleteComment, GitHubClient, writeComment} from '../services/github';
import {getPullRequestHeadCommit} from './git';
import {getDetailedPackageManifestsForPullRequest} from './PackageManifests';

async function getPullRequestInitialComment(
  repo: DbGitRepository,
  pullRequest: DbPullRequest,
): Promise<string> {
  return renderInitialComment(
    {
      repo: {
        owner: repo.owner,
        name: repo.name,
      },
      number: pullRequest.pr_number,
    },
    APP_URL,
  );
}
async function getPullRequestComment(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pullRequest: DbPullRequest,
  headCommit: DbGitCommit | null,
  logger: Logger,
): Promise<string> {
  const getPackagesResult = await getDetailedPackageManifestsForPullRequest(
    db,
    client,
    repo,
    pullRequest,
    logger,
  );
  if (!getPackagesResult) {
    throw new Error(
      `Cannot load package manifests for ${repo.owner}/${repo.name}`,
    );
  }
  return renderComment(
    {
      repo: {owner: repo.owner, name: repo.name},
      number: pullRequest.pr_number,
      headSha: headCommit?.commit_sha ?? null,
    },
    pullRequest.change_set_submitted_at_git_commit_sha,
    getPackagesResult,
    APP_URL,
  );

  // pullRequest: Omit<PullRequest, 'headSha'> & {headSha: string | null},
  // submittedAtCommitSha: string | null,
  // packages: Map<string, PullRequestPackage>,
  // rollingVersionsUrl: URL,
}

export async function updatePullRequestComment(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pullRequest: DbPullRequest,
  logger: Logger,
) {
  if (pullRequest.change_set_submitted_at_git_commit_sha) {
    const headCommit = await getPullRequestHeadCommit(
      db,
      client,
      repo,
      pullRequest,
      logger,
    );

    const headCommitSha =
      headCommit?.commit_sha ??
      pullRequest.change_set_submitted_at_git_commit_sha;
    if (headCommitSha !== pullRequest.comment_updated_at_commit_sha) {
      await setComment(
        db,
        client,
        repo,
        pullRequest,
        await getPullRequestComment(
          db,
          client,
          repo,
          pullRequest,
          headCommit,
          logger,
        ),
        headCommitSha,
        logger,
      );
    }
  } else if (!pullRequest.comment_id && !pullRequest.is_closed) {
    await setComment(
      db,
      client,
      repo,
      pullRequest,
      await getPullRequestInitialComment(repo, pullRequest),
      null,
      logger,
    );
  }
}

async function setComment(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pr: DbPullRequest,
  commentBody: string,
  headCommitSha: DbGitCommit['commit_sha'] | null,
  _logger: Logger,
) {
  const commentID = await writeComment(
    client,
    {
      repo: {
        owner: repo.owner,
        name: repo.name,
      },
      number: pr.pr_number,
    },
    commentBody,
    pr.comment_id ?? undefined,
  ).catch(async (ex) => {
    if (ex.status === 404 && pr.comment_id) {
      // The comment may have been manually deleted
      // if so, we should re-create it
      const commentID = await writeComment(
        client,
        {
          repo: {
            owner: repo.owner,
            name: repo.name,
          },
          number: pr.pr_number,
        },
        commentBody,
        undefined,
      );
      const updated = await tables.pull_requests(db).update(
        {id: pr.id, comment_id: pr.comment_id},
        {
          comment_id: commentID,
          ...(headCommitSha
            ? {comment_updated_at_commit_sha: headCommitSha}
            : {}),
        },
      );
      if (updated.length === 0) {
        // delete the duplicate comment
        await deleteComment(
          client,
          {
            repo: {
              owner: repo.owner,
              name: repo.name,
            },
            number: pr.pr_number,
          },
          commentID,
        );
        return null;
      } else {
        return commentID;
      }
    }
    throw ex;
  });
  if (commentID === null) {
    // this was a duplicate comment, so we deleted it
    return (await tables.pull_requests(db).findOne({id: pr.id})) ?? pr;
  }
  if (pr.comment_id === null) {
    const updated = await tables.pull_requests(db).update(
      {id: pr.id, comment_id: null},
      {
        comment_id: commentID,
        ...(headCommitSha
          ? {comment_updated_at_commit_sha: headCommitSha}
          : {}),
      },
    );

    // If we added a duplicate comment, we remove it here
    if (updated.length === 0) {
      await deleteComment(
        client,
        {
          repo: {
            owner: repo.owner,
            name: repo.name,
          },
          number: pr.pr_number,
        },
        commentID,
      );
      return (await tables.pull_requests(db).findOne({id: pr.id})) ?? pr;
    } else {
      return updated[0];
    }
  } else if (headCommitSha) {
    const updated = await tables
      .pull_requests(db)
      .update({id: pr.id}, {comment_updated_at_commit_sha: headCommitSha});
    return updated[0] ?? pr;
  } else {
    return pr;
  }
}
import {Queryable, tables} from '@rollingversions/db';
import DbGitCommit from '@rollingversions/db/git_commits';
import DbGitRepository from '@rollingversions/db/git_repositories';
import DbPullRequest from '@rollingversions/db/pull_requests';

import {getUrlForChangeLog} from '../../utils/Rendering';
import {APP_URL} from '../environment';
import {Logger} from '../logger';
import {GitHubClient, updateCommitStatus} from '../services/github';
import {getPullRequestHeadCommit} from './git';

async function getPullRequestStatus(
  db: Queryable,
  pullRequest: DbPullRequest,
  headCommit: DbGitCommit,
) {
  if (pullRequest.change_set_submitted_at_git_commit_sha === null) {
    return {
      state: 'pending',
      description: 'please add a changelog',
    } as const;
  } else if (
    // TODO: also take this path if the "config" says to allow changes after change log is created
    pullRequest.change_set_submitted_at_git_commit_sha === headCommit.commit_sha
  ) {
    const packagesToRelease = new Set(
      (
        await tables
          .change_log_entries(db)
          .find({pull_request_id: pullRequest.id})
          .select(`package_name`)
          .all()
      ).map((c) => c.package_name),
    );

    return {
      state: 'success',
      description:
        packagesToRelease.size === 0
          ? `no changes to release`
          : packagesToRelease.size === 1
          ? `releasing ${[...packagesToRelease][0]}`
          : `releasing multiple packages`,
    } as const;
  } else {
    return {
      state: 'pending',
      description: `please update the changelog`,
    } as const;
  }
}

export async function updatePullRequestStatus(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pullRequest: DbPullRequest,
  logger: Logger,
) {
  if (pullRequest.is_closed) {
    return null;
  }

  const headCommit = await getPullRequestHeadCommit(
    db,
    client,
    repo,
    pullRequest,
    logger,
  );

  if (
    headCommit &&
    headCommit.commit_sha !== pullRequest.status_updated_at_commit_sha
  ) {
    const url = getUrlForChangeLog(
      {
        repo: {
          owner: repo.owner,
          name: repo.name,
        },
        number: pullRequest.pr_number,
      },
      APP_URL,
    );
    const {state, description} = await getPullRequestStatus(
      db,
      pullRequest,
      headCommit,
    );
    await updateCommitStatus(client, repo, headCommit, {
      url,
      state,
      description,
    });
    await tables
      .pull_requests(db)
      .update(
        {id: pullRequest.id},
        {status_updated_at_commit_sha: headCommit.commit_sha},
      );
  }

  return headCommit;
}
import * as ft from 'funtypes';

import type {Queryable} from '@rollingversions/db';
import {tables} from '@rollingversions/db';
import type DbGitRepository from '@rollingversions/db/git_repositories';

import batchArray from '../../utils/batchArray';
import {Logger} from '../logger';
import {
  getPullRequestFromGraphID,
  getPullRequestFromNumber,
  getRepositoryPullRequestIDs,
  GitHubClient,
} from '../services/github';

const PayloadPullRequestSchema = ft.Object({
  id: ft.Number,
  node_id: ft.String,
  number: ft.Number,
  title: ft.String,
  closed_at: ft.Union(ft.Null, ft.String),
  merged_at: ft.Union(ft.Null, ft.String),
  merge_commit_sha: ft.Union(ft.Null, ft.String),
  head: ft.Object({ref: ft.String}),
  base: ft.Object({ref: ft.String}),
});
export type PayloadPullRequest = ft.Static<typeof PayloadPullRequestSchema>;

function checkForMergeCommit(
  repo: DbGitRepository,
  pr: {
    id: number;
    number: number;
    is_merged: boolean;
    merge_commit_sha: string | null;
  },
  logger: Logger,
) {
  if (pr.is_merged && !pr.merge_commit_sha) {
    logger.error(
      `merged_without_merge_commit`,
      `Merged PR should have a merge_commit_sha`,
      {
        repo_id: repo.id,
        repo_owner: repo.owner,
        repo_name: repo.name,
        pull_number: pr.number,
        pull_id: pr.id,
      },
    );
  }
}

export async function upsertPullRequestFromPayload(
  db: Queryable,
  _client: GitHubClient,
  repo: DbGitRepository,
  pr: PayloadPullRequest,
  logger: Logger,
) {
  PayloadPullRequestSchema.parse(pr);
  checkForMergeCommit(
    repo,
    {
      id: pr.id,
      number: pr.number,
      is_merged: !!pr.merged_at,
      merge_commit_sha: pr.merge_commit_sha,
    },
    logger,
  );
  const [dbPR] = await tables.pull_requests(db).insertOrUpdate([`id`], {
    git_repository_id: repo.id,
    id: pr.id,
    graphql_id: pr.node_id,
    pr_number: pr.number,
    title: pr.title,
    is_closed: pr.closed_at !== null || pr.merged_at !== null,
    is_merged: pr.merged_at !== null,
    merge_commit_sha: pr.merge_commit_sha,
    head_ref_name: pr.head.ref,
    base_ref_name: pr.base.ref,
  });
  return dbPR;
}

export async function upsertPullRequestFromGraphQL(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  graphQlId: string,
  logger: Logger,
) {
  const pr = await getPullRequestFromGraphID(client, graphQlId);
  if (!pr) {
    throw new Error(`Could not find the PR for GraphQL ID ${graphQlId}`);
  }
  checkForMergeCommit(repo, pr, logger);
  const [dbPR] = await tables.pull_requests(db).insertOrUpdate([`id`], {
    git_repository_id: repo.id,
    id: pr.id,
    graphql_id: pr.graphql_id,
    pr_number: pr.number,
    title: pr.title,
    is_closed: pr.is_closed || pr.is_merged,
    is_merged: pr.is_merged,
    merge_commit_sha: pr.merge_commit_sha,
    head_ref_name: pr.head_ref_name,
    base_ref_name: pr.base_ref_name,
  });
  return dbPR;
}

export async function getPullRequestFromRestParams(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pullRequestNumber: number,
  _logger: Logger,
) {
  const existingPR = await tables.pull_requests(db).findOne({
    git_repository_id: repo.id,
    pr_number: pullRequestNumber,
  });
  if (existingPR) {
    return existingPR;
  }
  const pr = await getPullRequestFromNumber(
    client,
    {
      owner: repo.owner,
      name: repo.name,
    },
    pullRequestNumber,
  );
  if (!pr) {
    return null;
  }
  const [dbPR] = await tables.pull_requests(db).insertOrUpdate([`id`], {
    git_repository_id: repo.id,
    id: pr.id,
    graphql_id: pr.graphql_id,
    pr_number: pr.number,
    title: pr.title,
    is_closed: pr.is_closed || pr.is_merged,
    is_merged: pr.is_merged,
    merge_commit_sha: pr.merge_commit_sha,
    head_ref_name: pr.head_ref_name,
    base_ref_name: pr.base_ref_name,
  });
  return dbPR;
}

export async function refreshPullRequests(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  logger: Logger,
) {
  const timer = logger.withTimer();
  const existingPullRequests = new Set(
    (
      await tables
        .pull_requests(db)
        .find({
          git_repository_id: repo.id,
        })
        .select(`id`)
        .all()
    ).map((pr) => pr.id),
  );
  for await (const pullRequestIDs of getRepositoryPullRequestIDs(
    client,
    repo,
  )) {
    const newPullRequests = pullRequestIDs.filter(
      ({id}) => !existingPullRequests.has(id),
    );
    await Promise.all(
      newPullRequests.map(({graphql_id}) =>
        upsertPullRequestFromGraphQL(db, client, repo, graphql_id, logger),
      ),
    );
  }
  timer.info('read_pull_requests', 'Read all pull request IDs');
  await refreshPullRequestMergeCommits(db, client, repo, logger);
}

export async function refreshPullRequestMergeCommits(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  logger: Logger,
) {
  const timer = logger.withTimer();
  const results = {successfullyAdded: 0, missing: 0};
  const pullRequests = await tables
    .pull_requests(db)
    .find({
      git_repository_id: repo.id,
      is_merged: true,
      merge_commit_sha: null,
    })
    .all();
  for (const batch of batchArray(pullRequests, {maxBatchSize: 30})) {
    await Promise.all(
      batch.map(async (pr) => {
        const updated = await upsertPullRequestFromGraphQL(
          db,
          client,
          repo,
          pr.graphql_id,
          logger,
        );
        if (updated.merge_commit_sha) {
          results.successfullyAdded++;
        } else {
          results.missing++;
        }
      }),
    );
  }
  timer.info(
    'refresh_pr_merge_commits',
    `Added all missing merge commit references for ${repo.owner}/${repo.name}`,
    results,
  );
  return results;
}
import * as ft from 'funtypes';

import type {Queryable} from '@rollingversions/db';
import {tables} from '@rollingversions/db';

import type {GitHubClient} from '../services/github';
import {getRepository} from '../services/github';

/**
 * Repository from a webhook event
 */
export interface PayloadRepository {
  id: number;
  node_id: string;
  full_name: string;
  private: boolean;
  default_branch: string;
}
const PayloadRepositorySchema: ft.Runtype<PayloadRepository> = ft.Object({
  id: ft.Number,
  node_id: ft.String,
  full_name: ft.String.withConstraint((value) =>
    /^[^\/]+\/[^\/]+$/.test(value)
      ? true
      : `Expected full_name to be in the form "owner/name" but got "${value}"`,
  ),
  private: ft.Boolean,
  default_branch: ft.String,
});

/**
 * Repository for a REST API call
 */
export interface RestParameterRepository {
  owner: string;
  name: string;
}
const RestParameterRepositorySchema: ft.Runtype<RestParameterRepository> = ft.Object(
  {
    owner: ft.String,
    name: ft.String,
  },
);

export async function getRepositoryFromRestParams(
  db: Queryable,
  client: GitHubClient,
  repo: RestParameterRepository,
) {
  RestParameterRepositorySchema.parse(repo);

  const existingRepo = await tables.git_repositories(db).findOne({
    owner: repo.owner,
    name: repo.name,
  });
  if (existingRepo) return existingRepo;

  const graphRepo = await getRepository(client, {
    owner: repo.owner,
    name: repo.name,
  });
  if (!graphRepo?.defaultBranch) {
    return null;
  }
  const [dbRepo] = await tables.git_repositories(db).insertOrUpdate([`id`], {
    id: graphRepo.id,
    graphql_id: graphRepo.graphql_id,
    owner: repo.owner,
    name: repo.name,
    default_branch_name: graphRepo.defaultBranch,
  });
  return dbRepo;
}

export async function upsertRepositoryFromEventPayload(
  db: Queryable,
  repo: PayloadRepository,
) {
  PayloadRepositorySchema.parse(repo);
  const [owner, name] = repo.full_name.split(`/`);
  const [dbRepo] = await tables.git_repositories(db).insertOrUpdate([`id`], {
    id: repo.id,
    graphql_id: repo.node_id,
    owner,
    name,
    default_branch_name: repo.default_branch,
  });
  return dbRepo;
}
import {Writable} from 'stream';
import {URL} from 'url';

import {batch} from '@mavenoid/dataloader';

import type {SQLQuery} from '@rollingversions/db';
import {Queryable, sql} from '@rollingversions/db';
import {q} from '@rollingversions/db';
import {tables} from '@rollingversions/db';
import DbChangeLogEntry from '@rollingversions/db/change_log_entries';
import type {GitCommits_InsertParameters} from '@rollingversions/db/git_commits';
import type DbGitCommit from '@rollingversions/db/git_commits';
import type DbGitRef from '@rollingversions/db/git_refs';
import type {GitRefs_InsertParameters} from '@rollingversions/db/git_refs';
import type DbGitRepository from '@rollingversions/db/git_repositories';
import type DbPullRequest from '@rollingversions/db/pull_requests';
import * as git from '@rollingversions/git-http';
import * as gitObj from '@rollingversions/git-objects';

import BatchStream from '../../utils/BatchStream';
import dedupeByKey from '../../utils/dedupeByKey';
import groupByKey from '../../utils/groupByKey';
import {getTokenForRepo} from '../getClient';
import type {Logger} from '../logger';
import type {GitHubClient} from '../services/github';

function notNull<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error(`Expected value but got null or undefined`);
  }
  return value;
}

const CONFLICTING_UPDATES_ERROR = new Error(
  `Two conflicting attempts to update the same git repository were made.`,
);
const dedupe = dedupeByKey<DbGitRepository['id'], void>();
async function getHttpHandler(
  repo: DbGitRepository,
): Promise<git.HttpInterface<Map<string, string>>> {
  const accessToken = await getTokenForRepo(repo);
  const headerValue = `Basic ${Buffer.from(
    `x-access-token:${accessToken}`,
  ).toString(`base64`)}`;
  return {
    ...git.DEFAULT_HTTP_HANDLER,
    createHeaders(url: URL) {
      const headers = git.DEFAULT_HTTP_HANDLER.createHeaders(url);

      // https://docs.github.com/en/developers/apps/authenticating-with-github-apps#http-based-git-access-by-an-installation
      // x-access-token:<token>
      headers.set('Authorization', headerValue);

      return headers;
    },
  };
}

export async function markRepoAsUpdated(
  db: Queryable,
  repo: DbGitRepository,
): Promise<DbGitRepository> {
  let r = repo;
  while (true) {
    const updatedRecords = await tables.git_repositories(db).update(
      {
        id: r.id,
        remote_git_version: r.remote_git_version,
      },
      {remote_git_version: r.remote_git_version + 1},
    );
    if (updatedRecords.length === 1) {
      return updatedRecords[0];
    } else {
      r = notNull(await tables.git_repositories(db).findOne({id: r.id}));
    }
  }
}

export async function updateRepoIfChanged(
  db: Queryable,
  _client: GitHubClient,
  repoID: DbGitRepository['id'],
  logger: Logger,
): Promise<void> {
  return await dedupe(repoID, async () => {
    let repo = notNull(await tables.git_repositories(db).findOne({id: repoID}));
    while (repo.remote_git_version !== repo.local_git_version) {
      const http = await getHttpHandler(repo);
      const repoURL = new URL(
        `https://github.com/${repo.owner}/${repo.name}.git`,
      );

      logger.info(`git_init`, `Git init request ${repoURL.href}`);
      const {capabilities: serverCapabilities} = await git.initialRequest(
        repoURL,
        {
          http,
          agent: 'rollingversions.com',
        },
      );

      logger.info(`git_lsrefs`, `Git ls refs request ${repoURL.href}`);
      const [remoteRefs, localRefs] = await Promise.all([
        git.lsRefs(
          repoURL,
          {
            // TODO: what do we need here?
            // symrefs: true,
            refPrefix: ['refs/heads/', 'refs/tags/', 'refs/pull/'],
          },
          {
            http,
            agent: 'rollingversions.com',
            serverCapabilities,
          },
        ),
        tables
          .git_refs(db)
          .find({
            git_repository_id: repo.id,
          })
          .select(`kind`, `name`, `commit_sha`)
          .all(),
      ]);

      const remoteRefNames = new Set(remoteRefs.map((r) => r.refName));
      const refsToDelete = localRefs.filter(
        (ref) => !remoteRefNames.has(`refs/${ref.kind}/${ref.name}`),
      );
      const localRefsMap = new Map(
        localRefs.map((ref) => [
          `refs/${ref.kind}/${ref.name}`,
          ref.commit_sha,
        ]),
      );
      const refsToUpsert = remoteRefs
        .filter((ref) => ref.objectID !== localRefsMap.get(ref.refName))
        .map(
          (ref): GitRefs_InsertParameters => {
            const match = /^refs\/([^\/]+)\/(.+)$/.exec(ref.refName);
            if (!match) {
              throw new Error(`Invalid ref format "${ref.refName}"`);
            }
            const prRefMatch = /^refs\/pull\/(\d+)\/(head|merge)$/.exec(
              ref.refName,
            );
            return {
              git_repository_id: repo.id,
              kind: match[1],
              name: match[2],
              commit_sha: ref.objectID,
              pr_number: prRefMatch ? parseInt(prRefMatch[1], 10) : null,
              pr_ref_kind: prRefMatch ? prRefMatch[2] : null,
            };
          },
        );

      const localRefShas = new Set(localRefs.map((ref) => ref.commit_sha));
      const missingShas = new Set(
        remoteRefs
          .map((ref) => ref.objectID)
          .filter((objectID) => !localRefShas.has(objectID)),
      );

      if (missingShas.size) {
        logger.info(`git_fetch_objects`, `Git fetch request ${repoURL.href}`);
        const commits = await git.fetchObjects(
          repoURL,
          {
            want: [...missingShas],
            have: [...localRefShas],
            filter: [git.treeDepth(0)],
          },
          {
            http,
            agent: 'rollingversions.com',
            serverCapabilities,
          },
        );

        await new Promise<void>((resolve, reject) => {
          commits
            .on(`error`, reject)
            .pipe(new BatchStream({maxBatchSize: 500}))
            .on(`error`, reject)
            .pipe(
              new Writable({
                objectMode: true,
                write(batch: git.FetchResponseEntryObject[], _encoding, cb) {
                  const commits = batch
                    .map((entry): GitCommits_InsertParameters | null => {
                      if (gitObj.objectIsCommit(entry.body)) {
                        const commit = gitObj.decodeObject(entry.body);
                        // If you use the `-x` option when cherry picking
                        // (see: https://git-scm.com/docs/git-cherry-pick)
                        // it will append the following line to the
                        // commit message:
                        //
                        // (cherry picked from commit <commit-sha>)
                        //
                        // If you repeat that process to cherry pick the
                        // already cherry picked commit into another branch
                        // it will add an additional cherry picked from ...
                        // line
                        const cherryPickedFrom: string[] = [];
                        commit.body.message.replace(
                          /\(cherry picked from commit ([0-9a-f]+)\)/g,
                          (_, sha) => {
                            cherryPickedFrom.push(sha);
                            return _;
                          },
                        );
                        return {
                          git_repository_id: repo.id,
                          commit_sha: entry.hash,
                          message: commit.body.message,
                          parents: commit.body.parents,
                          cherry_picked_from: cherryPickedFrom.length
                            ? cherryPickedFrom
                            : null,
                        };
                      } else {
                        return null;
                      }
                    })
                    .filter(<T>(v: T): v is Exclude<T, null> => v !== null);
                  tables
                    .git_commits(db)
                    .insertOrIgnore(...commits)
                    .then(
                      () => cb(),
                      (err) => cb(err),
                    );
                },
              }),
            )
            .on(`error`, reject)
            .on(`finish`, () => resolve());
        });
      }

      logger.info(`git_update_refs`, `Git update refs ${repoURL.href}`);
      try {
        repo = await db.tx(async (db) => {
          await tables
            .git_refs(db)
            .insertOrUpdate(
              [`git_repository_id`, `kind`, `name`],
              ...refsToUpsert,
            );
          const groupsToDelete = groupByKey(refsToDelete, (r) => r.kind);
          for (const [kind, refs] of groupsToDelete) {
            await tables.git_refs(db).delete({
              git_repository_id: repo.id,
              kind,
              name: q.anyOf(refs.map((r) => r.name)),
            });
          }
          const updated = await tables
            .git_repositories(db)
            .update(
              {id: repo.id, local_git_version: repo.local_git_version},
              {local_git_version: repo.remote_git_version},
            );
          if (updated.length !== 1) {
            throw CONFLICTING_UPDATES_ERROR;
          }
          return updated[0];
        });
      } catch (ex) {
        if (ex !== CONFLICTING_UPDATES_ERROR) {
          throw ex;
        }
        repo = notNull(await tables.git_repositories(db).findOne({id: repoID}));
      }
    }
  });
}

export async function fetchTree(
  repo: DbGitRepository,
  commitSha: string,
  logger: Logger,
): Promise<
  {
    path: string;
    getContents: () => Promise<string>;
  }[]
> {
  const http = await getHttpHandler(repo);
  const repoURL = new URL(`https://github.com/${repo.owner}/${repo.name}.git`);

  logger.info(`git_init`, `Git init request ${repoURL.href}`);
  const {capabilities: serverCapabilities} = await git.initialRequest(repoURL, {
    http,
    agent: 'rollingversions.com',
  });

  logger.info(`git_fetch_objects`, `Git fetch request ${repoURL.href}`);
  const objects = await git.fetchObjects(
    repoURL,
    {want: [commitSha], filter: [git.blobNone()], deepen: 1},
    {http, agent: 'rollingversions.com', serverCapabilities},
  );

  const trees = new Map<string, gitObj.TreeBody>();
  let rootCommit: gitObj.CommitBody | undefined;
  await new Promise<void>((resolve, reject) => {
    objects
      .on(`error`, reject)
      .pipe(
        new Writable({
          objectMode: true,
          write(entry: git.FetchResponseEntryObject, _encoding, cb) {
            if (gitObj.objectIsCommit(entry.body)) {
              if (entry.hash === commitSha) {
                rootCommit = gitObj.decodeObject(entry.body).body;
              }
            } else if (gitObj.objectIsTree(entry.body)) {
              trees.set(entry.hash, gitObj.decodeObject(entry.body).body);
            }
            cb();
          },
        }),
      )
      .on(`error`, reject)
      .on(`finish`, () => resolve());
  });
  if (!rootCommit) {
    throw new Error(`Could not find commit ${commitSha}`);
  }

  const getObject = batch<string, git.FetchResponseEntryObject>(
    async (want) => {
      const fetchResponse = await git.fetchObjects(
        repoURL,
        {want: [...new Set(want)]},
        {
          http,
          agent: 'rollingversions.com',
          serverCapabilities,
        },
      );

      const entries = new Map<string, git.FetchResponseEntryObject>();
      await new Promise<void>((resolve, reject) => {
        fetchResponse
          .on(`error`, reject)
          .pipe(
            new Writable({
              objectMode: true,
              write(entry: git.FetchResponseEntryObject, _encoding, cb) {
                entries.set(entry.hash, entry);
                cb();
              },
            }),
          )
          .on(`error`, reject)
          .on(`finish`, () => resolve());
      });
      return entries;
    },
  );

  const files: {
    path: string;
    getContents: () => Promise<string>;
  }[] = [];
  const walkTree = (hash: string, parentPath: string) => {
    const tree = trees.get(hash);
    if (!tree) {
      throw new Error(`Could not find tree ${hash}`);
    }
    for (const [name, {mode, hash}] of Object.entries(tree)) {
      const path = parentPath + name;

      if (mode === gitObj.Mode.tree) {
        walkTree(hash, path + '/');
      } else if (mode === gitObj.Mode.file) {
        files.push({
          path,
          getContents: async () => {
            const entry = await getObject(hash);
            if (!entry) {
              throw new Error(`Unable to find object ${hash} at ${path}`);
            }
            if (!gitObj.objectIsBlob(entry.body)) {
              throw new Error(
                `Object ${hash} at ${path} is not a blob, but we expected a blob`,
              );
            }
            const obj = gitObj.decodeObject(entry.body);
            return Buffer.from(obj.body).toString(`utf8`);
          },
        });
      }
    }
  };
  walkTree(rootCommit.tree, ``);

  return files;
}

async function getCommitByRef(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  kind: 'heads' | 'tags' | 'pull',
  name: string,
  logger: Logger,
): Promise<DbGitCommit | null> {
  await updateRepoIfChanged(db, client, repo.id, logger);

  const ref = await tables.git_refs(db).findOne({
    git_repository_id: repo.id,
    kind,
    name,
  });
  if (!ref) return null;

  const commit = await tables.git_commits(db).findOne({
    git_repository_id: repo.id,
    commit_sha: ref.commit_sha,
  });
  return commit;
}

export async function getCommitBySha(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  commitSha: string,
  logger: Logger,
) {
  await updateRepoIfChanged(db, client, repo.id, logger);

  const commit = await tables.git_commits(db).findOne({
    git_repository_id: repo.id,
    commit_sha: commitSha,
  });
  return commit;
}

export async function getTagHeadCommit(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  tagName: string,
  logger: Logger,
) {
  return await getCommitByRef(db, client, repo, `tags`, tagName, logger);
}
export async function getBranchHeadCommit(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  branchName: string,
  logger: Logger,
) {
  return await getCommitByRef(db, client, repo, `heads`, branchName, logger);
}
export async function getPullRequestHeadCommit(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pullRequest: DbPullRequest,
  logger: Logger,
) {
  return await getCommitByRef(
    db,
    client,
    repo,
    `pull`,
    `${pullRequest.pr_number}/head`,
    logger,
  );
}

function selectRecursiveUnion(q: {
  name: SQLQuery;
  fields: SQLQuery;
  from: SQLQuery;
  where: SQLQuery;
  whereHead: SQLQuery;
  whereJoin: SQLQuery;
}) {
  return sql`
    ${q.name} AS (
      SELECT ${q.fields}
      FROM ${q.from}
      WHERE ${q.where} AND ${q.whereHead}
      UNION
      SELECT ${q.fields}
      FROM ${q.from}
      INNER JOIN ${q.name} ON (${q.where} AND ${q.whereJoin})
    )
  `;
}
const anyValue = (value: Set<string>) =>
  value.size === 1 ? sql`${[...value][0]}` : sql`ANY(${[...value]})`;
function withCherryPickedCommits(q: {
  name: SQLQuery;
  fields: SQLQuery;
  nameWithoutCherryPicked: SQLQuery;
}) {
  return sql`
    ${q.name} AS (
      SELECT ${q.fields} FROM ${q.nameWithoutCherryPicked} c
      UNION
      SELECT ${q.fields} FROM git_commits c
      INNER JOIN ${q.nameWithoutCherryPicked} d
      ON (
        (c.cherry_picked_from IS NOT NULL AND d.commit_sha = ANY(c.cherry_picked_from)) OR
        (d.cherry_picked_from IS NOT NULL AND c.commit_sha = ANY(d.cherry_picked_from))
      )
    )
  `;
}
function selectCommits({
  repositoryID,
  includedCommits,
  excludedCommits,
}: {
  repositoryID: DbGitRepository['id'];
  includedCommits: Set<string>;
  excludedCommits: Set<string>;
}) {
  const queries = [];
  if (excludedCommits.size) {
    queries.push(
      selectRecursiveUnion({
        name: sql`excluded_commits_direct`,
        fields: sql`c.commit_sha, c.parents, c.cherry_picked_from`,
        from: sql`git_commits c`,
        where: sql`c.git_repository_id = ${repositoryID}`,
        whereHead: sql`c.commit_sha = ${anyValue(excludedCommits)}`,
        whereJoin: sql`c.commit_sha = ANY(excluded_commits_direct.parents)`,
      }),
    );
    queries.push(
      withCherryPickedCommits({
        name: sql`excluded_commits`,
        fields: sql`c.commit_sha`,
        nameWithoutCherryPicked: sql`excluded_commits_direct`,
      }),
    );
  }
  queries.push(
    selectRecursiveUnion({
      name: sql`commits_direct`,
      fields: sql`c.*`,
      from: sql`git_commits c`,
      where: excludedCommits.size
        ? sql`c.git_repository_id = ${repositoryID} AND c.commit_sha NOT IN (SELECT commit_sha FROM excluded_commits)`
        : sql`c.git_repository_id = ${repositoryID}`,
      whereHead: sql`c.commit_sha = ${anyValue(includedCommits)}`,
      whereJoin: sql`c.commit_sha = ANY(commits_direct.parents)`,
    }),
  );
  queries.push(
    withCherryPickedCommits({
      name: sql`commits`,
      fields: sql`c.*`,
      nameWithoutCherryPicked: sql`commits_direct`,
    }),
  );
  return sql`
    WITH RECURSIVE ${sql.join(queries, `, `)}`;
}

export async function getAllBranches(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  logger: Logger,
): Promise<DbGitRef[]> {
  await updateRepoIfChanged(db, client, repo.id, logger);

  const refs = await tables
    .git_refs(db)
    .find({
      git_repository_id: repo.id,
      kind: 'heads',
    })
    .orderByAsc(`name`)
    .all();
  return refs;
}
export async function getAllTags(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  logger: Logger,
): Promise<DbGitRef[]> {
  await updateRepoIfChanged(db, client, repo.id, logger);

  const refs = await tables
    .git_refs(db)
    .find({
      git_repository_id: repo.id,
      kind: 'tags',
    })
    .orderByAsc(`name`)
    .all();
  return refs;
}

export async function getAllTagsOnBranch(
  db: Queryable,
  headCommit: DbGitCommit,
): Promise<DbGitRef[]> {
  return await db.query(sql`
    ${selectCommits({
      repositoryID: headCommit.git_repository_id,
      includedCommits: new Set([headCommit.commit_sha]),
      excludedCommits: new Set(),
    })}
    SELECT r.*
    FROM git_refs AS r
    INNER JOIN commits AS c ON (r.commit_sha = c.commit_sha)
    WHERE r.git_repository_id = ${headCommit.git_repository_id}
  `);
}

export async function getUnreleasedChanges(
  db: Queryable,
  repo: DbGitRepository,
  {
    packageName,
    headCommitSha,
    releasedCommits,
  }: {
    packageName: string;
    headCommitSha: string;
    releasedCommits: Set<string>;
  },
): Promise<(DbChangeLogEntry & {pr_number: DbPullRequest['pr_number']})[]> {
  return await db.query(sql`
    ${selectCommits({
      repositoryID: repo.id,
      includedCommits: new Set([headCommitSha]),
      excludedCommits: releasedCommits,
    })}
    SELECT DISTINCT ON (change.id) change.*, pr.pr_number
    FROM change_log_entries AS change
    INNER JOIN pull_requests AS pr ON (
      pr.git_repository_id = ${repo.id} AND pr.id = change.pull_request_id
    )
    LEFT OUTER JOIN git_refs AS ref ON (
      ref.git_repository_id = ${repo.id} AND ref.pr_number = pr.pr_number
    )
    INNER JOIN commits AS c ON (
      pr.merge_commit_sha = c.commit_sha OR
      ref.commit_sha = c.commit_sha
    )
    WHERE change.package_name = ${packageName}
    ORDER BY change.id ASC
  `);
}

export async function isCommitReleased(
  db: Queryable,
  repo: DbGitRepository,
  {
    commitShaToCheck,
    releasedCommits,
  }: {
    commitShaToCheck: string;
    releasedCommits: Set<string>;
  },
): Promise<boolean> {
  const [{result}] = await db.query(sql`
    ${selectCommits({
      repositoryID: repo.id,
      includedCommits: releasedCommits,
      excludedCommits: new Set(),
    })}
    SELECT COUNT(*) as result
    FROM  commits AS c
    WHERE c.commit_sha = ${commitShaToCheck}
  `);
  return parseInt(`${result}`, 10) === 1;
}
import * as t from 'funtypes';

// TODO: use an enum
type Permission = 'none' | 'view' | 'edit';

export default Permission;

export const PermissionCodec = t.Union(
  t.Literal('none'),
  t.Literal('view'),
  t.Literal('edit'),
);
import {PullRequest, Repository} from '@rollingversions/types';

import withCache from '../../utils/withCache';
import {getClientForToken, getClientForRepo} from '../getClient';
import type {Logger} from '../logger';
import * as gh from '../services/github';
import Permission from './Permission';

export type {Permission};

/**
 * Check the viewer's permissions on a repository. This only considers
 * permissions from collaborators, so it can return "none" even if
 * the repository is public.
 */
const checkViewerPermissions = withCache(
  async (
    userAuth: string,
    repo: Repository,
    logger: Logger,
  ): Promise<{result: Permission; expiry: number}> => {
    try {
      // We create our own client in this function to prevent it being
      // batched with any other request. This is because getRepositoryViewerPermissions
      // can throw an error even if the repository is public.
      const client = getClientForToken(userAuth);
      const viewerPermission = await gh
        .getRepositoryViewerPermissions(client, repo)
        .catch((ex) => {
          logger.warning(
            'failed_to_get_repository_viewer_permissions',
            ex.stack,
            {repo_owner: repo.owner, repo_name: repo.name},
          );
          return null;
        });

      // see: https://developer.github.com/v4/enum/repositorypermission/
      if (
        viewerPermission === 'ADMIN' ||
        viewerPermission === 'MAINTAIN' ||
        viewerPermission === 'TRIAGE' ||
        viewerPermission === 'WRITE'
      ) {
        return {result: 'edit', expiry: Date.now() + 60_000};
      }
      if (viewerPermission === 'READ') {
        return {result: 'view', expiry: Date.now() + 60_000};
      }
      return {result: 'none', expiry: Date.now() + 60_000};
    } catch (ex) {
      logger.warning('failed_to_get_repository_viewer_permissions', ex.stack, {
        repo_owner: repo.owner,
        repo_name: repo.name,
      });
      return {result: 'none', expiry: 5_000};
    }
  },
  (userAuth: string, repo: Repository) =>
    `${userAuth}/${repo.owner}/${repo.name}`,
);

export const getViewer = withCache(
  async (userAuth: string) => ({
    result: await gh.getViewer(getClientForToken(userAuth)),
    expiry: Date.now() + 60 * 60_000,
  }),
  (userAuth) => userAuth,
);

const getRepositoryIsPublic = withCache(
  async (repo: Repository, logger: Logger) => {
    try {
      const client = await getClientForRepo(repo);
      return {
        result: await gh.getRepositoryIsPublic(client, repo),
        expiry: Date.now() + 60_000,
      };
    } catch (ex) {
      logger.warning('failed_to_get_repo', ex.stack, {
        repo_owner: repo.owner,
        repo_name: repo.name,
      });
      return {
        result: false,
        expiry: 0,
      };
    }
  },
  (repo) => `${repo.owner}/${repo.name}`,
);

const getPullRequestAuthor = withCache(
  async (pr: PullRequest, logger: Logger) => {
    try {
      const client = await getClientForRepo(pr.repo);
      const author = await gh.getPullRequestAuthor(client, pr);

      return {
        result: author,
        expiry: author ? Date.now() + 60 * 60_000 : 0,
      };
    } catch (ex) {
      logger.warning('failed_to_get_pull_request', ex.stack, {
        repo_owner: pr.repo.owner,
        repo_name: pr.repo.name,
        pull_number: pr.number,
      });
      return {
        result: null,
        expiry: 0,
      };
    }
  },
  (pr) => `${pr.repo.owner}/${pr.repo.name}/${pr.number}`,
);

export default async function getPermissionLevel(
  pr: PullRequest,
  userAuth: string,
  logger: Logger,
): Promise<{
  permission: Permission;
  login: string;
  reason?: string;
}> {
  const viewerPromise = getViewer(userAuth);
  const [
    {login, __typename: viewerTypeName},
    viewerPermission,
    isPublic,
    author,
    pullRequestStatus,
  ] = await Promise.all([
    viewerPromise,
    checkViewerPermissions(userAuth, pr.repo, logger),
    getRepositoryIsPublic(pr.repo, logger),
    getPullRequestAuthor(pr, logger),
    getClientForRepo(pr.repo)
      .then((repoClient) => gh.getPullRequestStatus(repoClient, pr))
      .catch(async (ex) => {
        const {login} = await viewerPromise;
        logger.warning('failed_to_get_pull_request', ex.stack, {
          repo_owner: pr.repo.owner,
          repo_name: pr.repo.name,
          pull_number: pr.number,
          login,
        });
        return null;
      }),
  ] as const);

  if (!pullRequestStatus) {
    return {permission: 'none', login};
  }

  const viewerIsAuthor =
    login === author?.login && viewerTypeName === author.__typename;
  const isPrOpen = !(pullRequestStatus.closed || pullRequestStatus.merged);

  if (viewerPermission === 'edit') {
    return {permission: 'edit', login};
  }

  if (isPublic || viewerPermission === 'view') {
    if (viewerIsAuthor && isPrOpen) {
      return {permission: 'edit', login};
    }
    return {permission: 'view', login};
  }

  return {permission: 'none', login};
}

export async function getRepoPermissionLevel(
  repo: Repository,
  userAuth: string,
  logger: Logger,
): Promise<{
  permission: Permission;
  login: string;
  reason?: string;
}> {
  const [{login}, viewerPermission, isPublic] = await Promise.all([
    getViewer(userAuth),
    checkViewerPermissions(userAuth, repo, logger),
    getRepositoryIsPublic(repo, logger),
  ] as const);

  if (viewerPermission === 'edit') {
    return {permission: 'edit', login};
  }

  if (isPublic || viewerPermission === 'view') {
    return {permission: 'view', login};
  }

  return {permission: 'none', login};
}
/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import {getMethod, gql} from '@github-graph/api';

/**
 * An ISO-8601 encoded date string
 */
export type Date = string;
/**
 * An ISO-8601 encoded UTC date string
 */
export type DateTime = string;
/**
 * A Git object ID
 */
export type GitObjectID = string;
/**
 * A fully qualified reference name (e.g. "refs/heads/master")
 */
export type GitRefname = string;
/**
 * Git SSH string
 */
export type GitSSHRemote = string;
/**
 * An ISO-8601 encoded date string. Unlike the DateTime type, GitTimestamp is not converted in UTC.
 */
export type GitTimestamp = string;
/**
 * A string containing HTML code.
 */
export type HTML = string;
/**
 * An ISO-8601 encoded UTC date string with millisecond precison.
 */
export type PreciseDateTime = string;
/**
 * An RFC 3986, RFC 3987, and RFC 6570 (level 4) compliant URI string.
 */
export type URI = string;
/**
 * A valid x509 certificate string
 */
export type X509Certificate = string;

//==============================================================
// START Enums and Input Objects
//==============================================================

/**
 * The access level to a repository
 */
export enum RepositoryPermission {
  ADMIN = 'ADMIN',
  MAINTAIN = 'MAINTAIN',
  READ = 'READ',
  TRIAGE = 'TRIAGE',
  WRITE = 'WRITE',
}

//==============================================================
// END Enums and Input Objects
//==============================================================

// ====================================================
// GraphQL query operation: GetTags
// ====================================================

export interface GetTags_repository_refs_pageInfo {
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating forwards, the cursor to continue.
   */
  endCursor: string | null;
}

export interface GetTags_repository_refs_nodes_target {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetTags_repository_refs_nodes {
  /**
   * The ref name.
   */
  name: string;
  /**
   * The object the ref points to.
   */
  target: GetTags_repository_refs_nodes_target;
}

export interface GetTags_repository_refs {
  /**
   * Information to aid in pagination.
   */
  pageInfo: GetTags_repository_refs_pageInfo;
  /**
   * A list of nodes.
   */
  nodes: (GetTags_repository_refs_nodes | null)[] | null;
}

export interface GetTags_repository {
  /**
   * Fetch a list of refs from the repository
   */
  refs: GetTags_repository_refs | null;
}

export interface GetTags {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetTags_repository | null;
}

export interface GetTagsVariables {
  owner: string;
  name: string;
  after?: string | null;
}

export const getTags = getMethod<GetTags, GetTagsVariables>(gql`
  query GetTags($owner: String!, $name: String!, $after: String) {
    repository(owner: $owner, name: $name) {
      refs(first: 100, after: $after, refPrefix: "refs/tags/") {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          name
          target {
            oid
          }
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetRepository
// ====================================================

export interface GetRepository_repository_defaultBranchRef {
  /**
   * The ref name.
   */
  name: string;
}

export interface GetRepository_repository {
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
  id: string;
  /**
   * Identifies if the repository is private.
   */
  isPrivate: boolean;
  /**
   * The Ref associated with the repository's default branch.
   */
  defaultBranchRef: GetRepository_repository_defaultBranchRef | null;
}

export interface GetRepository {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetRepository_repository | null;
}

export interface GetRepositoryVariables {
  owner: string;
  name: string;
}

export const getRepository = getMethod<
  GetRepository,
  GetRepositoryVariables
>(gql`
  query GetRepository($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      databaseId
      id
      isPrivate
      defaultBranchRef {
        name
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetRepositoryPullRequests
// ====================================================

export interface GetRepositoryPullRequests_repository_pullRequests_pageInfo {
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating forwards, the cursor to continue.
   */
  endCursor: string | null;
}

export interface GetRepositoryPullRequests_repository_pullRequests_nodes {
  id: string;
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
}

export interface GetRepositoryPullRequests_repository_pullRequests {
  /**
   * Information to aid in pagination.
   */
  pageInfo: GetRepositoryPullRequests_repository_pullRequests_pageInfo;
  /**
   * A list of nodes.
   */
  nodes:
    | (GetRepositoryPullRequests_repository_pullRequests_nodes | null)[]
    | null;
}

export interface GetRepositoryPullRequests_repository {
  /**
   * A list of pull requests that have been opened in the repository.
   */
  pullRequests: GetRepositoryPullRequests_repository_pullRequests;
}

export interface GetRepositoryPullRequests {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetRepositoryPullRequests_repository | null;
}

export interface GetRepositoryPullRequestsVariables {
  owner: string;
  name: string;
  after?: string | null;
}

export const getRepositoryPullRequests = getMethod<
  GetRepositoryPullRequests,
  GetRepositoryPullRequestsVariables
>(gql`
  query GetRepositoryPullRequests(
    $owner: String!
    $name: String!
    $after: String
  ) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: 100, after: $after, states: [CLOSED, MERGED, OPEN]) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          databaseId
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetDefaultBranch
// ====================================================

export interface GetDefaultBranch_repository_branch_target {
  __typename: 'Commit' | 'Tree' | 'Blob' | 'Tag';
  id: string;
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetDefaultBranch_repository_branch {
  id: string;
  /**
   * The ref name.
   */
  name: string;
  /**
   * The object the ref points to.
   */
  target: GetDefaultBranch_repository_branch_target;
}

export interface GetDefaultBranch_repository {
  /**
   * The Ref associated with the repository's default branch.
   */
  branch: GetDefaultBranch_repository_branch | null;
}

export interface GetDefaultBranch {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetDefaultBranch_repository | null;
}

export interface GetDefaultBranchVariables {
  owner: string;
  name: string;
}

export const getDefaultBranch = getMethod<
  GetDefaultBranch,
  GetDefaultBranchVariables
>(gql`
  query GetDefaultBranch($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      branch: defaultBranchRef {
        id
        name
        target {
          __typename
          id
          oid
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetAllDefaultBranchCommits
// ====================================================

export interface GetAllDefaultBranchCommits_repository_branch_target_Tree {
  __typename: 'Tree' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history_pageInfo {
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating forwards, the cursor to continue.
   */
  endCursor: string | null;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_parents_nodes {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_parents {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_parents_nodes | null)[]
    | null;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_associatedPullRequests_nodes_repository {
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_associatedPullRequests_nodes {
  id: string;
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
  /**
   * The repository associated with this node.
   */
  repository: GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_associatedPullRequests_nodes_repository;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_associatedPullRequests {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_associatedPullRequests_nodes | null)[]
    | null;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes {
  id: string;
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * The parents of a commit.
   */
  parents: GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_parents;
  /**
   * The pull requests associated with a commit
   */
  associatedPullRequests: GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_associatedPullRequests | null;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history {
  /**
   * Information to aid in pagination.
   */
  pageInfo: GetAllDefaultBranchCommits_repository_branch_target_Commit_history_pageInfo;
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes | null)[]
    | null;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit {
  __typename: 'Commit';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  id: string;
  /**
   * The linear commit history starting from (and including) this commit, in the same order as `git log`.
   */
  history: GetAllDefaultBranchCommits_repository_branch_target_Commit_history;
}

export type GetAllDefaultBranchCommits_repository_branch_target =
  | GetAllDefaultBranchCommits_repository_branch_target_Tree
  | GetAllDefaultBranchCommits_repository_branch_target_Commit;

export interface GetAllDefaultBranchCommits_repository_branch {
  /**
   * The object the ref points to.
   */
  target: GetAllDefaultBranchCommits_repository_branch_target;
}

export interface GetAllDefaultBranchCommits_repository {
  /**
   * The Ref associated with the repository's default branch.
   */
  branch: GetAllDefaultBranchCommits_repository_branch | null;
}

export interface GetAllDefaultBranchCommits {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetAllDefaultBranchCommits_repository | null;
}

export interface GetAllDefaultBranchCommitsVariables {
  owner: string;
  name: string;
  pageSize: number;
  after?: string | null;
}

export const getAllDefaultBranchCommits = getMethod<
  GetAllDefaultBranchCommits,
  GetAllDefaultBranchCommitsVariables
>(gql`
  query GetAllDefaultBranchCommits(
    $owner: String!
    $name: String!
    $pageSize: Int!
    $after: String
  ) {
    repository(owner: $owner, name: $name) {
      branch: defaultBranchRef {
        target {
          __typename
          oid
          ... on Commit {
            id
            history(first: $pageSize, after: $after) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                ...CommitDetail
              }
            }
          }
        }
      }
    }
  }
  fragment CommitDetail on Commit {
    id
    oid
    parents(first: 100) {
      nodes {
        oid
      }
    }
    associatedPullRequests(first: 100) {
      nodes {
        id
        databaseId
        repository {
          databaseId
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetRef
// ====================================================

export interface GetRef_repository_ref_target_Tree {
  __typename: 'Tree' | 'Blob';
}

export interface GetRef_repository_ref_target_Commit {
  __typename: 'Commit';
  id: string;
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetRef_repository_ref_target_Tag_target_Tree {
  __typename: 'Tree' | 'Blob' | 'Tag';
}

export interface GetRef_repository_ref_target_Tag_target_Commit {
  __typename: 'Commit';
  id: string;
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export type GetRef_repository_ref_target_Tag_target =
  | GetRef_repository_ref_target_Tag_target_Tree
  | GetRef_repository_ref_target_Tag_target_Commit;

export interface GetRef_repository_ref_target_Tag {
  __typename: 'Tag';
  /**
   * The Git object the tag points to.
   */
  target: GetRef_repository_ref_target_Tag_target;
}

export type GetRef_repository_ref_target =
  | GetRef_repository_ref_target_Tree
  | GetRef_repository_ref_target_Commit
  | GetRef_repository_ref_target_Tag;

export interface GetRef_repository_ref {
  id: string;
  /**
   * The ref name.
   */
  name: string;
  /**
   * The object the ref points to.
   */
  target: GetRef_repository_ref_target;
}

export interface GetRef_repository {
  /**
   * Fetch a given ref from the repository
   */
  ref: GetRef_repository_ref | null;
}

export interface GetRef {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetRef_repository | null;
}

export interface GetRefVariables {
  owner: string;
  name: string;
  qualifiedName: string;
}

export const getRef = getMethod<GetRef, GetRefVariables>(gql`
  query GetRef($owner: String!, $name: String!, $qualifiedName: String!) {
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $qualifiedName) {
        id
        name
        target {
          __typename
          ... on Commit {
            id
            oid
          }
          ... on Tag {
            target {
              __typename
              ... on Commit {
                id
                oid
              }
            }
          }
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetAllRefCommits
// ====================================================

export interface GetAllRefCommits_repository_ref_target_Tree {
  __typename: 'Tree' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history_pageInfo {
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating forwards, the cursor to continue.
   */
  endCursor: string | null;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history_nodes_parents_nodes {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history_nodes_parents {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllRefCommits_repository_ref_target_Commit_history_nodes_parents_nodes | null)[]
    | null;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history_nodes_associatedPullRequests_nodes_repository {
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history_nodes_associatedPullRequests_nodes {
  id: string;
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
  /**
   * The repository associated with this node.
   */
  repository: GetAllRefCommits_repository_ref_target_Commit_history_nodes_associatedPullRequests_nodes_repository;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history_nodes_associatedPullRequests {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllRefCommits_repository_ref_target_Commit_history_nodes_associatedPullRequests_nodes | null)[]
    | null;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history_nodes {
  id: string;
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * The parents of a commit.
   */
  parents: GetAllRefCommits_repository_ref_target_Commit_history_nodes_parents;
  /**
   * The pull requests associated with a commit
   */
  associatedPullRequests: GetAllRefCommits_repository_ref_target_Commit_history_nodes_associatedPullRequests | null;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history {
  /**
   * Information to aid in pagination.
   */
  pageInfo: GetAllRefCommits_repository_ref_target_Commit_history_pageInfo;
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllRefCommits_repository_ref_target_Commit_history_nodes | null)[]
    | null;
}

export interface GetAllRefCommits_repository_ref_target_Commit {
  __typename: 'Commit';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  id: string;
  /**
   * The linear commit history starting from (and including) this commit, in the same order as `git log`.
   */
  history: GetAllRefCommits_repository_ref_target_Commit_history;
}

export type GetAllRefCommits_repository_ref_target =
  | GetAllRefCommits_repository_ref_target_Tree
  | GetAllRefCommits_repository_ref_target_Commit;

export interface GetAllRefCommits_repository_ref {
  /**
   * The object the ref points to.
   */
  target: GetAllRefCommits_repository_ref_target;
}

export interface GetAllRefCommits_repository {
  /**
   * Fetch a given ref from the repository
   */
  ref: GetAllRefCommits_repository_ref | null;
}

export interface GetAllRefCommits {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetAllRefCommits_repository | null;
}

export interface GetAllRefCommitsVariables {
  owner: string;
  name: string;
  qualifiedName: string;
  pageSize: number;
  after?: string | null;
}

export const getAllRefCommits = getMethod<
  GetAllRefCommits,
  GetAllRefCommitsVariables
>(gql`
  query GetAllRefCommits(
    $owner: String!
    $name: String!
    $qualifiedName: String!
    $pageSize: Int!
    $after: String
  ) {
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $qualifiedName) {
        target {
          __typename
          oid
          ... on Commit {
            id
            history(first: $pageSize, after: $after) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                ...CommitDetail
              }
            }
          }
        }
      }
    }
  }
  fragment CommitDetail on Commit {
    id
    oid
    parents(first: 100) {
      nodes {
        oid
      }
    }
    associatedPullRequests(first: 100) {
      nodes {
        id
        databaseId
        repository {
          databaseId
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetAllCommitHistory
// ====================================================

export interface GetAllCommitHistory_node_CodeOfConduct {
  __typename:
    | 'CodeOfConduct'
    | 'Enterprise'
    | 'EnterpriseUserAccount'
    | 'Organization'
    | 'RegistryPackage'
    | 'RegistryPackageVersion'
    | 'RegistryPackageDependency'
    | 'RegistryPackageFile'
    | 'Release'
    | 'User'
    | 'Project'
    | 'ProjectColumn'
    | 'ProjectCard'
    | 'Issue'
    | 'UserContentEdit'
    | 'Label'
    | 'PullRequest'
    | 'Reaction'
    | 'Repository'
    | 'License'
    | 'BranchProtectionRule'
    | 'Ref'
    | 'PushAllowance'
    | 'App'
    | 'Team'
    | 'UserStatus'
    | 'TeamDiscussion'
    | 'TeamDiscussionComment'
    | 'OrganizationInvitation'
    | 'ReviewDismissalAllowance'
    | 'CommitComment'
    | 'Deployment'
    | 'DeploymentStatus'
    | 'Status'
    | 'StatusContext'
    | 'StatusCheckRollup'
    | 'Tree'
    | 'DeployKey'
    | 'Language'
    | 'Milestone'
    | 'RepositoryTopic'
    | 'Topic'
    | 'RepositoryVulnerabilityAlert'
    | 'SecurityAdvisory'
    | 'IssueComment'
    | 'PullRequestCommit'
    | 'ReviewRequest'
    | 'Mannequin'
    | 'PullRequestReviewThread'
    | 'PullRequestReviewComment'
    | 'PullRequestReview'
    | 'AssignedEvent'
    | 'Bot'
    | 'BaseRefForcePushedEvent'
    | 'ClosedEvent'
    | 'CommitCommentThread'
    | 'CrossReferencedEvent'
    | 'DemilestonedEvent'
    | 'DeployedEvent'
    | 'DeploymentEnvironmentChangedEvent'
    | 'HeadRefDeletedEvent'
    | 'HeadRefForcePushedEvent'
    | 'HeadRefRestoredEvent'
    | 'LabeledEvent'
    | 'LockedEvent'
    | 'MergedEvent'
    | 'MilestonedEvent'
    | 'ReferencedEvent'
    | 'RenamedTitleEvent'
    | 'ReopenedEvent'
    | 'ReviewDismissedEvent'
    | 'ReviewRequestRemovedEvent'
    | 'ReviewRequestedEvent'
    | 'SubscribedEvent'
    | 'UnassignedEvent'
    | 'UnlabeledEvent'
    | 'UnlockedEvent'
    | 'UnsubscribedEvent'
    | 'UserBlockedEvent'
    | 'AddedToProjectEvent'
    | 'BaseRefChangedEvent'
    | 'CommentDeletedEvent'
    | 'ConnectedEvent'
    | 'ConvertedNoteToIssueEvent'
    | 'DisconnectedEvent'
    | 'MarkedAsDuplicateEvent'
    | 'MentionedEvent'
    | 'MovedColumnsInProjectEvent'
    | 'PinnedEvent'
    | 'PullRequestCommitCommentThread'
    | 'ReadyForReviewEvent'
    | 'RemovedFromProjectEvent'
    | 'TransferredEvent'
    | 'UnmarkedAsDuplicateEvent'
    | 'UnpinnedEvent'
    | 'Gist'
    | 'GistComment'
    | 'SponsorsListing'
    | 'SponsorsTier'
    | 'Sponsorship'
    | 'PublicKey'
    | 'SavedReply'
    | 'ReleaseAsset'
    | 'RegistryPackageTag'
    | 'MembersCanDeleteReposClearAuditEntry'
    | 'MembersCanDeleteReposDisableAuditEntry'
    | 'MembersCanDeleteReposEnableAuditEntry'
    | 'OauthApplicationCreateAuditEntry'
    | 'OrgAddBillingManagerAuditEntry'
    | 'OrgAddMemberAuditEntry'
    | 'OrgBlockUserAuditEntry'
    | 'OrgConfigDisableCollaboratorsOnlyAuditEntry'
    | 'OrgConfigEnableCollaboratorsOnlyAuditEntry'
    | 'OrgCreateAuditEntry'
    | 'OrgDisableOauthAppRestrictionsAuditEntry'
    | 'OrgDisableSamlAuditEntry'
    | 'OrgDisableTwoFactorRequirementAuditEntry'
    | 'OrgEnableOauthAppRestrictionsAuditEntry'
    | 'OrgEnableSamlAuditEntry'
    | 'OrgEnableTwoFactorRequirementAuditEntry'
    | 'OrgInviteMemberAuditEntry'
    | 'OrgInviteToBusinessAuditEntry'
    | 'OrgOauthAppAccessApprovedAuditEntry'
    | 'OrgOauthAppAccessDeniedAuditEntry'
    | 'OrgOauthAppAccessRequestedAuditEntry'
    | 'OrgRemoveBillingManagerAuditEntry'
    | 'OrgRemoveMemberAuditEntry'
    | 'OrgRemoveOutsideCollaboratorAuditEntry'
    | 'OrgRestoreMemberAuditEntry'
    | 'OrgUnblockUserAuditEntry'
    | 'OrgUpdateDefaultRepositoryPermissionAuditEntry'
    | 'OrgUpdateMemberAuditEntry'
    | 'OrgUpdateMemberRepositoryCreationPermissionAuditEntry'
    | 'OrgUpdateMemberRepositoryInvitationPermissionAuditEntry'
    | 'PrivateRepositoryForkingDisableAuditEntry'
    | 'PrivateRepositoryForkingEnableAuditEntry'
    | 'RepoAccessAuditEntry'
    | 'RepoAddMemberAuditEntry'
    | 'RepoAddTopicAuditEntry'
    | 'RepoArchivedAuditEntry'
    | 'RepoChangeMergeSettingAuditEntry'
    | 'RepoConfigDisableAnonymousGitAccessAuditEntry'
    | 'RepoConfigDisableCollaboratorsOnlyAuditEntry'
    | 'RepoConfigDisableContributorsOnlyAuditEntry'
    | 'RepoConfigDisableSockpuppetDisallowedAuditEntry'
    | 'RepoConfigEnableAnonymousGitAccessAuditEntry'
    | 'RepoConfigEnableCollaboratorsOnlyAuditEntry'
    | 'RepoConfigEnableContributorsOnlyAuditEntry'
    | 'RepoConfigEnableSockpuppetDisallowedAuditEntry'
    | 'RepoConfigLockAnonymousGitAccessAuditEntry'
    | 'RepoConfigUnlockAnonymousGitAccessAuditEntry'
    | 'RepoCreateAuditEntry'
    | 'RepoDestroyAuditEntry'
    | 'RepoRemoveMemberAuditEntry'
    | 'RepoRemoveTopicAuditEntry'
    | 'RepositoryVisibilityChangeDisableAuditEntry'
    | 'RepositoryVisibilityChangeEnableAuditEntry'
    | 'TeamAddMemberAuditEntry'
    | 'TeamAddRepositoryAuditEntry'
    | 'TeamChangeParentTeamAuditEntry'
    | 'TeamRemoveMemberAuditEntry'
    | 'TeamRemoveRepositoryAuditEntry'
    | 'OrganizationIdentityProvider'
    | 'ExternalIdentity'
    | 'EnterpriseServerInstallation'
    | 'EnterpriseServerUserAccount'
    | 'EnterpriseServerUserAccountEmail'
    | 'EnterpriseServerUserAccountsUpload'
    | 'IpAllowListEntry'
    | 'EnterpriseRepositoryInfo'
    | 'EnterpriseAdministratorInvitation'
    | 'EnterpriseIdentityProvider'
    | 'MarketplaceCategory'
    | 'MarketplaceListing'
    | 'Blob'
    | 'RepositoryInvitation'
    | 'Tag';
}

export interface GetAllCommitHistory_node_Commit_history_pageInfo {
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating forwards, the cursor to continue.
   */
  endCursor: string | null;
}

export interface GetAllCommitHistory_node_Commit_history_nodes_parents_nodes {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllCommitHistory_node_Commit_history_nodes_parents {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllCommitHistory_node_Commit_history_nodes_parents_nodes | null)[]
    | null;
}

export interface GetAllCommitHistory_node_Commit_history_nodes_associatedPullRequests_nodes_repository {
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
}

export interface GetAllCommitHistory_node_Commit_history_nodes_associatedPullRequests_nodes {
  id: string;
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
  /**
   * The repository associated with this node.
   */
  repository: GetAllCommitHistory_node_Commit_history_nodes_associatedPullRequests_nodes_repository;
}

export interface GetAllCommitHistory_node_Commit_history_nodes_associatedPullRequests {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllCommitHistory_node_Commit_history_nodes_associatedPullRequests_nodes | null)[]
    | null;
}

export interface GetAllCommitHistory_node_Commit_history_nodes {
  id: string;
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * The parents of a commit.
   */
  parents: GetAllCommitHistory_node_Commit_history_nodes_parents;
  /**
   * The pull requests associated with a commit
   */
  associatedPullRequests: GetAllCommitHistory_node_Commit_history_nodes_associatedPullRequests | null;
}

export interface GetAllCommitHistory_node_Commit_history {
  /**
   * Information to aid in pagination.
   */
  pageInfo: GetAllCommitHistory_node_Commit_history_pageInfo;
  /**
   * A list of nodes.
   */
  nodes: (GetAllCommitHistory_node_Commit_history_nodes | null)[] | null;
}

export interface GetAllCommitHistory_node_Commit {
  __typename: 'Commit';
  id: string;
  /**
   * The linear commit history starting from (and including) this commit, in the same order as `git log`.
   */
  history: GetAllCommitHistory_node_Commit_history;
}

export type GetAllCommitHistory_node =
  | GetAllCommitHistory_node_CodeOfConduct
  | GetAllCommitHistory_node_Commit;

export interface GetAllCommitHistory {
  /**
   * Fetches an object given its ID.
   */
  node: GetAllCommitHistory_node | null;
}

export interface GetAllCommitHistoryVariables {
  commitID: string;
  pageSize: number;
  after?: string | null;
}

export const getAllCommitHistory = getMethod<
  GetAllCommitHistory,
  GetAllCommitHistoryVariables
>(gql`
  query GetAllCommitHistory($commitID: ID!, $pageSize: Int!, $after: String) {
    node(id: $commitID) {
      __typename
      ... on Commit {
        id
        history(first: $pageSize, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            ...CommitDetail
          }
        }
      }
    }
  }
  fragment CommitDetail on Commit {
    id
    oid
    parents(first: 100) {
      nodes {
        oid
      }
    }
    associatedPullRequests(first: 100) {
      nodes {
        id
        databaseId
        repository {
          databaseId
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetPullRequestFromGraphID
// ====================================================

export interface GetPullRequestFromGraphID_node_CodeOfConduct {
  __typename:
    | 'CodeOfConduct'
    | 'Enterprise'
    | 'EnterpriseUserAccount'
    | 'Organization'
    | 'RegistryPackage'
    | 'RegistryPackageVersion'
    | 'RegistryPackageDependency'
    | 'RegistryPackageFile'
    | 'Release'
    | 'User'
    | 'Project'
    | 'ProjectColumn'
    | 'ProjectCard'
    | 'Issue'
    | 'UserContentEdit'
    | 'Label'
    | 'Reaction'
    | 'Repository'
    | 'License'
    | 'BranchProtectionRule'
    | 'Ref'
    | 'PushAllowance'
    | 'App'
    | 'Team'
    | 'UserStatus'
    | 'TeamDiscussion'
    | 'TeamDiscussionComment'
    | 'OrganizationInvitation'
    | 'ReviewDismissalAllowance'
    | 'CommitComment'
    | 'Commit'
    | 'Deployment'
    | 'DeploymentStatus'
    | 'Status'
    | 'StatusContext'
    | 'StatusCheckRollup'
    | 'Tree'
    | 'DeployKey'
    | 'Language'
    | 'Milestone'
    | 'RepositoryTopic'
    | 'Topic'
    | 'RepositoryVulnerabilityAlert'
    | 'SecurityAdvisory'
    | 'IssueComment'
    | 'PullRequestCommit'
    | 'ReviewRequest'
    | 'Mannequin'
    | 'PullRequestReviewThread'
    | 'PullRequestReviewComment'
    | 'PullRequestReview'
    | 'AssignedEvent'
    | 'Bot'
    | 'BaseRefForcePushedEvent'
    | 'ClosedEvent'
    | 'CommitCommentThread'
    | 'CrossReferencedEvent'
    | 'DemilestonedEvent'
    | 'DeployedEvent'
    | 'DeploymentEnvironmentChangedEvent'
    | 'HeadRefDeletedEvent'
    | 'HeadRefForcePushedEvent'
    | 'HeadRefRestoredEvent'
    | 'LabeledEvent'
    | 'LockedEvent'
    | 'MergedEvent'
    | 'MilestonedEvent'
    | 'ReferencedEvent'
    | 'RenamedTitleEvent'
    | 'ReopenedEvent'
    | 'ReviewDismissedEvent'
    | 'ReviewRequestRemovedEvent'
    | 'ReviewRequestedEvent'
    | 'SubscribedEvent'
    | 'UnassignedEvent'
    | 'UnlabeledEvent'
    | 'UnlockedEvent'
    | 'UnsubscribedEvent'
    | 'UserBlockedEvent'
    | 'AddedToProjectEvent'
    | 'BaseRefChangedEvent'
    | 'CommentDeletedEvent'
    | 'ConnectedEvent'
    | 'ConvertedNoteToIssueEvent'
    | 'DisconnectedEvent'
    | 'MarkedAsDuplicateEvent'
    | 'MentionedEvent'
    | 'MovedColumnsInProjectEvent'
    | 'PinnedEvent'
    | 'PullRequestCommitCommentThread'
    | 'ReadyForReviewEvent'
    | 'RemovedFromProjectEvent'
    | 'TransferredEvent'
    | 'UnmarkedAsDuplicateEvent'
    | 'UnpinnedEvent'
    | 'Gist'
    | 'GistComment'
    | 'SponsorsListing'
    | 'SponsorsTier'
    | 'Sponsorship'
    | 'PublicKey'
    | 'SavedReply'
    | 'ReleaseAsset'
    | 'RegistryPackageTag'
    | 'MembersCanDeleteReposClearAuditEntry'
    | 'MembersCanDeleteReposDisableAuditEntry'
    | 'MembersCanDeleteReposEnableAuditEntry'
    | 'OauthApplicationCreateAuditEntry'
    | 'OrgAddBillingManagerAuditEntry'
    | 'OrgAddMemberAuditEntry'
    | 'OrgBlockUserAuditEntry'
    | 'OrgConfigDisableCollaboratorsOnlyAuditEntry'
    | 'OrgConfigEnableCollaboratorsOnlyAuditEntry'
    | 'OrgCreateAuditEntry'
    | 'OrgDisableOauthAppRestrictionsAuditEntry'
    | 'OrgDisableSamlAuditEntry'
    | 'OrgDisableTwoFactorRequirementAuditEntry'
    | 'OrgEnableOauthAppRestrictionsAuditEntry'
    | 'OrgEnableSamlAuditEntry'
    | 'OrgEnableTwoFactorRequirementAuditEntry'
    | 'OrgInviteMemberAuditEntry'
    | 'OrgInviteToBusinessAuditEntry'
    | 'OrgOauthAppAccessApprovedAuditEntry'
    | 'OrgOauthAppAccessDeniedAuditEntry'
    | 'OrgOauthAppAccessRequestedAuditEntry'
    | 'OrgRemoveBillingManagerAuditEntry'
    | 'OrgRemoveMemberAuditEntry'
    | 'OrgRemoveOutsideCollaboratorAuditEntry'
    | 'OrgRestoreMemberAuditEntry'
    | 'OrgUnblockUserAuditEntry'
    | 'OrgUpdateDefaultRepositoryPermissionAuditEntry'
    | 'OrgUpdateMemberAuditEntry'
    | 'OrgUpdateMemberRepositoryCreationPermissionAuditEntry'
    | 'OrgUpdateMemberRepositoryInvitationPermissionAuditEntry'
    | 'PrivateRepositoryForkingDisableAuditEntry'
    | 'PrivateRepositoryForkingEnableAuditEntry'
    | 'RepoAccessAuditEntry'
    | 'RepoAddMemberAuditEntry'
    | 'RepoAddTopicAuditEntry'
    | 'RepoArchivedAuditEntry'
    | 'RepoChangeMergeSettingAuditEntry'
    | 'RepoConfigDisableAnonymousGitAccessAuditEntry'
    | 'RepoConfigDisableCollaboratorsOnlyAuditEntry'
    | 'RepoConfigDisableContributorsOnlyAuditEntry'
    | 'RepoConfigDisableSockpuppetDisallowedAuditEntry'
    | 'RepoConfigEnableAnonymousGitAccessAuditEntry'
    | 'RepoConfigEnableCollaboratorsOnlyAuditEntry'
    | 'RepoConfigEnableContributorsOnlyAuditEntry'
    | 'RepoConfigEnableSockpuppetDisallowedAuditEntry'
    | 'RepoConfigLockAnonymousGitAccessAuditEntry'
    | 'RepoConfigUnlockAnonymousGitAccessAuditEntry'
    | 'RepoCreateAuditEntry'
    | 'RepoDestroyAuditEntry'
    | 'RepoRemoveMemberAuditEntry'
    | 'RepoRemoveTopicAuditEntry'
    | 'RepositoryVisibilityChangeDisableAuditEntry'
    | 'RepositoryVisibilityChangeEnableAuditEntry'
    | 'TeamAddMemberAuditEntry'
    | 'TeamAddRepositoryAuditEntry'
    | 'TeamChangeParentTeamAuditEntry'
    | 'TeamRemoveMemberAuditEntry'
    | 'TeamRemoveRepositoryAuditEntry'
    | 'OrganizationIdentityProvider'
    | 'ExternalIdentity'
    | 'EnterpriseServerInstallation'
    | 'EnterpriseServerUserAccount'
    | 'EnterpriseServerUserAccountEmail'
    | 'EnterpriseServerUserAccountsUpload'
    | 'IpAllowListEntry'
    | 'EnterpriseRepositoryInfo'
    | 'EnterpriseAdministratorInvitation'
    | 'EnterpriseIdentityProvider'
    | 'MarketplaceCategory'
    | 'MarketplaceListing'
    | 'Blob'
    | 'RepositoryInvitation'
    | 'Tag';
}

export interface GetPullRequestFromGraphID_node_PullRequest_mergeCommit {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetPullRequestFromGraphID_node_PullRequest {
  __typename: 'PullRequest';
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
  /**
   * Identifies the pull request number.
   */
  number: number;
  /**
   * Identifies the pull request title.
   */
  title: string;
  /**
   * Whether or not the pull request was merged.
   */
  merged: boolean;
  /**
   * `true` if the pull request is closed
   */
  closed: boolean;
  /**
   * The commit that was created when this pull request was merged.
   */
  mergeCommit: GetPullRequestFromGraphID_node_PullRequest_mergeCommit | null;
  /**
   * Identifies the name of the head Ref associated with the pull request, even if the ref has been deleted.
   */
  headRefName: string;
  /**
   * Identifies the name of the base Ref associated with the pull request, even if the ref has been deleted.
   */
  baseRefName: string;
}

export type GetPullRequestFromGraphID_node =
  | GetPullRequestFromGraphID_node_CodeOfConduct
  | GetPullRequestFromGraphID_node_PullRequest;

export interface GetPullRequestFromGraphID {
  /**
   * Fetches an object given its ID.
   */
  node: GetPullRequestFromGraphID_node | null;
}

export interface GetPullRequestFromGraphIDVariables {
  id: string;
}

export const getPullRequestFromGraphId = getMethod<
  GetPullRequestFromGraphID,
  GetPullRequestFromGraphIDVariables
>(gql`
  query GetPullRequestFromGraphID($id: ID!) {
    node(id: $id) {
      __typename
      ... on PullRequest {
        databaseId
        number
        title
        merged
        closed
        mergeCommit {
          oid
        }
        headRefName
        baseRefName
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetPullRequestFromNumber
// ====================================================

export interface GetPullRequestFromNumber_repository_pullRequest_mergeCommit {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetPullRequestFromNumber_repository_pullRequest {
  id: string;
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
  /**
   * Identifies the pull request number.
   */
  number: number;
  /**
   * Identifies the pull request title.
   */
  title: string;
  /**
   * Whether or not the pull request was merged.
   */
  merged: boolean;
  /**
   * `true` if the pull request is closed
   */
  closed: boolean;
  /**
   * The commit that was created when this pull request was merged.
   */
  mergeCommit: GetPullRequestFromNumber_repository_pullRequest_mergeCommit | null;
  /**
   * Identifies the name of the head Ref associated with the pull request, even if the ref has been deleted.
   */
  headRefName: string;
  /**
   * Identifies the name of the base Ref associated with the pull request, even if the ref has been deleted.
   */
  baseRefName: string;
}

export interface GetPullRequestFromNumber_repository {
  /**
   * Returns a single pull request from the current repository by number.
   */
  pullRequest: GetPullRequestFromNumber_repository_pullRequest | null;
}

export interface GetPullRequestFromNumber {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetPullRequestFromNumber_repository | null;
}

export interface GetPullRequestFromNumberVariables {
  owner: string;
  name: string;
  number: number;
}

export const getPullRequestFromNumber = getMethod<
  GetPullRequestFromNumber,
  GetPullRequestFromNumberVariables
>(gql`
  query GetPullRequestFromNumber(
    $owner: String!
    $name: String!
    $number: Int!
  ) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        id
        databaseId
        number
        title
        merged
        closed
        mergeCommit {
          oid
        }
        headRefName
        baseRefName
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetAllPullRequestCommits
// ====================================================

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Tree {
  __typename: 'Tree' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_pageInfo {
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating forwards, the cursor to continue.
   */
  endCursor: string | null;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_parents_nodes {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_parents {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_parents_nodes | null)[]
    | null;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_associatedPullRequests_nodes_repository {
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_associatedPullRequests_nodes {
  id: string;
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
  /**
   * The repository associated with this node.
   */
  repository: GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_associatedPullRequests_nodes_repository;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_associatedPullRequests {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_associatedPullRequests_nodes | null)[]
    | null;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes {
  id: string;
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * The parents of a commit.
   */
  parents: GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_parents;
  /**
   * The pull requests associated with a commit
   */
  associatedPullRequests: GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_associatedPullRequests | null;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history {
  /**
   * Information to aid in pagination.
   */
  pageInfo: GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_pageInfo;
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes | null)[]
    | null;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit {
  __typename: 'Commit';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  id: string;
  /**
   * The linear commit history starting from (and including) this commit, in the same order as `git log`.
   */
  history: GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history;
}

export type GetAllPullRequestCommits_repository_pullRequest_headRef_target =
  | GetAllPullRequestCommits_repository_pullRequest_headRef_target_Tree
  | GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit;

export interface GetAllPullRequestCommits_repository_pullRequest_headRef {
  /**
   * The object the ref points to.
   */
  target: GetAllPullRequestCommits_repository_pullRequest_headRef_target;
}

export interface GetAllPullRequestCommits_repository_pullRequest {
  /**
   * Identifies the head Ref associated with the pull request.
   */
  headRef: GetAllPullRequestCommits_repository_pullRequest_headRef | null;
}

export interface GetAllPullRequestCommits_repository {
  /**
   * Returns a single pull request from the current repository by number.
   */
  pullRequest: GetAllPullRequestCommits_repository_pullRequest | null;
}

export interface GetAllPullRequestCommits {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetAllPullRequestCommits_repository | null;
}

export interface GetAllPullRequestCommitsVariables {
  owner: string;
  name: string;
  number: number;
  pageSize: number;
  after?: string | null;
}

export const getAllPullRequestCommits = getMethod<
  GetAllPullRequestCommits,
  GetAllPullRequestCommitsVariables
>(gql`
  query GetAllPullRequestCommits(
    $owner: String!
    $name: String!
    $number: Int!
    $pageSize: Int!
    $after: String
  ) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        headRef {
          target {
            __typename
            oid
            ... on Commit {
              id
              history(first: $pageSize, after: $after) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  ...CommitDetail
                }
              }
            }
          }
        }
      }
    }
  }
  fragment CommitDetail on Commit {
    id
    oid
    parents(first: 100) {
      nodes {
        oid
      }
    }
    associatedPullRequests(first: 100) {
      nodes {
        id
        databaseId
        repository {
          databaseId
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetBlobContents
// ====================================================

export interface GetBlobContents_node_CodeOfConduct {
  __typename:
    | 'CodeOfConduct'
    | 'Enterprise'
    | 'EnterpriseUserAccount'
    | 'Organization'
    | 'RegistryPackage'
    | 'RegistryPackageVersion'
    | 'RegistryPackageDependency'
    | 'RegistryPackageFile'
    | 'Release'
    | 'User'
    | 'Project'
    | 'ProjectColumn'
    | 'ProjectCard'
    | 'Issue'
    | 'UserContentEdit'
    | 'Label'
    | 'PullRequest'
    | 'Reaction'
    | 'Repository'
    | 'License'
    | 'BranchProtectionRule'
    | 'Ref'
    | 'PushAllowance'
    | 'App'
    | 'Team'
    | 'UserStatus'
    | 'TeamDiscussion'
    | 'TeamDiscussionComment'
    | 'OrganizationInvitation'
    | 'ReviewDismissalAllowance'
    | 'CommitComment'
    | 'Commit'
    | 'Deployment'
    | 'DeploymentStatus'
    | 'Status'
    | 'StatusContext'
    | 'StatusCheckRollup'
    | 'Tree'
    | 'DeployKey'
    | 'Language'
    | 'Milestone'
    | 'RepositoryTopic'
    | 'Topic'
    | 'RepositoryVulnerabilityAlert'
    | 'SecurityAdvisory'
    | 'IssueComment'
    | 'PullRequestCommit'
    | 'ReviewRequest'
    | 'Mannequin'
    | 'PullRequestReviewThread'
    | 'PullRequestReviewComment'
    | 'PullRequestReview'
    | 'AssignedEvent'
    | 'Bot'
    | 'BaseRefForcePushedEvent'
    | 'ClosedEvent'
    | 'CommitCommentThread'
    | 'CrossReferencedEvent'
    | 'DemilestonedEvent'
    | 'DeployedEvent'
    | 'DeploymentEnvironmentChangedEvent'
    | 'HeadRefDeletedEvent'
    | 'HeadRefForcePushedEvent'
    | 'HeadRefRestoredEvent'
    | 'LabeledEvent'
    | 'LockedEvent'
    | 'MergedEvent'
    | 'MilestonedEvent'
    | 'ReferencedEvent'
    | 'RenamedTitleEvent'
    | 'ReopenedEvent'
    | 'ReviewDismissedEvent'
    | 'ReviewRequestRemovedEvent'
    | 'ReviewRequestedEvent'
    | 'SubscribedEvent'
    | 'UnassignedEvent'
    | 'UnlabeledEvent'
    | 'UnlockedEvent'
    | 'UnsubscribedEvent'
    | 'UserBlockedEvent'
    | 'AddedToProjectEvent'
    | 'BaseRefChangedEvent'
    | 'CommentDeletedEvent'
    | 'ConnectedEvent'
    | 'ConvertedNoteToIssueEvent'
    | 'DisconnectedEvent'
    | 'MarkedAsDuplicateEvent'
    | 'MentionedEvent'
    | 'MovedColumnsInProjectEvent'
    | 'PinnedEvent'
    | 'PullRequestCommitCommentThread'
    | 'ReadyForReviewEvent'
    | 'RemovedFromProjectEvent'
    | 'TransferredEvent'
    | 'UnmarkedAsDuplicateEvent'
    | 'UnpinnedEvent'
    | 'Gist'
    | 'GistComment'
    | 'SponsorsListing'
    | 'SponsorsTier'
    | 'Sponsorship'
    | 'PublicKey'
    | 'SavedReply'
    | 'ReleaseAsset'
    | 'RegistryPackageTag'
    | 'MembersCanDeleteReposClearAuditEntry'
    | 'MembersCanDeleteReposDisableAuditEntry'
    | 'MembersCanDeleteReposEnableAuditEntry'
    | 'OauthApplicationCreateAuditEntry'
    | 'OrgAddBillingManagerAuditEntry'
    | 'OrgAddMemberAuditEntry'
    | 'OrgBlockUserAuditEntry'
    | 'OrgConfigDisableCollaboratorsOnlyAuditEntry'
    | 'OrgConfigEnableCollaboratorsOnlyAuditEntry'
    | 'OrgCreateAuditEntry'
    | 'OrgDisableOauthAppRestrictionsAuditEntry'
    | 'OrgDisableSamlAuditEntry'
    | 'OrgDisableTwoFactorRequirementAuditEntry'
    | 'OrgEnableOauthAppRestrictionsAuditEntry'
    | 'OrgEnableSamlAuditEntry'
    | 'OrgEnableTwoFactorRequirementAuditEntry'
    | 'OrgInviteMemberAuditEntry'
    | 'OrgInviteToBusinessAuditEntry'
    | 'OrgOauthAppAccessApprovedAuditEntry'
    | 'OrgOauthAppAccessDeniedAuditEntry'
    | 'OrgOauthAppAccessRequestedAuditEntry'
    | 'OrgRemoveBillingManagerAuditEntry'
    | 'OrgRemoveMemberAuditEntry'
    | 'OrgRemoveOutsideCollaboratorAuditEntry'
    | 'OrgRestoreMemberAuditEntry'
    | 'OrgUnblockUserAuditEntry'
    | 'OrgUpdateDefaultRepositoryPermissionAuditEntry'
    | 'OrgUpdateMemberAuditEntry'
    | 'OrgUpdateMemberRepositoryCreationPermissionAuditEntry'
    | 'OrgUpdateMemberRepositoryInvitationPermissionAuditEntry'
    | 'PrivateRepositoryForkingDisableAuditEntry'
    | 'PrivateRepositoryForkingEnableAuditEntry'
    | 'RepoAccessAuditEntry'
    | 'RepoAddMemberAuditEntry'
    | 'RepoAddTopicAuditEntry'
    | 'RepoArchivedAuditEntry'
    | 'RepoChangeMergeSettingAuditEntry'
    | 'RepoConfigDisableAnonymousGitAccessAuditEntry'
    | 'RepoConfigDisableCollaboratorsOnlyAuditEntry'
    | 'RepoConfigDisableContributorsOnlyAuditEntry'
    | 'RepoConfigDisableSockpuppetDisallowedAuditEntry'
    | 'RepoConfigEnableAnonymousGitAccessAuditEntry'
    | 'RepoConfigEnableCollaboratorsOnlyAuditEntry'
    | 'RepoConfigEnableContributorsOnlyAuditEntry'
    | 'RepoConfigEnableSockpuppetDisallowedAuditEntry'
    | 'RepoConfigLockAnonymousGitAccessAuditEntry'
    | 'RepoConfigUnlockAnonymousGitAccessAuditEntry'
    | 'RepoCreateAuditEntry'
    | 'RepoDestroyAuditEntry'
    | 'RepoRemoveMemberAuditEntry'
    | 'RepoRemoveTopicAuditEntry'
    | 'RepositoryVisibilityChangeDisableAuditEntry'
    | 'RepositoryVisibilityChangeEnableAuditEntry'
    | 'TeamAddMemberAuditEntry'
    | 'TeamAddRepositoryAuditEntry'
    | 'TeamChangeParentTeamAuditEntry'
    | 'TeamRemoveMemberAuditEntry'
    | 'TeamRemoveRepositoryAuditEntry'
    | 'OrganizationIdentityProvider'
    | 'ExternalIdentity'
    | 'EnterpriseServerInstallation'
    | 'EnterpriseServerUserAccount'
    | 'EnterpriseServerUserAccountEmail'
    | 'EnterpriseServerUserAccountsUpload'
    | 'IpAllowListEntry'
    | 'EnterpriseRepositoryInfo'
    | 'EnterpriseAdministratorInvitation'
    | 'EnterpriseIdentityProvider'
    | 'MarketplaceCategory'
    | 'MarketplaceListing'
    | 'RepositoryInvitation'
    | 'Tag';
}

export interface GetBlobContents_node_Blob {
  __typename: 'Blob';
  /**
   * UTF8 text data or null if the Blob is binary
   */
  text: string | null;
}

export type GetBlobContents_node =
  | GetBlobContents_node_CodeOfConduct
  | GetBlobContents_node_Blob;

export interface GetBlobContents {
  /**
   * Fetches an object given its ID.
   */
  node: GetBlobContents_node | null;
}

export interface GetBlobContentsVariables {
  id: string;
}

export const getBlobContents = getMethod<
  GetBlobContents,
  GetBlobContentsVariables
>(gql`
  query GetBlobContents($id: ID!) {
    node(id: $id) {
      __typename
      ... on Blob {
        text
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetPullRequestStatus
// ====================================================

export interface GetPullRequestStatus_repository_pullRequest {
  /**
   * `true` if the pull request is closed
   */
  closed: boolean;
  /**
   * Whether or not the pull request was merged.
   */
  merged: boolean;
}

export interface GetPullRequestStatus_repository {
  /**
   * Returns a single pull request from the current repository by number.
   */
  pullRequest: GetPullRequestStatus_repository_pullRequest | null;
}

export interface GetPullRequestStatus {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetPullRequestStatus_repository | null;
}

export interface GetPullRequestStatusVariables {
  owner: string;
  name: string;
  number: number;
}

export const getPullRequestStatus = getMethod<
  GetPullRequestStatus,
  GetPullRequestStatusVariables
>(gql`
  query GetPullRequestStatus($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        closed
        merged
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetPullRequestAuthor
// ====================================================

export interface GetPullRequestAuthor_repository_pullRequest_author {
  __typename:
    | 'EnterpriseUserAccount'
    | 'Organization'
    | 'User'
    | 'Mannequin'
    | 'Bot';
  /**
   * The username of the actor.
   */
  login: string;
}

export interface GetPullRequestAuthor_repository_pullRequest {
  /**
   * The actor who authored the comment.
   */
  author: GetPullRequestAuthor_repository_pullRequest_author | null;
}

export interface GetPullRequestAuthor_repository {
  /**
   * Returns a single pull request from the current repository by number.
   */
  pullRequest: GetPullRequestAuthor_repository_pullRequest | null;
}

export interface GetPullRequestAuthor {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetPullRequestAuthor_repository | null;
}

export interface GetPullRequestAuthorVariables {
  owner: string;
  name: string;
  number: number;
}

export const getPullRequestAuthor = getMethod<
  GetPullRequestAuthor,
  GetPullRequestAuthorVariables
>(gql`
  query GetPullRequestAuthor($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        author {
          __typename
          login
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetViewer
// ====================================================

export interface GetViewer_viewer {
  __typename: 'User';
  /**
   * The username used to login.
   */
  login: string;
}

export interface GetViewer {
  /**
   * The currently authenticated user.
   */
  viewer: GetViewer_viewer;
}

export const getViewer = getMethod<GetViewer, {}>(gql`
  query GetViewer {
    viewer {
      __typename
      login
    }
  }
`);

// ====================================================
// GraphQL query operation: GetRepositoryViewerPermissions
// ====================================================

export interface GetRepositoryViewerPermissions_repository {
  /**
   * The users permission level on the repository. Will return null if authenticated as an GitHub App.
   */
  viewerPermission: RepositoryPermission | null;
}

export interface GetRepositoryViewerPermissions {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetRepositoryViewerPermissions_repository | null;
}

export interface GetRepositoryViewerPermissionsVariables {
  owner: string;
  name: string;
}

export const getRepositoryViewerPermissions = getMethod<
  GetRepositoryViewerPermissions,
  GetRepositoryViewerPermissionsVariables
>(gql`
  query GetRepositoryViewerPermissions($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      viewerPermission
    }
  }
`);

// ====================================================
// GraphQL query operation: GetRepositoryIsPrivate
// ====================================================

export interface GetRepositoryIsPrivate_repository {
  /**
   * Identifies if the repository is private.
   */
  isPrivate: boolean;
}

export interface GetRepositoryIsPrivate {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetRepositoryIsPrivate_repository | null;
}

export interface GetRepositoryIsPrivateVariables {
  owner: string;
  name: string;
}

export const getRepositoryIsPrivate = getMethod<
  GetRepositoryIsPrivate,
  GetRepositoryIsPrivateVariables
>(gql`
  query GetRepositoryIsPrivate($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      isPrivate
    }
  }
`);

// ====================================================
// GraphQL fragment: CommitDetail
// ====================================================

export interface CommitDetail_parents_nodes {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface CommitDetail_parents {
  /**
   * A list of nodes.
   */
  nodes: (CommitDetail_parents_nodes | null)[] | null;
}

export interface CommitDetail_associatedPullRequests_nodes_repository {
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
}

export interface CommitDetail_associatedPullRequests_nodes {
  id: string;
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
  /**
   * The repository associated with this node.
   */
  repository: CommitDetail_associatedPullRequests_nodes_repository;
}

export interface CommitDetail_associatedPullRequests {
  /**
   * A list of nodes.
   */
  nodes: (CommitDetail_associatedPullRequests_nodes | null)[] | null;
}

export interface CommitDetail {
  id: string;
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * The parents of a commit.
   */
  parents: CommitDetail_parents;
  /**
   * The pull requests associated with a commit
   */
  associatedPullRequests: CommitDetail_associatedPullRequests | null;
}
import GitHubClient, {
  auth,
  OptionsWithAuth as GitHubOptions,
} from '@github-graph/api';
import retry, {withRetry} from 'then-retry';

import DbGitCommit from '@rollingversions/db/git_commits';
import DbGitRepository from '@rollingversions/db/git_repositories';
import {PullRequest, Repository} from '@rollingversions/types';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';

import paginateBatched from '../../../utils/paginateBatched';
import * as queries from './github-graph';

export {GitHubClient};
export {auth};
export type {GitHubOptions};

export async function getRepository(client: GitHubClient, repo: Repository) {
  const repository = (await queries.getRepository(client, repo)).repository;
  if (!repository) {
    return null;
  }
  if (repository.databaseId === null) {
    throw new Error('Did not expect repository.databaseId to ever be null');
  }
  return {
    id: repository.databaseId,
    graphql_id: repository.id,
    owner: repo.owner,
    name: repo.name,
    isPrivate: repository.isPrivate,
    defaultBranch: repository.defaultBranchRef?.name,
  };
}

export function getRepositoryPullRequestIDs(
  client: GitHubClient,
  repo: Repository,
) {
  return paginateBatched(
    (token) =>
      queries.getRepositoryPullRequests(client, {
        owner: repo.owner,
        name: repo.name,
        after: token,
      }),
    (page) =>
      page.repository?.pullRequests.nodes?.filter(isTruthy).map((n) => ({
        id: n.databaseId!,
        graphql_id: n.id,
      })) || [],
    (page) =>
      page.repository?.pullRequests.pageInfo.hasNextPage
        ? page.repository.pullRequests.pageInfo.endCursor || undefined
        : undefined,
  );
}
export async function getDefaultBranch(client: GitHubClient, repo: Repository) {
  const branch = (await queries.getDefaultBranch(client, repo)).repository
    ?.branch;
  if (!branch) {
    return null;
  }
  if (branch.target.__typename !== 'Commit') {
    throw new Error(
      `Expected branch target to be "Commit" but got "${branch.target.__typename}"`,
    );
  }
  return {
    name: branch.name,
    target: {
      graphql_id: branch.target.id,
      commit_sha: branch.target.oid,
    },
    graphql_id: branch.id,
  };
}

export async function getRef(
  client: GitHubClient,
  repo: Repository,
  ref: GitReference,
) {
  const gitRef = (
    await queries.getRef(client, {
      ...repo,
      qualifiedName: getQualifiedName(ref),
    })
  ).repository?.ref;
  if (!gitRef) {
    return null;
  }
  const target =
    gitRef.target.__typename === 'Commit'
      ? gitRef.target
      : gitRef.target.__typename === 'Tag'
      ? gitRef.target.target.__typename === 'Commit'
        ? gitRef.target.target
        : null
      : null;
  if (target?.__typename !== 'Commit') {
    throw new Error(`Expected ${ref.type} target to be "Commit".`);
  }
  return {
    name: gitRef.name,
    target: target.oid,
    targetGraphID: target.id,
    graphql_id: gitRef.id,
  };
}

export type GitReference = {type: 'head' | 'tag'; name: string};
function getQualifiedName({type, name}: GitReference): string {
  switch (type) {
    case 'head':
      return `refs/heads/${name}`;
    case 'tag':
      return `refs/tags/${name}`;
  }
}
export async function* getCommitHistory(
  client: GitHubClient,
  commitID: string,
) {
  let pageSize = 5;
  for await (const result of paginateBatched(
    async (token) => {
      const currentPageSize = pageSize;
      pageSize = Math.min(100, pageSize + 20);
      return await retry(() =>
        queries.getAllCommitHistory(client, {
          commitID,
          pageSize: currentPageSize,
          after: token,
        }),
      );
    },
    (page) => {
      if (page.node?.__typename !== 'Commit') {
        throw new Error(
          `Expected a Commit but got ${page.node?.__typename || 'undefined'}`,
        );
      }
      return page.node.__typename === 'Commit'
        ? page.node.history.nodes || []
        : [];
    },
    (page) =>
      page.node?.__typename === 'Commit' &&
      page.node.history.pageInfo.hasNextPage
        ? page.node.history.pageInfo.endCursor || undefined
        : undefined,
  )) {
    yield result.filter(isTruthy).map(formatCommit);
  }
}
export async function* getAllRefCommits(
  client: GitHubClient,
  repo: Repository,
  ref: GitReference,
) {
  let pageSize = 5;
  for await (const result of paginateBatched(
    async (token) => {
      const currentPageSize = pageSize;
      pageSize = Math.min(100, pageSize + 20);
      return await retry(() =>
        queries.getAllRefCommits(client, {
          owner: repo.owner,
          name: repo.name,
          qualifiedName: getQualifiedName(ref),
          pageSize: currentPageSize,
          after: token,
        }),
      );
    },
    (page) =>
      page.repository?.ref?.target.__typename === 'Commit'
        ? page.repository.ref.target.history.nodes || []
        : [],
    (page) =>
      page.repository?.ref?.target.__typename === 'Commit' &&
      page.repository.ref.target.history.pageInfo.hasNextPage
        ? page.repository.ref.target.history.pageInfo.endCursor || undefined
        : undefined,
  )) {
    yield result.filter(isTruthy).map(formatCommit);
  }
}
export async function* getAllDefaultBranchCommits(
  client: GitHubClient,
  repo: Repository,
) {
  let pageSize = 5;
  for await (const result of paginateBatched(
    async (token) => {
      const currentPageSize = pageSize;
      pageSize = Math.min(100, pageSize + 20);
      return await queries.getAllDefaultBranchCommits(client, {
        ...repo,
        pageSize: currentPageSize,
        after: token,
      });
    },
    (page) =>
      page.repository?.branch?.target.__typename === 'Commit'
        ? page.repository.branch.target.history.nodes || []
        : [],
    (page) =>
      page.repository?.branch?.target.__typename === 'Commit' &&
      page.repository.branch.target.history.pageInfo.hasNextPage
        ? page.repository.branch.target.history.pageInfo.endCursor || undefined
        : undefined,
  )) {
    yield result.filter(isTruthy).map(formatCommit);
  }
}
export type GitHubCommit = {
  graphql_id: string;
  commit_sha: string;
  parents: string[];
  associatedPullRequests: {
    id: number;
    graphql_id: string;
    repositoryId: number | null;
  }[];
};
function formatCommit(result: {
  id: string;
  oid: string;
  parents: {nodes: null | ({oid: string} | null)[]};
  associatedPullRequests: null | {
    nodes:
      | null
      | (null | {
          databaseId: number | null;
          id: string;
          repository: {databaseId: number | null};
        })[];
  };
}): GitHubCommit {
  return {
    graphql_id: result.id,
    commit_sha: result.oid,
    parents: result.parents.nodes?.map((n) => n?.oid).filter(isTruthy) || [],
    associatedPullRequests:
      result.associatedPullRequests?.nodes
        ?.map((p) => {
          if (!p) return null;
          if (!p.databaseId) {
            throw new Error(
              `Expected pull request ${p.id} to have a databaseId`,
            );
          }
          return {
            id: p.databaseId,
            graphql_id: p.id,
            repositoryId: p.repository.databaseId,
          };
        })
        .filter(isTruthy) || [],
  };
}

export async function getPullRequestFromGraphID(
  client: GitHubClient,
  graphql_id: string,
): Promise<PullRequestDetail | null> {
  const result = (
    await queries.getPullRequestFromGraphId(client, {id: graphql_id})
  ).node;
  if (!result) return null;
  if (result.__typename !== 'PullRequest') {
    throw new Error(`Expected a PullRequest but got ${result.__typename}`);
  }
  if (!result.databaseId) {
    throw new Error(`Got null for pull request databaseId`);
  }
  return {
    id: result.databaseId,
    graphql_id,
    number: result.number,
    title: result.title,
    is_merged: result.merged,
    is_closed: result.closed || result.merged,
    merge_commit_sha: result.mergeCommit?.oid ?? null,
    head_ref_name: result.headRefName,
    base_ref_name: result.baseRefName,
  };
}

export async function getPullRequestFromNumber(
  client: GitHubClient,
  repo: Repository,
  prNumber: number,
): Promise<PullRequestDetail | null> {
  const result = (
    await queries.getPullRequestFromNumber(client, {
      owner: repo.owner,
      name: repo.name,
      number: prNumber,
    })
  ).repository?.pullRequest;
  if (!result) return null;
  if (!result.databaseId) {
    throw new Error(`Got null for pull request databaseId`);
  }
  return {
    id: result.databaseId,
    graphql_id: result.id,
    number: result.number,
    title: result.title,
    is_merged: result.merged,
    is_closed: result.closed || result.merged,
    merge_commit_sha: result.mergeCommit?.oid ?? null,
    head_ref_name: result.headRefName,
    base_ref_name: result.baseRefName,
  };
}
export async function* getAllPullRequestCommits(
  client: GitHubClient,
  repo: Repository,
  prNumber: number,
) {
  let pageSize = 5;
  for await (const result of paginateBatched(
    async (token) => {
      const currentPagesize = pageSize;
      pageSize = Math.min(100, pageSize + 5);
      return await queries.getAllPullRequestCommits(client, {
        owner: repo.owner,
        name: repo.name,
        number: prNumber,
        pageSize: currentPagesize,
        after: token,
      });
    },
    (page) =>
      page.repository?.pullRequest?.headRef?.target.__typename === 'Commit'
        ? page.repository.pullRequest.headRef.target.history.nodes || []
        : [],
    (page) =>
      page.repository?.pullRequest?.headRef?.target.__typename === 'Commit' &&
      page.repository.pullRequest.headRef.target.history.pageInfo.hasNextPage
        ? page.repository.pullRequest.headRef.target.history.pageInfo
            .endCursor || undefined
        : undefined,
  )) {
    yield result.filter(isTruthy).map(formatCommit);
  }
}

export interface PullRequestDetail {
  id: number;
  graphql_id: string;
  number: number;
  title: string;
  is_merged: boolean;
  is_closed: boolean;
  merge_commit_sha: string | null;
  head_ref_name: string;
  base_ref_name: string;
}

export const updateCommitStatus = withRetry(
  async (
    client: GitHubClient,
    repo: DbGitRepository,
    headCommit: DbGitCommit,
    status: {
      state: 'success' | 'pending' | 'error' | 'failure';
      url: URL;
      description: string;
    },
  ) => {
    await client.rest.repos.createStatus({
      owner: repo.owner,
      repo: repo.name,
      sha: headCommit.commit_sha,
      state: status.state,
      target_url: status.url.href,
      description: status.description,
      context: 'RollingVersions',
    });
  },
);

export async function writeComment(
  client: GitHubClient,
  pr: PullRequest,
  body: string,
  existingComment: number | undefined,
) {
  if (existingComment) {
    return (
      await retry(() =>
        client.rest.issues.updateComment({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          body,
          comment_id: existingComment,
        }),
      )
    ).data.id;
  } else {
    return (
      await client.rest.issues.createComment({
        owner: pr.repo.owner,
        repo: pr.repo.name,
        issue_number: pr.number,
        body,
      })
    ).data.id;
  }
}

export const deleteComment = withRetry(
  async (client: GitHubClient, pr: PullRequest, existingComment: number) => {
    await client.rest.issues.deleteComment({
      owner: pr.repo.owner,
      repo: pr.repo.name,
      comment_id: existingComment,
    });
  },
);

async function pullRequest<T>(
  promise: Promise<
    {repository?: null | {pullRequest?: null | T}} | null | undefined
  >,
): Promise<T | null> {
  return await promise.then(
    (result) => {
      return result?.repository?.pullRequest || null;
    },
    (ex) => {
      try {
        if (
          ex &&
          ex.errors &&
          Array.isArray(ex.errors) &&
          ex.errors.some(
            (e: any) =>
              e &&
              e.type === 'NOT_FOUND' &&
              Array.isArray(e.path) &&
              e.path.length === 2 &&
              e.path[0] === 'repository' &&
              e.path[0] === 'pullRequest',
          )
        ) {
          return null;
        }
      } catch {
        // fallthrough
      }
      throw ex;
    },
  );
}

export const getPullRequestStatus = withRetry(
  async (client: GitHubClient, pr: PullRequest) => {
    return (
      (await pullRequest(
        queries.getPullRequestStatus(client, {
          owner: pr.repo.owner,
          name: pr.repo.name,
          number: pr.number,
        }),
      )) || undefined
    );
  },
);

export const getPullRequestAuthor = withRetry(
  async (client: GitHubClient, pr: PullRequest) => {
    return (
      (
        await pullRequest(
          queries.getPullRequestAuthor(client, {
            owner: pr.repo.owner,
            name: pr.repo.name,
            number: pr.number,
          }),
        )
      )?.author || null
    );
  },
);

export const getViewer = withRetry(async (client: GitHubClient) => {
  return (await queries.getViewer(client)).viewer;
});

export const getRepositoryIsPublic = withRetry(
  async (client: GitHubClient, repo: Repository) => {
    return (
      (
        await queries.getRepositoryIsPrivate(client, {
          owner: repo.owner,
          name: repo.name,
        })
      ).repository?.isPrivate === false
    );
  },
);

export const getRepositoryViewerPermissions = withRetry(
  async (client: GitHubClient, repo: Repository) => {
    return (
      (await queries.getRepositoryViewerPermissions(client, repo)).repository
        ?.viewerPermission || null
    );
  },
  {
    shouldRetry: (_e, failedAttempts) => failedAttempts < 3,
    retryDelay: () => 100,
  },
);
import type WebhooksApi from '@octokit/webhooks';

import db from '@rollingversions/db';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {markRepoAsUpdated, updateRepoIfChanged} from '../../models/git';
import {upsertRepositoryFromEventPayload} from '../../models/Repositories';

export default async function onCreate(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadCreate>,
  logger: Logger,
) {
  const repo = await upsertRepositoryFromEventPayload(db, e.payload.repository);
  await markRepoAsUpdated(db, repo);
  const client = getClientForEvent(e);
  void updateRepoIfChanged(db, client, repo.id, logger).catch((ex) => {
    logger.error(`update_repo_failed`, ex.stack);
  });
}
import type WebhooksApi from '@octokit/webhooks';

import db from '@rollingversions/db';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {markRepoAsUpdated, updateRepoIfChanged} from '../../models/git';
import {upsertRepositoryFromEventPayload} from '../../models/Repositories';

export default async function onDelete(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadDelete>,
  logger: Logger,
) {
  const repo = await upsertRepositoryFromEventPayload(db, e.payload.repository);
  await markRepoAsUpdated(db, repo);
  const client = getClientForEvent(e);
  void updateRepoIfChanged(db, client, repo.id, logger).catch((ex) => {
    logger.error(`update_repo_failed`, ex.stack);
  });
}
import type WebhooksApi from '@octokit/webhooks';

import db, {tables} from '@rollingversions/db';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {updatePullRequestComment} from '../../models/PullRequestComment';
import {refreshPullRequests} from '../../models/PullRequests';
import {updatePullRequestStatus} from '../../models/PullRequestStatus';
import {getRepositoryFromRestParams} from '../../models/Repositories';

export default async function onInstallation(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadInstallation>,
  logger: Logger,
) {
  const client = getClientForEvent(e);

  const repos = await Promise.all(
    e.payload.repositories.map(async (repository) => {
      const [owner, name] = repository.full_name.split('/');
      const repo = await getRepositoryFromRestParams(db, client, {
        owner,
        name,
      });
      if (repo) {
        logger.info('added_repository', `Added repository: ${owner}/${name}`, {
          repo_owner: owner,
          repo_name: name,
        });
      }
      return repo;
    }),
  );

  await Promise.all(
    repos.map(async (repo) => {
      if (repo) {
        await refreshPullRequests(db, client, repo, logger);
        const pullRequests = await tables
          .pull_requests(db)
          .find({is_closed: false})
          .all();
        for (const pullRequest of pullRequests) {
          await updatePullRequestComment(db, client, repo, pullRequest, logger);
        }
      }
    }),
  );

  // Updating statuses on commits requires loading the git history.
  // If this is the first time, that's going to require lots of RAM, so
  // to give us the best possible chance, we only do this with one
  // repository at a time.
  // We also only do it for open pull requests
  for (const repo of repos) {
    if (repo) {
      const pullRequests = await tables
        .pull_requests(db)
        .find({is_closed: false})
        .all();
      for (const pullRequest of pullRequests) {
        await updatePullRequestStatus(db, client, repo, pullRequest, logger);
      }
    }
  }
}
import type WebhooksApi from '@octokit/webhooks';

import db, {tables} from '@rollingversions/db';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {updatePullRequestComment} from '../../models/PullRequestComment';
import {refreshPullRequests} from '../../models/PullRequests';
import {updatePullRequestStatus} from '../../models/PullRequestStatus';
import {getRepositoryFromRestParams} from '../../models/Repositories';

export default async function onInstallationRepositoriesAdded(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadInstallationRepositories>,
  logger: Logger,
) {
  const client = getClientForEvent(e);

  const repos = await Promise.all(
    e.payload.repositories_added.map(async (repository) => {
      const [owner, name] = repository.full_name.split('/');
      const repo = await getRepositoryFromRestParams(db, client, {
        owner,
        name,
      });
      if (repo) {
        logger.info('added_repository', `Added repository: ${owner}/${name}`, {
          repo_owner: owner,
          repo_name: name,
        });
      }
      return repo;
    }),
  );

  await Promise.all(
    repos.map(async (repo) => {
      if (repo) {
        await refreshPullRequests(db, client, repo, logger);
        const pullRequests = await tables
          .pull_requests(db)
          .find({is_closed: false})
          .all();
        for (const pullRequest of pullRequests) {
          await updatePullRequestComment(db, client, repo, pullRequest, logger);
        }
      }
    }),
  );

  // Updating statuses on commits requires loading the git history.
  // If this is the first time, that's going to require lots of RAM, so
  // to give us the best possible chance, we only do this with one
  // repository at a time.
  // We also only do it for open pull requests
  for (const repo of repos) {
    if (repo) {
      const pullRequests = await tables
        .pull_requests(db)
        .find({is_closed: false})
        .all();
      for (const pullRequest of pullRequests) {
        await updatePullRequestStatus(db, client, repo, pullRequest, logger);
      }
    }
  }
}
import type WebhooksApi from '@octokit/webhooks';

import db from '@rollingversions/db';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {markRepoAsUpdated, updateRepoIfChanged} from '../../models/git';
import {upsertPullRequestFromPayload} from '../../models/PullRequests';
import {upsertRepositoryFromEventPayload} from '../../models/Repositories';

export default async function onPullRequestClosed(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
  logger: Logger,
) {
  const repo = await upsertRepositoryFromEventPayload(db, e.payload.repository);
  await markRepoAsUpdated(db, repo);

  const client = getClientForEvent(e);

  await upsertPullRequestFromPayload(
    db,
    client,
    repo,
    e.payload.pull_request,
    logger,
  );
  await updateRepoIfChanged(db, client, repo.id, logger);
}
import type WebhooksApi from '@octokit/webhooks';

import db from '@rollingversions/db';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {markRepoAsUpdated} from '../../models/git';
import {updatePullRequestComment} from '../../models/PullRequestComment';
import {upsertPullRequestFromPayload} from '../../models/PullRequests';
import {updatePullRequestStatus} from '../../models/PullRequestStatus';
import {upsertRepositoryFromEventPayload} from '../../models/Repositories';

export default async function onPullRequestUpdate(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
  logger: Logger,
) {
  const repo = await upsertRepositoryFromEventPayload(db, e.payload.repository);
  await markRepoAsUpdated(db, repo);

  const client = getClientForEvent(e);

  const pr = await upsertPullRequestFromPayload(
    db,
    client,
    repo,
    e.payload.pull_request,
    logger,
  );

  await updatePullRequestComment(db, client, repo, pr, logger);
  await updatePullRequestStatus(db, client, repo, pr, logger);
}
import type WebhooksApi from '@octokit/webhooks';

import db from '@rollingversions/db';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {markRepoAsUpdated, updateRepoIfChanged} from '../../models/git';
import {upsertRepositoryFromEventPayload} from '../../models/Repositories';

export default async function onPush(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPush>,
  logger: Logger,
) {
  const repo = await upsertRepositoryFromEventPayload(db, e.payload.repository);
  await markRepoAsUpdated(db, repo);
  const client = getClientForEvent(e);
  void updateRepoIfChanged(db, client, repo.id, logger).catch((ex) => {
    logger.error(`update_repo_failed`, ex.stack);
  });
}
import type {WebhookEvent} from '@octokit/webhooks';
import WebhooksApi from '@octokit/webhooks';

import {WEBHOOK_SECRET} from '../environment';
import logger from '../logger';
import type {Logger} from '../logger';
import onCreate from './events/onCreate';
import onDelete from './events/onDelete';
import onInstallation from './events/onInstallation';
import onInstallationRepositoriesAdded from './events/onInstallationRepositoriesAdded';
import onPullRequestClosed from './events/onPullRequestClosed';
import onPullRequestUpdate from './events/onPullRequestUpdate';
import onPush from './events/onPush';

const webhooks = new WebhooksApi({secret: WEBHOOK_SECRET});

async function withLog(
  event: WebhookEvent<unknown>,
  {message, ...otherParams}: {message: string; [key: string]: any},
  fn: (logger: Logger) => Promise<void>,
) {
  const txLogger = logger.withTransaction({
    txid: event.id,
    event_name: event.name,
    ...otherParams,
  });
  txLogger.info(`${event.name}:received`, `${message} Received`);
  const timer = txLogger.withTimer();
  try {
    await fn(txLogger);
    timer.info(`${event.name}:handled`, `${message} Handled`);
  } catch (ex) {
    timer.error(
      `${event.name}:errored`,
      `${ex.stack || ex.message || ex}`,
      typeof ex === 'object' && ex !== null ? {...ex} : {},
    );
  }
}

webhooks.on('installation_repositories.added', async (e) => {
  await withLog(
    e,
    {
      message: 'Repository installation added',
      repo_owner: e.payload.sender.login,
      count: e.payload.repositories_added.length,
    },
    (logger) => onInstallationRepositoriesAdded(e, logger),
  );
});

webhooks.on('installation.created', async (e) => {
  await withLog(
    e,
    {
      message: 'New Installation',
      repo_owner: e.payload.sender.login,
      count: e.payload.repositories.length,
    },
    (logger) => onInstallation(e, logger),
  );
});

webhooks.on('create', async (e) => {
  await withLog(
    e,
    {
      message: 'Branch or tag created',
      repo_id: e.payload.repository.id,
      repo_owner: e.payload.repository.owner.login,
      repo_name: e.payload.repository.name,
      ref_type: e.payload.ref_type,
      ref_name: e.payload.ref,
    },
    (logger) => onCreate(e, logger),
  );
});
webhooks.on('delete', async (e) => {
  await withLog(
    e,
    {
      message: 'Branch or tag deleted',
      repo_id: e.payload.repository.id,
      repo_owner: e.payload.repository.owner.login,
      repo_name: e.payload.repository.name,
      ref_type: e.payload.ref_type,
      ref_name: e.payload.ref,
    },
    () => onDelete(e, logger),
  );
});

webhooks.on('pull_request.opened', onPullRequest('Pull Request Opened'));
webhooks.on('pull_request.edited', onPullRequest('Pull Request Edited'));
webhooks.on(
  'pull_request.synchronize',
  onPullRequest('Pull Request Synchronized'),
);

function onPullRequest(message: string) {
  return async (
    e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
  ) => {
    await withLog(
      e,
      {
        message,
        repo_id: e.payload.repository.id,
        repo_owner: e.payload.repository.owner.login,
        repo_name: e.payload.repository.name,
        pull_number: e.payload.pull_request.number,
        pull_id: e.payload.pull_request.id,
      },
      (logger) => onPullRequestUpdate(e, logger),
    );
  };
}

webhooks.on('pull_request.closed', async (e) => {
  await withLog(
    e,
    {
      message: 'Pull Request Closed',
      repo_id: e.payload.repository.id,
      repo_owner: e.payload.repository.owner.login,
      repo_name: e.payload.repository.name,
      pull_number: e.payload.pull_request.number,
      pull_id: e.payload.pull_request.id,
    },
    (logger) => onPullRequestClosed(e, logger),
  );
});

webhooks.on('push', async (e) => {
  await withLog(
    e,
    {
      message: 'Repository Push',
      repo_id: e.payload.repository.id,
      repo_owner: e.payload.repository.owner.login,
      repo_name: e.payload.repository.name,
    },
    (logger) => onPush(e, logger),
  );
});

export default webhooks;
declare module '*.svg' {
  const SvgIcon: (props: React.SVGProps<SVGElement>) => React.ReactElement;
  export default SvgIcon;
}

declare module '!url-loader!*.svg' {
  const url: string;
  export default url;
}
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
import {useState, useEffect} from 'react';

export default function useChanges(fn: () => void, watch: unknown[]) {
  const [isFirstCall, setIsFirstCall] = useState(true);
  useEffect(() => {
    if (isFirstCall) {
      setIsFirstCall(false);
    } else {
      fn();
    }
  }, watch);
}
import {useState, useEffect} from 'react';

export default function useDebounce<T>(value: T, milliseconds: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(value);
    }, milliseconds);
    return () => clearTimeout(timeout);
  }, [value]);
  return debounced;
}
import React from 'react';

import {
  PullRequestResponse,
  PullRequestResponseCodec,
  UpdatePullRequestBody,
  UpdatePullRequestBodyCodec,
} from '../../types';

export default function usePullRequest({
  owner,
  repo,
  pull_number,
}: {
  owner: string;
  repo: string;
  pull_number: string | number;
}) {
  const path = `/${owner}/${repo}/pull/${pull_number}`;
  const ref = React.useRef(path);
  ref.current = path;
  const [pullRequest, setPullRequest] = React.useState<
    PullRequestResponse | undefined
  >();
  const [error, setError] = React.useState<string | undefined>();
  const [updatesInFlight, setUpdatesInFlight] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`${path}/json`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`${res.statusText}: ${await res.text()}`);
        }
        return await res.json();
      })
      .then((data) => PullRequestResponseCodec.safeParse(data))
      .then((data) => {
        if (cancelled) return;
        if (data.success) setPullRequest(data.value);
        else setError(data.message);
      })
      .catch((ex) => {
        if (cancelled) return;
        setError(ex.message);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return {
    pullRequest,
    error,
    updating: updatesInFlight > 0,
    update: async (body: UpdatePullRequestBody): Promise<boolean> => {
      setUpdatesInFlight((v) => v + 1);
      try {
        try {
          const res = await fetch(path, {
            method: 'POST',
            body: JSON.stringify(UpdatePullRequestBodyCodec.serialize(body)),
            headers: {'Content-Type': 'application/json'},
          });
          if (!res.ok) {
            throw new Error(`${res.statusText}: ${await res.text()}`);
          }
          return true;
        } catch (ex) {
          if (ref.current === path) {
            setError(ex);
          }
          return false;
        }
      } finally {
        setUpdatesInFlight((v) => v - 1);
      }
    },
  };
}
let nextID = 1;
export default function getLocalId() {
  return nextID++;
}
import {Transform} from 'stream';

export default class BatchStream extends Transform {
  constructor({maxBatchSize}: {maxBatchSize: number}) {
    let batch: any[] = [];
    super({
      writableObjectMode: true,
      readableObjectMode: true,
      transform(chunk, _encoding, cb) {
        batch.push(chunk);
        if (batch.length === maxBatchSize) {
          this.push(batch);
          batch = [];
        }
        cb();
      },
      flush(cb) {
        this.push(batch);
        batch = [];
        cb();
      },
    });
  }
}
import {URL} from 'url';

import type ChangeSet from '@rollingversions/change-set';
import {changesToMarkdown, isEmptyChangeSet} from '@rollingversions/change-set';
import {printTag} from '@rollingversions/tag-format';
import {PackageManifest, PullRequest, VersionTag} from '@rollingversions/types';
import {getNextVersion, printString} from '@rollingversions/version-number';

import type {PullRequestPackage} from '../types';

// N.B. this comment guid must be kept in sync with the CLI for now
export const COMMENT_GUID = `9d24171b-1f63-43f0-9019-c4202b3e8e22`;
const COMMENT_PREFIX = `<!-- This comment is maintained by Rolling Versions. Do not edit it manually! -->\n<!-- ${COMMENT_GUID} -->\n\n`;

export function getVersionShift(
  currentVersion: VersionTag | null,
  changes: ChangeSet,
  manifest: PackageManifest,
) {
  const newVersion = getNextVersion(currentVersion?.version ?? null, changes, {
    changeTypes: manifest.changeTypes,
    versionSchema: manifest.versionSchema,
    baseVersion: manifest.baseVersion,
  });

  return `(${
    currentVersion?.version
      ? manifest.tagFormat
        ? currentVersion.name
        : printString(currentVersion.version)
      : 'unreleased'
  } → ${
    newVersion
      ? manifest.tagFormat
        ? printTag(newVersion, {
            packageName: manifest.packageName,
            versionSchema: manifest.versionSchema,
            tagFormat: manifest.tagFormat,
            oldTagName: null,
          })
        : printString(newVersion)
      : 'no new release'
  })`;
}

export function getUrlForChangeLog(pr: PullRequest, rollingVersionsUrl: URL) {
  const url = new URL(
    `/${pr.repo.owner}/${pr.repo.name}/pull/${pr.number}`,
    rollingVersionsUrl,
  );
  return url;
}

export function getShortDescription(packages: Map<string, PullRequestPackage>) {
  const packagesToRelease = [...packages].filter(
    ([, {changeSet}]) => !isEmptyChangeSet(changeSet),
  );
  if (packagesToRelease.length === 0) {
    return 'no changes to release';
  }
  if (packagesToRelease.length === 1) {
    return `releasing ${packagesToRelease[0][0]}`;
  }
  return 'releasing multiple packages';
}

export function renderInitialCommentWithoutState(
  pullRequest: PullRequest,
  rollingVersionsUrl: URL,
) {
  const url = getUrlForChangeLog(pullRequest, rollingVersionsUrl);
  return `There is no change log for this pull request yet.\n\n[Create a changelog](${url.href})`;
}

export function renderCommentWithoutState(
  pullRequest: Omit<PullRequest, 'headSha'> & {headSha: string | null},
  submittedAtCommitSha: string | null,
  packagesMap: Map<string, PullRequestPackage>,
  packageErrors: {filename: string; error: string}[],
  rollingVersionsUrl: URL,
) {
  const url = getUrlForChangeLog(pullRequest, rollingVersionsUrl);
  const warnings =
    (packageErrors.length === 0
      ? ``
      : [
          `\n\n> Errors were encountered while parsing:`,
          ...packageErrors.map((e) => `>  - ${e.filename}`),
        ].join(`\n`)) +
    (pullRequest.headSha === submittedAtCommitSha
      ? ``
      : `\n\n> **Change log has not been updated since latest commit** [Update Changelog](${url.href})`);

  const packages = [...packagesMap].sort(([a], [b]) => (a < b ? -1 : 1));
  if (packages.length === 1) {
    const [packageName, {changeSet, currentVersion, manifest}] = packages[0];
    if (isEmptyChangeSet(changeSet)) {
      return `This PR will **not** result in a new version of ${packageName} as there are no user facing changes.\n\n[Add changes to trigger a release](${url.href})${warnings}`;
    }
    return `### Change Log for ${packageName} ${getVersionShift(
      currentVersion,
      changeSet,
      manifest,
    )}\n\n${changesToMarkdown(changeSet, {
      headingLevel: 4,
      changeTypes: manifest.changeTypes,
    })}\n\n[Edit changelog](${url.href})${warnings}`;
  }

  const packagesWithChanges = packages.filter(([, {changeSet}]) => {
    return !isEmptyChangeSet(changeSet);
  });
  const packagesWithoutChanges = packages.filter(([, {changeSet}]) => {
    return isEmptyChangeSet(changeSet);
  });
  if (!packagesWithChanges.length) {
    return `This PR will **not** result in a new version of the following packages as there are no user facing changes:\n\n${packages
      .map(([packageName]) => `- ${packageName}`)
      .join('\n')}\n\n[Add changes to trigger a release](${
      url.href
    })${warnings}`;
  }
  return `${packagesWithChanges
    .map(([packageName, {changeSet, currentVersion, manifest}]) => {
      return `### ${packageName} ${getVersionShift(
        currentVersion,
        changeSet,
        manifest,
      )}\n\n${changesToMarkdown(changeSet, {
        headingLevel: 4,
        changeTypes: manifest.changeTypes,
      })}`;
    })
    .join('\n\n')}${
    packagesWithoutChanges.length
      ? `\n\n### Packages With No Changes\n\nThe following packages have no user facing changes, so won't be released:\n\n${packagesWithoutChanges
          .map(([packageName]) => `- ${packageName}`)
          .join('\n')}`
      : ``
  }\n\n[Edit changelogs](${url.href})${warnings}`;
}

export function renderInitialComment(
  pullRequest: PullRequest,
  rollingVersionsUrl: URL,
) {
  return `${COMMENT_PREFIX}${renderInitialCommentWithoutState(
    pullRequest,
    rollingVersionsUrl,
  )}`;
}
export function renderComment(
  pullRequest: Omit<PullRequest, 'headSha'> & {headSha: string | null},
  submittedAtCommitSha: string | null,
  manifests: {
    packages: Map<string, PullRequestPackage>;
    packageErrors: {filename: string; error: string}[];
  },
  rollingVersionsUrl: URL,
) {
  return `${COMMENT_PREFIX}${renderCommentWithoutState(
    pullRequest,
    submittedAtCommitSha,
    manifests.packages,
    manifests.packageErrors,
    rollingVersionsUrl,
  )}`;
}
import {URL} from 'url';

import {DEFAULT_CONFIG} from '@rollingversions/config';

import type {PullRequestPackage} from '../../types';
import {renderCommentWithoutState} from '../Rendering';

function mockPackage(
  packageName: string,
  {
    changeSet,
    released,
    ...manifest
  }: Partial<PullRequestPackage['manifest']> & {
    changeSet?: PullRequestPackage['changeSet'];
    released?: boolean;
  } = {},
): PullRequestPackage {
  return {
    manifest: {
      ...DEFAULT_CONFIG,
      customized: [],
      packageName: packageName,
      targetConfigs: [],
      dependencies: {required: [], optional: [], development: []},
      ...manifest,
    },
    currentVersion: null,
    changeSet: changeSet ?? [],
    released: released ?? false,
  };
}

test('renderCommentWithoutState', () => {
  expect(
    renderCommentWithoutState(
      {
        repo: {owner: 'Foo', name: 'bar'},
        number: 10,
        headSha: 'd38990d3d54749a1408e7ca29e139e3c9743aa2e',
      },
      'd38990d3d54749a1408e7ca29e139e3c9743aa2e',
      new Map([
        ['changelogversion\u002dutils', mockPackage('changelogversion-utils')],
        [
          'changelogversion',
          mockPackage('changelogversion', {
            changeSet: [
              {type: 'feat', title: 'Something awesome was added', body: ''},
            ],
          }),
        ],
        [
          'changelogversion\u002dserver',
          mockPackage('changelogversion-server'),
        ],
      ]),
      [],
      new URL('https://example.com'),
    ),
  ).toMatchInlineSnapshot(`
    "### changelogversion (unreleased → 1.0.0)

    #### New Features

    - Something awesome was added

    ### Packages With No Changes

    The following packages have no user facing changes, so won't be released:

    - changelogversion-server
    - changelogversion-utils

    [Edit changelogs](https://example.com/Foo/bar/pull/10)"
  `);
});
import dedupeByKey from '../dedupeByKey';

test('dedupeByKey', async () => {
  const dedupe = dedupeByKey<string, number>();
  const getter = jest.fn().mockImplementation(async (key: string) => {
    await new Promise((r) => setTimeout(r, 100));
    return key.length;
  });
  // parallel requests are always deduped
  const results = await Promise.all([
    dedupe('foo', getter),
    dedupe('foo', getter),
    dedupe('foo', getter),
    dedupe('foo', getter),
    dedupe('foo', getter),
    dedupe('foo', getter),
    dedupe('hello world', getter),
    dedupe('hello world', getter),
    dedupe('hello world', getter),
    dedupe('hello world', getter),
  ]);
  expect(results).toEqual([
    'foo'.length,
    'foo'.length,
    'foo'.length,
    'foo'.length,
    'foo'.length,
    'foo'.length,
    'hello world'.length,
    'hello world'.length,
    'hello world'.length,
    'hello world'.length,
  ]);
  expect(getter).toBeCalledTimes(2);

  // sequential requests are not deduped
  expect(await dedupe('foo', getter)).toBe('foo'.length);
  expect(await dedupe('foo', getter)).toBe('foo'.length);
  expect(await dedupe('foo', getter)).toBe('foo'.length);
  expect(getter).toBeCalledTimes(5);
});
import mapGetOrSet from '../mapGetOrSet';

test('with empty map', () => {
  const getter = jest.fn().mockReturnValue(42);
  const map = new Map<string, number>();
  const result = mapGetOrSet(map, 'foo', getter);
  expect(result).toBe(42);
  expect(getter).toBeCalledTimes(1);
  expect(map.get('foo')).toBe(42);
});

test('with existing key in map', () => {
  const getter = jest.fn().mockReturnValue(1);
  const map = new Map<string, number>([['foo', 42]]);
  const result = mapGetOrSet(map, 'foo', getter);
  expect(result).toBe(42);
  expect(getter).not.toBeCalled();
  expect(map.get('foo')).toBe(42);
});

test('with empty map and method after populating', () => {
  const getter = jest.fn().mockReturnValue(42);
  const map = new Map<string, number>();
  const onValue = jest.fn().mockImplementation((value, key) => {
    expect(value).toBe(42);
    expect(key).toBe('foo');
    // expect the map to already be populated
    expect(map.get('foo')).toBe(42);
  });
  const result = mapGetOrSet(map, 'foo', getter, onValue);
  expect(result).toBe(42);
  expect(getter).toBeCalledTimes(1);
  expect(map.get('foo')).toBe(42);
  expect(onValue).toBeCalledTimes(1);
});

test('with existing key in map and method after populating', () => {
  const getter = jest.fn().mockReturnValue(1);
  const onValue = jest.fn();
  const map = new Map<string, number>([['foo', 42]]);
  const result = mapGetOrSet(map, 'foo', getter, onValue);
  expect(result).toBe(42);
  expect(getter).not.toBeCalled();
  expect(map.get('foo')).toBe(42);
  expect(onValue).not.toBeCalled();
});
export default function batchArray<T>(
  input: T[],
  {maxBatchSize}: {maxBatchSize: number},
) {
  const batchCount = Math.ceil(input.length / maxBatchSize);
  const batchSize = Math.ceil(input.length / batchCount);
  const results: T[][] = [];
  for (let i = 0; i < input.length; i += batchSize) {
    results.push(input.slice(i, i + batchSize));
  }
  return results;
}
// TODO: publish this to npm

import mapGetOrSet from './mapGetOrSet';

export default function dedupeByKey<TKey, TResult>() {
  const cache = new Map<TKey, Promise<TResult>>();
  return async (key: TKey, fn: (key: TKey) => Promise<TResult>) => {
    return await mapGetOrSet(
      cache,
      key,
      async () => await fn(key),
      (result) =>
        void result.then(
          () => cache.delete(key),
          () => cache.delete(key),
        ),
    );
  };
}
// TODO: publish this to npm

export default function groupByKey<TEntry, TKey>(
  entries: readonly TEntry[],
  getKey: (entry: TEntry) => TKey,
): Map<TKey, TEntry[]> {
  const results = new Map<TKey, TEntry[]>();
  for (const entry of entries) {
    const key = getKey(entry);
    const existing = results.get(key);
    if (existing) {
      existing.push(entry);
    } else {
      results.set(key, [entry]);
    }
  }
  return results;
}
export default function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
export default function isObject(
  value: unknown,
): value is {[key: string]: unknown} {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
// TODO: publish this to npm

export default function mapGetOrSet<TKey, TResult>(
  // can be a Map<TKey, TResult> or WeakMap<TKey, TResult>, or any similar shape
  cache: {
    get(key: TKey): Exclude<TResult, undefined> | undefined;
    set(key: TKey, value: Exclude<TResult, undefined>): unknown;
  },
  key: TKey,
  fn: (key: TKey) => Exclude<TResult, undefined>,
  onFreshValue?: (value: Exclude<TResult, undefined>, key: TKey) => void,
): Exclude<TResult, undefined> {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const fresh = fn(key);
  cache.set(key, fresh);
  if (onFreshValue) onFreshValue(fresh, key);
  return fresh;
}
import paginateBatched from './paginateBatched';

export default async function* paginate<TPage, TEntry>(
  getPage: (token?: string) => Promise<TPage>,
  getEntries: (page: TPage) => TEntry[],
  getNextPageToken: (page: TPage) => string | undefined,
) {
  for await (const page of paginateBatched(
    getPage,
    getEntries,
    getNextPageToken,
  )) {
    for (const item of page) {
      yield item;
    }
  }
}
export default async function* paginateBatched<TPage, TEntry>(
  getPage: (token?: string) => Promise<TPage>,
  getEntries: (page: TPage) => TEntry[],
  getNextPageToken: (page: TPage) => string | undefined,
) {
  let nextPage: Promise<TPage> | undefined;
  let currentPage: TPage | undefined;
  let nextPageToken: string | undefined;
  do {
    nextPage = getPage(nextPageToken);
    nextPage.catch(() => {
      // swallow errors here because otherwise they can be
      // reported as unhandled exceptions before we get to
      // the part where we await this promise
    });
    if (currentPage) {
      const entries = getEntries(currentPage);
      if (entries.length) {
        yield entries;
      }
    }
    currentPage = await nextPage;
    nextPageToken = getNextPageToken(currentPage);
  } while (nextPageToken);
  if (currentPage) {
    const entries = getEntries(currentPage);
    if (entries.length) {
      yield entries;
    }
  }
}
import Cache from 'quick-lru';

export default function withCache<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<{result: TResult; expiry: number}>,
  getKey: (...args: TArgs) => any,
) {
  const cache = new Cache<any, Promise<{result: TResult; expiry: number}>>({
    maxSize: 10,
  });
  return async (...args: TArgs): Promise<TResult> => {
    const key = getKey(...args);
    const cachedPromise = cache.get(key);
    if (cachedPromise) {
      const cached = await cachedPromise;
      if (cached.expiry > Date.now()) {
        return cached.result;
      }
    }
    const livePromise = fn(...args);
    cache.set(key, livePromise);
    try {
      const live = await livePromise;
      if (live.expiry < Date.now()) {
        cache.delete(key);
      }
      return live.result;
    } catch (ex) {
      cache.delete(key);
      throw ex;
    }
  };
}
import type {PackageDependencies} from '@rollingversions/types';

export interface CircularPackages {
  readonly circular: true;
  readonly packageNames: string[];
}
export interface SortedPackages<T> {
  readonly circular: false;
  readonly packages: readonly T[];
}

export type SortResult<T> = CircularPackages | SortedPackages<T>;

export default function sortPackagesByDependencies<T>(
  packages: Map<string, T>,
  getDependencies: (pkg: T) => PackageDependencies,
): SortResult<T> {
  function putPackage(
    stack: readonly string[],
    resultSoFar: SortedPackages<T>,
    pkgName: string,
    pkg: T,
  ): SortResult<T> {
    if (resultSoFar.packages.includes(pkg)) {
      return resultSoFar;
    }

    const stackIndex = stack.indexOf(pkgName);
    if (stackIndex !== -1) {
      return {
        circular: true,
        packageNames: stack.slice(stackIndex),
      };
    }

    let result = resultSoFar;

    const childStack = [...stack, pkgName];

    const dependencies = getDependencies(pkg);
    for (const kind of ['required', 'optional', 'development'] as const) {
      for (const dependencyName of dependencies[kind].slice().sort()) {
        const dep = packages.get(dependencyName);
        if (dep) {
          const child = putPackage(childStack, result, dependencyName, dep);
          if (child.circular) {
            if (kind === 'required' || !child.packageNames.includes(pkgName)) {
              return child;
            }
          } else {
            result = child;
          }
        }
      }
    }

    return {circular: false, packages: [...result.packages, pkg]};
  }

  let result: SortedPackages<T> = {
    circular: false,
    packages: [],
  };
  const EMPTY_ARRAY = [] as const;
  for (const [depName, dep] of [...packages].sort(([a], [b]) =>
    a < b ? -1 : 1,
  )) {
    const depResult = putPackage(EMPTY_ARRAY, result, depName, dep);
    if (depResult.circular) {
      return depResult;
    } else {
      result = depResult;
    }
  }
  return result;
}
import compile from './compile';
import {parse} from './parse';
import {Template} from './types';

let cacheA = new Map<string, Template>();
let cacheB = new Map<string, Template>();
function swapFullCaches() {
  if (cacheA.size > 20) {
    [cacheB, cacheA] = [cacheA, cacheB];
    cacheA.clear();
  }
}
export default function parseTemplate(str: string): Template {
  const cachedA = cacheA.get(str);
  if (cachedA) return cachedA;

  const cachedB = cacheB.get(str);
  if (cachedB) {
    cacheA.set(str, cachedB);
    swapFullCaches();
    return cachedB;
  }

  const fresh = compile(parse(str));
  cacheA.set(str, fresh);
  swapFullCaches();

  return fresh;
}
import {parseTag} from '..';
import type {ParseTagContext} from '..';

const baseContext: ParseTagContext = {
  allowTagsWithoutPackageName: false,
  packageName: 'my-package',
  tagFormat: undefined,
  versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
};
test('parseTag', () => {
  expect(
    parseTag('foo-bar', {
      ...baseContext,
      allowTagsWithoutPackageName: false,
    }),
  ).toBe(null);
  expect(
    parseTag('foo-bar', {
      ...baseContext,
      allowTagsWithoutPackageName: true,
    }),
  ).toBe(null);

  expect(
    parseTag('1.0.0', {
      ...baseContext,
      allowTagsWithoutPackageName: false,
    }),
  ).toBe(null);
  expect(
    parseTag('1.0.0', {
      ...baseContext,
      allowTagsWithoutPackageName: true,
    }),
  ).toEqual({
    numerical: [1, 0, 0],
    prerelease: [],
    build: [],
  });

  expect(
    parseTag('my-package@1.0.0', {
      ...baseContext,
      allowTagsWithoutPackageName: false,
    }),
  ).toEqual({
    numerical: [1, 0, 0],
    prerelease: [],
    build: [],
  });
  expect(
    parseTag('my-package@1.0.0', {
      ...baseContext,
      allowTagsWithoutPackageName: true,
    }),
  ).toEqual({
    numerical: [1, 0, 0],
    prerelease: [],
    build: [],
  });
});

test('Custom tag format', () => {
  expect(
    parseTag('0-4-5', {
      ...baseContext,
      tagFormat: '{{PATCH}}-{{MINOR}}-{{MAJOR}}',
    }),
  ).toEqual({
    numerical: [5, 4, 0],
    prerelease: [],
    build: [],
  });
  expect(
    parseTag('before-0-4-5-after', {
      ...baseContext,
      tagFormat: 'before-{{PATCH}}-{{MINOR}}-{{MAJOR}}-after',
    }),
  ).toEqual({
    numerical: [5, 4, 0],
    prerelease: [],
    build: [],
  });
  expect(
    parseTag('before-0-04-006-after', {
      ...baseContext,
      tagFormat:
        'before-{{ PATCH | pad-number 2 }}-{{ MINOR | pad-number 2 }}-{{ MAJOR | pad-number 3 }}-after',
    }),
  ).toEqual({
    numerical: [6, 4, 0],
    prerelease: [],
    build: [],
  });
});

test('Custom tag format with optional sections', () => {
  expect(
    parseTag('1.2.3', {
      ...baseContext,
      tagFormat: '{{MAJOR}}.{{MINOR}}{{?.{{PATCH}}}}',
    }),
  ).toEqual({
    numerical: [1, 2, 3],
    prerelease: [],
    build: [],
  });

  expect(
    parseTag('1.2', {
      ...baseContext,
      tagFormat: '{{MAJOR}}.{{MINOR}}.{{PATCH}}',
    }),
  ).toEqual(null);

  expect(
    parseTag('1.2', {
      ...baseContext,
      tagFormat: '{{MAJOR}}.{{MINOR}}{{?.{{PATCH}}}}',
    }),
  ).toEqual({
    numerical: [1, 2, 0],
    prerelease: [],
    build: [],
  });
});
import {printTag} from '..';

test('printTag', () => {
  expect(
    printTag(
      {
        numerical: [1, 0, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        oldTagName: null,
        tagFormat: undefined,
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
      },
    ),
  ).toBe(`my-package-name@1.0.0`);
  expect(
    printTag(
      {
        numerical: [1, 0, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        oldTagName: 'my-package-name@v0.0.0',
        tagFormat: undefined,
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
      },
    ),
  ).toBe(`my-package-name@v1.0.0`);
  expect(
    printTag(
      {
        numerical: [1, 0, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        oldTagName: 'v0.0.0',
        tagFormat: undefined,
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
      },
    ),
  ).toBe(`v1.0.0`);
  expect(
    printTag(
      {
        numerical: [1, 0, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        oldTagName: '0.0.0',
        tagFormat: undefined,
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
      },
    ),
  ).toBe(`1.0.0`);

  expect(
    printTag(
      {
        numerical: [1, 0, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        oldTagName: null,
        tagFormat: '{{MAJOR}}/{{MINOR}}/{{PATCH}}',
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
      },
    ),
  ).toBe(`1/0/0`);

  expect(
    printTag(
      {
        numerical: [1, 0, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        oldTagName: null,
        tagFormat:
          '{{MAJOR | pad-number 4}}/{{MINOR | pad-number 3}}/{{PATCH | pad-number 6}}',
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
      },
    ),
  ).toBe(`0001/000/000000`);
});

test('Custom tag format with optional sections', () => {
  expect(
    printTag(
      {
        numerical: [1, 2, 3],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
        oldTagName: null,
        tagFormat: '{{MAJOR}}.{{MINOR}}{{?.{{PATCH}}}}',
      },
    ),
  ).toEqual(`1.2.3`);

  expect(
    printTag(
      {
        numerical: [1, 2, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
        oldTagName: null,
        tagFormat: '{{MAJOR}}.{{MINOR}}.{{PATCH}}',
      },
    ),
  ).toEqual(`1.2.0`);

  expect(
    printTag(
      {
        numerical: [1, 2, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
        oldTagName: null,
        tagFormat: '{{MAJOR}}.{{MINOR}}{{?.{{PATCH}}}}',
      },
    ),
  ).toEqual(`1.2`);
});
import {Node, ParseState, Template} from './types';

interface TemplatePart {
  variables: string[];
  print: (getVersionPart: (id: string) => string) => string;
  /**
   * Parse the next part of the version and return `null` if it failed
   * to match and the remaining string if it matched. Call matchVersionPart
   * for each version part. The call to matchVersionPart
   */
  parse: <T>(
    state: ParseState<T>,
    matchVersionPart: (
      state: ParseState<T>,
      variableName: string,
    ) => null | ParseState<T>,
  ) => null | ParseState<T>;
}

function mergeVariables(body: TemplatePart[]) {
  const variables: string[] = [];
  for (const b of body) {
    for (const v of b.variables) {
      if (variables.includes(v)) {
        throw new Error(`Duplicate variable in tag format: ${v}`);
      }
      variables.push(v);
    }
  }
  return variables;
}
function compileNode(node: Node): TemplatePart {
  switch (node.type) {
    case 'literal':
      return {
        variables: [],
        print() {
          return node.value;
        },
        parse(state) {
          if (state.rest.startsWith(node.value)) {
            state.rest = state.rest.substr(node.value.length);
            return state;
          } else {
            return null;
          }
        },
      };
    case 'variable':
      return {
        variables: [node.name],
        print(getVersionPart) {
          return node.filters.reduce<string>(
            (value, filter): string => filter(value),
            getVersionPart(node.name),
          );
        },
        parse(state, matchVersionPart) {
          return matchVersionPart(state, node.name);
        },
      };
    case 'optional_section': {
      const body = node.body.map((n) => compileNode(n));
      const variables = mergeVariables(body);
      return {
        variables,
        print(getVersionPart) {
          if (variables.every((v) => getVersionPart(v) === `0`)) {
            return ``;
          }
          return body.map((b) => b.print(getVersionPart)).join(``);
        },
        parse(state, matchVersionPart) {
          // deep copy the state in case we are unable to match
          // the optional part
          let lastState = {rest: state.rest, values: state.values.slice()};
          for (const b of body) {
            const match = b.parse(lastState, matchVersionPart);
            // if part of this optional section does not match,
            // return the state before the optional section
            if (!match) return state;
            lastState = match;
          }
          return lastState;
        },
      };
    }
    case 'root': {
      const body = node.body.map((n) => compileNode(n));
      const variables = mergeVariables(body);
      return {
        variables,
        print(getVersionPart) {
          return body.map((b) => b.print(getVersionPart)).join(``);
        },
        parse(state, matchVersionPart) {
          let lastState = state;
          for (const b of body) {
            const match = b.parse(lastState, matchVersionPart);
            if (!match) return null;
            lastState = match;
          }
          return lastState;
        },
      };
    }
  }
}

export default function compile(node: Node): Template {
  const templatePart = compileNode(node);
  return {
    variables: templatePart.variables,
    parse(tag, matchVersionPart) {
      return (
        templatePart.parse({rest: tag, values: []}, matchVersionPart)?.values ??
        null
      );
    },
    print(getVersionPart) {
      return templatePart.print(getVersionPart);
    },
  };
}
import {DEFAULT_VERSION_SCHEMA} from '@rollingversions/config';
import type {VersionNumber, VersionSchema} from '@rollingversions/types';
import {parseString, printString} from '@rollingversions/version-number';

import parseTemplate from './TemplateCache';

export interface PrintTagContext {
  packageName: string;
  oldTagName: string | null;
  versionSchema?: VersionSchema;
  tagFormat?: string;
}
export function printTag(
  version: VersionNumber,
  {
    packageName,
    oldTagName,
    versionSchema = DEFAULT_VERSION_SCHEMA,
    tagFormat,
  }: PrintTagContext,
): string {
  if (tagFormat) {
    return parseTemplate(tagFormat).print((variableName: string) => {
      if (variableName === 'PACKAGE_NAME') {
        return packageName;
      }
      const i = versionSchema.indexOf(variableName);
      if (i !== -1) {
        return version.numerical[i].toString(10);
      }
      throw new Error(`Unsupported variable: "${variableName}"`);
    });
  }

  let versionString = ``;
  if (!oldTagName || oldTagName.includes('@'))
    versionString += `${packageName}@`;
  if (oldTagName && oldTagName[versionString.length] === 'v')
    versionString += `v`;
  versionString += printString(version);
  return versionString;
}

export interface ParseTagContext {
  allowTagsWithoutPackageName: boolean;
  packageName: string;
  versionSchema?: VersionSchema;
  tagFormat?: string;
}
export function parseTag(
  tagName: string,
  {
    allowTagsWithoutPackageName,
    packageName,
    versionSchema = DEFAULT_VERSION_SCHEMA,
    tagFormat,
  }: ParseTagContext,
): VersionNumber | null {
  if (tagFormat) {
    const numerical = versionSchema.map(() => 0);
    const values = parseTemplate(tagFormat).parse<[string, number]>(
      tagName,
      (state, variableName) => {
        if (variableName === 'PACKAGE_NAME') {
          if (!state.rest.startsWith(packageName)) return null;

          state.rest = state.rest.substr(packageName.length);

          return state;
        } else {
          const match = /^\d+/.exec(state.rest);
          if (!match) return null;

          state.values.push([variableName, parseInt(match[0], 10)]);
          state.rest = state.rest.substr(match[0].length);

          return state;
        }
      },
    );
    if (values) {
      for (const [variableName, value] of values) {
        const i = versionSchema.indexOf(variableName);
        if (i === -1) {
          throw new Error(`Unsupported variable: "${variableName}"`);
        }
        numerical[i] = value;
      }
      return {
        numerical,
        prerelease: [],
        build: [],
      };
    } else {
      return null;
    }
  }
  if (tagName.startsWith(`${packageName}@`)) {
    return parseString(tagName.substr(`${packageName}@`.length));
  }
  if (allowTagsWithoutPackageName) {
    return parseString(tagName);
  }
  return null;
}
import {Node} from './types';

function indexOfAny(str: string, searchStrings: string[]) {
  const indexes = searchStrings
    .map((s) => str.indexOf(s))
    .filter((i) => i !== -1);
  if (indexes.length === 0) return -1;
  return Math.min(...indexes);
}

function parseExpression(str: string): [Node, string] {
  if (str[0] === `?`) {
    // to parse an optional section, keep parsing nodes until you find the closing "}}"
    const body: Node[] = [];
    let rest = str.substr(1).trim();
    while (!rest.startsWith(`}}`) && rest.length !== 0) {
      const [node, r] = parseNode(rest);
      body.push(node);
      rest = r;
    }
    if (!rest.startsWith(`}}`)) {
      throw new Error(`Tag format has a "{{" without the matching "}}"`);
    }
    return [{type: 'optional_section', body}, rest.substr(2)];
  }

  const closeIdx = str.indexOf(`}}`);
  if (closeIdx === -1) {
    throw new Error(`Tag format has a "{{" without the matching "}}"`);
  }
  const placeholder = str.substr(0, closeIdx);
  const rest = str.substr(closeIdx + 2);
  if (!placeholder) {
    throw new Error(`Tag format has an empty "{{}}" placeholder`);
  }

  const [name, ...filters] = placeholder.split('|').map((str) => str.trim());

  return [
    {
      type: `variable`,
      name,
      filters: filters.map((filter) => {
        const [filterName, ...params] = filter
          .split(' ')
          .filter((v) => v.trim());
        switch (filterName) {
          case 'pad-number': {
            if (params.length !== 1) {
              throw new Error(
                `The ${filterName} filter requires a value for the required length: ${str}`,
              );
            }

            if (!/^[0-9]+$/.test(params[0])) {
              throw new Error(
                `The parameter for the ${filterName} filter must be an integer: ${str}`,
              );
            }

            const length = parseInt(params[0], 10);
            return (str: string) => str.padStart(length, '0');
          }
          default:
            throw new Error(
              `Unrecognized filter in version format, "${filter}" in: ${str}`,
            );
        }
      }),
    },
    rest,
  ];
}

function parseNode(str: string): [Node, string] {
  if (str.startsWith(`{{`)) {
    return parseExpression(str.substr(2));
  } else if (str.startsWith(`}}`)) {
    throw new Error(`Tag format has a "}}" without the matching "{{"`);
  }

  const nextIndex = indexOfAny(str, [`{{`, `}}`]);

  if (nextIndex === -1) {
    // no open or close, so the rest of the string is a literal
    return [{type: 'literal', value: str.trim()}, ''];
  }

  return [
    {type: 'literal', value: str.substr(0, nextIndex).trim()},
    str.substr(nextIndex),
  ];
}

export function parse(str: string): Node {
  const body: Node[] = [];
  let rest = str;
  while (rest.length) {
    const [node, r] = parseNode(rest);
    body.push(node);
    rest = r;
  }
  return {type: 'root', body};
}
export interface LiteralNode {
  type: 'literal';
  value: string;
}
export interface VariableNode {
  type: 'variable';
  name: string;
  filters: ((str: string) => string)[];
}
export interface OptionalSectionNode {
  type: 'optional_section';
  body: Node[];
}
export interface RootNode {
  type: 'root';
  body: Node[];
}
export type Node = LiteralNode | VariableNode | OptionalSectionNode | RootNode;

export type ParseState<T> = {rest: string; values: T[]};
export interface Template {
  variables: string[];
  parse: <T>(
    tag: string,
    matchVersionPart: (
      state: ParseState<T>,
      variableName: string,
    ) => null | ParseState<T>,
  ) => null | T[];
  print: (getVersionPart: (id: string) => string) => string;
}
import ChangeSet from './ChangeSet';
import PackageManifest from './PackageManifest';
import VersionNumber from './VersionNumber';
import {CurrentVersionTag} from './VersionTag';

export interface ApiPackageResponse {
  manifest: PackageManifest;
  changeSet: ChangeSet<{pr: number}>;
  currentVersion: CurrentVersionTag | null;
  newVersion: VersionNumber | null;
}
export interface GetRepositoryApiResponse {
  headSha: string;
  defaultBranch: {name: string; headSha: string | null};
  deployBranch: {name: string; headSha: string | null};
  allBranchNames: string[];
  allTagNames: string[];
  packages: ApiPackageResponse[];
  packageErrors: {filename: string; error: string}[];
  cycleDetected: string[] | null;
}
import * as t from 'funtypes';

export const BaseVersionCodec = t.Readonly(
  t.Array(
    t.Number.withConstraint((v) =>
      v !== Math.floor(v)
        ? 'Version parts must be whole numbers'
        : v < 0
        ? 'Version parts cannot be less than 0'
        : v > Number.MAX_SAFE_INTEGER
        ? 'Version parts must be less than MAX_SAFE_INTEGER'
        : true,
    ),
  ),
);

type BaseVersion = t.Static<typeof BaseVersionCodec>;
export default BaseVersion;
import ChangeTypeID from './ChangeTypeID';
import MarkdownString from './MarkdownString';

export interface ChangeSetEntryBase {
  readonly type: ChangeTypeID;
  readonly title: MarkdownString;
  readonly body: MarkdownString;
}

export type ChangeSetEntry<TContext = {}> = ChangeSetEntryBase & TContext;

type ChangeSet<TContext = {}> = readonly ChangeSetEntry<TContext>[];
export default ChangeSet;
import * as t from 'funtypes';

import {ChangeTypeIdCodec} from './ChangeTypeID';
import {StringDescription} from './Strings';
import {VersionBumpTypeCodec} from './VersionBumpType';

export const ChangeTypeCodec = t.Readonly(
  t.Object({
    id: ChangeTypeIdCodec,
    bumps: t.Union(VersionBumpTypeCodec, t.Null),
    plural: StringDescription,
  }),
);
type ChangeType = t.Static<typeof ChangeTypeCodec>;
export default ChangeType;
import * as t from 'funtypes';

import {StringKey} from './Strings';

type ChangeTypeID = string & {__brand?: 'ChangeTypeID'};
export default ChangeTypeID;

export const ChangeTypeIdCodec = StringKey as t.Codec<ChangeTypeID>;
type MarkdownString = string & {__brand?: 'Markdown'};
export default MarkdownString;
import * as t from 'funtypes';

export const PackageDependenciesCodec = t.Named(
  `PackageDependencies`,
  t.Readonly(
    t.Object({
      required: t.Readonly(t.Array(t.String)),
      optional: t.Readonly(t.Array(t.String)),
      development: t.Readonly(t.Array(t.String)),
    }),
  ),
);

type PackageDependencies = t.Static<typeof PackageDependenciesCodec>;
export default PackageDependencies;
import * as t from 'funtypes';

import {BaseVersionCodec} from './BaseVersion';
import {ChangeTypeCodec} from './ChangeType';
import {PackageDependenciesCodec} from './PackageDependencies';
import {PublishTargetConfigCodec} from './PublishTarget';
import {TagFormatCodec} from './Strings';
import {VersioningModeCodec} from './VersioningMode';
import {VersionSchemaCodec} from './VersionSchema';

export const PackageManifestCodec = t.Named(
  `PackageManifest`,
  t.Intersect(
    t.Readonly(
      t.Object({
        packageName: t.String,
        dependencies: PackageDependenciesCodec,
        targetConfigs: t.Readonly(t.Array(PublishTargetConfigCodec)),

        tagFormat: t.Union(TagFormatCodec, t.Undefined),
        changeTypes: t.ReadonlyArray(ChangeTypeCodec),
        versioningMode: VersioningModeCodec,
        versionSchema: VersionSchemaCodec,
        baseVersion: BaseVersionCodec,
        customized: t.Readonly(
          t.Array(
            t.Union(
              t.Literal(`tagFormat`),
              t.Literal(`changeTypes`),
              t.Literal(`versioningMode`),
              t.Literal(`versionSchema`),
              t.Literal(`baseVersion`),
            ),
          ),
        ),
      }),
    ),
  ),
);

type PackageManifest = t.Static<typeof PackageManifestCodec>;
export default PackageManifest;
import * as t from 'funtypes';

type PublishConfigAccess = 'restricted' | 'public';
export default PublishConfigAccess;

export const PublishConfigAccessCodec = t.Union(
  t.Literal('restricted'),
  t.Literal('public'),
);
import * as t from 'funtypes';

import {PublishConfigAccessCodec} from './PublishConfigAccess';

// N.B. this enum **must** be kept in sync with the publish_targets table in the database
enum PublishTarget {
  npm = 'npm',
  custom_script = 'custom_script',
}
export default PublishTarget;

export const NpmPublishTargetConfigCodec = t.Named(
  `NpmPublishTarget`,
  t.Readonly(
    t.Object({
      type: t.Literal(PublishTarget.npm),
      /**
       * The filename of the package.json file
       */
      path: t.String,
      /**
       * The "name" field in package.json
       */
      packageName: t.String,
      /**
       * The "private" field in package.json (defaults to false)
       */
      private: t.Boolean,
      /**
       * The "publishConfig"."access" field in package.json (defaults to "restricted" if package name stars with "@", otherwise defaults to "public")
       */
      publishConfigAccess: PublishConfigAccessCodec,
    }),
  ),
);
export type NpmPublishTargetConfig = t.Static<
  typeof NpmPublishTargetConfigCodec
>;

export const CustomScriptTargetConfigCodec = t.Named(
  `CustomScriptTarget`,
  t.Intersect(
    t.Readonly(
      t.Object({
        type: t.Literal(PublishTarget.custom_script),
        /**
         * The filename of the rolling-package.* file
         */
        path: t.String,
        /**
         * The command to run in order to publish a new version of the package
         */
        publish: t.String,
      }),
    ),
    t.Readonly(
      t.Partial({
        /**
         * A command to execute before publish/prepublish
         *
         * Use this to check permissions are configured correctly
         */
        prepublish: t.String,
        /**
         * A command to run instead of `publish` when in dry run mode
         *
         * Publish is never called in dry run
         */
        publish_dry_run: t.String,
      }),
    ),
  ),
);
export type CustomScriptTargetConfig = t.Static<
  typeof CustomScriptTargetConfigCodec
>;

export const PublishTargetConfigCodec = t.Named(
  `PublishTarget`,
  t.Union(NpmPublishTargetConfigCodec, CustomScriptTargetConfigCodec),
);

export type PublishTargetConfig = t.Static<typeof PublishTargetConfigCodec>;
import BaseVersion from './BaseVersion';
import ChangeType from './ChangeType';
import {VersioningModeConfig} from './VersioningMode';
import VersionSchema from './VersionSchema';

export default interface RollingConfigOptions {
  readonly tagFormat: string | undefined;
  readonly changeTypes: readonly ChangeType[];
  readonly versioningMode: VersioningModeConfig;
  readonly versionSchema: VersionSchema;
  readonly baseVersion: BaseVersion;
}
import * as t from 'funtypes';

import withMaxLength from './withMaxLength';

const MAX_KEY_LENGTH = 32;
const MAX_DESCRIPTION_LENGTH = 64;
const MAX_TAG_FORMAT_LENGTH = 64;

export const StringKey = withMaxLength(t.String, MAX_KEY_LENGTH);
export const StringDescription = withMaxLength(
  t.String,
  MAX_DESCRIPTION_LENGTH,
);
export const TagFormatCodec = withMaxLength(t.String, MAX_TAG_FORMAT_LENGTH);
import * as t from 'funtypes';

import {StringKey} from './Strings';

type VersionBumpType = string & {__brand?: 'VersionBumpType'};
export default VersionBumpType;

export const VersionBumpTypeCodec = StringKey as t.Codec<VersionBumpType>;
import * as t from 'funtypes';

export const VersionNumberCodec = t.Named(
  `VersionNumber`,
  t.Readonly(
    t.Object({
      numerical: t.Readonly(t.Array(t.Number)),
      prerelease: t.Readonly(t.Array(t.String)),
      build: t.Readonly(t.Array(t.String)),
    }),
  ),
);
type VersionNumber = t.Static<typeof VersionNumberCodec>;

export default VersionNumber;
import * as t from 'funtypes';

import {StringKey} from './Strings';
import VersionBumpType from './VersionBumpType';
import withMaxLength from './withMaxLength';

const MAX_VERSION_SCHEMA_LENGTH = 16;

type VersionSchema = readonly [
  VersionBumpType,
  ...(readonly VersionBumpType[])
];
export default VersionSchema;

export const VersionSchemaCodec: t.Codec<VersionSchema> = withMaxLength(
  t.ReadonlyArray(StringKey),
  MAX_VERSION_SCHEMA_LENGTH,
).withGuard(
  <T>(x: readonly T[]): x is readonly [T, ...(readonly T[])] => x.length !== 0,
  {name: 'VersionSchema'},
);
import * as t from 'funtypes';

import VersionNumber, {VersionNumberCodec} from './VersionNumber';

export const VersionTagCodec = t.Named(
  `VersionTag`,
  t.Readonly(
    t.Object({
      commitSha: t.String,
      name: t.String,
      version: VersionNumberCodec,
    }),
  ),
);
type VersionTag = t.Static<typeof VersionTagCodec>;
export default VersionTag;

export type CurrentVersionTag =
  | {
      ok: true;
      commitSha: string;
      name: string;
      version: VersionNumber;
    }
  | {
      ok: false;
      maxVersion: VersionTag | null;
      branchVersion: VersionTag | null;
    };
import * as t from 'funtypes';
enum VersioningMode {
  Unambiguous = 'UNAMBIGUOUS',
  ByBranch = 'BY_BRANCH',
  AlwaysIncreasing = 'ALWAYS_INCREASING',
}
export default VersioningMode;

const LiteralVersioningModeCodec = t.Enum(`VersioningMode`, VersioningMode);
export const VersioningModeCodec = t.Union(
  LiteralVersioningModeCodec,
  t.Readonly(
    t.Array(
      t.Readonly(
        t.Object({
          branch: t.String,
          mode: LiteralVersioningModeCodec,
        }),
      ),
    ),
  ),
);
export type VersioningModeConfig = t.Static<typeof VersioningModeCodec>;
export type {ApiPackageResponse, GetRepositoryApiResponse} from './ApiResponse';
export type {default as BaseVersion} from './BaseVersion';
export type {ChangeSetEntry, default as ChangeSet} from './ChangeSet';
export type {default as ChangeType} from './ChangeType';
export type {default as ChangeTypeID} from './ChangeTypeID';
export type {default as MarkdownString} from './MarkdownString';
export type {default as PackageDependencies} from './PackageDependencies';
export type {default as PackageManifest} from './PackageManifest';
export {PackageManifestCodec} from './PackageManifest';
export type {default as PublishConfigAccess} from './PublishConfigAccess';
export type {
  PublishTargetConfig,
  NpmPublishTargetConfig,
  CustomScriptTargetConfig,
} from './PublishTarget';
export type {default as RollingConfigOptions} from './RollingConfigOptions';
export type {default as VersionBumpType} from './VersionBumpType';
export type {VersioningModeConfig} from './VersioningMode';
export type {default as VersionNumber} from './VersionNumber';
export type {default as VersionSchema} from './VersionSchema';
export type {default as VersionTag, CurrentVersionTag} from './VersionTag';

export {default as withMaxLength} from './withMaxLength';

export {BaseVersionCodec} from './BaseVersion';
export {TagFormatCodec} from './Strings';
export {ChangeTypeCodec} from './ChangeType';
export {VersioningModeCodec} from './VersioningMode';
export {VersionSchemaCodec} from './VersionSchema';
export {VersionTagCodec} from './VersionTag';
export {default as VersioningMode} from './VersioningMode';
export {default as PublishTarget} from './PublishTarget';

export interface Repository {
  owner: string;
  name: string;
}
export interface PullRequest {
  repo: Repository;
  number: number;
}
import * as t from 'funtypes';

export default function withMaxLength<T extends {readonly length: number}>(
  codec: t.Codec<T>,
  maxLength: number,
): t.Codec<T> {
  return t.Constraint(
    codec,
    (value) =>
      value.length > maxLength
        ? `Length must not be greater than ${maxLength}`
        : true,
    {name: `MaxLength<${codec.show ? codec.show(false) : codec.tag}>`},
  );
}
import {
  getNextVersion,
  gt,
  increment,
  lt,
  max,
  min,
  normalize,
  parseString,
  printString,
  sortAscending,
  sortDescending,
} from '..';

test('parseString', () => {
  expect(parseString('1.0.0')).toEqual({
    numerical: [1, 0, 0],
    prerelease: [],
    build: [],
  });
  expect(parseString('001.0.0')).toEqual({
    numerical: [1, 0, 0],
    prerelease: [],
    build: [],
  });
  expect(parseString('1.0.0alpha.1.3')).toEqual(null);
  expect(parseString('1.0.0-alpha.1.3')).toEqual({
    numerical: [1, 0, 0],
    prerelease: ['alpha', '1', '3'],
    build: [],
  });
  expect(parseString('1.0.0+build.4')).toEqual({
    numerical: [1, 0, 0],
    prerelease: [],
    build: ['build', '4'],
  });
  expect(parseString('1.0.0-alpha.1.3+build.4')).toEqual({
    numerical: [1, 0, 0],
    prerelease: ['alpha', '1', '3'],
    build: ['build', '4'],
  });
  expect(parseString('1.0.0alpha.1.3')).toEqual(null);
  expect(parseString('')).toEqual(null);
  expect(parseString('hello')).toEqual(null);
  expect(parseString('1.0.0-')).toEqual(null);
  expect(parseString('1.0.0+')).toEqual(null);
});

test('printString', () => {
  expect(
    printString({
      numerical: [1, 0, 0],
      prerelease: [],
      build: [],
    }),
  ).toEqual('1.0.0');
  expect(
    printString({
      numerical: [1, 0, 0],
      prerelease: ['alpha', '1', '3'],
      build: [],
    }),
  ).toEqual('1.0.0-alpha.1.3');
  expect(
    printString({
      numerical: [1, 0, 0],
      prerelease: [],
      build: ['build', '4'],
    }),
  ).toEqual('1.0.0+build.4');
  expect(
    printString({
      numerical: [1, 0, 0],
      prerelease: ['alpha', '1', '3'],
      build: ['build', '4'],
    }),
  ).toEqual('1.0.0-alpha.1.3+build.4');
});

test('normalize', () => {
  expect(
    normalize(
      {
        numerical: [91, 92, 93],
        prerelease: ['alpha', '1'],
        build: ['a34'],
      },
      5,
    ),
  ).toEqual({
    numerical: [91, 92, 93, 0, 0],
    prerelease: ['alpha', '1'],
    build: ['a34'],
  });
  expect(
    normalize(
      {
        numerical: [91, 92, 93],
        prerelease: ['alpha', '1'],
        build: ['a34'],
      },
      2,
    ),
  ).toEqual({
    numerical: [91, 92],
    prerelease: ['alpha', '1'],
    build: ['a34'],
  });
});

test('increment', () => {
  expect(
    increment(
      {
        numerical: [91, 92, 93, 94, 95],
        prerelease: ['alpha', '1'],
        build: ['a34'],
      },
      2,
    ),
  ).toEqual({
    numerical: [91, 92, 94, 0, 0],
    prerelease: [],
    build: [],
  });
});

test('gt', () => {
  expect(
    gt(
      {numerical: [1, 16, 0], prerelease: [], build: []},
      {numerical: [1, 8, 0], prerelease: [], build: []},
    ),
  ).toBe(true);
  expect(
    gt(
      {numerical: [1, 8, 0], prerelease: [], build: []},
      {numerical: [1, 16, 0], prerelease: [], build: []},
    ),
  ).toBe(false);
});

test('lt', () => {
  expect(
    lt(
      {numerical: [1, 8, 0], prerelease: ['alpha', '1'], build: []},
      {numerical: [1, 8, 0], prerelease: [], build: []},
    ),
  ).toBe(true);
});

test('sortAscending', () => {
  expect(
    sortAscending(['2.0.0', '1.0.0', '3.0.0'], (v) => parseString(v)!),
  ).toEqual(['1.0.0', '2.0.0', '3.0.0']);
});

test('sortDescending', () => {
  expect(
    sortDescending(['2.0.0', '1.0.0', '3.0.0'], (v) => parseString(v)!),
  ).toEqual(['3.0.0', '2.0.0', '1.0.0']);
});

test('min', () => {
  expect(min(['2.0.0', '1.0.0', '3.0.0'], (v) => parseString(v)!)).toBe(
    '1.0.0',
  );
});
test('max', () => {
  expect(max(['2.0.0', '1.0.0', '3.0.0'], (v) => parseString(v)!)).toBe(
    '3.0.0',
  );
});

test('getNextVersion', () => {
  expect(getNextVersion(null, [])).toEqual(null);

  expect(
    getNextVersion(
      {
        numerical: [2, 0, 0],
        prerelease: [],
        build: [],
      },
      [],
    ),
  ).toEqual(null);

  expect(getNextVersion(null, [{type: 'feat'}])).toEqual({
    numerical: [1, 0, 0],
    prerelease: [],
    build: [],
  });

  expect(
    getNextVersion(
      {
        numerical: [0, 1, 0],
        prerelease: [],
        build: [],
      },
      [{type: 'feat'}],
    ),
  ).toEqual({
    numerical: [1, 0, 0],
    prerelease: [],
    build: [],
  });

  expect(
    getNextVersion(
      {
        numerical: [2, 0, 0],
        prerelease: [],
        build: [],
      },
      [{type: 'feat'}],
    ),
  ).toEqual({
    numerical: [2, 1, 0],
    prerelease: [],
    build: [],
  });

  expect(
    getNextVersion(
      {
        numerical: [2, 0, 0],
        prerelease: [],
        build: [],
      },
      [{type: 'feat'}, {type: 'breaking'}, {type: 'fix'}],
    ),
  ).toEqual({
    numerical: [3, 0, 0],
    prerelease: [],
    build: [],
  });
});
import {
  DEFAULT_CHANGE_TYPES,
  DEFAULT_VERSION_SCHEMA,
  DEFAULT_BASE_VERSION,
} from '@rollingversions/config';
import type {
  VersionNumber as VN,
  ChangeTypeID,
  RollingConfigOptions,
} from '@rollingversions/types';

const MAX_LENGTH = 256;
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
const MAX_SAFE_INTEGER_LENGTH = MAX_SAFE_INTEGER.toString(10).length;

type VersionNumber = VN;
export default VersionNumber;

function parseInteger(str: string | undefined): number | undefined {
  if (!str) return undefined;
  if (!/^\d+$/.test(str)) return undefined;
  if (str.length > MAX_SAFE_INTEGER_LENGTH) return undefined;
  const int = parseInt(str, 10);
  if (int > MAX_SAFE_INTEGER) return undefined;
  return int;
}

function parseDotSeparated<T>(
  getMatch: (str: string) => string | undefined,
  parseMatch: (str: string) => T | undefined,
) {
  return (str: string): [boolean, string, T[]] => {
    let remaining = str;
    const values = [];
    let match = getMatch(remaining);
    while (match) {
      const value = parseMatch(match);
      if (value === undefined) break;

      values.push(value);

      if (
        match.length === remaining.length ||
        remaining[match.length] !== '.'
      ) {
        return [true, remaining.substr(match.length), values];
      }

      remaining = remaining.substr(match.length + 1);
      match = getMatch(remaining);
    }
    return [false, remaining, values];
  };
}

const parseDotSeparatedInt = parseDotSeparated(
  (str) => /^[0-9]+/i.exec(str)?.[0],
  parseInteger,
);
const parseDotSeparatedIdentifier = parseDotSeparated(
  (str) => /^[a-z0-9-]+/i.exec(str)?.[0],
  (str) => str,
);

/**
 * Parse an optional section with a required prefix
 */
function parsePrefix<T>(
  prefix: string,
  parser: (str: string) => [boolean, string, T[]],
): (str: string) => [boolean, string, T[]] {
  return (str) => {
    if (str.startsWith(prefix)) return parser(str.substr(prefix.length));
    else return [true, str, []];
  };
}

const parsePrerelease = parsePrefix('-', parseDotSeparatedIdentifier);
const parseBuild = parsePrefix('+', parseDotSeparatedIdentifier);

export function parseString(str: string): VersionNumber | null {
  if (str.length >= MAX_LENGTH) {
    return null;
  }

  const [numericalValid, afterNumerical, numerical] = parseDotSeparatedInt(
    str.startsWith('v') ? str.substr(1) : str,
  );

  if (!numericalValid) return null;

  const [prereleaseValid, afterPrerelease, prerelease] = parsePrerelease(
    afterNumerical,
  );

  if (!prereleaseValid) return null;

  const [buildValid, afterBuild, build] = parseBuild(afterPrerelease);

  if (!buildValid || afterBuild.length) return null;

  return {numerical, prerelease, build};
}

export function printString(version: VersionNumber): string {
  let result = version.numerical.map((v) => v.toString(10)).join('.');
  if (version.prerelease.length) {
    result += `-${version.prerelease.join('.')}`;
  }
  if (version.build.length) {
    result += `+${version.build.join('.')}`;
  }
  return result;
}

export function normalize(version: VersionNumber, numericalLength: number) {
  if (version.numerical.length === numericalLength) return version;
  return {
    numerical: Array.from({length: numericalLength}).map((_, i) =>
      i < version.numerical.length ? version.numerical[i] : 0,
    ),
    prerelease: version.prerelease,
    build: version.build,
  };
}

export function increment(
  version: VersionNumber,
  index: number,
): VersionNumber {
  return {
    numerical: version.numerical.map((v, i) =>
      i < index ? v : i === index ? v + 1 : 0,
    ),
    prerelease: [],
    build: [],
  };
}

enum ABComparison {
  B_IS_GREATER = -1,
  Equal = 0,
  A_IS_GREATER = 1,
}

const compareNumbers = (a: number, b: number) => {
  return a === b
    ? 0
    : a < b
    ? ABComparison.B_IS_GREATER
    : ABComparison.A_IS_GREATER;
};

/**
 * If both strings are valid integers, they are compared numerically.
 * If one string is an integer and the other is not, the integer is smaller than the arbitrary string.
 * Otherwise they are compared alphabetically.
 */
const compareIdentifiers = (a: string, b: string) => {
  const anum = /^[0-9]+$/.test(a);
  const bnum = /^[0-9]+$/.test(b);

  if (anum && bnum) {
    return compareNumbers(parseInt(a, 10), parseInt(b, 10));
  }

  if (a === b) return ABComparison.Equal;
  if (anum && !bnum) return ABComparison.B_IS_GREATER;
  if (bnum && !anum) return ABComparison.A_IS_GREATER;

  return a < b ? ABComparison.B_IS_GREATER : ABComparison.A_IS_GREATER;
};

function compareArrays<T>(
  compareValue: (aValue: T, bValue: T) => ABComparison,
  compareLength: (
    a: {readonly length: number},
    b: {readonly length: number},
  ) => ABComparison,
): (a: readonly T[], b: readonly T[]) => ABComparison {
  return (a, b) => {
    for (let i = 0; i < a.length && i < b.length; i++) {
      const comparison = compareValue(a[i], b[i]);
      if (comparison !== ABComparison.Equal) return comparison;
    }
    return compareLength(a, b);
  };
}

/**
 * Compare the "numerical" portion of two version numbers. If the two version numbers
 * are different lengths, all the excess values in the longer version number are ignored.
 * 1.0.0 < 2.0.0 < 2.9.0 < 2.19.0
 */
const compareMain = compareArrays<number>(
  compareNumbers,
  () => ABComparison.Equal,
);

/**
 * Compare the "prerelease" portion of two version numbers.
 *
 * If one of the version numbers does not have any prerelease strings, it is greater
 * than the one with prerelease strings.
 *
 * If the prerelease arrays are different lengths, and all values up to the
 * minimum length are equal, the longer array is greater than the shorter one.
 */
const comparePre = compareArrays<string>(compareIdentifiers, (a, b) => {
  // 1.0.0-beta < 1.0.0
  if (a.length && !b.length) return ABComparison.B_IS_GREATER;
  if (!a.length && b.length) return ABComparison.A_IS_GREATER;

  // 1.0.0-beta < 1.0.0-beta.1
  if (a.length < b.length) return ABComparison.B_IS_GREATER;
  if (a.length > b.length) return ABComparison.A_IS_GREATER;

  return ABComparison.Equal;
});

function _compare(a: VersionNumber, b: VersionNumber) {
  return (
    compareMain(a.numerical, b.numerical) ||
    comparePre(a.prerelease, b.prerelease)
  );
}

/**
 * Compare two version numbers (e.g. for sorting)
 * N.B. as per the "semver" spec, build metadata is always ignored
 * when comparing version numbers. This means that two version numbers
 * can be considered "equal" even if they have different build metadata
 */
export function compare(a: VersionNumber, b: VersionNumber): number {
  return _compare(a, b);
}

function resultIs(...types: readonly ABComparison[]) {
  return (a: VersionNumber, b: VersionNumber) => {
    const result = _compare(a, b);
    return types.includes(result);
  };
}

export const eq = resultIs(ABComparison.Equal);
export const neq = resultIs(
  ABComparison.A_IS_GREATER,
  ABComparison.B_IS_GREATER,
);
export const gt = resultIs(ABComparison.A_IS_GREATER);
export const gte = resultIs(ABComparison.A_IS_GREATER, ABComparison.Equal);
export const lt = resultIs(ABComparison.B_IS_GREATER);
export const lte = resultIs(ABComparison.B_IS_GREATER, ABComparison.Equal);

export function isPrerelease(a: VersionNumber) {
  return a.prerelease.length !== 0;
}

function sorter(order: 1 | -1) {
  function sort(versions: readonly VersionNumber[]): VersionNumber[];
  function sort<T>(
    versions: readonly T[],
    getVersionNumber: (value: T) => VersionNumber,
  ): T[];
  function sort<T>(
    versions: readonly T[],
    getVersionNumber: (value: T) => VersionNumber = (
      value: any,
    ): VersionNumber => value,
  ): T[] {
    return versions
      .slice()
      .sort(
        (a, b) => compare(getVersionNumber(a), getVersionNumber(b)) * order,
      );
  }
  return sort;
}
export const sortAscending = sorter(1);
export const sortDescending = sorter(-1);

function limit(order: 1 | -1) {
  function getLimit(
    versions: readonly VersionNumber[],
  ): VersionNumber | undefined;
  function getLimit<T>(
    versions: readonly T[],
    getVersionNumber: (value: T) => VersionNumber,
  ): T | undefined;
  function getLimit<T>(
    versions: readonly T[],
    getVersionNumber: (value: T) => VersionNumber = (
      value: any,
    ): VersionNumber => value,
  ): T | undefined {
    let limit: T | undefined;
    let limitV: VersionNumber | undefined;
    for (const v of versions) {
      if (limitV === undefined) {
        limit = v;
        limitV = getVersionNumber(v);
      } else {
        const version = getVersionNumber(v);
        const comparison = _compare(limitV, version);
        if (comparison === order) {
          limit = v;
          limitV = version;
        }
      }
    }
    return limit;
  }
  return getLimit;
}
export const min = limit(1);
export const max = limit(-1);

export function getNextVersion(
  currentVersion: VersionNumber | null,
  changeSet: readonly {readonly type: ChangeTypeID}[],
  {
    changeTypes = DEFAULT_CHANGE_TYPES,
    versionSchema = DEFAULT_VERSION_SCHEMA,
    baseVersion = DEFAULT_BASE_VERSION(versionSchema),
  }: Partial<
    Pick<RollingConfigOptions, 'changeTypes' | 'versionSchema' | 'baseVersion'>
  > = {},
): VersionNumber | null {
  let minIndex = -1;
  for (const c of changeSet) {
    const bumps = changeTypes.find((ct) => ct.id === c.type)?.bumps ?? null;
    const bumpsIndex = bumps === null ? -1 : versionSchema.indexOf(bumps);
    if (bumpsIndex !== -1 && (minIndex === -1 || minIndex > bumpsIndex)) {
      minIndex = bumpsIndex;
    }
  }
  if (minIndex === -1) return null;

  const baseVersionNumber: VersionNumber = {
    numerical: baseVersion,
    prerelease: [],
    build: [],
  };
  if (currentVersion === null || lt(currentVersion, baseVersionNumber)) {
    return baseVersionNumber;
  }

  return increment(normalize(currentVersion, versionSchema.length), minIndex);
}
import './index.css';
import React from 'react';
import {render} from 'react-dom';
import {BrowserRouter, Switch, Route} from 'react-router-dom';

import Contact from './pages/Contact';
import Docs from './pages/Docs';
import Home from './pages/Home';
import PullChangeLog from './pages/PullChangeLog';
import Repository from './pages/Repository';

render(
  <BrowserRouter>
    <Switch>
      <Route path="/" exact>
        <Home />
      </Route>
      <Route path="/help" exact={false}>
        <Docs />
      </Route>
      <Route path="/contact" exact>
        <Contact />
      </Route>
      <Route path="/:owner/:repo" exact>
        <Repository />
      </Route>
      <Route path="/:owner/:repo/pull/:pull_number" exact>
        <PullChangeLog />
      </Route>
    </Switch>
  </BrowserRouter>,
  document.getElementById('app'),
);
import React from 'react';

import ContactsPage from '../visual/ContactsPage';
import NavBar from '../visual/NavBar';
import NavBarLink from '../visual/NavBarLink';

export default function Contact() {
  return (
    <>
      <NavBar>
        <NavBarLink to="/">HOME</NavBarLink>
        <NavBarLink to="/help/github-actions">DOCS</NavBarLink>
        <NavBarLink to="/contact">CONTACT</NavBarLink>
      </NavBar>
      <ContactsPage />
    </>
  );
}
import * as React from 'react';
import {useRouteMatch} from 'react-router-dom';

import DocsPage from '../visual/DocsPage';
import NavBar from '../visual/NavBar';
import NavBarLink from '../visual/NavBarLink';

export default function Docs() {
  const match = useRouteMatch<{selected: string}>('/help/:selected');
  const selected = match && match.params.selected;
  return (
    <>
      <NavBar>
        <NavBarLink to="/">HOME</NavBarLink>
        <NavBarLink to="/help/github-actions">DOCS</NavBarLink>
        <NavBarLink to="/contact">CONTACT</NavBarLink>
      </NavBar>
      <DocsPage
        selected={
          selected === 'circle-ci'
            ? selected
            : selected === 'github-actions'
            ? selected
            : null
        }
        links={{
          'circle-ci': '/help/circle-ci',
          'github-actions': '/help/github-actions',
        }}
      />
    </>
  );
}
import React from 'react';

import LandingPage from '../visual/LandingPage';
import NavBar from '../visual/NavBar';
import NavBarLink from '../visual/NavBarLink';

export default function Home() {
  return (
    <>
      <NavBar>
        <NavBarLink to="/">HOME</NavBarLink>
        <NavBarLink to="/help/github-actions">DOCS</NavBarLink>
        <NavBarLink to="/contact">CONTACT</NavBarLink>
      </NavBar>
      <LandingPage />
    </>
  );
}
import React from 'react';
import {useParams} from 'react-router-dom';

import usePullRequest from '../hooks/usePullRequest';
import AppContainer from '../visual/AppContainer';
import AppNavBar, {AppNavBarLink} from '../visual/AppNavBar';
import PullRequestPage from '../visual/PullRequestPage';

interface Params {
  owner: string;
  repo: string;
  pull_number: string;
}

export default function PullChangeLog() {
  const params = useParams<Params>();
  const pr = usePullRequest(params);
  const [saving, setSaving] = React.useState(false);

  return (
    <AppContainer>
      <AppNavBar>
        <AppNavBarLink to={`/${params.owner}`}>{params.owner}</AppNavBarLink>
        <AppNavBarLink to={`/${params.owner}/${params.repo}`}>
          {params.repo}
        </AppNavBarLink>
        <AppNavBarLink>PR {params.pull_number}</AppNavBarLink>
      </AppNavBar>
      {(() => {
        if (pr.error) {
          return <div>Something went wrong: {pr.error}</div>;
        }
        if (!pr.pullRequest) {
          return <div>Loading...</div>;
        }

        return (
          <PullRequestPage
            permission={pr.pullRequest.permission}
            closed={pr.pullRequest.closed}
            merged={pr.pullRequest.merged}
            saving={pr.updating || saving}
            packages={pr.pullRequest.packages}
            packageErrors={pr.pullRequest.packageErrors}
            onSave={async (updates) => {
              setSaving(true);
              if (
                pr.pullRequest &&
                (await pr.update({
                  headSha: pr.pullRequest.headSha,
                  updates,
                }))
              ) {
                location.assign(
                  `https://github.com/${params.owner}/${params.repo}/pull/${params.pull_number}`,
                );
              } else {
                setSaving(false);
              }
            }}
          />
        );
      })()}
    </AppContainer>
  );
}
import React from 'react';
import {useParams} from 'react-router-dom';

import {printTag} from '@rollingversions/tag-format';
import {GetRepositoryApiResponse, VersioningMode} from '@rollingversions/types';
import {printString} from '@rollingversions/version-number';

import Alert from '../visual/Alert';
import AppContainer from '../visual/AppContainer';
import AppNavBar, {AppNavBarLink} from '../visual/AppNavBar';
import ChangeBranchDialog, {
  ChangeBranchButton,
} from '../visual/ChangeBranchDialog';
import ChangeBranchLink from '../visual/ChangeBranchLink';
import RepositoryPage, {
  CycleWarning,
  ManifestWarning,
  PackageWithChanges,
  PackageWithNoChanges,
  ReleaseButton,
  useBranchState,
} from '../visual/RepositoryPage';

interface Params {
  owner: string;
  repo: string;
}

export default function Repository() {
  const params = useParams<Params>();
  const [error, setError] = React.useState<Error | undefined>();
  const [state, setState] = React.useState<
    GetRepositoryApiResponse | undefined
  >();
  const path = `/${params.owner}/${params.repo}`;
  const {branch, changingBranch} = useBranchState();

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setError(undefined);
        const res = await fetch(
          `${path}/json${
            branch ? `?branch=${encodeURIComponent(branch)}` : ``
          }`,
        );
        if (!res.ok) {
          throw new Error(`${res.statusText}: ${await res.text()}`);
        }
        const data = await res.json();
        if (!cancelled) setState(data);
      } catch (ex: any) {
        if (!cancelled) {
          setError(ex);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [path, branch]);

  return (
    <>
      <AppContainer>
        <AppNavBar>
          <AppNavBarLink to={`/${params.owner}`}>{params.owner}</AppNavBarLink>
          <AppNavBarLink>{params.repo}</AppNavBarLink>
          <AppNavBarLink>
            {state?.deployBranch?.name ?? (error ? `Error` : `Loading`)}
            <ChangeBranchLink currentBranch={branch} />
          </AppNavBarLink>
        </AppNavBar>
        {(() => {
          if (error) {
            return (
              <div>
                Failed to load repository: <pre>{error.stack}</pre>
              </div>
            );
          }
          if (!state) {
            return <div>Loading...</div>;
          }

          const updateRequired =
            !state.cycleDetected &&
            state.packages.some((pkg) => pkg.newVersion);

          return (
            <RepositoryPage
              {...state}
              releaseButton={
                updateRequired &&
                (branch === state?.defaultBranch?.name || branch === null) ? (
                  <form
                    method="POST"
                    action={`/${params.owner}/${params.repo}/dispatch/rollingversions_publish_approved`}
                  >
                    <ReleaseButton />
                  </form>
                ) : null
              }
            >
              {state.cycleDetected ? (
                <CycleWarning cycle={state.cycleDetected} />
              ) : null}
              {state.packageErrors.map(({filename, error}, i) => (
                <ManifestWarning key={i} filename={filename} error={error} />
              ))}
              {state.packages.map((pkg) => {
                if (pkg.currentVersion?.ok !== false) {
                  return null;
                }
                return (
                  <Alert key={pkg.manifest.packageName}>
                    {pkg.manifest.packageName} has an ambiguous version on the
                    selected branch. You need to set the versioning in the
                    package manifest to either:{' '}
                    <code>{VersioningMode.AlwaysIncreasing}</code> or{' '}
                    <code>{VersioningMode.ByBranch}</code>.
                  </Alert>
                );
              })}
              {state.packages.map((pkg) => {
                const currentVersion = pkg.currentVersion;
                if (!pkg.newVersion) {
                  return null;
                }
                return (
                  <PackageWithChanges
                    key={pkg.manifest.packageName}
                    packageName={pkg.manifest.packageName}
                    currentVersion={
                      currentVersion?.ok
                        ? pkg.manifest.tagFormat
                          ? currentVersion.name
                          : printString(currentVersion.version)
                        : null
                    }
                    newVersion={
                      pkg.manifest.tagFormat
                        ? printTag(pkg.newVersion, {
                            packageName: pkg.manifest.packageName,
                            oldTagName: null,
                            tagFormat: pkg.manifest.tagFormat,
                            versionSchema: pkg.manifest.versionSchema,
                          })
                        : printString(pkg.newVersion)
                    }
                    changeSet={pkg.changeSet}
                    changeTypes={pkg.manifest.changeTypes}
                  />
                );
              })}
              {state.packages.map((pkg) => {
                if (pkg.newVersion) {
                  return null;
                }
                return (
                  <PackageWithNoChanges
                    key={pkg.manifest.packageName}
                    packageName={pkg.manifest.packageName}
                    currentVersion={
                      pkg.currentVersion?.ok
                        ? pkg.manifest.tagFormat
                          ? pkg.currentVersion.name
                          : printString(pkg.currentVersion.version)
                        : null
                    }
                  />
                );
              })}
            </RepositoryPage>
          );
        })()}
      </AppContainer>
      <ChangeBranchDialog
        open={!!(changingBranch && state)}
        currentBranch={branch}
      >
        {state?.allBranchNames.map((branchName) => (
          <ChangeBranchButton
            to={{search: `?branch=${encodeURIComponent(branchName)}`}}
          >
            {branchName}
          </ChangeBranchButton>
        ))}
      </ChangeBranchDialog>
    </>
  );
}
import React from 'react';

export default function Alert({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={`px-6 py-4 md:px-10 md:py-6 text-red-900 bg-red-200 rounded-lg border border-red-300 ${
        className || ''
      }`}
    >
      {children}
    </p>
  );
}
import React from 'react';

export interface AppContainerProps {
  children: React.ReactNode;
}
export default function AppContainer({children}: AppContainerProps) {
  return <div className="flex flex-col min-h-full bg-gray-200">{children}</div>;
}
import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';

import AppNavBar, {AppNavBarLink} from '.';

export default {title: 'modules/AppNavBar'};

export const Default = () => {
  return (
    <MemoryRouter>
      <AppNavBar>
        <AppNavBarLink to="#">ForbesLindesay</AppNavBarLink>
        <AppNavBarLink to="#">atdatabases</AppNavBarLink>
        <AppNavBarLink>PR 100</AppNavBarLink>
      </AppNavBar>
    </MemoryRouter>
  );
};
import React from 'react';
import {Link} from 'react-router-dom';

import InstallIcon from '../HeroBar/install-icon.svg';
import Logo from '../Logo';

export interface NavBarProps {
  children?: React.ReactNode;
}

export default function AppNavBar({children}: NavBarProps) {
  return (
    <nav className="flex flex-shrink-0 items-center text-2xl px-10 bg-white h-16 sticky top-0 z-50 overflow-x-auto">
      <Link
        className="flex-shrink-0 focus:outline-none focus:shadow-orange"
        to="/"
      >
        <Logo className="w-auto h-8" />
      </Link>
      {React.Children.map(children, (child) => {
        return (
          <>
            <div className="mx-4">
              <InstallIcon className="w-auto h-4" />
            </div>
            {child}
          </>
        );
      })}
    </nav>
  );
}

export interface AppNavBarLinkProps {
  to?: string;
  children: React.ReactNode;
}
export function AppNavBarLink({children, to}: AppNavBarLinkProps) {
  if (!to) {
    return (
      <span className="flex items-center font-popins flex-shrink-0">
        {children}
      </span>
    );
  }
  return (
    <Link
      to={to}
      className="flex items-center font-popins flex-shrink-0 focus:outline-none focus:shadow-orange"
    >
      {children}
    </Link>
  );
}
import React, {useEffect, useState} from 'react';
import {LinkProps} from 'react-router-dom';
import {Link} from 'react-router-dom';

const OPEN_DURATION = 300;
const CLOSE_DURATION = 200;
type State = 'open' | 'closing' | 'closed' | 'opening' | 'pre-open';
function backgroundAnimation(state: Exclude<State, 'closed'>): string {
  switch (state) {
    case 'pre-open':
      return `ease-out duration-300 opacity-0`;
    case 'opening':
      return `ease-out duration-300 opacity-75`;
    case 'open':
      return `ease-in duration-200 opacity-75`;
    case 'closing':
      return `ease-in duration-200 opacity-0`;
  }
}
function dialogAnimation(state: Exclude<State, 'closed'>): string {
  switch (state) {
    case 'pre-open':
      return `ease-out duration-500 opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95`;
    case 'opening':
      return `ease-out duration-500 opacity-100 translate-y-0 sm:scale-100`;
    case 'open':
      return `ease-in duration-200 opacity-100 translate-y-0 sm:scale-100`;
    case 'closing':
      return `ease-in duration-200 opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95`;
  }
}
export default function ChangeBranchDialog({
  children,
  currentBranch,
  open,
}: {
  children: React.ReactNode;
  currentBranch: string | null;
  open: boolean;
}) {
  const [state, setState] = useState<State>(open ? 'open' : 'closed');
  useEffect(() => {
    let cancelled = false;
    if (open) {
      switch (state) {
        case 'open':
          break;
        case 'opening':
          setTimeout(() => {
            if (!cancelled) setState('open');
          }, OPEN_DURATION);
          break;
        case 'closed':
        case 'closing':
          setState('pre-open');
          break;
        case 'pre-open':
          requestAnimationFrame(() => {
            if (!cancelled) setState('opening');
          });
          break;
      }
    } else {
      switch (state) {
        case 'open':
        case 'opening':
        case 'pre-open':
          setState('closing');
          break;
        case 'closed':
          break;
        case 'closing':
          setTimeout(() => {
            if (!cancelled) setState('closed');
          }, CLOSE_DURATION);
          break;
      }
    }
    return () => {
      cancelled = true;
    };
  }, [open, state]);

  if (state === 'closed') return null;
  return (
    <div
      className="fixed z-50 inset-0 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <Link
          to={{
            search: currentBranch
              ? `?branch=${encodeURIComponent(currentBranch)}`
              : ``,
          }}
          className={`fixed inset-0 bg-gray-500 transition-opacity ${backgroundAnimation(
            state,
          )}`}
          aria-hidden="true"
        ></Link>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-scrseen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div
          className={`inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6 ${dialogAnimation(
            state,
          )}`}
        >
          <div>
            <div className="mt-3 text-center sm:mt-5">
              <h3
                className="text-lg leading-6 font-medium text-gray-900"
                id="modal-title"
              >
                Choose a branch
              </h3>
            </div>
          </div>
          <ul className="mt-5 sm:mt-6">{children}</ul>
        </div>
      </div>
    </div>
  );
}

export function ChangeBranchButton({
  children,
  to,
}: {
  children: React.ReactNode;
  to: LinkProps['to'];
}) {
  return (
    <li className="mt-2">
      <Link
        to={to}
        className="inline-flex justify-center w-full rounded-md border shadow-sm px-4 py-2 border-indigo-600 text-base font-medium text-indigo-600 hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
      >
        {children}
      </Link>
    </li>
  );
}
import React from 'react';
import {Link} from 'react-router-dom';

export default function ChangeBranchLink({
  currentBranch,
}: {
  currentBranch: string | null;
}) {
  return (
    <Link
      className="ml-2 text-sm text-gray-700"
      to={{
        search: `?change-branch=1${
          currentBranch ? `&branch=${encodeURIComponent(currentBranch)}` : ``
        }`,
      }}
    >
      (change branch)
    </Link>
  );
}
import {action} from '@storybook/addon-actions';
import * as React from 'react';

import ChangeInput, {ChangeInputList} from '.';

export default {title: 'modules/ChangeInput', component: ChangeInput};
const Story = ({disabled}: {disabled: boolean}) => {
  const [change, setChange] = React.useState({
    title: 'I **fixed** a thing',
    body:
      'If you were doing\n\n```ts\ndb.stream(sql`SELECT * FROM table;`);\n```\n\nYou now need to do:\n\n```ts\ndb.queryStream(sql`SELECT * FROM table;`);\n```',
  });
  const [change2, setChange2] = React.useState({
    title: 'I **fixed** a thing',
    body: '',
  });
  const [change3, setChange3] = React.useState({
    title: '',
    body: 'I only have a body, which is an error',
  });
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <ChangeInputList>
        <ChangeInput
          ref={(input) => {
            input?.focus();
          }}
          localId={1}
          title={change.title}
          body={change.body}
          disabled={disabled}
          readOnly={false}
          onChange={setChange}
          onFocus={action('focus 1')}
          onBlur={action('blur 1')}
        />
        <ChangeInput
          localId={2}
          title={change2.title}
          body={change2.body}
          disabled={disabled}
          readOnly={false}
          onChange={setChange2}
          onFocus={action('focus 2')}
          onBlur={action('blur 2')}
        />
        <ChangeInput
          localId={3}
          title={change3.title}
          body={change3.body}
          disabled={disabled}
          readOnly={false}
          onChange={setChange3}
          onFocus={action('focus 3')}
          onBlur={action('blur 3')}
        />
      </ChangeInputList>
    </div>
  );
};

export const Default = () => <Story disabled={false} />;
export const Disabled = () => <Story disabled={true} />;
import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import useChanges from '../../hooks/useChanges';
import GitHubMarkdown from '../GitHubMarkdown/async';

export interface ChangeInputProps {
  localId: number;
  title: string;
  body: string;
  disabled: boolean;
  readOnly: boolean;
  onChange: (changeSetEntry: {
    localId: number;
    title: string;
    body: string;
  }) => void;
  onFocus?: (id: number) => void;
  onBlur?: (id: number) => void;
}

export interface ChangeInputListProps {
  children: React.ReactNode;
}

export function ChangeInputList({children}: ChangeInputListProps) {
  return (
    <ul className="max-w-2xl w-full pl-0">
      {React.Children.map(children, (child, i) => (
        <li className={`${i === 0 ? '' : 'mt-4'} flex w-full`}>
          <div className="flex items-center mr-2" style={{height: 40}}>
            <div>•</div>
          </div>
          <div className="flex-grow flex-shrink overflow-hidden">{child}</div>
        </li>
      ))}
    </ul>
  );
}

const inc = (n: number) => n + 1;
const dec = (n: number) => n - 1;

function useTrackFocus() {
  const [count, setCount] = React.useState(0);
  const onFocus = React.useCallback(() => setCount(inc), []);
  const onBlur = React.useCallback(() => setCount(dec), []);
  return {focused: count !== 0, onFocus, onBlur};
}
type MakeRefMutable<T> = T extends React.RefObject<infer S>
  ? React.MutableRefObject<S | null>
  : unknown;
const ChangeInput = React.forwardRef<HTMLTextAreaElement, ChangeInputProps>(
  function ChangeInput(
    {
      localId,
      title,
      body,
      disabled,
      readOnly,
      onChange,
      onFocus,
      onBlur,
    }: ChangeInputProps,
    ref,
  ) {
    const titleRef = React.useRef<HTMLTextAreaElement | null>(null);
    const titleFocus = useTrackFocus();
    const bodyFocus = useTrackFocus();

    const isFocused = titleFocus.focused || bodyFocus.focused;
    const [isFocusedDebounced, setIsFocusedDebounced] = React.useState(
      isFocused,
    );
    // delay handling blur a tiny bit so that we don't handle blur when tabbing between fields, but ensure focus is always immediate
    React.useLayoutEffect(() => {
      if (isFocused) {
        setIsFocusedDebounced(true);
        return undefined;
      } else {
        const timeout = setTimeout(() => {
          setIsFocusedDebounced(false);
        }, 15);
        return () => clearTimeout(timeout);
      }
    }, [isFocused]);

    useChanges(() => {
      if (isFocused) {
        if (onFocus) onFocus(localId);
      } else {
        if (onBlur) onBlur(localId);

        if (!title.trim() && body.trim() && titleRef.current) {
          titleRef.current.focus();
        }
      }
    }, [isFocusedDebounced]);

    if (readOnly) {
      return (
        <div>
          <div className="p-2">
            <GitHubMarkdown inline>{title}</GitHubMarkdown>
          </div>
          {body.trim() && (
            <div className="p-2">
              <GitHubMarkdown>{body}</GitHubMarkdown>
            </div>
          )}
        </div>
      );
    }
    const showBody = !!(body.trim() || (isFocusedDebounced && title.trim()));
    return (
      <div style={{minHeight: 113}}>
        <div className={`rounded-lg bg-white ${disabled ? `opacity-50` : ``}`}>
          <div
            className="relative text-md"
            style={{
              // hack to prevent any jumping from happening
              minHeight: 47,
              // marginBottom: titleFocus.focused ? -5 : 0,
            }}
          >
            {!titleFocus.focused && (
              <div className="p-2">
                {title ? (
                  <GitHubMarkdown inline>{title}</GitHubMarkdown>
                ) : (
                  <span className="text-gray-500">Change title</span>
                )}
              </div>
            )}
            {!disabled && (
              <TextareaAutosize
                aria-label="Change title"
                inputRef={(textArea) => {
                  if (typeof ref === 'function') ref(textArea);
                  else if (ref) {
                    (ref as MakeRefMutable<typeof ref>).current = textArea;
                  }
                  titleRef.current = textArea;
                }}
                className={
                  'inset-0 p-2 resize-none w-full rounded-t-lg opacity-0 focus:opacity-100 focus:outline-none' +
                  (titleFocus.focused ? '' : ' absolute') +
                  (body.trim() && !title.trim()
                    ? ' outline-none border-2 border-red-700'
                    : '')
                }
                value={title}
                onKeyPress={(e) => {
                  if (e.charCode === 13) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  onChange({
                    localId,
                    title: e.target.value.replace(/\r?\n/g, ''),
                    body,
                  });
                }}
                onFocus={titleFocus.onFocus}
                onBlur={titleFocus.onBlur}
              />
            )}
          </div>

          {showBody && (
            <>
              <div className={`bg-gray-300 mx-1`} style={{height: 2}} />
              {(isFocusedDebounced || body.trim()) && (
                <div
                  className="relative"
                  style={{
                    minHeight: '4rem',
                  }}
                >
                  {!bodyFocus.focused && (
                    <div className="p-2">
                      {body ? (
                        <GitHubMarkdown>{body}</GitHubMarkdown>
                      ) : (
                        <span className="text-gray-500">Optional details</span>
                      )}
                    </div>
                  )}
                  {!disabled && (
                    <TextareaAutosize
                      aria-label="Optional detailed change description"
                      className={`${
                        bodyFocus.focused ? '' : 'absolute '
                      }inset-0 p-2 resize-none w-full rounded-b-lg opacity-0 focus:opacity-100 focus:outline-none`}
                      value={body}
                      onFocus={bodyFocus.onFocus}
                      onBlur={bodyFocus.onBlur}
                      onChange={(e) => {
                        onChange({localId, title, body: e.target.value});
                      }}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  },
);

export default ChangeInput;
import * as React from 'react';

import {createChangeSet, extractChanges} from '@rollingversions/change-set';

import Changes from '.';
import getLocalId from '../../utils/getLocalId';

export default {title: 'modules/Changes'};

export const Default = () => {
  const [changes, setChanges] = React.useState(
    createChangeSet<{localId: number}>(
      {
        localId: getLocalId(),
        type: 'breaking',
        title: 'Renamed `merged.unmerge` to `merged.unmergeAllQueries`',
        body: '',
      },
      {
        localId: getLocalId(),
        type: 'breaking',
        title: 'Renamed `merged.documents` to `merged.allQueries`',
        body: '',
      },
      {
        localId: getLocalId(),
        type: 'feat',
        title:
          'Add `Batch` API that allows you to cleanly queue up queries and run them as a batch',
        body: `\`\`\`ts
import {Batch} from 'graphql-merge-unmerge';
import gql from 'graphql-tag';
import {print} from 'graphql';
const batch = new Batch(async ({query, variables}) => {
  const r = await callGraphQLServer({query: print(query), variables});
  if (!r.data) {
    throw new Error(JSON.stringify(r.errors));
  }
  return r.data;
});
const resultA = batch.queue({
  query: gql\`
    query($id: Int!) {
      user(id: $id) {
        id
        teams {
          name
        }
      }
    }
  \`,
  variables: {id: 3},
});
const resultB = batch.queue({
  query: gql\`
    query($id: Int!) {
      user(id: $id) {
        id
        name
      }
    }
  \`,
  variables: {id: 3},
});
await batch.run();
console.log(await resultA);
console.log(await resultB);
\`\`\``,
      },
    ),
  );
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <Changes
        title="Breaking Changes"
        disabled={false}
        readOnly={false}
        type="breaking"
        bumps="MAJOR"
        changes={extractChanges(changes, 'breaking')}
        onChange={setChanges}
      />
      <Changes
        title="New Features"
        disabled={false}
        readOnly={false}
        type="feat"
        bumps="MINOR"
        changes={extractChanges(changes, 'feat')}
        onChange={setChanges}
      />
      <Changes
        title="Internal Changes"
        disabled={false}
        readOnly={false}
        type="internal"
        bumps={null}
        changes={extractChanges(changes, 'internal')}
        onChange={setChanges}
      />
    </div>
  );
};
import React, {useEffect} from 'react';

import type {
  ChangeSet,
  ChangeTypeID,
  VersionBumpType,
} from '@rollingversions/types';

import getLocalId from '../../utils/getLocalId';
import ChangeInput, {ChangeInputList} from '../ChangeInput';

function useIsMouseDownRef() {
  const mouseDownRef = React.useRef(false);
  React.useEffect(() => {
    const onMouseDown = () => {
      mouseDownRef.current = true;
    };
    const onMouseUp = () => {
      mouseDownRef.current = false;
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);
  return mouseDownRef;
}
export interface ChangesProps {
  type: ChangeTypeID;
  bumps: VersionBumpType | null;
  title: string;
  changes: ChangeSet<{localId: number}>;
  disabled: boolean;
  readOnly: boolean;
  onChange: (
    update: (
      before: ChangeSet<{localId: number}>,
    ) => ChangeSet<{localId: number}>,
  ) => void;
}
function Changes({
  type,
  bumps,
  title,
  changes,
  disabled,
  readOnly,
  onChange,
}: ChangesProps) {
  const [newID, setNewID] = React.useState<number>();
  const [adding, setAdding] = React.useState(false);
  const isMouseDownRef = useIsMouseDownRef();
  const [focusCount, setFocusCount] = React.useState(0);

  useEffect(() => {
    if (focusCount === 0 && changes.length === 0) {
      setNewID(undefined);
    }
  }, [focusCount === 0 && changes.length === 0]);

  if (!changes.length && readOnly) {
    return null;
  }
  return (
    <div>
      <div className="flex justify-between items-baseline">
        <h3 className="font-sans text-xl text-gray-800 font-light mt-4">
          {title}
        </h3>
        {!readOnly && !newID && (
          <button
            className={`-m-6 p-6 flex flex-grow justify-end focus:outline-none focus:underline ${
              disabled ? `opacity-50` : ``
            }`}
            disabled={disabled}
            onClick={() => {
              setNewID(getLocalId());
              setAdding(true);
            }}
          >
            Add
          </button>
        )}
      </div>
      <div className="pt-2 font-sans text-sm text-gray-700 font-light">
        {bumps
          ? `(bumps the ${bumps} version)`
          : `(does not trigger a release)`}
      </div>
      <div className="pt-2">
        <ChangeInputList>
          {[
            ...changes,
            ...(disabled || newID === undefined
              ? []
              : [{localId: newID, title: '', body: ''}]),
          ].map((entry) => (
            <ChangeInput
              key={entry.localId}
              localId={entry.localId}
              ref={(input) => {
                if (input && adding && entry.localId === newID) {
                  input.focus();
                  setAdding(false);
                }
              }}
              title={entry.title}
              body={entry.body}
              disabled={disabled}
              readOnly={readOnly}
              onChange={(update) => {
                if (entry.localId === newID) {
                  setNewID(getLocalId());
                }
                onChange(
                  (changes): ChangeSet<{localId: number}> => {
                    let found = false;
                    const updated = changes.map((c) => {
                      if (c.localId === entry.localId) {
                        found = true;
                        return {type, ...update};
                      }
                      return c;
                    });
                    if (found) {
                      return updated;
                    } else {
                      return [...changes, {type, ...update}];
                    }
                  },
                );
              }}
              onFocus={() => setFocusCount(inc)}
              onBlur={() => {
                setFocusCount(dec);
                let removed = false;
                const remove = () => {
                  if (removed) return;
                  removed = true;
                  document.removeEventListener('mouseup', remove);
                  if (!entry.title && !entry.body && entry.localId !== newID) {
                    onChange((changes) => changes.filter((c) => c !== entry));
                  }
                };
                if (isMouseDownRef.current) {
                  setTimeout(remove, 1000);
                  document.addEventListener('mouseup', remove);
                } else {
                  setTimeout(remove, 100);
                }
              }}
            />
          ))}
        </ChangeInputList>
      </div>
    </div>
  );
}

export default React.memo(Changes);

function inc(v: number) {
  return v + 1;
}
function dec(v: number) {
  return v - 1;
}
import React from 'react';

function ContactDescription({children}: {children: string}) {
  return (
    <span className="font-poppins text-gray-700 hidden sm:block text-xl">
      {children}
    </span>
  );
}
function ContactLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="font-sans text-gray-900 text-lg xs:text-2xl sm:text-3xl md:text-4xl flex items-center focus:outline-none focus:shadow-orange"
    >
      {children}
    </a>
  );
}

export default function ContactMethod({
  contactDescription,
  contactLink,
  contactAddress,
  contactIcon,
}: {
  contactDescription: string;
  contactLink: string;
  contactAddress: string;
  contactIcon: React.ReactNode;
}) {
  return (
    <div>
      <ContactDescription>{contactDescription}</ContactDescription>
      <ContactLink href={contactLink}>
        {contactIcon} {contactAddress}
      </ContactLink>
    </div>
  );
}
import React from 'react';

import EmailIcon from '../../icons/emailMono.svg';
import FacebookIcon from '../../icons/facebookMono.svg';
import GithubIcon from '../../icons/githubMono.svg';
import TwitterIcon from '../../icons/twitterMono.svg';
import ContactMethod from './contactMethod';

export default function Contacts() {
  return (
    <div className="grid gap-4 md:gap-8">
      <ContactMethod
        contactDescription="Email"
        contactLink="mailto: hi@rollingversions.com?subject=Rolling Versions"
        contactAddress="hi@rollingversions.com"
        contactIcon={
          <EmailIcon className="h-12 w-12" aria-label="Email Icon" role="img" />
        }
      />
      <ContactMethod
        contactDescription="Twitter"
        contactLink="https://twitter.com/RollingVersions"
        contactAddress="@rollingversions"
        contactIcon={
          <TwitterIcon
            className="h-12 w-12"
            aria-label="Twitter Logo"
            role="img"
          />
        }
      />
      <ContactMethod
        contactDescription="GitHub"
        contactLink="https://github.com/RollingVersions/RollingVersions"
        contactAddress="RollingVersions/RollingVersions"
        contactIcon={
          <GithubIcon
            className="h-12 w-12"
            aria-label="GitHub Logo"
            role="img"
          />
        }
      />
      <ContactMethod
        contactDescription="Facebook"
        contactLink="https://www.facebook.com/RollingVersions/"
        contactAddress="Rolling Versions"
        contactIcon={
          <FacebookIcon
            className="h-12 w-12"
            aria-label="Facebook Logo"
            role="img"
          />
        }
      />
    </div>
  );
}
import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';

import ContactsPage from '.';
import NavBar from '../NavBar';
import NavBarLink from '../NavBarLink';

export default {title: 'pages/ContactsPage'};

export const Default = () => {
  return (
    <MemoryRouter>
      <NavBar>
        <NavBarLink to="#">HOME</NavBarLink>
        <NavBarLink to="#">DOCS</NavBarLink>
        <NavBarLink to="#">PRICING</NavBarLink>
        <NavBarLink to="#">CONTACT</NavBarLink>
      </NavBar>
      <ContactsPage />
    </MemoryRouter>
  );
};
import React from 'react';

import HeroBar, {HeroBarFooter} from '../HeroBar';
import Contacts from './contacts';

export default function ContactsPage() {
  return (
    <>
      <HeroBar>
        <p>We are here to help.</p>
      </HeroBar>
      <div className="py-8 xs:py-16 container mx-auto">
        <Contacts />
      </div>
      <HeroBarFooter />
    </>
  );
}
import React from 'react';

import CircleCIJobsCode from './circleCIJobsCode';
import CircleCIWorkflowsCode from './circleCIWorkflowsCode';
import {Instruction, Details, InlineCode} from './docsFormats';

export default function CircleCI() {
  return (
    <>
      <Instruction>Circle CI</Instruction>
      <Details>
        In your Circle CI config, add a workflow that has a{' '}
        <InlineCode>publish-dry-run</InlineCode> and{' '}
        <InlineCode>publish</InlineCode> step separated by a{' '}
        <InlineCode>publish-approval</InlineCode> step:
      </Details>

      <CircleCIWorkflowsCode />
      <Details>Add the corresponding jobs:</Details>
      <CircleCIJobsCode />
      <Details>
        The exact job names and steps are up to you. All that is important is
        that it authenticates to npm and runs{' '}
        <InlineCode>npx rollingversions publish</InlineCode>.
      </Details>
      <Details>
        In the settings for this repository on Circle CI, add these environment
        variables:
      </Details>

      <ul className="font-sans text-xl list-square ml-10">
        <li>
          <InlineCode>GITHUB_TOKEN</InlineCode> - a GitHub personal access token
          with at least "repo" scope.
        </li>
        <li>
          <InlineCode>NPM_TOKEN</InlineCode> - an npm token with permission to
          publish all the packages in this repo
        </li>
      </ul>
      <Details>
        Next time you submit a pull request, you will be asked to add a change
        log. Once you've merged the pull request, you can go to the workflow in
        Circle CI, see the output of the <InlineCode>--dry-run</InlineCode> and
        optionally approve the release to trigger the final part of the workflow
        - publishing your package.
      </Details>
    </>
  );
}
import React from 'react';

import {CodeBlock, CodeLine, CodePrefix} from './docsFormats';

export default function CircleCIJobsCode() {
  return (
    <CodeBlock>
      <CodeLine>
        <CodePrefix>jobs:</CodePrefix>
      </CodeLine>
      <CodeLine indent={1}>
        <CodePrefix>publish-dry-run:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>docker: </CodePrefix>
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>image: </CodePrefix>circleci/node:12
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>steps: </CodePrefix>
      </CodeLine>
      <CodeLine indent={3}>- checkout</CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>npm install
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>npm test
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>name: </CodePrefix>Authenticate with registry
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>command: </CodePrefix>
        {'echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc'}
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>npx rollingversions publish --dry-run
      </CodeLine>

      <CodeLine indent={1}>
        <CodePrefix>publish:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>docker: </CodePrefix>
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>image: </CodePrefix>circleci/node:12
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>steps: </CodePrefix>
      </CodeLine>
      <CodeLine indent={3}>- checkout</CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>npm install
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>npm test
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>name: </CodePrefix>Authenticate with registry
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>command: </CodePrefix>
        {'echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc'}
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>npx rollingversions publish
      </CodeLine>
    </CodeBlock>
  );
}
import React from 'react';

import {CodeBlock, CodeLine, CodePrefix} from './docsFormats';

export default function CircleCIWorkflowsCode() {
  return (
    <CodeBlock>
      <CodeLine>
        <CodePrefix>workflows:</CodePrefix>
      </CodeLine>
      <CodeLine indent={1}>
        <CodePrefix>release:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>jobs: </CodePrefix>
      </CodeLine>
      <CodeLine indent={3}>
        <CodePrefix>- publish-dry-run: </CodePrefix>
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>filters: </CodePrefix>
      </CodeLine>
      <CodeLine indent={6}>
        <CodePrefix>branches: </CodePrefix>
      </CodeLine>
      <CodeLine indent={7}>
        <CodePrefix>only: </CodePrefix>master
      </CodeLine>

      {'\n'}
      <CodeLine indent={3}>
        <CodePrefix>- publish-approval: </CodePrefix>
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>type: </CodePrefix>approval
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>requires: </CodePrefix>
      </CodeLine>
      <CodeLine indent={6}>- publish-dry-run</CodeLine>

      {'\n'}
      <CodeLine indent={3}>
        <CodePrefix>- publish: </CodePrefix>
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>requires: </CodePrefix>
      </CodeLine>
      <CodeLine indent={6}>- publish-approval</CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>filters: </CodePrefix>
      </CodeLine>
      <CodeLine indent={6}>
        <CodePrefix>branches: </CodePrefix>
      </CodeLine>
      <CodeLine indent={7}>
        <CodePrefix>only: </CodePrefix>master
      </CodeLine>
    </CodeBlock>
  );
}
import React from 'react';

import {InstallButton} from '../HeroBar';
import CircleCI from './circleCI';
import {Heading, Instruction, Details} from './docsFormats';
import GithubActions from './githubActions';
import MonoRepos from './monoRepos';
import type {CIservice} from './selector';
import Selector from './selector';

export default function Docs({
  selected,
  links,
}: {
  selected: CIservice | null;
  links: {[key in CIservice]: string};
}) {
  return (
    <>
      <div className="grid gap-4 md:gap-8">
        <Heading>Getting Started</Heading>
        <Instruction>Install the GitHub App</Instruction>
        <Details>
          To get started, you will need to install the GitHub App. This allows
          us to detect pull requests, comment on your pull requests with a
          preview of the change log, update build statuses, and trigger GitHub
          actions workflows if you use them for releases.
        </Details>
        <InstallButton />
        <Selector selected={selected} links={links} />
        {selected === 'github-actions' ? (
          <GithubActions />
        ) : selected === 'circle-ci' ? (
          <CircleCI />
        ) : null}
        {selected ? <MonoRepos /> : null}
      </div>
    </>
  );
}
import React from 'react';

export function Heading({children}: {children: string}) {
  return <h2 className="font-poppins text-3xl xs:text-4xl">{children}</h2>;
}
export function Instruction({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <h2 className={`font-sans text-2xl xs:text-3xl ${className}`}>
      {children}
    </h2>
  );
}
export function Details({children}: {children: React.ReactNode}) {
  return <p className="font-sans text-lg xs:text-xl">{children}</p>;
}

export function InlineCode({children}: {children: React.ReactNode}) {
  return (
    <code className="font-mono text-sm xs:text-base bg-gray-200 text-gray-900 p-1 -my-1">
      {children}
    </code>
  );
}

export function CodeBlock({children}: {children: React.ReactNode}) {
  return (
    <pre className="bg-gray-200 py-4 px-2 block overflow-x-auto">
      <code className="font-mono text-sm xs:text-base text-gray-900">
        {children}
      </code>
    </pre>
  );
}

export function CodeLine({
  children,
  indent = 0,
}: {
  children: React.ReactNode;
  indent?: number;
}) {
  return (
    <>
      {'  '.repeat(indent)}
      {children}
      {'\n'}
    </>
  );
}
export function CodePrefix({children}: {children: string}) {
  return <span className="text-orange-500">{children}</span>;
}
import React from 'react';

import {Instruction, Details, InlineCode, CodeBlock} from './docsFormats';
import GithubActionsCodeBlock from './githubActionsCodeBlock';

export default function GithubActions() {
  return (
    <>
      <Instruction>GitHub Actions</Instruction>
      <Details>
        Create a new file called{' '}
        <InlineCode>.github/workflows/rollingversions.yml</InlineCode>. In it,
        put:
      </Details>
      <GithubActionsCodeBlock />
      <Details>
        It's up to you what tests you run, the important thing is that it's
        triggered by{' '}
        <InlineCode>
          repository_dispatch of rollingversions_publish_approved
        </InlineCode>{' '}
        and that it eventually authenticates to npm and runs{' '}
        <InlineCode>npx rollingversions publish</InlineCode> - this will publish
        your release.
      </Details>
      <Details>
        Go to your repositories <InlineCode>Settings</InlineCode>
        {' > '}
        <InlineCode>Secrets</InlineCode> and add an{' '}
        <InlineCode>NPM_TOKEN</InlineCode> with permission to publish all the
        packages in this repository. You don't need to worry about the{' '}
        <InlineCode>GITHUB_TOKEN</InlineCode> as GitHub will generate one for
        your action automatically.
      </Details>

      <Details>
        Edit your <InlineCode>README.md</InlineCode> file and add the badge:
      </Details>
      <CodeBlock>
        {
          '[![Rolling Versions](https://img.shields.io/badge/Rolling%20Versions-Enabled-brightgreen)](https://rollingversions.com/YOUR_GITHUB_LOGIN/YOUR_REPOSITORY_NAME)'
        }
      </CodeBlock>

      <Details>
        Next time you submit a pull request, you will be asked to add a change
        log. Once you've merged the pull request, you can click on the badge in
        the README and you will be taken to Rolling Versions, where you can
        preview the release, and approve it to be published (providing you have
        write or admin access to the GitHub repository).
      </Details>
    </>
  );
}
import React from 'react';

import {CodeBlock, CodeLine, CodePrefix} from './docsFormats';

export default function GithubActionsCodeBlock() {
  return (
    <CodeBlock>
      <CodeLine>
        <CodePrefix>name: </CodePrefix>Release
      </CodeLine>
      {'\n'}
      <CodeLine>
        <CodePrefix>on:</CodePrefix>
      </CodeLine>
      <CodeLine indent={1}>
        <CodePrefix>repository_dispatch:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>types: </CodePrefix>[rollingversions_publish_approved]
      </CodeLine>

      {'\n'}
      <CodeLine>
        <CodePrefix>jobs:</CodePrefix>
      </CodeLine>
      <CodeLine indent={1}>
        <CodePrefix>test:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>runs-on: </CodePrefix>ubuntu-latest
      </CodeLine>

      {'\n'}
      <CodeLine indent={2}>
        <CodePrefix>strategy:</CodePrefix>
      </CodeLine>

      <CodeLine indent={3}>
        <CodePrefix>matrix:</CodePrefix>
      </CodeLine>
      <CodeLine indent={4}>
        <CodePrefix>node-version: </CodePrefix>[8.x, 10.x, 12.x, 14.x]
      </CodeLine>

      {'\n'}
      <CodeLine indent={2}>
        <CodePrefix>steps:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- uses: </CodePrefix>actions/checkout@v2
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- uses: </CodePrefix>actions/setup-node@v1
      </CodeLine>
      <CodeLine indent={3}>
        <CodePrefix>with:</CodePrefix>
      </CodeLine>
      <CodeLine indent={4}>
        <CodePrefix>node-version: </CodePrefix>
        {`\${{ matrix.node-version }}`}
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- run: </CodePrefix>npm install
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- run: </CodePrefix>npm test
      </CodeLine>

      {'\n'}
      <CodeLine indent={1}>
        <CodePrefix>publish:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>runs-on: </CodePrefix>ubuntu-latest
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>needs: </CodePrefix>test
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>steps:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- uses: </CodePrefix>actions/checkout@v2
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- uses: </CodePrefix>actions/setup-node@v1
      </CodeLine>
      <CodeLine indent={3}>
        <CodePrefix>with:</CodePrefix>
      </CodeLine>
      <CodeLine indent={4}>
        <CodePrefix>node-version: </CodePrefix>12.x
      </CodeLine>
      <CodeLine indent={4}>
        <CodePrefix>registry-url: </CodePrefix>'https://registry.npmjs.org'
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- run: </CodePrefix>npm install
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- run: </CodePrefix>
        npx rollingversions publish
      </CodeLine>
      <CodeLine indent={3}>
        <CodePrefix>env: </CodePrefix>
      </CodeLine>
      <CodeLine indent={4}>
        <CodePrefix>GITHUB_TOKEN: </CodePrefix>
        {`\${{ secrets.GITHUB_TOKEN }}`}
      </CodeLine>
      <CodeLine indent={4}>
        <CodePrefix>NODE_AUTH_TOKEN: </CodePrefix>
        {`\${{ secrets.NPM_TOKEN }}`}
      </CodeLine>
    </CodeBlock>
  );
}
import * as React from 'react';
import {MemoryRouter, useRouteMatch} from 'react-router-dom';

import DocsPage from '.';
import NavBar from '../NavBar';
import NavBarLink from '../NavBarLink';

export default {title: 'pages/DocsPage'};

const DocsPageDemo = () => {
  const match = useRouteMatch<{selected: string}>('/docs/:selected');
  const selected = match && match.params.selected;
  return (
    <DocsPage
      selected={
        selected === 'circle-ci'
          ? selected
          : selected === 'github-actions'
          ? selected
          : null
      }
      links={{
        'circle-ci': '/docs/circle-ci',
        'github-actions': '/docs/github-actions',
      }}
    />
  );
};
export const Default = () => {
  return (
    <MemoryRouter>
      <NavBar>
        <NavBarLink to="#">HOME</NavBarLink>
        <NavBarLink to="#">DOCS</NavBarLink>
        <NavBarLink to="#">PRICING</NavBarLink>
        <NavBarLink to="#">CONTACT</NavBarLink>
      </NavBar>
      <DocsPageDemo />
    </MemoryRouter>
  );
};
import React from 'react';

import HeroBar, {HeroBarFooter} from '../HeroBar';
import Docs from './docs';
import type {CIservice} from './selector';

export default function DocsPage({
  selected,
  links,
}: {
  selected: CIservice | null;
  links: {[key in CIservice]: string};
}) {
  return (
    <>
      <HeroBar>
        <p>Docs</p>
      </HeroBar>
      <div className="py-8 xs:py-16 container mx-auto">
        <Docs selected={selected} links={links} />
      </div>
      <HeroBarFooter />
    </>
  );
}
import React from 'react';

import {Instruction, Details, InlineCode} from './docsFormats';

// Note that the link to rolling versions is to a fixed version rather than the current version of the package.  This means that appropriate line is highlighted.

export default function MonoRepos() {
  return (
    <>
      <Instruction>Mono Repos</Instruction>
      <Details>
        If your project is in a mono repo, Rolling Versions will still work just
        fine without any changes, but you can optionally choose to ignore
        certain packages that should not have versions by adding{' '}
        <InlineCode>"@rollingversions/ignore": true</InlineCode> to your
        package.json. We do exactly that on{' '}
        <a
          className="border-b-2 border-orange-400 text-orange-400 hover:border-orange-400 hover:text-orange-500 focus:outline-none focus:shadow-orange focus:text-orange-500"
          href="https://github.com/RollingVersions/RollingVersions/blob/0276c1a0918a8c79b5b69dd5dadecc0bfefe0ed8/package.json#L4"
        >
          Rolling Versions itself
        </a>
        .
      </Details>
    </>
  );
}
import React from 'react';
import {Link} from 'react-router-dom';

import CircleCIicon from '../../icons/circleci.svg';
import GithubActionsIcon from '../../icons/githubactions.svg';
import {Instruction} from './docsFormats';

function SelectorButton({
  children,
  isSelected,
  to,
  svgIcon,
}: {
  children: string;
  isSelected: boolean;
  to: string;
  svgIcon: React.ReactNode;
}) {
  return (
    <Link
      className={`flex flex-col items-center h-32 w-32 xs:h-48 xs:w-48 md:h-56 md:w-56 ${
        isSelected
          ? 'bg-gray-300 border-4 '
          : 'bg-transparent hover:bg-gray-100 border hover:border-orange-300 '
      } font-poppins text-xl xs:text-3xl md:text-4xl py-2 px-4 border-orange-500 focus:outline-none focus:shadow-orange`}
      to={to}
      onMouseUp={(e) => {
        e.currentTarget.blur();
      }}
    >
      <div className="flex items-center justify-center flex-grow h-0">
        <div className="h-8 w-8 xs:h-12 xs:w-12">{svgIcon}</div>
      </div>
      <p className="text-center flex-grow h-0">{children}</p>
    </Link>
  );
}

export type CIservice = 'github-actions' | 'circle-ci';

export default function Selector({
  selected,
  links,
}: {
  selected: CIservice | null;
  links: {[key in CIservice]: string};
}) {
  return (
    <>
      <Instruction className="mt-12 xs:mt-16">
        Select Continuous Integration Service
      </Instruction>

      <div className="my-4 xs:my-8 flex justify-center">
        <div className="grid grid-cols-2 gap-8 xs:gap-12">
          <SelectorButton
            isSelected={selected === 'github-actions'}
            to={links['github-actions']}
            svgIcon={
              <GithubActionsIcon
                className={`fill-current ${
                  selected === 'github-actions'
                    ? `text-orange-500`
                    : `text-gray-700`
                }`}
              />
            }
          >
            GitHub Actions
          </SelectorButton>
          <SelectorButton
            isSelected={selected === 'circle-ci'}
            to={links['circle-ci']}
            svgIcon={
              <CircleCIicon
                className={`fill-current ${
                  selected === 'circle-ci' ? `text-orange-500` : `text-gray-900`
                }`}
              />
            }
          >
            Circle CI
          </SelectorButton>
        </div>
      </div>
    </>
  );
}
import React from 'react';

export type GitHubMarkdownProps = import('./').GitHubMarkdownProps;
let GitHubMarkdownCache: typeof import('./') | undefined;
let GitHubMarkdownPromise: Promise<typeof import('./')> | undefined;

export default function GitHubMarkdownAsync(props: GitHubMarkdownProps) {
  const [GitHubMarkdown, setModules] = React.useState(GitHubMarkdownCache);
  const [err, setError] = React.useState<Error | undefined>(undefined);
  React.useEffect(() => {
    let cancelled = false;
    if (!GitHubMarkdownPromise) {
      GitHubMarkdownPromise = import(/* webpackPrefetch: true */ './');
    }
    GitHubMarkdownPromise.then((r) => {
      if (cancelled) return;
      GitHubMarkdownCache = r;
      setModules(r);
      setError(undefined);
    }).catch((err) => {
      if (cancelled) return;
      setError(err);
    });
    return () => {
      cancelled = true;
    };
  }, [err]);
  if (err) {
    return <div>{err.message}</div>;
  }
  if (!GitHubMarkdown) {
    return <pre>{props.children}</pre>;
  }
  return <GitHubMarkdown.default {...props} />;
}
import * as React from 'react';

import GitHubMarkdown from '.';

export default {title: 'modules/GitHubMarkdown'};

const markdownString = `<script>alert('You\'ve been hacked')</script>

This is a paragraph.

    This is a paragraph.

\`\`\`typescript
function foo() {
  return 'Hello World';
}
\`\`\`

Header 1
========

Header 2
--------

    Header 1
    ========

    Header 2
    --------



# Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6

    # Header 1
    ## Header 2
    ### Header 3
    #### Header 4
    ##### Header 5
    ###### Header 6



# Header 1 #
## Header 2 ##
### Header 3 ###
#### Header 4 ####
##### Header 5 #####
###### Header 6 ######

    # Header 1 #
    ## Header 2 ##
    ### Header 3 ###
    #### Header 4 ####
    ##### Header 5 #####
    ###### Header 6 ######



> Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus. Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.

    > Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus. Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.



> ## This is a header.
> 1. This is the first list item.
> 2. This is the second list item.
>
> Here's some example code:
>
>     Markdown.generate();

    > ## This is a header.
    > 1. This is the first list item.
    > 2. This is the second list item.
    >
    > Here's some example code:
    >
    >     Markdown.generate();




- Red
- Green
- Blue


+ Red
+ Green
+ Blue


* Red
* Green
* Blue


\`\`\`markdown
- Red
- Green
- Blue

+ Red
+ Green
+ Blue

* Red
* Green
* Blue
\`\`\`



1. Buy flour and salt
1. Mix together with water
1. Bake

\`\`\`markdown
1. Buy flour and salt
1. Mix together with water
1. Bake
\`\`\`



Paragraph:

    Code

<!-- -->

    Paragraph:

        Code



* * *

***

*****

- - -

---------------------------------------

    * * *

    ***

    *****

    - - -

    ---------------------------------------



This is [an example](http://example.com "Example") link.

[This link](http://example.com) has no title attr.

This is [an example] [id] reference-style link.

[id]: http://example.com "Optional Title"

    This is [an example](http://example.com "Example") link.

    [This link](http://example.com) has no title attr.

    This is [an example] [id] reference-style link.

    [id]: http://example.com "Optional Title"



*single asterisks*

_single underscores_

**double asterisks**

__double underscores__

    *single asterisks*

    _single underscores_

    **double asterisks**

    __double underscores__



This paragraph has some \`code\` in it.

    This paragraph has some \`code\` in it.



![Alt Text](https://get.svg.workers.dev/?s=64&f=gray "Image Title")

    ![Alt Text](https://get.svg.workers.dev/?s=64&f=gray "Image Title")`;

export const Default = () => <GitHubMarkdown>{markdownString}</GitHubMarkdown>;

export const InlineMarkdown = () => (
  <GitHubMarkdown inline>
    {'This is rendered without a **paragraph** tag!'}
  </GitHubMarkdown>
);
import React from 'react';
import Markdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-async-light';
import SyntaxHighlighterStyle from 'react-syntax-highlighter/dist/esm/styles/prism/ghcolors';

const SyntaxHighligherSupportedLanguages: string[] = require('react-syntax-highlighter/dist/esm/languages/prism/supported-languages')
  .default;

export interface GitHubMarkdownProps {
  children: string;
  inline?: boolean;
}
function GitHubMarkdown({children, inline}: GitHubMarkdownProps) {
  if (inline) {
    return (
      <Markdown
        className="markdown"
        source={children}
        renderers={{
          paragraph: (props): React.ReactElement => {
            return props.children;
          },
        }}
      />
    );
  }
  return (
    <Markdown
      className="markdown"
      source={children}
      renderers={{
        code: (props: {language: string | null; value: string}) => {
          const aliases = {
            ts: 'typescript',
            js: 'javascript',
          };
          const language: string | null = props.language
            ? props.language.toLowerCase() in aliases
              ? (aliases as any)[props.language.toLowerCase()]
              : props.language.toLowerCase()
            : null;
          return (
            <SyntaxHighlighter
              style={SyntaxHighlighterStyle}
              language={
                language &&
                SyntaxHighligherSupportedLanguages.includes(language)
                  ? language
                  : 'text'
              }
              children={props.value}
            />
          );
        },
      }}
    />
  );
}

export default React.memo(GitHubMarkdown);
import * as React from 'react';

import HeroBar, {HeroBarFooter, InstallButton} from '.';

export default {title: 'modules/HeroBar'};

export const Default = () => {
  return (
    <HeroBar callToAction={<InstallButton />}>
      <p>Add change sets to pull requests</p>
      <p>Automatically release with change logs</p>
    </HeroBar>
  );
};
export const Footer = () => {
  return <HeroBarFooter />;
};
import React from 'react';

import InstallIcon from './install-icon.svg';

// tslint:disable-next-line:no-implicit-dependencies
import background from '!url-loader!./background-image.svg';

const shadowClasses = {
  gray: 'focus:shadow-gray',
  orange: 'focus:shadow-orange',
  white: 'focus:shadow-white',
};

export function InstallButton({
  size = 'sm',
  shadow = 'gray',
}: {
  size?: 'sm' | 'lg';
  shadow?: 'gray' | 'orange' | 'white';
}) {
  return (
    <a
      href="https://github.com/apps/rollingversions/installations/new"
      className={`flex items-center justify-center bg-black text-white italic font-poppins font-black focus:outline-none ${
        shadowClasses[shadow]
      } ${
        size === 'lg' ? `h-20 flex-grow text-4xl` : `h-12 px-6 w-auto text-2xl`
      }`}
    >
      Install GitHub App
      <div className={size === 'lg' ? 'w-3' : 'w-2'} />
      <InstallIcon
        aria-hidden={true}
        className={size === 'lg' ? 'h-8 w-auto' : 'h-6 w-auto'}
      />
    </a>
  );
}
export default function HeroBar({
  children,
  callToAction,
}: {
  children: React.ReactNode;
  callToAction?: React.ReactNode;
}) {
  return (
    <>
      <div className="bg-orange-500 py-8 xs:py-10 sm:py-12 block md:hidden">
        <div className="container mx-auto grid grid-cols-1 gap-4 xs:gap-6 font-poppins font-normal text-2xl xs:text-3xl text-white italic">
          {children}
        </div>
      </div>
      <div
        className="bg-orange-500 h-64 pt-20 bg-no-repeat hidden md:block"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 80%)',
          backgroundImage: `url(${background})`,
          backgroundPosition: 'center right 15%',
          backgroundSize: 'auto 140%',
        }}
      >
        <div className="container mx-auto flex items-end">
          <div className="flex-grow max-w-4xl font-poppins font-normal text-3xl text-white italic">
            {children}
          </div>
          <div className="hidden lg:flex">{callToAction}</div>
        </div>
      </div>
    </>
  );
}

export function HeroBarFooter() {
  return (
    <div
      className="bg-orange-500 h-64 bg-no-repeat flex"
      style={{
        clipPath: 'polygon(0 0, 100% 20%, 100% 100%, 0 100%)',
        backgroundImage: `url(${background})`,
        backgroundSize: 'auto 130%',
        backgroundPosition: 'center left 10%',
      }}
    >
      <div className="container mx-auto flex flex-grow items-center">
        <InstallButton size="lg" shadow="white" />
      </div>
    </div>
  );
}

export function HeroBarBanner({children}: {children: string}) {
  return (
    <>
      <div className="bg-black py-8 block md:hidden">
        <div className="container mx-auto grid font-poppins font-normal text-xl text-white italic">
          {children}
        </div>
      </div>
      <div
        className="bg-black h-64 pt-20 bg-no-repeat hidden md:block "
        style={{
          position: 'relative',
          top: '-51px',
          clipPath: 'polygon(0 0, 100% 20%, 100% 100%, 0 100%)',
          backgroundSize: 'auto 130%',
          backgroundPosition: 'center left 10%',
        }}
      >
        <div className="container mx-auto flex items-end">
          <div className="max-w-3xl flex-grow font-poppins text-2xl text-white italic">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';

import LandingPage from '.';
import NavBar from '../NavBar';
import NavBarLink from '../NavBarLink';

export default {title: 'pages/LandingPage'};

export const Default = () => {
  return (
    <MemoryRouter>
      <NavBar>
        <NavBarLink to="#">HOME</NavBarLink>
        <NavBarLink to="#">DOCS</NavBarLink>
        <NavBarLink to="#">CONTACT</NavBarLink>
      </NavBar>
      <LandingPage />
    </MemoryRouter>
  );
};
import React from 'react';

import HeroBar, {HeroBarFooter, InstallButton} from '../HeroBar';
import MarketingContent from '../MarketingContent';

export default function LandingPage() {
  return (
    <>
      <HeroBar callToAction={<InstallButton />}>
        <p>Add change sets to your pull requests</p>
        <p>Automatically release with change logs</p>
      </HeroBar>
      <div className="py-8 xs:py-16">
        <MarketingContent />
      </div>
      <HeroBarFooter />
    </>
  );
}
import * as React from 'react';

import Logo from '.';

export default {title: 'modules/Logo'};

export const Default = () => {
  return <Logo />;
};

export const Dark = () => {
  return (
    <div style={{background: 'black', height: '100%', width: '100%'}}>
      <Logo dark />
    </div>
  );
};
import React from 'react';

import WordmarkDark from './wordmark-dark.svg';
import Wordmark from './wordmark.svg';

export default function Logo({
  dark,
  ...props
}: Omit<
  React.SVGProps<SVGElement>,
  'width' | 'height' | 'viewBox' | 'xmlns'
> & {
  dark?: boolean;
}) {
  if (dark) {
    return <WordmarkDark {...props} />;
  }
  return <Wordmark {...props} />;
}
import * as React from 'react';

import MarketingContent from '.';

export default {title: 'modules/MarketingContent'};

export const Default = () => {
  return <MarketingContent />;
};
import React from 'react';

function Heading({children}: {children: string}) {
  return <h2 className="font-poppins text-3xl xs:text-4xl">{children}</h2>;
}
function Description({children}: {children: string}) {
  return <p className="font-sans text-xl xs:text-2xl">{children}</p>;
}
export default function MarketingContent() {
  return (
    <div className="container mx-auto">
      <div className="max-w-4xl grid grid-cols-1 gap-8 xs:gap-10">
        <section>
          <Heading>Submit a Pull Request</Heading>
          <Description>
            When you submit a pull request, Rolling Versions asks you to
            describe the changes.
          </Description>
        </section>
        <section>
          <Heading>Add a Change Set</Heading>
          <Description>
            List your changes. You don't need to memorise CLI parameters or some
            magic structure. You just enter the changes into our UI.
          </Description>
        </section>
        <section>
          <Heading>Preview your Changes</Heading>
          <Description>
            Review the changes to be published as part of your pull request. You
            can check that Rolling Versions has chosen the version you expected.
          </Description>
        </section>
        <section>
          <Heading>Publish in CI</Heading>
          <Description>
            Automate the release as part of your CI setup so that every release
            is properly tested and published without delay.
          </Description>
        </section>
        <section>
          <Heading>Change Log</Heading>
          <Description>
            When your new version is published, Rolling Versions automatically
            creates a beautiful change log in GitHub and selects the correct new
            version number so that your users know what they're getting when
            they upgrade.
          </Description>
        </section>
      </div>
    </div>
  );
}
import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';

import NavBar from '.';

export default {title: 'modules/NavBar'};

export const Default = () => {
  return (
    <MemoryRouter>
      <NavBar />
    </MemoryRouter>
  );
};
import React from 'react';

import Logo from '../Logo';

export interface NavBarProps {
  children?: React.ReactNode;
}

export default function NavBar({children}: NavBarProps) {
  return (
    <nav className="container mx-auto flex flex-col items-center justify-between lg:flex-row pb-4 sm:pb-6 pt-8 sm:pt-6">
      <Logo className="flex-grow-0 w-auto h-12 sm:h-14 max-w-full" />

      <div className="text-l xs:text-xl mt-6 lg:mt-0">
        {React.Children.map(children, (child, index) => {
          if (index !== 0) {
            return (
              <>
                <span className="font-poppins font-400">{' / '}</span>
                {child}
              </>
            );
          }
          return child;
        })}
      </div>
    </nav>
  );
}
import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';

import NavBarLink from '.';

export default {title: 'modules/NavBarLink'};

export const Default = () => {
  return (
    <MemoryRouter>
      <NavBarLink to="/">HOME</NavBarLink>
    </MemoryRouter>
  );
};
import React from 'react';
import {Link} from 'react-router-dom';

export interface NavBarLinkProps {
  to: string;
  children: string;
}
export default function NavBarLink({children, to}: NavBarLinkProps) {
  return (
    <Link
      to={to}
      className="font-heading italic text-orange-500 focus:outline-none focus:shadow-orange"
    >
      {children}
    </Link>
  );
}
import * as React from 'react';

import {createChangeSet} from '@rollingversions/change-set';
import {DEFAULT_CHANGE_TYPES} from '@rollingversions/config';
import {PublishTarget} from '@rollingversions/types';

import PackageChangeSet from '.';

export default {title: 'modules/PackageChangeSet'};

export const Default = () => {
  const [changes, setChanges] = React.useState(
    createChangeSet<{localId: number}>(),
  );
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <PackageChangeSet
        packageName="@databases/pg"
        targetConfigs={[
          {
            type: PublishTarget.npm,
            publishConfigAccess: 'public',
            packageName: '@databases/pg',
            path: 'fake-path',
            private: false,
          },
        ]}
        changes={changes}
        changeTypes={DEFAULT_CHANGE_TYPES}
        disabled={false}
        readOnly={false}
        onChange={(_packageName, update) => setChanges(update)}
      />
    </div>
  );
};
import React, {useCallback} from 'react';

import type ChangeSet from '@rollingversions/change-set';
import {extractChanges} from '@rollingversions/change-set';
import {ChangeType, PublishTargetConfig} from '@rollingversions/types';

import Changes from '../Changes';
import RegistryStatus from '../RegistryStatus';

export interface PackageChangeSetProps {
  packageName: string;
  targetConfigs: readonly PublishTargetConfig[];
  changes: ChangeSet<{localId: number}>;
  disabled: boolean;
  readOnly: boolean;
  warning?: React.ReactNode;
  changeTypes: readonly ChangeType[];
  onChange: (
    packageName: string,
    update: (
      oldChanges: ChangeSet<{localId: number}>,
    ) => ChangeSet<{localId: number}>,
  ) => void;
}

function PackageChangeSet({
  targetConfigs,
  packageName,
  changes,
  disabled,
  readOnly,
  warning,
  changeTypes,
  onChange,
}: PackageChangeSetProps) {
  const onChangeInner = useCallback((update) => onChange(packageName, update), [
    packageName,
    onChange,
  ]);
  // TODO(feat): show warning if no changes are added and the commit has modified files in the directory
  // TODO(feat): show warning if dependencies have breaking changes but this package has no changes
  return (
    <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
      <div>
        <h2 className="font-sans text-3xl text-gray-900 font-light mb-4">
          {packageName}
        </h2>
        {warning}
        <RegistryStatus targetConfigs={targetConfigs} />
      </div>
      <div className="grid gap-4 lg:gap-8">
        {changeTypes.map((changeType) => (
          <Changes
            key={changeType.id}
            type={changeType.id}
            bumps={changeType.bumps}
            title={changeType.plural}
            disabled={disabled}
            readOnly={readOnly}
            changes={extractChanges(changes, changeType.id)}
            onChange={onChangeInner}
          />
        ))}
      </div>
    </div>
  );
}
export default React.memo(PackageChangeSet);
import {action} from '@storybook/addon-actions';
import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';

import {createChangeSet} from '@rollingversions/change-set';
import {DEFAULT_CONFIG} from '@rollingversions/config';
import {PackageManifest, PublishTarget} from '@rollingversions/types';

import PullRequestPage from '.';
import type {PullRequestPageProps} from '.';
import AppContainer from '../AppContainer';
import AppNavBar, {AppNavBarLink} from '../AppNavBar';

export default {title: 'pages/PullRequestPage'};

function packageManifest(
  manifest: Pick<PackageManifest, 'packageName'> & Partial<PackageManifest>,
): PackageManifest {
  return {
    ...DEFAULT_CONFIG,
    customized: [],
    targetConfigs: [
      {
        type: PublishTarget.npm,
        packageName: manifest.packageName,
        private: false,
        publishConfigAccess: 'public',
        path: 'fake-path',
      },
    ],
    dependencies: {required: [], optional: [], development: []},
    ...manifest,
  };
}
const Template = (props: Partial<PullRequestPageProps>) => {
  const [saving, setSaving] = React.useState(false);
  return (
    <MemoryRouter>
      <AppContainer>
        <AppNavBar>
          <AppNavBarLink to={`#`}>ForbesLindesay</AppNavBarLink>
          <AppNavBarLink to={`#`}>atdatabases</AppNavBarLink>
          <AppNavBarLink>PR 100</AppNavBarLink>
        </AppNavBar>
        <PullRequestPage
          permission="edit"
          closed={false}
          merged={false}
          saving={saving}
          packages={
            new Map([
              [
                '@databases/pg',
                {
                  changeSet: createChangeSet(),
                  manifest: packageManifest({packageName: '@databases/pg'}),
                  currentVersion: null,
                  dependencies: {required: [], optional: [], development: []},
                  released: false,
                },
              ],
              [
                '@databases/mysql',
                {
                  changeSet: createChangeSet(),
                  manifest: packageManifest({packageName: '@databases/mysql'}),
                  currentVersion: null,

                  dependencies: {required: [], optional: [], development: []},
                  released: false,
                },
              ],
            ])
          }
          packageErrors={[]}
          onSave={async (...args) => {
            action('save')(...args);
            setSaving(true);
            await new Promise((r) => setTimeout(r, 2000));
            setSaving(false);
          }}
          {...props}
        />
      </AppContainer>
    </MemoryRouter>
  );
};
export const Default = () => {
  return <Template />;
};

export const ReadOnlyPackage = () => {
  return (
    <Template
      closed={true}
      merged={true}
      packages={
        new Map([
          [
            '@databases/pg',
            {
              changeSet: createChangeSet(),
              manifest: packageManifest({packageName: '@databases/pg'}),
              currentVersion: null,
              released: false,
            },
          ],
          [
            '@databases/mysql',
            {
              changeSet: createChangeSet({
                type: 'breaking',
                title: 'Renamed `querySingleResult` to `queryOneResult`',
                body: '',
              }),
              manifest: packageManifest({packageName: '@databases/mysql'}),
              currentVersion: null,
              released: true,
            },
          ],
        ])
      }
    />
  );
};

export const AllChangesReleased = () => {
  return (
    <Template
      closed={true}
      merged={true}
      packages={
        new Map([
          [
            '@databases/pg',
            {
              changeSet: createChangeSet(),
              manifest: packageManifest({packageName: '@databases/pg'}),
              currentVersion: null,
              released: true,
            },
          ],
          [
            '@databases/mysql',
            {
              changeSet: createChangeSet({
                type: 'breaking',
                title: 'Renamed `querySingleResult` to `queryOneResult`',
                body: '',
              }),
              manifest: packageManifest({packageName: '@databases/mysql'}),
              currentVersion: null,
              released: true,
            },
          ],
        ])
      }
    />
  );
};

export const ClosedNonAdmin = () => {
  return (
    <Template
      permission="view"
      closed={true}
      merged={true}
      packages={
        new Map([
          [
            '@databases/pg',
            {
              changeSet: createChangeSet(),
              manifest: packageManifest({packageName: '@databases/pg'}),
              currentVersion: null,
              dependencies: {required: [], optional: [], development: []},
              released: true,
            },
          ],
          [
            '@databases/mysql',
            {
              changeSet: createChangeSet({
                type: 'breaking',
                title: 'Renamed `querySingleResult` to `queryOneResult`',
                body: '',
              }),
              manifest: packageManifest({packageName: '@databases/mysql'}),
              currentVersion: null,
              released: false,
            },
          ],
        ])
      }
    />
  );
};

export const OpenNonAdminNonAuthor = () => {
  return (
    <Template
      permission="view"
      packages={
        new Map([
          [
            '@databases/pg',
            {
              changeSet: createChangeSet(),
              manifest: packageManifest({packageName: '@databases/pg'}),
              currentVersion: null,
              released: false,
            },
          ],
          [
            '@databases/mysql',
            {
              changeSet: createChangeSet({
                type: 'breaking',
                title: 'Renamed `querySingleResult` to `queryOneResult`',
                body: '',
              }),
              currentVersion: null,
              manifest: packageManifest({packageName: '@databases/mysql'}),
              released: true,
            },
          ],
        ])
      }
    />
  );
};
import React from 'react';

import type ChangeSet from '@rollingversions/change-set';
import type {PackageManifest} from '@rollingversions/types';

import type Permission from '../../../server/permissions/Permission';
import type {PullRequestPackage} from '../../../types';
import getLocalId from '../../utils/getLocalId';
import Alert from '../Alert';
import type {PackageChangeSetProps} from '../PackageChangeSet';
import PackageChangeSet from '../PackageChangeSet';
import {ManifestWarning} from '../RepositoryPage';
import SaveChangeLogFooter from '../SaveChangeLogFooter';

function getState(
  packages: Map<string, PullRequestPackage>,
): {
  packageName: string;
  changes: ChangeSet<{localId: number}>;
  manifest: PackageManifest;
  released: boolean;
}[] {
  return [...packages]
    .map(([packageName, {changeSet, manifest, released}]) => ({
      packageName,
      changes: changeSet.map((c) => ({
        ...c,
        localId: getLocalId(),
      })),
      manifest,
      released,
    }))
    .sort(({packageName: a}, {packageName: b}) => (a < b ? -1 : 1));
}

export interface PullRequestPageProps {
  saving: boolean;
  packages: Map<string, PullRequestPackage>;
  closed: boolean;
  merged: boolean;
  permission: Permission;
  packageErrors: readonly {
    readonly filename: string;
    readonly error: string;
  }[];
  onSave: (changes: {packageName: string; changes: ChangeSet}[]) => void;
}

const alreadyReleasedWarning = (
  <Alert className="mb-4">
    This package has already been released, so these notes are read only. If you
    need to edit the release notes, you can do so in GitHub releases, but it
    will not change the version numbers that were released, as they are
    immutable.
  </Alert>
);
export default function PullRequestPage({
  saving,
  packages,
  closed,
  merged,
  permission,
  packageErrors,
  onSave,
}: PullRequestPageProps) {
  const [initialState] = React.useState(() => getState(packages));
  const [state, setState] = React.useState(initialState);

  const onChange: PackageChangeSetProps['onChange'] = React.useCallback(
    (packageName, update) => {
      setState((s) =>
        s.map((pkg) =>
          pkg.packageName === packageName
            ? {...pkg, changes: update(pkg.changes)}
            : pkg,
        ),
      );
    },
    [setState],
  );

  const allReleased = state.every((p) => p.released);

  return (
    <>
      <div className="flex-grow flex-shrink-0 pb-16 pt-16 px-8 container mx-auto">
        {allReleased ? (
          <Alert className="mb-6">
            This change set is read only because all these changes have already
            been released. If you need to edit the release notes, you can do so
            in GitHub releases, but it will not change the version numbers that
            were released, as they are immutable.
          </Alert>
        ) : (closed || merged) && permission !== 'edit' ? (
          <Alert className="mb-6">
            This change set is read only because the pull request has been{' '}
            {merged ? 'merged' : 'closed'}. Once a pull request is merged, it
            can only be edited by a repository owner.
          </Alert>
        ) : permission !== 'edit' ? (
          <Alert className="mb-6">
            Only the owner of the repository or author of the pull request can
            edit the release notes.
          </Alert>
        ) : null}

        {packageErrors
          ? packageErrors.map(({filename, error}, i) => (
              <ManifestWarning key={i} filename={filename} error={error} />
            ))
          : null}
        {state.map(({packageName, changes, manifest, released}, i) => (
          <React.Fragment key={packageName}>
            {i === 0 ? null : <hr className="my-16" />}
            <PackageChangeSet
              disabled={saving}
              readOnly={permission !== 'edit' || released}
              warning={
                !allReleased && released && permission === 'edit'
                  ? alreadyReleasedWarning
                  : null
              }
              packageName={packageName}
              targetConfigs={manifest.targetConfigs}
              changes={changes}
              changeTypes={manifest.changeTypes}
              onChange={onChange}
            />
          </React.Fragment>
        ))}
      </div>
      {permission === 'edit' && !allReleased && (
        <SaveChangeLogFooter
          disabled={saving}
          onClick={() => {
            if (saving) return;
            const oldState = new Map(
              initialState.map(
                ({packageName, changes}) => [packageName, changes] as const,
              ),
            );
            onSave(
              state
                .filter(
                  ({packageName, changes}) =>
                    oldState.get(packageName) !== changes,
                )
                .map(({packageName, changes}) => ({
                  packageName,
                  changes: changes.map(({localId, ...c}) => c),
                })),
            );
          }}
        />
      )}
    </>
  );
}
import * as React from 'react';

import {PublishTarget} from '@rollingversions/types';

import RegistryStatus from '.';

export default {title: 'modules/RegistryStatus'};

export const Default = () => {
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <RegistryStatus targetConfigs={[]} />
      <RegistryStatus
        targetConfigs={[
          {
            type: PublishTarget.npm,
            private: true,
            publishConfigAccess: 'public',
            path: '',
            packageName: '',
          },
        ]}
      />
      <RegistryStatus
        targetConfigs={[
          {
            type: PublishTarget.npm,
            private: false,
            publishConfigAccess: 'public',
            path: '',
            packageName: '',
          },
        ]}
      />
      <RegistryStatus
        targetConfigs={[
          {
            type: PublishTarget.npm,
            private: false,
            publishConfigAccess: 'restricted',
            path: '',
            packageName: '',
          },
        ]}
      />
    </div>
  );
};
import React from 'react';

import {PublishTarget, PublishTargetConfig} from '@rollingversions/types';

import Alert from '../Alert';

export interface RegistryStatusProps {
  targetConfigs: readonly PublishTargetConfig[];
}

export default function RegistryStatus({targetConfigs}: RegistryStatusProps) {
  if (targetConfigs.length === 0) {
    return (
      <Alert>
        This package will not be published because there are no longer any
        target configs for it. If you want to publish these changes, either move
        the changes onto the correct package, or add a publish target in the
        repo for this package name.
      </Alert>
    );
  }
  return (
    <>
      {targetConfigs.map(
        (targetConfig, i): React.ReactElement => {
          switch (targetConfig.type) {
            case PublishTarget.npm: {
              // if (p.versionTag || p.registryVersion) {
              //   if (p.registryVersion) {
              //     return (
              //       <p key={i}>
              //         This package is published <strong>publicly</strong> on
              //         the {publishTarget} registry.
              //       </p>
              //     );
              //   } else {
              //     return (
              //       <p key={i}>
              //         This package is published <strong>privately</strong> on
              //         the {publishTarget} registry.
              //       </p>
              //     );
              //   }
              // }
              if (targetConfig.private) {
                return (
                  <p>
                    This package is not published on any registry, but git
                    tags/releases will still be created for it if you add a
                    changelog.
                  </p>
                );
              }
              if (targetConfig.publishConfigAccess === 'restricted') {
                return (
                  <React.Fragment key={i}>
                    <p>
                      This package will be published <strong>privately</strong>{' '}
                      on the npm registry, unless you have manually updated the
                      access config.
                    </p>
                    <p>
                      If you prefer to publish it publicly, you can add the
                      following to your package.json:
                      <pre>
                        <code>{'"publishConfig": {"access": "public"}'}</code>
                      </pre>
                    </p>
                  </React.Fragment>
                );
              }
              return (
                <p key={i}>
                  This package will be published <strong>publicly</strong> on
                  the npm registry.
                </p>
              );
            }
            case PublishTarget.custom_script: {
              return (
                <p key={i}>
                  This package will be published via a custom script:
                  <pre>
                    <code>{targetConfig.publish}</code>
                  </pre>
                </p>
              );
            }
          }
        },
      )}
    </>
  );
}
import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';

import {createChangeSet} from '@rollingversions/change-set';
import {DEFAULT_CHANGE_TYPES} from '@rollingversions/config';

import {RepositoryPageProps, useBranchState} from '.';
import RepositoryPage, {
  CycleWarning,
  PackageWithChanges,
  PackageWithNoChanges,
  ReleaseButton,
} from '.';
import AppContainer from '../AppContainer';
import AppNavBar, {AppNavBarLink} from '../AppNavBar';
import ChangeBranchDialog, {ChangeBranchButton} from '../ChangeBranchDialog';
import ChangeBranchLink from '../ChangeBranchLink';

export default {title: 'pages/RepositoryPage'};

const TemplateInner = ({
  dialog,
  ...props
}: RepositoryPageProps & {dialog?: React.ReactNode}) => {
  const {branch, changingBranch} = useBranchState();
  return (
    <>
      <AppContainer>
        <AppNavBar>
          <AppNavBarLink to={`#`}>ForbesLindesay</AppNavBarLink>
          <AppNavBarLink>atdatabases</AppNavBarLink>
          <AppNavBarLink>
            {branch ?? `main`}
            <ChangeBranchLink currentBranch={branch} />
          </AppNavBarLink>
        </AppNavBar>
        <RepositoryPage {...props} />
      </AppContainer>

      <ChangeBranchDialog open={changingBranch} currentBranch={branch}>
        <ChangeBranchButton to={{search: `?branch=main`}}>
          main
        </ChangeBranchButton>
        {Array.from({length: 20}).map((_, i) => (
          <ChangeBranchButton
            key={i}
            to={{
              search: `?branch=${encodeURIComponent(
                `feat/${String.fromCharCode(97 + i)}`,
              )}`,
            }}
          >
            feat/{String.fromCharCode(97 + i)}
          </ChangeBranchButton>
        ))}
      </ChangeBranchDialog>
    </>
  );
};
const Template = (props: RepositoryPageProps & {dialog?: React.ReactNode}) => {
  return (
    <MemoryRouter>
      <TemplateInner {...props} />
    </MemoryRouter>
  );
};

export const NoUpdateRequired = () => {
  return (
    <Template>
      <PackageWithNoChanges packageName="@database/pg" currentVersion={null} />
      <PackageWithNoChanges
        packageName="@database/mysql"
        currentVersion={null}
      />
    </Template>
  );
};

export const UpdateRequired = () => {
  return (
    <Template releaseButton={<ReleaseButton />}>
      <PackageWithChanges
        packageName="@database/pg"
        currentVersion={null}
        newVersion="1.0.0"
        changeSet={createChangeSet({
          type: 'feat',
          title: 'Initial release',
          body: '',
          pr: 42,
        })}
        changeTypes={DEFAULT_CHANGE_TYPES}
      />
      <PackageWithChanges
        packageName="@database/mysql"
        currentVersion="1.0.0"
        newVersion="2.0.0"
        changeSet={createChangeSet({
          type: 'breaking',
          title: 'Renamed queryStream to queryIterable',
          body: '',
          pr: 42,
        })}
        changeTypes={DEFAULT_CHANGE_TYPES}
      />
    </Template>
  );
};

export const CircularDependency = () => {
  return (
    <Template>
      <CycleWarning
        cycle={['@datbases/pg', '@databases/mysl', '@databases/pg']}
      />
      <PackageWithChanges
        packageName="@database/pg"
        currentVersion={null}
        newVersion="1.0.0"
        changeSet={createChangeSet({
          type: 'feat',
          title: 'Initial release',
          body: '',
          pr: 42,
        })}
        changeTypes={DEFAULT_CHANGE_TYPES}
      />
      <PackageWithChanges
        packageName="@database/mysql"
        currentVersion="1.0.0"
        newVersion="2.0.0"
        changeSet={createChangeSet({
          type: 'breaking',
          title: 'Renamed queryStream to queryIterable',
          body: '',
          pr: 42,
        })}
        changeTypes={DEFAULT_CHANGE_TYPES}
      />
    </Template>
  );
};
import React, {useMemo} from 'react';
import {useLocation} from 'react-router-dom';

import type ChangeSet from '@rollingversions/change-set';
import {changesToMarkdown} from '@rollingversions/change-set';
import {ChangeType} from '@rollingversions/types';

import Alert from '../Alert';
import GitHubMarkdownAsync from '../GitHubMarkdown/async';
import InstallIcon from '../HeroBar/install-icon.svg';

function PackageName({children}: {children: React.ReactNode}) {
  return (
    <h2 className="font-sans text-2xl text-gray-900 font-light mb-4">
      {children}
    </h2>
  );
}

export interface RepositoryPageProps {
  releaseButton?: React.ReactNode;
  children: React.ReactNode;
}

export default function RepositoryPage({
  releaseButton,
  children,
}: RepositoryPageProps) {
  return (
    <div className="container mx-auto">
      <h1 className="flex align-center justify-between mb-2 mt-12">
        <span className="font-sans text-3xl text-gray-900 font-normal">
          Next Release
        </span>
        {releaseButton}
      </h1>
      {children}
    </div>
  );
}

export function CycleWarning({cycle}: {cycle: readonly string[]}) {
  return <Alert className="mb-4">Cycle Detected: {cycle.join(' -> ')}</Alert>;
}
export function ManifestWarning({
  filename,
  error,
}: {
  filename: string;
  error: string;
}) {
  return (
    <Alert className="mb-4">
      An error was encountered while parsing the package manifest at "{filename}
      ":
      <pre>{error}</pre>
    </Alert>
  );
}

export function PackageWithChanges({
  packageName,
  currentVersion,
  newVersion,
  changeSet,
  changeTypes,
}: {
  packageName: string;
  currentVersion: string | null;
  newVersion: string;
  changeSet: ChangeSet<{pr: number}>;
  changeTypes: readonly ChangeType[];
}) {
  return (
    <React.Fragment key={packageName}>
      <PackageName>
        {packageName} ({currentVersion || 'unreleased'}
        {' -> '}
        {newVersion})
      </PackageName>
      <GitHubMarkdownAsync>
        {changesToMarkdown(changeSet, {
          headingLevel: 3,
          renderContext: ({pr}) => ` (#${pr})`,
          changeTypes,
        })}
      </GitHubMarkdownAsync>
    </React.Fragment>
  );
}

export function PackageWithNoChanges({
  packageName,
  currentVersion,
}: {
  packageName: string;
  currentVersion: string | null;
}) {
  return (
    <React.Fragment key={packageName}>
      <PackageName>
        {packageName} ({currentVersion || 'unreleased'})
      </PackageName>
      <p className="mb-8">No updates merged</p>
    </React.Fragment>
  );
}

export function ReleaseButton() {
  return (
    <button
      type="submit"
      className="flex items-center justify-center bg-black text-white italic font-poppins font-black h-12 px-8 text-2xl focus:outline-none focus:shadow-gray"
    >
      Release via GitHub
      <div className="w-2" />
      <InstallIcon className="h-6 w-auto" />
    </button>
  );
}

export function useBranchState() {
  const {search} = useLocation();
  return useMemo(() => {
    const searchParams = new URLSearchParams(search);
    const branch = searchParams.get(`branch`);
    const changingBranch = searchParams.get(`change-branch`) === `1`;
    return {branch, changingBranch};
  }, [search]);
}
import {action} from '@storybook/addon-actions';
import * as React from 'react';

import SaveChangeLogFooter from '.';

export default {title: 'modules/SaveChangeLogFooter'};

export const Default = () => {
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <SaveChangeLogFooter disabled={false} onClick={action('save')} />
    </div>
  );
};

export const Disabled = () => {
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <SaveChangeLogFooter disabled={true} onClick={action('save')} />
    </div>
  );
};
import React from 'react';

export interface SaveChangeLogFooterProps {
  disabled: boolean;
  onClick: () => void;
}
export default function SaveChangeLogFooter({
  disabled,
  onClick,
}: SaveChangeLogFooterProps) {
  return (
    <div
      className="flex-shrink-0 px-6 h-24 w-full bg-white flex justify-end items-center lg:sticky bottom-0"
      style={{
        boxShadow:
          '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <SaveButton disabled={disabled} onClick={onClick} />
    </div>
  );
}

function SaveButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex items-center justify-center bg-black text-white italic font-poppins font-medium h-16 w-auto px-6 text-4xl rounded shadow-lg focus:outline-none focus:shadow-gray ${
        disabled ? ` opacity-50` : ``
      }`}
      onClick={async () => {
        if (disabled) return;
        onClick();
      }}
    >
      Save Changes
    </button>
  );
}
