import * as type from '../../types/types';

declare const ContractError;

export const getPrice = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  let result:type.getPriceResult = {price: state.price};

  return { result };
};
