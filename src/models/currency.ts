import * as bjs from "bitcoinjs-lib";
import { DerivationMode } from "../configuration/currencies";

interface Currency {
  name: string;
  symbol: string;
  network: bjs.networks.Network;
  derivationModes: Array<DerivationMode>;
  precision: number;
}

export { Currency };
