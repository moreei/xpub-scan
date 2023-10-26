import { toLegacyAddress } from "bchaddrjs";
import BigNumber from "bignumber.js";

type OperationType =
  | "Received" // Received - common case
  | "Received (non-sibling to change)" // Received - edge case: address not belonging to the xpub
  //                                                            sending funds to change address
  | "Received (token)" // Received - common case
  | "Sent" // Sent - common case
  | "Sent (token)" // Sent - token
  | "Sent to self" // Sent - edge case 1: The recipient is the sender (identity)
  | "Sent to sibling" // Sent - edge case 2: recipient belongs to same xpub ("sibling")
  | "Failed to send" // Sent - edge case 3: failed send operation that impacts the balance (fees) (Ethereum)
  | "SCI (caller)" // Called a smart contract
  | "SCI (recipient)" // Recipient of a smart contract interaction
  | "Swapped"; // Swapped Ethers for tokens

class Operation {
  operationType?: OperationType;
  txid?: string;
  date?: string;
  block?: number;
  address?: string;
  cashAddress?: string; // Bitcoin Cash: Cash Address format
  _amount?: BigNumber;
  token?: {
    name: string;
    symbol: string;
    amount: BigNumber;
  };
  dapp?: {
    contract_name: string;
  };

  constructor(date?: string, amount?: BigNumber | string) {
    if (date) {
      this.date = date;
    }

    if (amount) {
      if (typeof amount === "string") {
        this._amount = new BigNumber(amount);
      } else {
        this._amount = amount;
      }
    }
  }

  get amount() {
    if (!this._amount) return new BigNumber(0);
    return this._amount;
  }

  setTxid(txid: string) {
    this.txid = txid; // txid to which it belongs
  }

  getTxid() {
    if (!this.txid) throw new Error("Txid not set");
    return this.txid;
  }

  getDate() {
    if (!this.date) throw new Error("Date not set");
    return this.date;
  }

  setBlockNumber(blockNumber: number) {
    this.block = blockNumber;
  }

  getBlockNumber() {
    if (!this.block) throw new Error("Block number not set");
    return this.block;
  }

  setAddress(address?: string) {
    if (!address || address === "") {
      this.address = "(no address)";
    } else {
      this.address = address;
    }
  }

  setCashAddress(cashAddress: string | undefined) {
    this.cashAddress = cashAddress;

    // set the corresponding legacy address representation if it is undefined
    if (
      typeof this.address === "undefined" &&
      typeof this.cashAddress !== "undefined"
    ) {
      this.address = toLegacyAddress(this.cashAddress);
    }
  }

  getAddress() {
    if (!this.address) throw new Error("Address not set");
    return this.address;
  }

  getCashAddress() {
    return this.cashAddress;
  }

  setOperationType(operationType: OperationType) {
    this.operationType = operationType;

    // if the operation has failed, set its amount to 0
    if (operationType === "Failed to send") {
      this._amount = new BigNumber(0);
    }
  }

  getOperationType() {
    if (!this.operationType) throw new Error("Operation type not set");
    return this.operationType;
  }

  addToken(symbol: string, name: string, amount: BigNumber) {
    this.token = {
      name,
      symbol,
      amount,
    };
  }

  addDapp(contract_name: string) {
    this.dapp = {
      contract_name,
    };
  }
}

export { Operation, OperationType };
