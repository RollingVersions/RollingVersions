export type {ApiPackageResponse, GetRepositoryApiResponse} from './ApiResponse';
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
export type {default as VersionNumber} from './VersionNumber';
export type {default as VersionSchema} from './VersionSchema';
export type {default as VersionTag, CurrentVersionTag} from './VersionTag';

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
