import * as checkBalances from "./checkBalance";
import * as display from "../display";

import { ScanData, ScanMeta, ScanResult } from "../types";
import { getCurrency } from "../helpers";

export class Scanner {
  xpub;
  now = new Date();

  constructor(xpub: string) {
    this.xpub = xpub; // xpub or address
  }

  async scan(): Promise<ScanResult> {
    const currency = getCurrency(this.xpub);

    const scanResult = await checkBalances.xpubAnalysis(currency, this.xpub);

    const actualAddresses = scanResult.addresses; // active addresses belonging to the xpub

    const summary = scanResult.summary; // summary: balance per derivation path

    display.showResults(actualAddresses, summary);

    // full v. partial scan
    let mode: string;
    mode = "Full scan";
    mode += " | Balance Only";

    const meta: ScanMeta = {
      xpub: this.xpub,
      currency,
      date: this.now,
      mode,
      balanceOnly: true,
      derivationMode: "",
    };

    const data: ScanData = {
      summary,
      addresses: actualAddresses,
    };

    return { meta, data };
  }
}
