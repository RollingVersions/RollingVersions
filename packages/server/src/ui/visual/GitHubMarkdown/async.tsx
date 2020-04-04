import React from 'react';

export type GitHubMarkdownProps = import('./').GitHubMarkdownProps;
let GitHubMarkdownCache: typeof import('./') | undefined;
let GitHubMarkdownPromise: Promise<typeof import('./')> | undefined;

export default function GitHubMarkdownAsync(props: GitHubMarkdownProps) {
  const [GitHubMarkdown, setModules] = React.useState(GitHubMarkdownCache);
  const [err, setError] = React.useState<Error | undefined>(undefined);
  React.useEffect(() => {
    let cancelled = false;
    if (!GitHubMarkdownPromise) {
      GitHubMarkdownPromise = import(/* webpackPrefetch: true */ './');
    }
    GitHubMarkdownPromise.then((r) => {
      if (cancelled) return;
      GitHubMarkdownCache = r;
      setModules(r);
      setError(undefined);
    }).catch((err) => {
      if (cancelled) return;
      setError(err);
    });
    return () => {
      cancelled = true;
    };
  }, [err]);
  if (err) {
    return <div>{err.message}</div>;
  }
  if (!GitHubMarkdown) {
    return <pre>{props.children}</pre>;
  }
  return <GitHubMarkdown.default {...props} />;
}
