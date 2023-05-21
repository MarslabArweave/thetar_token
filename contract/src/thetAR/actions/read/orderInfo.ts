import * as type from '../../types/types';
import { contractAssert } from '../common';

declare const ContractError;

export const orderInfo = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.orderInfoParam = <type.orderInfoParam>action.input.params;
  let tokenAddress: string = param.tokenAddress;
  let result: type.Result;

  contractAssert(
    state.orderInfos.hasOwnProperty(tokenAddress),
    'Token does not exist!'
  );

  result = state.orderInfos[tokenAddress];

  return { result };
};
