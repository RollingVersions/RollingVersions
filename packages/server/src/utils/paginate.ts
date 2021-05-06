import paginateBatched from './paginateBatched';

export default async function* paginate<TPage, TEntry>(
  getPage: (token?: string) => Promise<TPage>,
  getEntries: (page: TPage) => TEntry[],
  getNextPageToken: (page: TPage) => string | undefined,
) {
  for await (const page of paginateBatched(
    getPage,
    getEntries,
    getNextPageToken,
  )) {
    for (const item of page) {
      yield item;
    }
  }
}
