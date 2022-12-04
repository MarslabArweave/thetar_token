import * as type from '../../types/types';
import { isAddress } from '../common';

declare const ContractError;

export const addTokenSrcTx = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.addTokenSrcTxParam = <type.addTokenSrcTxParam>action.input.params;
  const src: string = param.src;
  
  if (action.caller !== state.owner) {
    throw new ContractError('You have no permission to modify hash list!');
  }

  state.tokenSrcTxs.push(src);

  return { state };
};