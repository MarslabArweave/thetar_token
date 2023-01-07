export class intelliContract {
  constructor(warpInst) {
    this.warp = warpInst;
    this.contract4Read = undefined;
    this.contract4Write = undefined;
    this.walletConnected = false;
    this.contractConnected = false;
  }

  contractConnected() {
    return this.contractConnected;
  }

  walletConnected() {
    return this.walletConnected;
  }

  connectContract(contractAddress) {
    this.contract4Read = this.warp.contract(contractAddress);
    this.contract4Write = this.warp.contract(contractAddress);
    this.contract4Read.setEvaluationOptions({
      internalWrites: true,
      allowUnsafeClient: true,
      // updateCacheForEachInteraction: true,
    });
    this.contract4Write.setEvaluationOptions({
      internalWrites: true,
      allowUnsafeClient: true,
      // updateCacheForEachInteraction: true,
    });
    this.contractConnected = true;
  }

  connectWallet(walletJwk) {
    this.contract4Write.connect(walletJwk);
    this.walletConnected = true;
  }

  async viewState(input) {
    return await this.contract4Read.viewState(input);
  }

  async writeInteraction(input, options) {
    return await this.contract4Write.writeInteraction(input, options);
  }
}
