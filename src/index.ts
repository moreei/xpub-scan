import { getArgs } from "./input/args";
import { Scanner } from "./actions/scanner";
import { ScanResult } from "./types";

// async function scan() {
//   const args = getArgs(); // get CLI args (if any)
//   const scanResult: ScanResult = await new Scanner(args).scan();
//   process.exit(scanResult.exitCode);
// }

// function handleSignal(signal: string) {
//   console.log(`Received ${signal}`);
//   process.exit(1);
// }

// // ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
// // ┃ ENTRYPOINT OF XPUB SCAN ┃
// // ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛
// scan();

// process.on("SIGINT", handleSignal);
// process.on("SIGTERM", handleSignal);

export const hello = () => console.log("Hellox world!");

export async function getScanResults(xpub: string) {
  const args = getArgs(); // get CLI args (if any)
  args.itemToScan = xpub;
  const scanResult: ScanResult = await new Scanner(args).scan();
  return scanResult;
}
