// TODO: publish this to npm

import mapGetOrSet from './mapGetOrSet';

export default function createEvent<T extends any[]>() {
  const subscribers = new Map<(...event: T) => void | Promise<void>, number>();
  async function tryEmit(...event: T) {
    const results = await Promise.allSettled(
      [...subscribers.keys()].map((key) =>
        Promise.resolve(null).then(() => key(...event)),
      ),
    );
    return results.flatMap((r) => (r.status === 'rejected' ? [r.reason] : []));
  }
  return {
    tryEmit,
    async emit(...event: T) {
      const errors = await tryEmit(...event);
      for (const error of errors) {
        throw error;
      }
    },
    subscribe(fn: (...event: T) => void | Promise<void>) {
      mapGetOrSet(subscribers, fn, (existingValue = 0) => existingValue + 1);
      let unsubscribed = false;
      return () => {
        if (unsubscribed) return;
        unsubscribed = true;
        mapGetOrSet(subscribers, fn, (existingValue = 1) => {
          const value = existingValue - 1;
          if (value === 0) {
            return undefined;
          } else {
            return value;
          }
        });
      };
    },
  };
}
