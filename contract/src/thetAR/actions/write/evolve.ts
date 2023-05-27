import * as type from '../../types/types';
import { contractAssert } from '../common';

export const evolve = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  if (state.canEvolve) {
    contractAssert(
      state.owner === action.caller,
      'Only the owner can evolve a contract!'
    );
  
    state.evolve = action.input.value;
  }

  return { state };
};
