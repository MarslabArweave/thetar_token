export interface approveAmountParam {
  amount: number;
}

export interface setPriceParam {
  price: number; // mesured by ar
}

export interface getPriceResult {
  price: number; // mesured by ar
}

export interface getRemainResult {
  amount: number;
}

export type getPouredResult = getRemainResult;

// common interfaces

export interface Action {
  input: Input;
  caller: string;
}

export interface Input {
  function: Function;
  params: Params;
}

export interface State {
  owner: string;
  tokenAddress: string;
  price: number; // mesured by ar
  poured: number;
}

export type Function = 
    'swap' | 
    'setPrice' | 
    'getPrice' |
    'getPoured';

export type Params = 
    setPriceParam;

export type Result = 
    getPriceResult |
    getPouredResult;
    
export type ContractResult = { state: State } | { result: Result };
