import * as type from '../../types/types';
import { contractAssert } from '../common';

declare const ContractError;
interface Transaction {
  tokenType: 'trade' | 'dominent';
  to: string;
  quantity: number;
}

export const createOrder = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  // pay $TAR for order-placing fee, to avoid flood attack
  await SmartWeave.contracts.write(
    state.thetarTokenAddress, 
    { function: 'transferFrom', from: action.caller, to: state.owner, amount: state.orderFee},
  );

  const param: type.createOrderParam = <type.createOrderParam>action.input.params;
  contractAssert(
    state.orderInfos.hasOwnProperty(param.tokenAddress),
    'Pair does not exist!'
  );
  if (param.price !== undefined && param.price !== null) {
    contractAssert(
      typeof(param.price) === 'number',
      'Price must be null or number!'
    );
    contractAssert(
      param.price > 0 && Number.isInteger(param.price),
      'Price must be positive integer!'
    );
  }

  const newOrder: type.orderInfoInterface = {
    creator: action.caller,
    orderId: SmartWeave.transaction.id,
    quantity: await checkOrderQuantity(state, action),
    price: param.price,
  }

  const { newOrderbook, newUserOrders, transactions, currentPrice } = await matchOrder(
    newOrder,
    param.direction,
    state.orderInfos[param.tokenAddress].orders,
    state.userOrders,
    param.tokenAddress,
    action.caller
  );

  // update orderInfos and userOrders
  state.orderInfos[param.tokenAddress].orders = newOrderbook;
  state.userOrders = newUserOrders;

  // update pair's current price
  if (!isNaN(currentPrice) && isFinite(currentPrice)) {
    state.orderInfos[param.tokenAddress].currentPrice = currentPrice;
  }
  
  // make transactions
  for await (const tx of transactions) {
    const targetTokenAdrress = tx.tokenType === 'dominent' ? 
        state.thetarTokenAddress : param.tokenAddress;
    await SmartWeave.contracts.write(
      targetTokenAdrress, 
      { function: 'transfer', to: tx.to, amount: tx.quantity},
    );
  }
  
  return { state };
};

const checkOrderQuantity = async (
  state: type.State,
  action: type.Action,
): Promise<number> => {
  const param: type.createOrderParam = <type.createOrderParam>action.input.params;

  // fetch allowance
  const tokenAddress: string = param.direction === 'buy' ? state.thetarTokenAddress : param.tokenAddress;
  const tokenState = await SmartWeave.contracts.viewContractState(tokenAddress, {
    function: 'allowance',
    owner: action.caller,
    spender: SmartWeave.contract.id
  });
  let orderQuantity = tokenState.result.allowance;

  // If direction is buy and order type is limit, covert quantity metric to that of wanted token
  // All quantity in orderbook should metric in trade token, 
  // but in `market` order type & `buy` direction we don't know that.
  if (param.direction === 'buy' && param.price) {
    orderQuantity = Math.floor(orderQuantity / param.price);
    // transfer token(s) to contract address
    await SmartWeave.contracts.write(
      tokenAddress, 
      { function: 'transferFrom', from: action.caller, to: SmartWeave.contract.id, amount: orderQuantity*param.price},
    );
  } else {
    // transfer token(s) to contract address
    await SmartWeave.contracts.write(
      tokenAddress, 
      { function: 'transferFrom', from: action.caller, to: SmartWeave.contract.id, amount: orderQuantity},
    );
  }
  return orderQuantity;
};

