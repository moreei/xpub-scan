import BigNumber from "bignumber.js";
import { DerivationMode } from "./configuration/currencies";
import { Address } from "./models/address";
import { Currency } from "./models/currency";

export interface Summary {
  derivationMode: DerivationMode;
  balance: BigNumber;
}
export interface ScanResult {
  meta?: ScanMeta;
  data?: ScanData;
}

export interface ScanMeta {
  xpub: string;
  currency: Currency;
  date: Date;
  mode: string;
  derivationMode: string;
  balanceOnly: boolean;
}

export interface ScanData {
  summary: Array<Summary>;
  addresses: Array<Address>;
}
