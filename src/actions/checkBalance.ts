import chalk from "chalk";

import * as display from "../display";

import { Address } from "../models/address";
import { OwnAddresses } from "../models/ownAddresses";
import { DerivationMode } from "../configuration/currencies";
import { Summary } from "../types";

import BigNumber from "bignumber.js";
import { configuration } from "../configuration/settings";
import { Currency } from "../models/currency";
import { getStats } from "../api/defaultProvider";

/**
 * derive and scan all active addresses _for a given derivation mode_
 * note: an ACTIVE ADDRESS is an address with > 0 transactions
 * @param derivationMode a derivation mode (enum)
 * @param xpub the xpub to scan
 * @param balanceOnly option to fetch the balance only—not the transactions
 * @param scanLimits option to limit the scan to a certain account and indices range
 * @returns an object containing the total balance for the derivation mode as well as
 *          a list of active addresses associated with it
 */
async function deriveAndScanAddressesByDerivationMode(
  currency: Currency,
  derivationMode: DerivationMode,
  xpub: string
) {
  display.logStatus(
    "Scanning ".concat(chalk.bold(derivationMode)).concat(" addresses...")
  );

  const ownAddresses = new OwnAddresses();

  let totalBalance = new BigNumber(0);
  let txCounter = 0;
  const addresses: Array<Address> = [];

  // loop over derivation path accounts: `m/{account}/{index}`
  // note: we limit ourselves to accounts 0 and 1
  // but the scope could be extended further if needed
  for (let account = 0; account < 2; ++account) {
    // account 0 == external addresses
    // account 1 == internal (aka change) addresses
    const typeAccount = account === 1 ? "internal" : "external";

    display.logStatus(
      "- scanning " + chalk.italic(typeAccount) + " addresses -"
    );

    txCounter = 0;

    for (let index = 0 /* scan all active indices */; ; ++index) {
      // get address derived according to:
      // - its xpub (by definition),
      // - the current derivation mode (legacy, SegWit, etc.)
      // - the derivation path characteristics: `m/{account:0|1}/{index:0|∞}`
      const address = new Address(
        currency,
        xpub,
        derivationMode,
        account,
        index
      );

      const status = txCounter === 0 ? "analyzing" : "probing address gap";

      process.stdout.write(chalk.yellow(status + "..."));

      // fetch (from external provider) the basic data regarding the address
      // (balance, transactions count, etc.)
      await getStats(currency, address);

      const addressStats = address.getStats();

      // here, evaluate if the address needs further analysis

      if (addressStats && addressStats.txsCount.isZero()) {
        // no transaction associated with the address:
        // perform address gap probing
        // GAP PROBE: check whether an address is active in a certain range
        //
        // for instance:
        // ┌┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┐
        // ┊ m/0/0 — active (10 transactions)           ┊
        // ┊ m/0/1 — active (2 transactions)            ┊
        // ┊                                  ┐         ┊
        // ┊ m/0/2 — inactive (0 transaction) │         ┊
        // ┊ m/0/3 — inactive (0 transaction) │ GAP     ┊
        // ┊ m/0/4 — inactive (0 transaction) │         ┊
        // ┊                                  ┘         ┊
        // ┊ m/0/5 — active (4 transactions)            ┊
        // └┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┘
        //
        // in this example, the gap probing allows to detect that
        // `m/0/5` is an active address
        //
        // note: the scope of the gap probing is 20 addresses by
        // default (check `DEFAULT_GAP_LIMIT`) but can be configured
        // using the `GAP_LIMIT` environment variable

        txCounter++;
        display.transientLine(/* delete address as it is not an active one */);

        if (account === 1 || txCounter >= Number(configuration.gap_limit)) {
          // all active addresses have been scanned and the gap limit reached:
          // stop the scan for this specific derivation mode
          display.transientLine(/* delete last probing info */);
          display.logStatus(
            "- " + chalk.italic(typeAccount) + " addresses scanned -"
          );
          break;
        }

        continue;
      } else {
        txCounter = 0;
      }

      // convert address balance into satoshis (or equivalent unit)
      // in order to avoid issue with floats addition
      totalBalance = totalBalance.plus(address.getBalance());

      display.updateAddressDetails(address);

      // important step: add the active address to the
      // list of own addresses in order to perform
      // transaction analysis further down the flow
      ownAddresses.addAddress(address);

      addresses.push(address);
    }
  }

  // process transactions
  display.transientLine(chalk.yellowBright("Processing transactions..."));

  display.transientLine(/* delete address */);

  display.logStatus(derivationMode.concat(" addresses scanned\n"));

  return {
    balance: totalBalance,
    addresses,
  };
}

/**
 * scan an xpub (UTXO-based mode)
 * @param xpub the xpub to scan
 * @param balanceOnly option to fetch the balance only—not the transactions
 * @param scanLimits option to limit the scan to a certain account and indices range
 * @returns a list of active addresses and a summary (total balance per derivation mode)
 */
async function xpubAnalysis(currency: Currency, xpub: string) {
  let activeAddresses: Array<Address> = [];
  const summary: Array<Summary> = [];

  // get all derivation modes associated with the currency type
  // (e.g., for Bitcoin: legacy, SegWit, native SegWit, and taproot)
  let derivationModes = currency.derivationModes;

  if (configuration.specificDerivationMode) {
    // if a specific derivation mode is set, limit the scan to this mode
    derivationModes = derivationModes!.filter((derivation) =>
      derivation
        .toString()
        .toLocaleLowerCase()
        .startsWith(configuration.specificDerivationMode.toLocaleLowerCase())
    );
  }

  if (!configuration.silent) {
    console.log(chalk.bold("\nActive addresses\n"));
  }

  for (const derivationMode of derivationModes!) {
    // loop over the derivation modes and `scan` the addresses belonging to
    // the current derivation mode
    // (that is: derive them and identify the active ones)
    const results = await deriveAndScanAddressesByDerivationMode(
      currency,
      derivationMode,
      xpub
    );

    activeAddresses = activeAddresses.concat(results.addresses);

    summary.push({
      derivationMode,
      balance: results.balance,
    });
  }

  return {
    addresses: activeAddresses,
    summary,
  };
}

export { xpubAnalysis };
