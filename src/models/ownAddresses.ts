import { Address } from "./address";

// addresses belonging to the same xpub
class OwnAddresses {
  internal: Array<string>;
  external: Array<string>;

  constructor() {
    this.internal = [];
    this.external = [];
  }

  addAddress(address: Address) {
    this.external.push(address.toString());
  }

  getInternalAddresses() {
    return this.internal;
  }

  getExternalAddresses() {
    return this.external;
  }

  getAllAddresses() {
    return this.internal.concat(this.external);
  }
}

export { OwnAddresses };
