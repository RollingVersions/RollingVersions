import React from 'react';

let GitHubMarkdownCache: typeof import('./GitHubMarkdown') | undefined;
let GitHubMarkdownPromise:
  | Promise<typeof import('./GitHubMarkdown')>
  | undefined;

export default function GitHubMarkdownAsync({source}: {source: string}) {
  const [GitHubMarkdown, setModules] = React.useState(GitHubMarkdownCache);
  const [err, setError] = React.useState<Error | undefined>(undefined);
  React.useEffect(() => {
    if (!GitHubMarkdownPromise) {
      GitHubMarkdownPromise = import('./GitHubMarkdown');
    }
    GitHubMarkdownPromise.then((r) => {
      GitHubMarkdownCache = r;
      setModules(r);
      setError(undefined);
    }).catch((err) => {
      setError(err);
    });
  }, [err]);
  if (err) {
    return <div>{err.message}</div>;
  }
  if (!GitHubMarkdown) {
    return <pre>{source}</pre>;
  }
  return <GitHubMarkdown.default source={source} />;
}
