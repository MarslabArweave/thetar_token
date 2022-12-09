import React from 'react';
import { SubmitButton } from './SubmitButton/SubmitButton';
import { TextInput } from './TextInput/TextInput';
import { 
  arLessThan,
  checkAmountValidation,
  getAllowance,
  getBalance, 
  getPoured, 
  getPrice,
  tarDecimals,
  swap,
} from '../lib/api';

export const Faucet = (props) => {
  const [balance, setBalance] = React.useState('N/A');
  const [price, setPrice] = React.useState('N/A');
  const [poured, setPoured] = React.useState('N/A');
  const [allowance, setAllowance] = React.useState('N/A');
  const [amount, setAmount] = React.useState('');

  React.useEffect(async () => {
    if (props.walletConnect) {
      let ret;

      ret = await getBalance('ar');
      if (ret.status === true) {
        setBalance(ret.result);
      }

      ret = await getPrice();
      if (ret.status === true) {
        setPrice(ret.result * Math.pow(10, tarDecimals));
      }

      ret = await getPoured();
      if (ret.status === true) {
        setPoured((ret.result * Math.pow(10, -tarDecimals)).toFixed(tarDecimals));
      }
      
      ret = await getAllowance();
      if (ret.status === true) {
        setAllowance((ret.result * Math.pow(10, -tarDecimals)).toFixed(tarDecimals));
      }
    }
  }, [props.walletConnect]);

  if (!props.walletConnect) {
    return (
      <div className='darkRow'>
        Please connect wallet first!
      </div>
    );
  }

  const setClaimAmount = (value) => {
    if (!checkAmountValidation(value)) {
      return;
    }
    setAmount(Number(value).toFixed(tarDecimals));
  }

  const makeSwap = async () => {
    const arStr = (amount * price).toString();
    if (arLessThan(balance, arStr)) {
      return {status: false, result: 'Insuffient $AR in your wallet!'};
    }
    if (amount > allowance) {
      return {status: false, result: 'Claim token exceeds max!'};
    }
    return await swap(arStr);
  }
  
  return (
    <>
      <div className='faucetTiele'>Faucet Information:</div>
      <div style={{'margin-top': '1rem'}}>
        <span className='faucetKey'>$TAR price:</span>
        <span className='faucetValue'> 1 $TAR = {price} $AR; 1 $AR = {(1/price).toFixed(tarDecimals)} $TAR</span>
      </div>
      <div style={{'margin-top': '1rem'}}>
        <span className='faucetKey'>$TAR in pool:</span>
        <span className='faucetValue'> {allowance} $TAR</span>
      </div>
      <div style={{'margin-top': '1rem'}}>
        <span className='faucetKey'>Total claimed:</span>
        <span className='faucetValue'> {poured} $TAR</span>
      </div>
      <div style={{'margin-top': '1rem'}}>
        <span className='faucetKey'>$AR balance:</span>
        <span className='faucetValue'> {balance} $AR</span>
      </div>
      
      <TextInput 
        title='Claim $TAR:'
        tip={
          <>❕
            {Number.isNaN(amount) ? 
                'The amount of $TAR you enter is not valid!' : 
                'You will swap ' + amount * price + '$AR for ' + amount + '$TAR token.'
            }
          </>
        }
        onChange={setClaimAmount}
        placeholder='e.g. 123.45'
      />
      <SubmitButton 
        buttonText='Claim'
        buttonSize='Medium'
        submitTask={makeSwap}
      />
    </>
  );
};