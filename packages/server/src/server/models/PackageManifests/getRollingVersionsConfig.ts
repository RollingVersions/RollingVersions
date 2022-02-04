import * as toml from 'toml';

import {parseRollingConfig, RollingConfig} from '@rollingversions/config';
import {DbGitRepository} from '@rollingversions/db';

import {getFileContents, GitHubClient} from '../../services/github';

const CONFIG_FILENAME = `.github/rolling-versions.toml`;
export default async function getRollingVersionsConfig(
  client: GitHubClient,
  repo: DbGitRepository,
  commitSha: string,
): Promise<
  {ok: true; value: RollingConfig | null} | {ok: false; reason: string}
> {
  const configFileContents = await getFileContents(client, {
    repoId: repo.graphql_id,
    commitSha,
    filePath: CONFIG_FILENAME,
  });
  if (configFileContents === null) {
    return {ok: true, value: null};
  }

  const parsed = parseToml(configFileContents);
  if (!parsed.ok) {
    return {ok: false, reason: parsed.reason};
  }

  const validated = parseRollingConfig(parsed.value);
  if (!validated.success) {
    return {ok: false, reason: validated.reason};
  }

  return {ok: true, value: validated.value};
}

function parseToml(str: string) {
  try {
    return {ok: true as const, value: toml.parse(str)};
  } catch (ex: any) {
    return {ok: false as const, reason: ex.message};
  }
}
