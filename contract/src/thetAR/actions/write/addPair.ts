import * as type from '../../types/types';
import { isAddress, contractAssert } from '../common';

declare const ContractError;

export const addPair = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  const param: type.addPairParam = <type.addPairParam>action.input.params;
  const tokenAddress: string = param.tokenAddress;

  // pay $TAR for listing token fee, to avoid flood attack
  await SmartWeave.contracts.write(
    state.thetarTokenAddress, 
    { function: 'transferFrom', from: action.caller, to: state.owner, amount: state.addFee},
  );

  contractAssert(
    isAddress(tokenAddress),
    'Token address format error!'
  );
  contractAssert(
    !state.orderInfos.hasOwnProperty(tokenAddress),
    'Pair already exists!'
  );

  state.orderInfos[tokenAddress] = {
    currentPrice: 0,
    orders: {buy: [], sell: []},
  };

  return { state };
};
