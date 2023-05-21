import * as type from '../../types/types';
import { contractAssert, isAddress } from '../common';

declare const ContractError;

export const userOrder = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.userOrderParam = <type.userOrderParam>action.input.params;
  let address: string = param.address;
  let result: type.Result;

  contractAssert(
    isAddress(address),
    'Invalid wallet address!'
  );

  result = state.userOrders[address];

  return { result };
};
