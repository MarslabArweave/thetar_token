import * as type from '../../types/types';
import { contractAssert, isAddress } from '../common';

declare const ContractError;

export const cancelOrder = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.cancelOrderParam = <type.cancelOrderParam>action.input.params;
  const orderId: string = param.orderId;
  const tokenAddress: string = param.tokenAddress;

  contractAssert(
    isAddress(orderId),
    `OrderId not found: ${param.orderId}!`
  );
  contractAssert(
    state.orderInfos.hasOwnProperty(param.tokenAddress),
    `Pair does not exist!`
  );

  let direction = 'buy';
  let orderInfo = state.userOrders[action.caller][tokenAddress].buy.find(v=>v.orderId===orderId);
  if (!orderInfo) {
    direction = 'sell';
    orderInfo = state.userOrders[action.caller][tokenAddress].sell.find(v=>v.orderId===orderId);
  }
  contractAssert(
    orderInfo !== undefined && orderInfo !== null,
    `Cannot get access to pair: ${tokenAddress}!`
  );

  const refundAddress = direction === 'buy' ? 
      state.thetarTokenAddress : tokenAddress;
  const quantity = direction === 'buy' ? 
      orderInfo.price * orderInfo.quantity : orderInfo.quantity;

  await SmartWeave.contracts.write(
    refundAddress, 
    { function: 'transfer', to: action.caller, amount: quantity},
  );

  let ordersForUser = state.userOrders[action.caller][tokenAddress][direction];
  state.userOrders[action.caller][tokenAddress][direction] = 
      ordersForUser.filter(i=>i.orderId!==orderId);

  let ordersForPair = state.orderInfos[tokenAddress].orders[direction];
  state.orderInfos[tokenAddress].orders[direction] = 
      ordersForPair.filter(i=>i.orderId!==orderId);

  return { state };
};