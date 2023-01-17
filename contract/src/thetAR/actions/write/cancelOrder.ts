import * as type from '../../types/types';
import { isAddress } from '../common';

declare const ContractError;

export const cancelOrder = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.cancelOrderParam = <type.cancelOrderParam>action.input.params;
  const orderId: string = param.orderId;
  const tokenAddress: string = param.tokenAddress;

  if (!isAddress(orderId)) {
    throw new ContractError(`OrderId not found: ${param.orderId}!`);
  }
  if (!state.pairInfos.hasOwnProperty(param.tokenAddress)) {
    throw new ContractError('Pair does not exist!');
  }
  const orderInfo = state.userOrders[action.caller][tokenAddress].find(v=>v.orderId===orderId);
  const pairInfo = state.pairInfos[tokenAddress];
  if (!orderInfo) {
    throw new ContractError(`Cannot get access to pair: ${tokenAddress}!`);
  }
  if (!pairInfo) {
    throw new ContractError(`Pair info record not found: ${tokenAddress}!`);
  }

  const refundAddress = orderInfo.direction === 'buy' ? 
      state.thetarTokenAddress : tokenAddress;
  const quantity = orderInfo.direction === 'buy' ? 
      orderInfo.price * orderInfo.quantity : orderInfo.quantity;

  await SmartWeave.contracts.write(
    refundAddress, 
    { function: 'transfer', to: action.caller, amount: quantity},
  );

  let ordersForUser = state.userOrders[action.caller][tokenAddress];
  state.userOrders[action.caller][tokenAddress] = 
      ordersForUser.filter(i=>i.orderId!==orderId);

  let ordersForPair = state.orderInfos[tokenAddress].orders;
  state.orderInfos[tokenAddress].orders = 
      ordersForPair.filter(i=>i.orderId!==orderId);

  return { state };
};