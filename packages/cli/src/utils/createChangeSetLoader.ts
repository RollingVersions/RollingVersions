import {ChangeSet} from '../types';
import {
  changeSetWithContext,
  createEmptyChangeSet,
  mergeChangeSets,
} from '../types/ChangeSet';

export interface ChangeSetLoaderConfig<TPackage, TPullRequest, TContext> {
  getPullRequestID: (pullRequest: TPullRequest) => number | string;
  getPullRequestContext: (pullRequest: TPullRequest) => TContext;
  getChangeSetForPullRequest: (
    pullRequest: TPullRequest,
  ) => Promise<(pkg: TPackage) => ChangeSet | null>;
  getUnreleasedPullRequests: (
    pkg: TPackage,
  ) => Promise<readonly TPullRequest[]>;
}

export default function createChangeSetLoader<TPackage, TPullRequest, TContext>(
  config: ChangeSetLoaderConfig<TPackage, TPullRequest, TContext>,
) {
  const changeSetCacheByPullRequest = new Map<
    TPullRequest,
    Promise<(pkg: TPackage) => ChangeSet | null>
  >();
  const getChangeSetForPullRequest = (pr: TPullRequest) => {
    const cached = changeSetCacheByPullRequest.get(pr);
    if (cached) return cached;
    const fresh = config.getChangeSetForPullRequest(pr);
    changeSetCacheByPullRequest.set(pr, fresh);
    try {
      return fresh;
    } catch (ex) {
      changeSetCacheByPullRequest.delete(pr);
      throw ex;
    }
  };
  const changeSetCacheByPackage = new Map<
    TPackage,
    Promise<ChangeSet<TContext>>
  >();

  return async (pkg: TPackage) => {
    const cached = changeSetCacheByPackage.get(pkg);
    if (cached) return cached;
    const pullRequests = await config.getUnreleasedPullRequests(pkg);
    const seen = new Set<string | number>();
    const changeSets = await Promise.all(
      pullRequests
        .filter((pr) => {
          const id = config.getPullRequestID(pr);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        })
        .map(
          async (pr): Promise<ChangeSet<TContext> | null> => {
            const changeSet = (await getChangeSetForPullRequest(pr))(pkg);
            return changeSet
              ? changeSetWithContext(
                  changeSet,
                  config.getPullRequestContext(pr),
                )
              : null;
          },
        ),
    );
    return changeSets.reduce<ChangeSet<TContext>>(
      (accumulatedChangeSet, pullRequestChangSet) => {
        return pullRequestChangSet
          ? mergeChangeSets(accumulatedChangeSet, pullRequestChangSet)
          : accumulatedChangeSet;
      },
      createEmptyChangeSet(),
    );
  };
}
