declare const ContractError;

export const isAddress = (addr: string) => /[a-z0-9_-]{43}/i.test(addr);

export const securityCheck = async (tokenSrcTxs: string[], contractTxId: string): Promise<boolean> => {
  const tx = await SmartWeave.unsafeClient.transactions.get(contractTxId);

  let SrcTxId: string;
  tx.get('tags').forEach(tag => {
    let key = tag.get('name', {decode: true, string: true});
    if (key === 'Contract-Src') {
      SrcTxId = tag.get('value', {decode: true, string: true});
    }
  });
  if (!SrcTxId || !isAddress(SrcTxId)) {
    throw new ContractError('Cannot find valid srcTxId in contract Tx content!');
  }
  
  if (tokenSrcTxs.includes(SrcTxId)) {
    return true;
  }
  return false;
};