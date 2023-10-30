import { Result } from "./actions/checkAddress";
import { Scanner } from "./actions/scanner";
import { ScanResult } from "./types";

// export const hello = () => console.log("Hellox world!");

export const xpubScan = async (xpub: string): Promise<ScanResult> => {
  const scanner = new Scanner(xpub);
  const results = await scanner.scan();
  return results;
};

export const derivedFromXpub = (
  xpub: string,
  providedAddress: string
): Result => {
  const scanner = new Scanner(xpub);
  const result = scanner.derivedFromXpub(providedAddress);
  return result;
};
