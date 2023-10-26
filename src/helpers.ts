import {
  CRYPTOAPIS_URL,
  DEFAULT_API_URLS,
  configuration,
} from "./configuration/settings";
import axios from "axios";
import chalk from "chalk";
import { currencies } from "./configuration/currencies";
import { Currency } from "./models/currency";
import BigNumber from "bignumber.js";

function getExternalProviderURL(currency: Currency) {
  //   return CRYPTOAPIS_URL.replace("{network}", getNetworkLabel());

  // default provider
  if (
    currency.symbol === currencies.btc.symbol ||
    currency.symbol === currencies.ltc.symbol ||
    currency.symbol === currencies.doge.symbol
  ) {
    return DEFAULT_API_URLS.general;
  }

  if (currency.symbol === currencies.bch.symbol) {
    return DEFAULT_API_URLS.bch;
  }

  throw new Error("INVALID CURRENCY: " + currency.symbol);
}

function getNetworkLabel() {
  if (configuration.testnet) {
    return "testnet";
  } else {
    return "mainnet";
  }
}

async function getJSON<T>(
  url: string,
  { retries, retryDelayMS }: { retries?: number; retryDelayMS?: number } = {}
): Promise<T> {
  const job = async () => {
    const headers = {
      ...{},
    };

    const res = await axios.get<T>(url, { headers });

    if (res.status !== 200) {
      console.log(chalk.red("GET request error"));
      throw new Error(
        "GET REQUEST ERROR: "
          .concat(url)
          .concat(", Status Code: ")
          .concat(String(res.status))
      );
    }

    return res.data;
  };

  return retry(job, { retries, retryDelayMS });
}

async function retry<T>(
  job: () => Promise<T>,
  { retries = 5, retryDelayMS = 0 } = {}
): Promise<T> {
  let err: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await job();
    } catch (e) {
      err = e;
      // wait before retrying if it's not the last try
      if (retryDelayMS && i < retries - 1) {
        await new Promise((r) => setTimeout(r, retryDelayMS));
      }
    }
  }
  if (err) throw err;
  throw new Error(`No result after ${retries} retries`);
}

function getCurrency(xpub: string, currency?: string) {
  let currencyModel: Currency | undefined;

  if (
    !currency ||
    currency === "BTC" ||
    currency === "LTC" ||
    currency === "DOGE"
  ) {
    const prefix = xpub.substring(0, 4).toLocaleLowerCase();

    if (prefix === "xpub") {
      // Bitcoin mainnet
      currencyModel = {
        name: currencies.btc.name,
        symbol: currencies.btc.symbol,
        network: currencies.btc.network_mainnet,
        precision: currencies.btc.precision,
        derivationModes: currencies.btc.derivationModes,
      };
    } else if (prefix === "tpub") {
      configuration.testnet = true;
      currencyModel = {
        name: currencies.btc.name,
        symbol: currencies.btc.symbol,
        network: currencies.btc.network_testnet,
        precision: currencies.btc.precision,
        derivationModes: currencies.btc.derivationModes,
      };
    } else if (prefix === "ltub") {
      // Litecoin
      currencyModel = {
        name: currencies.ltc.name,
        symbol: currencies.ltc.symbol,
        network: currencies.ltc.network_mainnet,
        precision: currencies.ltc.precision,
        derivationModes: currencies.ltc.derivationModes,
      };
    } else if (prefix === "dgub") {
      // Dogecoin
      currencyModel = {
        name: currencies.doge.name,
        symbol: currencies.doge.symbol,
        network: currencies.doge.network_mainnet,
        precision: currencies.doge.precision,
        derivationModes: currencies.doge.derivationModes,
      };
    } else {
      throw new Error("INVALID XPUB: " + xpub + " has not a valid prefix");
    }
  } else {
    // Bitcoin Cash
    if (currency === "BCH") {
      currencyModel = {
        name: currencies.bch.name,
        symbol: currencies.bch.symbol,
        network: currencies.bch.network_mainnet,
        precision: currencies.bch.precision,
        derivationModes: currencies.bch.derivationModes,
      };
    }
  }

  if (!currencyModel) {
    throw new Error("INVALID CURRENCY: " + currency);
  }

  return currencyModel;
}

/**
 * Convert from base unit to unit of account (e.g. satoshis to bitcoins)
 * @param amount the amount (in base unit) to convert
 * @param decimalPlaces (optional) decimal precision
 * @returns the converted amount, in unit of account
 */
function toAccountUnit(
  currency: Currency,
  amount: BigNumber,
  decimalPlaces?: number
): string {
  if (amount.isZero()) {
    return amount.toFixed();
  }

  let convertedValue: BigNumber;
  convertedValue = amount.dividedBy(currency.precision);

  if (decimalPlaces) {
    return convertedValue.toFixed(decimalPlaces);
  }

  return convertedValue.toFixed();
}

export {
  getExternalProviderURL,
  getNetworkLabel,
  getJSON,
  getCurrency,
  toAccountUnit,
};
