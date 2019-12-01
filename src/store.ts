const memStore = new Map<string, number>();

export async function setInstallationID(
  ownerName: string,
  installationID: number,
) {
  memStore.set(ownerName, installationID);
}
export async function getInstallationID(ownerName: string) {
  return memStore.get(ownerName);
}
