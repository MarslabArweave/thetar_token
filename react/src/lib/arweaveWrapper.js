export class arweaveWrapper {
  constructor(arweave, memLimit=500000000, maxDataSize=20000000) {
    this.arweave = arweave;

    this.txCache = {};

    this.memLimit = memLimit;
    this.maxDataSize = maxDataSize;
    this.memoryUsed = 0;
    this.dataCache = {};
    this.dataList = [];
  }

  async getTx(txId) {
    // if in cache, return cache directly
    if (this.txCache.hasOwnProperty(txId)) {
      return this.txCache[txId];
    }

    // get transaction info
    let tx = await this.arweave.transactions.get(txId);
    let tags = {};
    tx.get('tags').forEach(tag => {
      const key = tag.get('name', {decode: true, string: true});
      const value = tag.get('value', {decode: true, string: true});
      tags[key] = value;
    });
    tx.tags = tags;

    // add owner_address
    tx.owner_address = await this.arweave.wallets.ownerToAddress(tx.owner);

    // if data feild is also retreived in transaction object, move data to dataCache
    if (tx.data_size <= this.maxDataSize && 
        tx.data && 
        !this.dataCache.hasOwnProperty(txId) && 
        this.memoryUsed + tx.data_size <= this.memLimit) {
      this.dataCache[txId] = tx.data;
      this.dataList.push({txId: txId, freq: 1, size: tx.data_size});
    }

    // remove data feild in tx object
    if (tx.data) {
      delete tx.data;
    }

    this.txCache[txId] = tx;
    return tx;
  }

  async getTags(txId) {
    if (this.txCache.hasOwnProperty(txId)) {
      return this.txCache[txId].tags;
    }

    return (await this.getTx(txId)).tags;
  }

  async getData(txId) {
    // if in cache, return cache directly
    if (this.dataCache.hasOwnProperty(txId)) {
      this.dataList.find(e=>e.txId === txId).freq += 1;
      return this.dataCache[txId];
    }

    // check data_size
    const data_size = (await this.getTx(txId)).data_size;
    if (data_size > this.maxDataSize) {
      this.dataCache[txId] = new ArrayBuffer(0);
      const dataInfo = this.dataList.find(e=>e.txId === txId);
      dataInfo.freq = 9999; // When data oversize, we do not want to retrieve data again from Arweave gateway anymore
      dataInfo.size = 0;
      return this.dataCache[txId];
    }

    // check dataCache remaining size
    if (this.memoryUsed + data_size > this.memLimit) {
      this.dataList = this.dataList.sort((a, b) => b.freq - a.freq);
    }
    while (this.memoryUsed + data_size > this.memLimit) {
      const tail = this.dataList.pop();
      this.memoryUsed -= tail.size;
      delete this.dataCache[txId];
    }

    // retreive data and push to dataCache
    let data = await this.arweave.transactions.getData(txId, {decode: true});
    this.memoryUsed += data_size;
    this.dataCache[txId] = data;
    this.dataList.push({txId: txId, freq: 1, size: data_size});

    return data;
  }
}
