import React from 'react';

import {
  PullRequestResponse,
  PullRequestResponseCodec,
  UpdatePullRequestBody,
  UpdatePullRequestBodyCodec,
} from '../../types';

export default function usePullRequest({
  owner,
  repo,
  pull_number,
}: {
  owner: string;
  repo: string;
  pull_number: string | number;
}) {
  const path = `/${owner}/${repo}/pull/${pull_number}`;
  const ref = React.useRef(path);
  ref.current = path;
  const [pullRequest, setPullRequest] = React.useState<
    PullRequestResponse | undefined
  >();
  const [error, setError] = React.useState<string | undefined>();
  const [updatesInFlight, setUpdatesInFlight] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`${path}/json`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`${res.statusText}: ${await res.text()}`);
        }
        return await res.json();
      })
      .then((data) => PullRequestResponseCodec.safeParse(data))
      .then((data) => {
        if (cancelled) return;
        if (data.success) setPullRequest(data.value);
        else setError(data.message);
      })
      .catch((ex) => {
        if (cancelled) return;
        setError(ex.message);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return {
    pullRequest,
    error,
    updating: updatesInFlight > 0,
    update: async (body: UpdatePullRequestBody): Promise<boolean> => {
      setUpdatesInFlight((v) => v + 1);
      try {
        try {
          const res = await fetch(path, {
            method: 'POST',
            body: JSON.stringify(UpdatePullRequestBodyCodec.serialize(body)),
            headers: {'Content-Type': 'application/json'},
          });
          if (!res.ok) {
            throw new Error(`${res.statusText}: ${await res.text()}`);
          }
          return true;
        } catch (ex: any) {
          if (ref.current === path) {
            setError(ex);
          }
          return false;
        }
      } finally {
        setUpdatesInFlight((v) => v - 1);
      }
    },
  };
}
