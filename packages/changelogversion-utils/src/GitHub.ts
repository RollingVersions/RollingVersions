import {URL} from 'url';
import Octokit = require('@octokit/rest');
import {
  COMMENT_PREFIX,
  PullRequst,
  renderComment,
  getUrlForChangeLog,
  getShortDescription,
} from './Rendering';
import {readState} from './CommentState';
import PullChangeLog from './PullChangeLog';

function isObject(
  value: unknown,
): value is Record<string | number | symbol, unknown> {
  return value && typeof value === 'object';
}

export async function listPackages(
  github: Pick<Octokit, 'repos'>,
  pr: Pick<PullRequst, 'owner' | 'repo' | 'headSha'>,
) {
  const packages: Array<{packageName: string; notToBePublished: boolean}> = [];
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
    if (item.type === 'file' && !item.path.endsWith('/package.json')) {
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
        packages.push({
          packageName: result.name,
          notToBePublished: result.private === true,
        });
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

export async function readComment(
  github: Pick<Octokit, 'issues'>,
  pr: Pick<PullRequst, 'owner' | 'repo' | 'number'>,
): Promise<{
  existingComment: number | undefined;
  state: PullChangeLog | undefined;
}> {
  const comments = await github.issues.listComments({
    issue_number: pr.number,
    owner: pr.owner,
    repo: pr.repo,
    per_page: 100,
  });
  const existingComment = comments.data.find((comment) =>
    comment.body.includes(COMMENT_PREFIX),
  );
  return {
    existingComment: existingComment?.id,
    state: readState(existingComment?.body),
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
