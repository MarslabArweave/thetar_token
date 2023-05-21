export interface addPairParam {
  tokenAddress: string;
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

export interface orderInfoParam {
  tokenAddress: string;
}

export interface userOrderParam {
  address: string;
}

export interface currentPriceResult {
  currentPrice: number;
}

export interface userOrderResult {
  [tokenAddress: string]: orderInterface;
}

export interface orderInfoResult {
  currentPrice: number;
  orders: orderInterface;
}

export interface orderInfosResult {
  [tokenAddress: string]: { 
    currentPrice: number;
    orders: orderInterface;
  };
}

export type tokenInfosResult = string[];

export interface Action {
  input: Input;
  caller: string;
}

export interface Input {
  function: Function;
  params: Params;
}

export interface orderInterface {
  buy: orderInfoInterface[];
  sell: orderInfoInterface[];
}

export interface orderInfoInterface {
  creator: string;
  quantity: number;
  price: number;
  orderId: string;
}

export interface State {
  owner: string;
  thetarTokenAddress: string;
  addFee: number;
  orderFee: number;

  orderInfos: {
    [tokenAddress: string]: { 
      currentPrice: number;
      orders: orderInterface;
    };
  };
  userOrders: {
    [walletAddress: string]: {
      [nftAddress: string]: orderInterface;
    }
  };
}

export type Function = 
    'createOrder' | 
    'cancelOrder' | 
    'addPair' | 
    'pairInfos' |
    'orderInfo' |
    'orderInfos' |
    'userOrder';

export type Params = 
    createOrderParam |
    addPairParam |
    cancelOrderParam |
    orderInfoParam |
    userOrderParam;

export type Result = 
    orderInfoResult |
    orderInfosResult |
    userOrderResult |
    tokenInfosResult;
    
export type ContractResult = { state: State } | { result: Result };
