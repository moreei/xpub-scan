// Here, the raw data is fetched from default (i.e., free of charge) providers:
//  - balance,
//  - total spent and received, and
//  - operations
// per address

import { getExternalProviderURL, getJSON, toAccountUnit } from "../helpers";
import { configuration } from "../configuration/settings";
import { Address } from "../models/address";
import { currencies } from "../configuration/currencies";

import BigNumber from "bignumber.js";
import { Currency } from "../models/currency";

// ┏━━━━━━━━━━━━━━━━━━━━┓
// ┃ DEFAULT PROVIDER   ┃
// ┃ Bitcoin & Litecoin ┃
// ┗━━━━━━━━━━━━━━━━━━━━┛

// structure of the responses from the default API
interface RawTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: Vin[];
  vout: Vout[];
  size: number;
  weight: number;
  fee: number;
  status: Status;
}

interface Vin {
  txid: string;
  vout: number;
  prevout: Prevout;
  scriptsig: string;
  scriptsig_asm: string;
  is_coinbase: boolean;
  sequence: number;
  witness?: string[];
  inner_redeemscript_asm?: string;
}

interface Prevout {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address: string;
  value: number;
}

interface Vout {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address: string;
  value: number;
}

interface Status {
  confirmed: boolean;
  block_height: number;
  block_hash: string;
  block_time: number;
}

/**
 * fetch the structured basic stats related to an address
 * its balance, funded and spend sums and counts
 * @param address the address being analyzed
 */
async function getStats(currency: Currency, address: Address) {
  // important: coin name is required to be upper case for default provider
  const coin = currency.symbol.toUpperCase();

  //   if (coin === currencies.bch.symbol) {
  //     return getBchStats(address);
  //   }

  let url = getExternalProviderURL(currency).replace(
    "{address}",
    address.toString()
  );

  if (coin === currencies.btc.symbol.toUpperCase()) {
    url = url.replace("{network}", configuration.testnet ? "testnet" : "");
  }

  const res = await getJSON<any>(url);

  // TODO: check potential errors here (API returning invalid data...)
  const fundedSum = res.chain_stats.funded_txo_sum;
  const spentSum = res.chain_stats.spent_txo_sum;

  const balance = fundedSum - spentSum;

  address.setStats(
    res.chain_stats.tx_count,
    toAccountUnit(currency, BigNumber(fundedSum)),
    toAccountUnit(currency, BigNumber(spentSum))
  );
  address.setBalance(toAccountUnit(currency, BigNumber(balance)));

  if (res.chain_stats.tx_count > 0) {
    // get transactions per address
    address.setRawTransactions(await getJSON<any>(url + "/txs"));
  }
}

// ┏━━━━━━━━━━━━━━┓
// ┃ BCH PROVIDER ┃
// ┃ Bitcoin Cash ┃
// ┗━━━━━━━━━━━━━━┛

// structure of the responses from the BCH API
interface BchRawTransaction {
  txid: string;
  blockheight: number;
  confirmations: number;
  time: number;
  vin: {
    value: string;
    addr: string;
  }[];
  vout: {
    value: string;
    scriptPubKey: {
      addresses: Array<string>;
    };
  }[];
}

/**
 * fetch the structured basic stats related to a Bitcoin Cash address
 * its balance, funded and spend sums and counts
 * @param address the address being analyzed
 */
// async function getBchStats(address: Address) {
//   const urlStats = configuration.externalProviderURL
//     .replace("{type}", "details")
//     .replace("{address}", address.asCashAddress()!);

//   const res = await getJSON<any>(urlStats);

//   // TODO: check potential errors here (API returning invalid data...)
//   const fundedSum = res.totalReceived;
//   const balance = res.balance;
//   const spentSum = res.totalSent;

//   address.setStats(res.txApperances, fundedSum, spentSum);
//   address.setBalance(balance);

//   const urlTxs = configuration.externalProviderURL
//     .replace("{type}", "transactions")
//     .replace("{address}", address.asCashAddress()!);

//   const payloads = [];
//   let totalPages = 1;

//   for (let i = 0; i < totalPages; i++) {
//     const response = await getJSON<any>(
//       urlTxs.concat("?page=").concat(i.toString())
//     );
//     totalPages = response.pagesTotal;
//     payloads.push(response.txs);
//   }

//   // flatten the payloads
//   const rawTransactions = [].concat(...payloads);

//   address.setRawTransactions(rawTransactions);
// }

export { getStats };
