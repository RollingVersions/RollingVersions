import * as t from 'funtypes';
import {pascalCase} from 'pascal-case';

const InstallationSchema = t.Named(
  `Installation`,
  t.Object({
    id: t.Number,
  }),
);
export type Installation = t.Static<typeof InstallationSchema>;

const FullNameSchema = t.String.withConstraint(
  (value) =>
    /^[^\/]+\/[^\/]+$/.test(value)
      ? true
      : `Expected full_name to be in the form "owner/name" but got "${value}"`,
  {name: 'FullRepositoryName'},
);

const RepositorySchema = t.Named(
  `Repository`,
  t.Object({
    id: t.Number,
    node_id: t.String,
    full_name: FullNameSchema,
    private: t.Boolean,
    default_branch: t.String,
    name: t.String,
    owner: t.Object({
      login: t.String,
    }),
  }),
);

const PullRequestSchema = t.Named(
  `PullRequest`,
  t.Object({
    id: t.Number,
    node_id: t.String,
    number: t.Number,
    title: t.String,
    closed_at: t.Union(t.Null, t.String),
    merged_at: t.Union(t.Null, t.String),
    merge_commit_sha: t.Union(t.Null, t.String),
    head: t.Object({ref: t.String}),
    base: t.Object({ref: t.String}),
  }),
);

function createEventSchema<TName extends string, TPayload>(
  name: TName,
  payload: t.Codec<TPayload>,
) {
  return t.Named(
    `${pascalCase(name)}Event`,
    t.Object({
      id: t.String,
      name: t.Literal(name),
      payload,
    }),
  );
}

const RepositoriesAddedSchema = t.Object({
  action: t.Literal(`added`),
  // [{"id":448335841,"node_id":"R_kgDOGrkP4Q","name":"hypermail","full_name":"sitedata/hypermail","private":false}]
  repositories_added: t.Array(t.Object({full_name: FullNameSchema})),
  sender: t.Object({login: t.String}),
  installation: InstallationSchema,
});

const InstallationRepositoriesEventSchema = createEventSchema(
  `installation_repositories`,
  RepositoriesAddedSchema,
);
export type InstallationRepositoriesEvent = t.Static<
  typeof InstallationRepositoriesEventSchema
>;

const InstallationCreatedSchema = t.Named(
  `InstallationCreated`,
  t.Object({
    action: t.Literal(`created`),
    repositories: t.Array(t.Object({full_name: FullNameSchema})),
    sender: t.Object({login: t.String}),
    installation: InstallationSchema,
  }),
);
export type InstallationCreated = t.Static<typeof InstallationCreatedSchema>;
const InstallationSuspendedSchema = t.Named(
  `InstallationSuspended`,
  t.Object({
    action: t.Literal(`suspend`),
    sender: t.Object({login: t.String}),
    installation: InstallationSchema,
  }),
);
const InstallationEventSchema = createEventSchema(
  `installation`,
  t.Union(InstallationCreatedSchema, InstallationSuspendedSchema),
);
export type InstallationEvent = t.Static<typeof InstallationEventSchema>;

const CreateEventSchema = createEventSchema(
  `create`,
  t.Object({
    ref: t.String,
    ref_type: t.Union(t.Literal('tag'), t.Literal('branch')),
    repository: RepositorySchema,
    installation: InstallationSchema,
  }),
);
export type CreateEvent = t.Static<typeof CreateEventSchema>;

const DeleteEventSchema = createEventSchema(
  `delete`,
  t.Object({
    ref: t.String,
    ref_type: t.Union(t.Literal('tag'), t.Literal('branch')),
    repository: RepositorySchema,
    installation: InstallationSchema,
  }),
);
export type DeleteEvent = t.Static<typeof DeleteEventSchema>;

const PullRequestEventSchema = createEventSchema(
  `pull_request`,
  t.Object({
    action: t.Union(
      t.Literal('labeled'),
      t.Literal('unlabeled'),
      t.Literal('opened'),
      t.Literal('synchronize'),
      t.Literal('closed'),
      t.Literal('auto_merge_enabled'),
      t.Literal('auto_merge_disabled'),
      t.Literal('review_requested'),
      t.Literal('review_request_removed'),
      t.Literal('ready_for_review'),
      t.Literal('edited'),
      t.Literal('assigned'),
    ),
    repository: RepositorySchema,
    pull_request: PullRequestSchema,
    installation: InstallationSchema,
  }),
);
export type PullRequestEvent = t.Static<typeof PullRequestEventSchema>;

const PushEventSchema = createEventSchema(
  `push`,
  t.Object({
    repository: RepositorySchema,
    installation: InstallationSchema,
  }),
);
export type PushEvent = t.Static<typeof PushEventSchema>;

const GitHubAppAuthorizationEventSchema = createEventSchema(
  `github_app_authorization`,
  t.Object({
    action: t.Literal(`revoked`),
    sender: t.Object({login: t.String}),
  }),
);

export const GitHubEventSchema = t.Union(
  CreateEventSchema,
  DeleteEventSchema,
  InstallationEventSchema,
  InstallationRepositoriesEventSchema,
  PullRequestEventSchema,
  PushEventSchema,
  GitHubAppAuthorizationEventSchema,
);

export type GitHubEvent = t.Static<typeof GitHubEventSchema>;

export const IGNORED_EVENT_NAMES = [
  // The "installation_repositories" events are fired when repositories
  // are created anyway, so we don't need to handle these
  // TODO: what about repository renames?
  `repository`,
  // We do not proactively store/cache release notes for past releases
  `release`,
];
