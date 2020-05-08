export default async function* paginate<TPage, TEntry>(
  getPage: (token?: string) => Promise<TPage>,
  getEntries: (page: TPage) => TEntry[],
  getNextPageToken: (page: TPage) => string | undefined,
) {
  let nextPage: Promise<TPage> | undefined;
  let currentPage: TPage | undefined;
  let nextPageToken: string | undefined;
  do {
    nextPage = getPage(nextPageToken);
    nextPage.catch(() => {
      // swallow errors here because otherwise they can be
      // reported as unhandled exceptions before we get to
      // the part where we await this promise
    });
    for (const entry of currentPage ? getEntries(currentPage) : []) {
      yield entry;
    }
    currentPage = await nextPage;
    nextPageToken = getNextPageToken(currentPage);
  } while (nextPageToken);
}
