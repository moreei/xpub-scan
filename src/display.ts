import chalk from "chalk";
import readline from "readline";
import { Address } from "./models/address";
import BigNumber from "bignumber.js";
import { Summary } from "./types";
import { DerivationMode } from "./configuration/currencies";

function logStatus(status: string) {
  console.log(chalk.dim(status));
}

function transientLine(message?: string) {
  readline.cursorTo(process.stdout, 0);

  if (message) {
    process.stdout.write(message);
  } else {
    // blank line
    // ! solution implemented this way to be
    // ! compatible with Docker
    process.stdout.write("".padEnd(140, " "));
    readline.cursorTo(process.stdout, 0);
  }
}

// display the active/probed address with its stats
function updateAddressDetails(address: Address) {
  // quiet mode: only display full information, once

  const addressStats = address.getStats();
  if (!addressStats) {
    return;
  }
  // _type_  path  address ...
  let stats = "";
  stats = stats.concat(address.toString().padEnd(46, " "));

  // else, display the full line
  const balance = address.getBalance();
  const txsCount = addressStats.txsCount;
  const fundedSum = renderAmount(addressStats.funded);

  transientLine(/* delete line to display complete info */);

  // ... +{total funded} ←
  stats = stats
    .concat(txsCount.toString().padEnd(16, " "))
    .concat("+")
    .concat(balance.toString().padEnd(16, " "))
    .concat("+")
    .concat(fundedSum.padEnd(14, " ")) // an active address has necessarily been funded,
    .concat(" ←"); // thus this information is mandatory

  // optional: spent sum
  if (addressStats.spent) {
    const spentSum = renderAmount(addressStats.spent);

    // ... -{total spent} →
    stats = stats.concat("\t-").concat(spentSum.padEnd(14, " ")).concat(" →");
  }

  console.log(stats);
}

function renderAmount(amount: BigNumber): string {
  // Currently, this function does not convert the amounts
  // into relevant units. But in the future, if the API
  // changes, it would allow to change the unit
  // depending on the network.
  // For example:
  // if (configuration.currency.symbol === currencies.btc.symbol) {
  //   return sb.toAccountUnit(amount);
  // }
  if (amount.isZero()) {
    return String(amount);
  } else {
    // 8 digital places max without trailing 0s
    return amount.toFixed(8);
  }
}

// display the list of UTXOs sorted by date (reverse chronological order)
function showSortedUTXOs(sortedUTXOs: Array<Address>) {
  console.log(chalk.bold("\nUTXOs\n"));

  if (sortedUTXOs.length === 0) {
    console.log(chalk.gray("(no UTXO)"));
    return;
  }

  sortedUTXOs.forEach((utxo) => {
    updateAddressDetails(utxo);
  });
}
// display the summary: total balance by address type
function showSummary(derivationMode: DerivationMode, totalBalance: BigNumber) {
  const derivation = derivationMode.toString();
  const balance = renderAmount(new BigNumber(totalBalance));

  if (balance === "0") {
    console.log(
      chalk.grey(derivation.padEnd(16, " ").concat(balance.padEnd(12, " ")))
    );
  } else {
    console.log(
      chalk
        .whiteBright(derivation.padEnd(16, " "))
        .concat(chalk.greenBright(balance.padEnd(12, " ")))
    );
  }
}

function showResults(sortedUTXOs: Array<Address>, summary: Array<Summary>) {
  showSortedUTXOs(sortedUTXOs);

  console.log(chalk.bold("\nSummary\n"));
  for (const total of summary) {
    showSummary(total.derivationMode, total.balance);
  }
}

export { logStatus, transientLine, updateAddressDetails, showResults };
