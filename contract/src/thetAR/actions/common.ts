declare const ContractError;

export const isAddress = (addr: string) => /[a-z0-9_-]{43}/i.test(addr);

export const hashCheck = async (validHashs: number[], contractTxId: string): Promise<boolean> => {
  const tx = await SmartWeave.unsafeClient.transactions.get(contractTxId);

  let SrcTxId;
  tx.get('tags').forEach(tag => {
    let key = tag.get('name', {decode: true, string: true});
    if (key === 'Contract-Src') {
      SrcTxId = tag.get('value', {decode: true, string: true});
    }
  });
  if (!SrcTxId || !isAddress(SrcTxId)) {
    throw new ContractError('Cannot find valid srcTxId in contract Tx content!');
  }
  const srcTx: string = await SmartWeave.unsafeClient.transactions.getData(SrcTxId); // TODO: should not get entire data in case large amount of data
  if (srcTx.length < 500000 && validHashs.includes(calcHash(srcTx))) {
    return true;
  }
  return false;
};

export const calcHash = (string) => {
	var hash: number = 0, i, chr;
	if (string.length === 0) return hash;
	for (i = 0; i < string.length; i++) {
    chr = string.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
	}
    return hash;
}