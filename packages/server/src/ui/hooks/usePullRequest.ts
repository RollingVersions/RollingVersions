import React from 'react';
import {PullRequestResponse} from '../../types';

export default function usePullRequest({
  owner,
  repo,
  pull_number,
}: {
  owner: string;
  repo: string;
  pull_number: string | number;
}) {
  const path = `/${owner}/${repo}/pulls/${pull_number}`;
  const ref = React.useRef(path);
  ref.current = path;
  const [pullRequest, setPullRequest] = React.useState<
    PullRequestResponse | undefined
  >();
  const [error, setError] = React.useState<Error | undefined>();
  const [updatesInFlight, setUpdatesInFlight] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`${path}/json`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`${res.statusText}: ${await res.text()}`);
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setPullRequest(data);
      })
      .catch((ex) => {
        if (cancelled) return;
        setError(ex);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return {
    pullRequest,
    error,
    updating: updatesInFlight > 0,
    update: async (
      state: PullRequestResponse['changeLogState'],
    ): Promise<void> => {
      setUpdatesInFlight((v) => v + 1);
      try {
        try {
          setPullRequest((pr) => pr && {...pr, changeLogState: state});
          const res = await fetch(path, {
            method: 'POST',
            body: JSON.stringify(state),
            headers: {'Content-Type': 'application/json'},
          });
          if (!res.ok) {
            throw new Error(`${res.statusText}: ${await res.text()}`);
          }
        } catch (ex) {
          if (ref.current === path) {
            setError(ex);
          }
        }
      } finally {
        setUpdatesInFlight((v) => v - 1);
      }
    },
  };
}
