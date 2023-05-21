const dreNodeAddress = 'marslab.top'
const dreNodePort = '1080'

export class intelliContract {
  constructor(warpInst, env='mainnet') {
    this.warp = warpInst;
    this.contract4Read = undefined;
    this.contract4Write = undefined;
    this.walletConnected = false;
    this.contractConnected = false;
    this.contractAddress = '';
    this.env = env;
  }

  contractConnected() {
    return this.contractConnected;
  }

  walletConnected() {
    return this.walletConnected;
  }

  connectContract(contractAddress) {
    this.contractAddress = contractAddress;
    this.contract4Read = this.warp.contract(contractAddress);
    this.contract4Write = this.warp.contract(contractAddress);
    this.contract4Read.setEvaluationOptions({
      internalWrites: true
    });
    this.contract4Write.setEvaluationOptions({
      internalWrites: true
    });
    this.contractConnected = true;
  }

  connectWallet(walletJwk) {
    this.contract4Write.connect(walletJwk);
    this.walletConnected = true;
  }

  async writeInteraction(input, options) {
    return await this.contract4Write.writeInteraction(input, options);
  }

  async viewState(input) {
    if (this.env === 'mainnet') {
      const resp = await fetch(`https://${dreNodeAddress}:${dreNodePort}/v1/contract/viewState?id=${this.contractAddress}&action=${JSON.stringify(input)}`);
      const respJson = await resp.json();
      if (respJson.code !== 200) {
        throw respJson.msg;
      }
      return respJson.data;
    } else {
      return await this.contract4Read.viewState(input);
    }
  }

  async readState(blockHeight) {
    if (this.env === 'mainnet') {
      var optionField = '';
      if (blockHeight) {
        optionField = `&option=${blockHeight}`;
      }
      const resp = await fetch(`https://${dreNodeAddress}:${dreNodePort}/v1/contract/readState?id=${this.contractAddress}${optionField}`);
      const respJson = await resp.json();
      if (respJson.code !== 200) {
        throw respJson.msg;
      }
      return respJson.data;
    } else {
      return await this.contract4Read.readState(blockHeight);
    }
  }
}
