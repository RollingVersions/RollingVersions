import {GitHubClient} from '@rollingversions/utils/lib/GitHub';
import {Repository} from '@rollingversions/utils/lib/types';
import updateRepo from './updateRepo';

const timeouts = new Map<string, NodeJS.Timeout>();
const resolvers = new Map<string, (() => void)[]>();
const rejecters = new Map<string, ((err: any) => void)[]>();
function getCallbacks<TKey, TValue>(map: Map<TKey, TValue[]>, key: TKey) {
  const current = map.get(key);
  if (current) return current;
  const initial: TValue[] = [];
  map.set(key, initial);
  return initial;
}

export default async function updateRepoDebounced(
  github: GitHubClient,
  repo: Repository,
) {
  const fullName = `${repo.owner}/${repo.name}`;

  const existingTimeout = timeouts.get(fullName);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  setTimeout(() => {
    timeouts.delete(fullName);
    updateRepo(github, repo).then(
      () => {
        getCallbacks(resolvers, fullName).forEach((fn) => fn());
        resolvers.delete(fullName);
        rejecters.delete(fullName);
      },
      (err) => {
        getCallbacks(rejecters, fullName).forEach((fn) => fn(err));
        resolvers.delete(fullName);
        rejecters.delete(fullName);
      },
    );
    // We debounce by 10 seconds to allow for registry package publishing,
    // which might happen later than the github tag publishing.
    // This also helps to
  }, 10_000);

  await new Promise((resolve, reject) => {
    getCallbacks(resolvers, fullName).push(resolve);
    getCallbacks(rejecters, fullName).push(reject);
  });
}
