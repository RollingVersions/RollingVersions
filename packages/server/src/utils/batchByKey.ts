// TODO: publish this to npm

import mapGetOrSet from './mapGetOrSet';

type Batch<TItemKey, TResult> = {
  fire: () => Promise<void>;
  request: (request: TItemKey) => Promise<TResult>;
};
export default function batchByKey<TBatchKey, TItemKey, TResult>() {
  const cache = new Map<TBatchKey, Batch<TItemKey, TResult>>();
  const inFlightRequests = new Set<TBatchKey>();
  function createBatch(
    batchKey: TBatchKey,
    fn: (
      itemKeys: TItemKey[],
      resolve: (key: TItemKey, value: TResult) => void,
      reject: (key: TItemKey, reason: Error) => void,
      batchKey: TBatchKey,
    ) => Promise<TResult>,
  ): Batch<TItemKey, TResult> {
    const requests = new Map<
      TItemKey,
      {
        result: Promise<TResult>;
        resolve: (value: TResult) => void;
        reject: (reason: Error) => void;
      }
    >();
    setImmediate(async () => {
      if (!inFlightRequests.has(batchKey)) {
        try {
          inFlightRequests.add(batchKey);
          let batch;
          // tslint:disable-next-line: no-conditional-assignment
          while ((batch = cache.get(batchKey))) {
            cache.delete(batchKey);
            // fire never throws an error
            await batch.fire();
          }
        } finally {
          inFlightRequests.delete(batchKey);
        }
      }
    });
    return {
      fire: async () => {
        try {
          const defaultResult = await fn(
            [...requests.keys()],
            (key, value) => {
              const req = requests.get(key);
              if (!req) throw new Error(`Unable to find request for ${key}`);
              req.resolve(value);
            },
            (key, value) => {
              const req = requests.get(key);
              if (!req) throw new Error(`Unable to find request for ${key}`);
              req.reject(value);
            },
            batchKey,
          );
          for (const req of requests.values()) {
            req.resolve(defaultResult);
          }
        } catch (ex) {
          for (const req of requests.values()) {
            req.reject(ex);
          }
        }
      },
      request: async (key: TItemKey) => {
        return mapGetOrSet(requests, key, () => {
          let resolve!: (value: TResult) => void;
          let reject!: (reason: Error) => void;
          let resolved = false;
          const result = new Promise<TResult>((_resolve, _reject) => {
            resolve = (v) => {
              if (resolved) return;
              resolved = true;
              _resolve(v);
            };
            reject = (r) => {
              if (resolved) return;
              resolved = true;
              _reject(r);
            };
          });
          return {result, resolve, reject};
        }).result;
      },
    };
  }
  return async (
    batchKey: TBatchKey,
    itemKey: TItemKey,
    fn: (
      itemKeys: TItemKey[],
      resolve: (key: TItemKey, value: TResult) => void,
      reject: (key: TItemKey, reason: Error) => void,
      batchKey: TBatchKey,
    ) => Promise<TResult>,
  ) => {
    return mapGetOrSet(
      cache,
      batchKey,
      (existingValue) => existingValue ?? createBatch(batchKey, fn),
    ).request(itemKey);
  };
}
