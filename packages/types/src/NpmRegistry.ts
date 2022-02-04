import * as t from 'funtypes';

const GoogleArtifactRegistryCodec = t.Named(
  `GoogleArtifactRegistry`,
  t.Object({
    type: t.Literal('google_artifact_registry'),
    repository: t.String,
    project: t.String,
    location: t.String,
  }),
);

const GitHubPackagesRegistryCodec = t.Named(
  `GitHubPackagesRegistry`,
  t.Intersect(
    t.Object({
      type: t.Literal('github_packages'),
    }),
    t.Partial({
      auth_token_env: t.String,
    }),
  ),
);

export const NpmRegistryCodec = t.Named(
  `NpmRegistry`,
  t.Union(GoogleArtifactRegistryCodec, GitHubPackagesRegistryCodec),
);
type NpmRegistry = t.Static<typeof NpmRegistryCodec>;
export default NpmRegistry;
