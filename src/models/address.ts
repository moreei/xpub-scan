import { deriveAddress } from "../actions/deriveAddresses";
import { DerivationMode } from "../configuration/currencies";
import { Currency } from "./currency";
import { Stats } from "./stats";
import BigNumber from "bignumber.js";

class Address {
  address: string;
  derivationMode: DerivationMode;
  account: number;
  index: number;
  balance: BigNumber;
  rawTransactions: Array<any> = [];
  stats: Stats = {
    txsCount: new BigNumber(0),
    funded: new BigNumber(0),
    spent: new BigNumber(0),
  };

  constructor(
    currency: Currency,
    itemToScan: string,
    derivationMode: DerivationMode,
    account: number,
    index: number
  ) {
    this.address = deriveAddress(
      currency,
      derivationMode,
      itemToScan,
      account,
      index
    );
    this.derivationMode = derivationMode!;
    this.account = account!;
    this.index = index!;
    this.balance = new BigNumber(0);
  }

  setBalance(balance: string | number) {
    this.balance = new BigNumber(balance);
  }

  setRawTransactions(rawTransactions: Array<any>) {
    this.rawTransactions = rawTransactions;
  }

  getRawTransactions() {
    return this.rawTransactions;
  }

  setStats(
    txsCount: string | number,
    fundedSum: string | number,
    spentSum: string | number
  ) {
    this.stats = {
      txsCount: new BigNumber(txsCount),
      funded: new BigNumber(fundedSum),
      spent: new BigNumber(spentSum),
    };
  }

  toString() {
    return this.address;
  }

  getBalance(): string {
    return this.balance.toFixed();
  }

  getStats() {
    return this.stats;
  }
}

export { Address };
