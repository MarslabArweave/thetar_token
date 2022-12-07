import * as type from '../../types/types';
import { contractAssert, isAddress } from '../common';

declare const ContractError;

export const setPrice = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.setPriceParam = <type.setPriceParam>action.input.params;
  const price: number = param.price;

  contractAssert(
    typeof(price) === 'number', 
    'Param {price} type error!'
  );
  contractAssert(
    action.caller === state.owner, 
    'Only contract owner has permission to call this function! ' +
    'caller: ' + action.caller +
    'owner: ' + state.owner
  );

  state.price = price;

  return { state };
};
