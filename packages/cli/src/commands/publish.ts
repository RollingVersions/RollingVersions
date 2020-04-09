import {
  Config,
  areAllSuccessPackageStatuses,
  Status,
  isSuccessPackageStatus,
  MissingTag,
  NoUpdateRequired,
  NewVersionToBePublished,
  SuccessPackageStatus,
} from '../types';
import {listPackages} from '@rollingversions/utils/lib/LocalRepo';
import {getPackageStatuses} from '../utils/getPackageStatuses';
import {GitHubClient, auth} from '@rollingversions/utils/lib/GitHub';
import sortPackages from '../utils/sortPackages';
import {prepublishGitHub, publishGitHub} from '../targets/github';
import getGitTag from '../utils/getGitTag';
import {prepublish, publish as publishTarget} from '../targets';
import notFn from '../utils/notFn';

export enum PublishResultKind {
  NoUpdatesRequired,
  UpdatesPublished,
  MissingTags,
  CircularPackageDependencies,
  GitHubAuthCheckFail,
  PrepublishFailures,
}
export interface NoUpdatesRequired {
  readonly kind: PublishResultKind.NoUpdatesRequired;
  readonly packages: readonly NoUpdateRequired[];
}
export interface UpdatesPublished {
  readonly kind: PublishResultKind.UpdatesPublished;
  readonly packages: readonly SuccessPackageStatus[];
}
export interface MissingTags {
  readonly kind: PublishResultKind.MissingTags;
  readonly packages: readonly MissingTag[];
}
export interface CircularPackageDependencies {
  readonly kind: PublishResultKind.CircularPackageDependencies;
  readonly packageNames: readonly string[];
}
export interface GitHubAuthCheckFail {
  readonly kind: PublishResultKind.GitHubAuthCheckFail;
  readonly reason: string;
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
  | MissingTags
  | CircularPackageDependencies
  | GitHubAuthCheckFail
  | PrepublishFailures;

export default async function publish(config: Config): Promise<Result> {
  const client = new GitHubClient({
    auth: auth.createTokenAuth(config.accessToken),
  });

  const packageInfos = await listPackages(config.dirname);

  const unsortedPackageStatuses = await getPackageStatuses(
    config,
    client,
    packageInfos,
  );

  if (!areAllSuccessPackageStatuses(unsortedPackageStatuses)) {
    return {
      kind: PublishResultKind.MissingTags,
      packages: unsortedPackageStatuses.filter(notFn(isSuccessPackageStatus)),
    };
  }

  const sortResult = sortPackages(config, unsortedPackageStatuses);

  if (sortResult.circular) {
    return {
      kind: PublishResultKind.CircularPackageDependencies,
      packageNames: sortResult.packageNames,
    };
  }

  const packageStatuses = sortResult.packages;

  config.logger.onValidatedPackages?.({
    packages: packageStatuses,
    dryRun: config.dryRun,
  });

  if (
    !packageStatuses.some(
      (pkg) => pkg.status === Status.NewVersionToBePublished,
    )
  ) {
    return {
      kind: PublishResultKind.NoUpdatesRequired,
      packages: packageStatuses as NoUpdateRequired[],
    };
  }

  // TODO: print change logs here

  // prepublish checks
  const gitHubPrepublishInfo = await prepublishGitHub(config, client);
  if (!gitHubPrepublishInfo.ok) {
    return {
      kind: PublishResultKind.GitHubAuthCheckFail,
      reason: gitHubPrepublishInfo.reason,
    };
  }

  const packageVersions = new Map(
    packageStatuses.map((p) => [p.packageName, p.newVersion]),
  );

  const failures: PrepublishFailures['failures'][number][] = [];
  for (const pkg of packageStatuses) {
    if (pkg.status === Status.NewVersionToBePublished) {
      const reasons = [];
      const tagName = getGitTag(packageStatuses, pkg);
      if (gitHubPrepublishInfo.tags.includes(tagName)) {
        reasons.push(`A github release already exists for ${tagName}`);
      }
      for (const prepublishResult of await prepublish(
        config,
        pkg,
        packageVersions,
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

  for (const pkg of packageStatuses) {
    if (pkg.status === Status.NewVersionToBePublished) {
      await publishTarget(config, pkg, packageVersions);

      await publishGitHub(config, client, pkg, getGitTag(packageStatuses, pkg));
    }
  }
  return {
    kind: PublishResultKind.UpdatesPublished,
    packages: packageStatuses,
  };
}
