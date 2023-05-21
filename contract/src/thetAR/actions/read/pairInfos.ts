import * as type from '../../types/types';

declare const ContractError;

export const pairInfos = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  let result: type.Result;

  result = Object.keys(state.orderInfos);

  return { result };
};
