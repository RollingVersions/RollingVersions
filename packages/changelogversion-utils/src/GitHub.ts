import {URL} from 'url';
import Octokit from '@octokit/rest';
import {valid, gt, prerelease} from 'semver';
import {
  COMMENT_PREFIX,
  PullRequst,
  renderComment,
  getUrlForChangeLog,
  getShortDescription,
} from './Rendering';
import {readState} from './CommentState';
import PullChangeLog from './PullChangeLog';
import {PackageInfo, Platform, VersionTag, PackageInfos} from './Platforms';
import {getNpmVersion} from './Npm';

function isObject(
  value: unknown,
): value is Record<string | number | symbol, unknown> {
  return value && typeof value === 'object';
}

function mapMap<TKey, TValue, TResultValue>(
  mapObj: Map<TKey, TValue>,
  mapFn: (value: TValue, key: TKey) => TResultValue,
) {
  return new Map(
    [...mapObj.entries()].map(([key, value]) => {
      return [key, mapFn(value, key)];
    }),
  );
}

function getVersionTag(
  allTags: Octokit.ReposListTagsResponse,
  packageName: string,
  registryVersion: string | null,
  isMonoRepo: boolean,
): VersionTag | null {
  const tags = allTags
    .map((tag) => {
      if (!isMonoRepo && valid(tag.name)) {
        return {
          ...tag,
          version: tag.name,
        };
      }
      const split = tag.name.split('@');
      const version = split.pop()!;
      const name = split.join('@');
      if (name === packageName && valid(version)) {
        return {...tag, version};
      }
      return null;
    })
    .filter(<T>(v: T): v is Exclude<T, null> => v !== null);
  if (registryVersion) {
    return tags.find((t) => t.version === registryVersion) || null;
  } else if (tags.some((t) => !prerelease(t.version))) {
    return tags
      .filter((t) => !prerelease(t.version))
      .reduce((a, b) => {
        if (gt(a.version, b.version)) {
          return a;
        } else {
          return b;
        }
      });
  } else {
    return null;
  }
}

export async function listPackages(
  github: Pick<Octokit, 'repos'>,
  pr: Pick<PullRequst, 'owner' | 'repo' | 'headSha'>,
): Promise<PackageInfos> {
  const allTags = (
    await github.repos.listTags({
      owner: pr.owner,
      repo: pr.repo,
    })
  ).data;
  const packages = new Map<string, Array<Omit<PackageInfo, 'versionTag'>>>();
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
      if (item.path.endsWith('/package.json')) {
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
          const registryVersion =
            result.private === true ? null : await getNpmVersion(result.name);
          packages.get(result.name)!.push({
            platform: Platform.npm,
            packageName: result.name,
            notToBePublished: result.private === true,
            registryVersion,
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

  const result: PackageInfos = {};
  for (const [key, pkgInfo] of mapMap(packages, (pkgInfos) =>
    pkgInfos.map(
      (pkg): PackageInfo => {
        return {
          ...pkg,
          versionTag: getVersionTag(
            allTags,
            pkg.packageName,
            pkg.registryVersion,
            packages.size === 1,
          ),
        };
      },
    ),
  )) {
    result[key] = pkgInfo;
  }
  return result;
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
    per_page: 100,
  });
  const existingComment = comments.data.find((comment) =>
    comment.body.includes(COMMENT_PREFIX),
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
