import * as real from '../git';
import {byDirectory} from './fixtures';

export const getAllTags: typeof real.getAllTags = async (dirname) => {
  return byDirectory(dirname)
    .commits.map((c) => c.tags.map((name) => ({name, commitSha: c.sha})))
    .reduce((a, b) => [...a, ...b], []);
};

export const getAllFiles: typeof real.getAllFiles = async function* getAllFiles(
  dirname: string,
) {
  const files = byDirectory(dirname).files;
  for (const file of files) {
    yield {
      path: file.path,
      getContents: async () => file.contents,
    };
  }
};

export const getCommits: typeof real.getCommits = async (dirname, lastTag) => {
  const commits = byDirectory(dirname).commits;
  if (!lastTag) return commits.map((c) => c.sha);
  const results: string[] = [];
  for (const {sha} of commits) {
    if (sha === lastTag) {
      return results;
    } else {
      results.push(sha);
    }
  }
  return results;
};

export const getHeadSha: typeof real.getHeadSha = async (dirname) => {
  const commits = byDirectory(dirname).commits;
  return commits[0].sha;
};
