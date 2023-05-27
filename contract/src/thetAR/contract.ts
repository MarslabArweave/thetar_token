import * as type from './types/types';
import { addPair } from './actions/write/addPair';
import { createOrder } from './actions/write/createOrder';
import { cancelOrder } from './actions/write/cancelOrder';
import { evolve } from './actions/write/evolve';
import { pairInfos } from './actions/read/pairInfos';
import { orderInfos } from './actions/read/orderInfos';
import { orderInfo } from './actions/read/orderInfo';
import { userOrder } from './actions/read/userOrder';

declare const ContractError;

export async function handle(state: type.State, action: type.Action): Promise<type.ContractResult> {
  const func = action.input.function;

  switch (func) {
    case 'evolve':
      return await evolve(state, action);
    case 'addPair':
      return await addPair(state, action);
    case 'createOrder':
      return await createOrder(state, action);
    case 'cancelOrder':
      return await cancelOrder(state, action);
    case 'pairInfos':
      return await pairInfos(state, action);
    case 'orderInfo':
      return await orderInfo(state, action);
    case 'orderInfos':
      return await orderInfos(state, action);
    case 'userOrder':
      return await userOrder(state, action);
    default:
      throw new ContractError(`No function supplied or function not recognised: "${func}"`);
  }
}
