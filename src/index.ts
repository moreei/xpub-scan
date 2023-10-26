import { Scanner } from "./actions/scanner";

export const hello = () => console.log("Hellox world!");

export async function xpubScan(xpub: string) {
  const scanner = new Scanner(xpub);
  const results = await scanner.scan();
  return results;
}