const matchOrder = async (
  newOrder: type.orderInfoInterface,
  direction: 'buy' | 'sell',
  orderbook: type.orderInterface,
  userOrders: {
    [walletAddress: string]: {
      [tokenAddress: string]: type.orderInterface;
    }
  },
  tokenAddress,
  caller
): Promise<{
  newOrderbook: type.orderInterface, 
  newUserOrders: {
    [walletAddress: string]: {
      [tokenAddress: string]: type.orderInterface;
    }
  },
  transactions: Transaction[],
  currentPrice: number,
}> => {
  let transactions: Transaction[] = Array<Transaction>();
  let totalTradePrice = 0;
  let totalTradeVolume = 0;

  const reverseDirection = direction === 'buy' ? 'sell' : 'buy';
  const reverseOrderbook = direction === 'buy' ?
      orderbook.sell :
      orderbook.buy;
  let reverseBookSize = reverseOrderbook.length;

  const orderType = newOrder.price ? 'limit' : 'market';
  if (reverseBookSize === 0 && orderType === 'market') {
    throw new ContractError(`The first order must be limit type!`);
  }
  const newOrderTokenType = 
        orderType === 'market' && direction === 'buy' ? 
        'dominent' : 'trade';

  for (let i = 0; i < reverseBookSize; ) {
    const order = reverseOrderbook[i];
    var nextIndex = i + 1;

    // For limit type order, we only process orders which price equals to newOrder.price
    if (orderType === 'limit' && order.price !== newOrder.price) {
      i = nextIndex;
      continue;
    }

    const targetPrice = order.price;
    const orderAmount = order.quantity;
    const newOrderAmoumt = newOrderTokenType === 'trade' ? 
        newOrder.quantity : Math.floor(newOrder.quantity / targetPrice);
    const targetAmout = orderAmount < newOrderAmoumt ? orderAmount : newOrderAmoumt;

    totalTradePrice += targetPrice * targetAmout;
    totalTradeVolume += targetAmout;

    if (targetAmout === 0) {
      i = nextIndex;
      break;
    }

    /// generate transactions
    const buyer = direction === 'buy' ? newOrder : order;
    const seller = direction === 'buy' ? order : newOrder;
    transactions.push({
      tokenType: 'dominent',
      to: seller.creator,
      quantity: targetAmout * targetPrice,
    });
    transactions.push({
      tokenType: 'trade',
      to: buyer.creator,
      quantity: targetAmout,
    });
    
    /// update Objects

    // 1. update orderbook
    order.quantity -= targetAmout;
    if (order.quantity === 0) {
      reverseOrderbook.splice(i, 1);
      nextIndex = i;
      reverseBookSize -= 1;
    }

    // 2. update Order in userOrders
    let userOrderInfos = userOrders[order.creator][tokenAddress][reverseDirection];
    let matchedOrderIdx = userOrderInfos.findIndex(value=>value.orderId===order.orderId);
    userOrderInfos[matchedOrderIdx].quantity -= targetAmout;
    if (userOrderInfos[matchedOrderIdx].quantity === 0) {
      userOrders[order.creator][tokenAddress][reverseDirection] = 
          userOrderInfos.filter(v=>v.orderId !== order.orderId);
    }

    // 3. update new order
    newOrder.quantity -= newOrderTokenType === 'trade' ? 
        targetAmout : targetAmout * targetPrice;
  }

  /// if there are remaining tokens:

  // case1: refund user 
  if (orderType === 'market' && newOrder.quantity !== 0) {
    transactions.push({
      tokenType: newOrderTokenType,
      to: newOrder.creator,
      quantity: newOrder.quantity,
    });
    newOrder.quantity = 0;
  }
  // case2: update orderbook and userOrders
  if (orderType === 'limit' && newOrder.quantity !== 0) {
    const insertIndex = searchInsert(orderbook[direction], newOrder, direction==='buy');
    orderbook[direction].splice(insertIndex, 0, {...newOrder});
  }
  if (newOrder.quantity !== 0) {
    if (userOrders[caller] === undefined) {
      userOrders[caller] = {};
    }
    if (!userOrders[caller][tokenAddress]) {
      userOrders[caller][tokenAddress] = {buy: [], sell: []}
    }
    userOrders[caller][tokenAddress][direction].push({...newOrder});
  }


  return {
    newOrderbook: orderbook,
    newUserOrders: userOrders,
    transactions: transactions,
    currentPrice: totalTradePrice / totalTradeVolume
  };
};

const searchInsert = (
  nums: type.orderInfoInterface[], 
  target: type.orderInfoInterface, 
  descending: boolean = false) => {
  const n = nums.length;
  let left = 0, right = n - 1, ans = n;
  while (left <= right) {
      let mid = ((right - left) >> 1) + left;
      if (descending ? target.price > nums[mid].price : target.price < nums[mid].price) {
          ans = mid;
          right = mid - 1;
      } else {
          left = mid + 1;
      }
  }
  return ans;
};