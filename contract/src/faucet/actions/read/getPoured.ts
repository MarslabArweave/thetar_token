import * as type from '../../types/types';

declare const ContractError;

export const getPoured = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  let result:type.getPouredResult = {amount: state.poured};

  return { result };
};
