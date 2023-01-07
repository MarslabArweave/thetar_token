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
import { div, mul, pow, myToLocaleString } from '../lib/math';
import { ConnectWallet } from './ConnectWallet/ConnectWallet';
import { Container, Content, Footer, Header } from 'rsuite';
import BackIcon from '@rsuite/icons/legacy/Left';

export const Faucet = (props) => {
  const [balance, setBalance] = React.useState('N/A');
  const [price, setPrice] = React.useState('N/A');
  const [poured, setPoured] = React.useState('N/A');
  const [allowance, setAllowance] = React.useState('N/A');
  const [amount, setAmount] = React.useState(0);

  React.useEffect(async () => {
    if (props.walletConnect) {
      let ret;

      ret = await getBalance('ar');
      if (ret.status === true) {
        setBalance(ret.result);
      }

      ret = await getPrice();
      if (ret.status === true) {
        setPrice(mul(ret.result, pow(10, tarDecimals)));
      }

      ret = await getPoured();
      if (ret.status === true) {
        setPoured(mul(ret.result, pow(10, -tarDecimals)));
      }
      
      ret = await getAllowance();
      if (ret.status === true) {
        setAllowance(mul(ret.result, pow(10, -tarDecimals)));
      }
    }
  }, [props.walletConnect]);

  if (!props.walletConnect) {
    return (
      <ConnectWallet />
    );
  }

  const setClaimAmount = (value) => {
    if (!checkAmountValidation(value)) {
      return;
    }
    setAmount(Number(value).toFixed(tarDecimals));
  }

  const makeSwap = async () => {
    // const arStr = mul(amount, price).toString();
    // if (arLessThan(balance, arStr)) {
    //   return {status: false, result: 'Insuffient $AR in your wallet!'};
    // }
    // if (amount > allowance) {
    //   return {status: false, result: 'Claim token exceeds max!'};
    // }
    return await swap(undefined);
  }

  return (
    <>
      <div className='faucetTitle'>Faucet Information:</div>
      {/* <div style={{'margin-top': '1rem'}}>
        <span className='faucetKey'>$TAR price:</span>
        <span className='faucetValue'> 1 $TAR = {price} $AR; 1 $AR = {div(1, price).toFixed(tarDecimals)} $TAR</span>
      </div> */}
      <div style={{'margin-top': '1rem'}}>
        <span className='faucetKey'>$TAR in pool:</span>
        <span className='faucetValue'> {allowance} $TAR</span>
      </div>
      <div style={{'margin-top': '1rem'}}>
        <span className='faucetKey'>Total claimed:</span>
        <span className='faucetValue'> {poured} $TAR</span>
      </div>
      {/* <div style={{'margin-top': '1rem'}}>
        <span className='faucetKey'>$AR balance:</span>
        <span className='faucetValue'> {balance} $AR</span>
      </div> */}
      
      {/* <TextInput 
        title='Claim $TAR:'
        tip={
          <>❕
            {Number.isNaN(Number(amount)) ? 
                'The amount of $TAR you enter is not valid!' : 
                'You will swap ' + myToLocaleString(mul(amount, price)) + '$AR for ' + myToLocaleString(amount) + '$TAR token.'
            }
          </>
        }
        onChange={setClaimAmount}
        placeholder='e.g. 123.45'
      /> */}
      <SubmitButton 
        buttonText='Claim $TAR'
        buttonSize='Medium'
        submitTask={makeSwap}
      />
    </>
  );
};