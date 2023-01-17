import * as type from '../../types/types';

declare const ContractError;

export const pairInfo = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.pairInfoParam = <type.pairInfoParam>action.input.params;
  let tokenAddress: string = param.tokenAddress;
  let result: type.Result;

  if (!state.pairInfos.hasOwnProperty(param.tokenAddress)) {
    throw new ContractError('Pair does not exist!');
  }

  result = state.pairInfos[tokenAddress];

  return { result };
};
