export interface addPairParam {
  tokenAddress: string;
  logo: string;
  description: string;
}

export interface createOrderParam {
  tokenAddress: string;
  direction: 'buy' | 'sell';
  price?: number;
}

export interface cancelOrderParam {
  tokenAddress: string;
  orderId: string;
}

export interface pairInfoParam {
  tokenAddress: string;
}

export interface addTokenSrcTxParam {
  src: string;
}

export type orderInfoParam = pairInfoParam;

export interface userOrderParam {
  address: string;
}

export interface currentPriceResult {
  currentPrice: number;
}

export interface userOrderResult {
  [tokenAddress: string]: orderInterface[];
}

export type pairInfoResult = pairInfoInterface;

export interface pairInfoResults {
  [tokenAddress: string]: pairInfoInterface;
}

export interface orderInfoResult {
  currentPrice: number;
  orders: orderInterface[];
}

export interface orderInfosResult {
  [tokenAddress: string]: { 
    currentPrice: number;
    orders: orderInterface[];
  };
}

export interface Action {
  input: Input;
  caller: string;
}

export interface Input {
  function: Function;
  params: Params;
}

export interface tokenInfoInterface {
  tokenAddress: string;
  logo: string;
  description: string;
}

export interface orderInterface {
  creator: string;
  direction: 'sell' | 'buy';
  quantity: number;
  price: number;
  orderId: string;
}

export interface pairInfoInterface {
  logo: string;
  description: string;
  name: string;
  symbol: string;
  decimals: string;
}

export interface State {
  owner: string;
  tokenSrcTxs: string[];
  thetarTokenAddress: string;

  pairInfos: {[tokenAddress: string]: pairInfoInterface};
  userOrders: {
    [walletAddress: string]: {
      [tokenAddress: string]: orderInterface[];
    }
  };
  orderInfos: {
    [tokenAddress: string]: { 
      currentPrice: number;
      orders: orderInterface[];
    };
  };
}

export type Function = 
    'createOrder' | 
    'cancelOrder' | 
    'addPair' | 
    'pairInfo' |
    'tokenInfo' |
    'pairInfos' |
    'orderInfo' |
    'orderInfos' |
    'addTokenSrcTx' |
    'userOrder';

export type Params = 
    createOrderParam |
    addPairParam |
    cancelOrderParam |
    pairInfoParam |
    orderInfoParam |
    addTokenSrcTxParam |
    userOrderParam;

export type Result = 
    pairInfoResult |
    pairInfoResults |
    orderInfoResult |
    orderInfosResult |
    userOrderResult;
    
export type ContractResult = { state: State } | { result: Result };
