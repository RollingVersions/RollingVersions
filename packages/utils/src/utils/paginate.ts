export default async function* paginate<TPage, TEntry>(
  getPage: (token?: string) => Promise<TPage>,
  getEntries: (page: TPage) => TEntry[],
  getNextPageToken: (page: TPage) => string | undefined,
) {
  let page;
  let nextPageToken;
  while (nextPageToken) {
    page = await getPage(nextPageToken);
    nextPageToken = getNextPageToken(page);
    for (const entry of getEntries(page)) {
      yield entry;
    }
  }
}
