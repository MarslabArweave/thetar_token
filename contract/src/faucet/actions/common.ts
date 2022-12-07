declare const ContractError;

export const isAddress = (addr: string) => /[a-z0-9_-]{43}/i.test(addr);

export const contractAssert = (expression: boolean, message: string) => {
  if (!expression) {
    throw new ContractError(`Contract assertion failed: ${message}`);
  }
}