export {PullRequest, Repository} from './GitHub';
export {default as PackageDependencies} from './PackageDependencies';
export {default as PackageManifest} from './PackageManifest';
export {PublishConfig, PublishEvents, PublishEventHandlers} from './publish';
export {default as PublishTarget} from './PublishTarget';
export {default as PullRequestState} from './PullRequestState';
export {default as VersionTag} from './VersionTag';

export {ChangeLogEntry, ChangeSet, ChangeType} from './ChangeSet';

export type PrePublishResult = {ok: true} | {ok: false; reason: string};
