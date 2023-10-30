import { Scanner } from "./actions/scanner";

// export const hello = () => console.log("Hellox world!");

export const xpubScan = async (xpub: string) => {
  const scanner = new Scanner(xpub);
  const results = await scanner.scan();
  return results;
};

export const derivedFromXpub = (xpub: string, providedAddress: string) => {
  const scanner = new Scanner(xpub);
  const result = scanner.derivedFromXpub(providedAddress);
  return result;
};
