import {URL} from 'url';
import Octokit from '@octokit/rest';
import {
  COMMENT_GUID,
  PullRequst,
  renderComment,
  getUrlForChangeLog,
  getShortDescription,
} from './Rendering';
import {readState} from './CommentState';
import PullChangeLog from './PullChangeLog';
import {PackageInfo, Platform, PackageInfos} from './Platforms';
import isObject from './utils/isObject';
import addVersions from './utils/addVersions';
import VersionTag from './VersionTag';

export async function getAllTags(
  github: Pick<Octokit, 'repos'>,
  pr: Pick<PullRequst, 'owner' | 'repo'>,
) {
  const results: Pick<VersionTag, 'commitSha' | 'name'>[] = [];
  let page = 1;
  let nextPage = true;
  while (nextPage) {
    const data = (
      await github.repos.listTags({
        owner: pr.owner,
        repo: pr.repo,
        per_page: 100,
        page,
      })
    ).data.map((t) => ({name: t.name, commitSha: t.commit.sha}));
    results.push(...data);
    nextPage = data.length === 100;
    page++;
  }
  return results;
}
async function listRawPackages(
  github: Pick<Octokit, 'repos'>,
  pr: Pick<PullRequst, 'owner' | 'repo' | 'headSha'>,
) {
  const packages = new Map<
    string,
    Array<Omit<PackageInfo, 'versionTag' | 'registryVersion'>>
  >();
  let ref: string | undefined = pr.headSha;
  let root: Octokit.Response<Octokit.ReposGetContentsResponse>;
  try {
    root = await github.repos.getContents({
      owner: pr.owner,
      repo: pr.repo,
      ref,
      path: '',
    });
  } catch (ex) {
    root = await github.repos.getContents({
      owner: pr.owner,
      repo: pr.repo,
      path: '',
    });
    ref = undefined;
  }

  async function walk(item: Octokit.ReposGetContentsResponseItem) {
    if (
      item.type === 'file' &&
      item.path !== 'package.json' &&
      !item.path.endsWith('/package.json')
    ) {
      return;
    }
    const entry = await github.repos.getContents({
      owner: pr.owner,
      repo: pr.repo,
      ref,
      path: item.path,
    });
    if (Array.isArray(entry.data)) {
      for (const item of entry.data) {
        await walk(item);
      }
    } else {
      if (item.path === 'package.json' || item.path.endsWith('/package.json')) {
        const content = entry.data.content
          ? Buffer.from(entry.data.content, 'base64').toString('utf8')
          : '';
        let result: unknown;
        try {
          result = JSON.parse(content);
        } catch (ex) {
          // ignore
        }
        if (isObject(result) && typeof result.name === 'string') {
          packages.set(result.name, packages.get(result.name) || []);
          packages.get(result.name)!.push({
            path: entry.data.path.replace(/^\//, ''),
            platform: Platform.npm,
            publishConfigAccess:
              result.name[0] === '@'
                ? isObject(result.publishConfig) &&
                  result.publishConfig.access === 'public'
                  ? 'public'
                  : 'restricted'
                : 'public',
            packageName: result.name,
            notToBePublished: result.private === true,
          });
        }
      }
    }
  }
  if (Array.isArray(root.data)) {
    for (const item of root.data) {
      await walk(item);
    }
  } else {
    await walk(root.data);
  }

  return packages;
}
export async function listPackages(
  github: Pick<Octokit, 'repos'>,
  pr: Pick<PullRequst, 'owner' | 'repo' | 'headSha'>,
): Promise<PackageInfos> {
  const [packages, allTags] = await Promise.all([
    listRawPackages(github, pr),
    getAllTags(github, pr),
  ]);

  return await addVersions(packages, allTags);
}

export async function readComment(
  github: Pick<Octokit, 'issues'>,
  pr: Pick<PullRequst, 'owner' | 'repo' | 'number'>,
): Promise<{
  existingComment: number | undefined;
  state: PullChangeLog;
}> {
  const comments = await github.issues.listComments({
    issue_number: pr.number,
    owner: pr.owner,
    repo: pr.repo,
    per_page: 20,
  });
  const existingComment = comments.data.find((comment) =>
    comment.body.includes(COMMENT_GUID),
  );
  return {
    existingComment: existingComment?.id,
    state: readState(existingComment?.body) || {
      submittedAtCommitSha: null,
      packages: [],
    },
  };
}

export async function writeComment(
  github: Pick<Octokit, 'issues'>,
  existingComment: number | undefined,
  pr: PullRequst,
  changeLog: PullChangeLog | undefined,
  changeLogVersionURL: URL,
) {
  const body = renderComment(pr, changeLog, changeLogVersionURL);
  if (existingComment) {
    await github.issues.updateComment({
      owner: pr.owner,
      repo: pr.repo,
      body,
      comment_id: existingComment,
    });
  } else {
    await github.issues.createComment({
      issue_number: pr.number,
      owner: pr.owner,
      repo: pr.repo,
      body,
    });
  }
}

export async function updateStatus(
  github: Pick<Octokit, 'repos'>,
  pr: PullRequst,
  changeLog: PullChangeLog | undefined,
  changeLogVersionURL: URL,
) {
  const url = getUrlForChangeLog(pr, changeLogVersionURL);
  await github.repos.createStatus({
    owner: pr.owner,
    repo: pr.repo,
    sha: pr.headSha,
    state:
      changeLog && pr.headSha === changeLog.submittedAtCommitSha
        ? 'success'
        : 'pending',
    target_url: url.href,
    description: getShortDescription(pr, changeLog),
    context: 'Changelog',
  });
}
