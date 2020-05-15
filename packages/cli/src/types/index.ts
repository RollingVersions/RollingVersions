export {PullRequest, Repository} from './GitHub';
export {default as PackageDependencies} from './PackageDependencies';
export {
  default as PackageManifest,
  PackageManifestWithVersion,
} from './PackageManifest';
export {PublishConfig, PublishEvents, PublishEventHandlers} from './publish';
export {default as PublishTarget} from './PublishTarget';
export {
  ChangeLogEntry,
  ChangeSet,
  ChangeType,
  default as PullRequestState,
} from './PullRequestState';
export {default as VersionTag} from './VersionTag';

export type PrePublishResult = {ok: true} | {ok: false; reason: string};
