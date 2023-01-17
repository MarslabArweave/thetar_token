import React from 'react';
import Select from 'react-select';
import TextareaAutosize from 'react-textarea-autosize';
import { 
  arLessThan,
  checkAmountValidation,
  createOrder,
  tarDecimals,
  tarSymbol
} from '../lib/api';
import { mul, pow, sub, div } from '../lib/math';
import { SubmitButton } from './SubmitButton/SubmitButton';

export const MakeOrder = (props) => {
  const orderTypeOption = [
    {value: 'limit', label: 'Limit'},
    {value: 'market', label: 'Market'},
  ];
  const directionOption = [
    {value: 'buy', label: 'Buy'}, 
    {value: 'sell', label: 'Sell'}
  ];
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      background: '#fff',
      borderColor: '#9e9e9e',
      minHeight: '30px',
      height: '30px',
      boxShadow: state.isFocused ? null : null,
    }),

    valueContainer: (provided, state) => ({
      ...provided,
      height: '30px',
      padding: '0 8px'
    }),

    input: (provided, state) => ({
      ...provided,
      margin: '0px',
    }),
    indicatorSeparator: state => ({
      display: 'none',
    }),
    indicatorsContainer: (provided, state) => ({
      ...provided,
      height: '30px',
    }),
  };

  const [orderTypeText, setOrderTypeText] = React.useState(orderTypeOption[0]);
  const [dirTypeText, setDirTypeText] = React.useState(directionOption[0]);
  const [volumeText, setVolumeText] = React.useState();
  const [priceText, setPriceText] = React.useState();
  const [tips, setTips] = React.useState('');
  const [disabled, setDisabled] = React.useState(true);

  React.useEffect(async ()=>{
    // set tips when user input changes
    const tidyOrderInput = convertOrderInput();
    if (orderTypeText.value === 'market') {
      processMarketOrder(tidyOrderInput);
    } else {
      processLimitOrder(tidyOrderInput);
    }
  }, [volumeText, priceText, dirTypeText, orderTypeText]);

  function convertOrderInput() {
    const decimals = 
        orderTypeText.value==='market' && dirTypeText.value==='buy' ? 
        tarDecimals : props.tokenDecimals;
    
    // priceWithDecimals * priceCoeff = priceWithoutDecimals
    const priceCoeff = pow(10, tarDecimals-props.tokenDecimals);

    // priceWithDecimals * volumeCoeff = priceWithoutDecimals
    const volumeCoeff = pow(10, decimals);

    const volume = Math.floor(mul(Number(volumeText), pow(10, decimals)));

    const price = orderTypeText.value === 'limit' ? 
        Math.floor(
          mul(Number(priceText),
          priceCoeff
        )) : undefined;
    
    return {decimals, volume, price, priceCoeff, volumeCoeff};
  }

  function processMarketOrder(tidyOrderInput) {
    if (tidyOrderInput.volume === 0) {
      setTips(`Minimum volume is ${pow(10, -tidyOrderInput.decimals)}!`);
      setDisabled(true);
      return false;
    }
    setTips('This is a market order, the amount of token you will get relies on the current orders in orderbook!');
    setDisabled(false);
    return true;
  }

  function processLimitOrder(tidyOrderInput) {
    if (tidyOrderInput.volume <= 0) {
      setTips(`Minimum volume is ${pow(10, -tidyOrderInput.decimals)}!`);
      setDisabled(true);
      return false;
    }
    if (tidyOrderInput.price <= 0) {
      setTips(`Minimum price is ${div(1, tidyOrderInput.priceCoeff)}!`);
      setDisabled(true);
      return false;
    }

    const vol = div(tidyOrderInput.volume, tidyOrderInput.volumeCoeff);
    const price = div(tidyOrderInput.price, tidyOrderInput.priceCoeff);
    if (dirTypeText.value === 'buy') {
      setTips(`You will swap ${mul(vol,price)}$${tarSymbol} for ${vol}$${props.tokenSymbol}`);
    } else {
      setTips(`You will swap ${vol}$${props.tokenSymbol} for ${mul(vol,price)}$${tarSymbol}`);
    }
    setDisabled(false);
    return true;
  }

  async function onMakeOrder() {
    // check for order type
    if (orderTypeText.value === 'market' && props.orders.length === 0) {
      return {status: false, result: 'No orders in orderbook, cannot create market order for you!'};
    }

    const orderInput = convertOrderInput();
    const volume = orderInput.volume;
    const price = orderInput.price;

    // check for funds amout
    let targetAmout = 0;
    if (orderTypeText.value === 'market' || dirTypeText.value === 'sell') {
      targetAmout = volume;
    } else {
      targetAmout = mul(volume, price);
    }
    if ((dirTypeText.value === 'buy' && targetAmout > props.dominentBalance) ||
        (dirTypeText.value === 'sell' && targetAmout > props.tokenBalance)) {
      return {status: false, result: 'Insuffient funds!'};
    }
    if (arLessThan(props.arBalance, '0.02')) {
      return {status: false, result: 'You should have at least 0.02$AR in your wallet to pay for network fee!'};
    }

    const ret = await createOrder(dirTypeText.value, targetAmout, price, props.tokenAddress);
    await props.onUpdateBalance();
    return ret;
  }

  function setVolume(value) {
    if (checkAmountValidation(value)) {
      setVolumeText(value);
    }
  }

  function setPrice(value) {
    if (checkAmountValidation(value)) {
      setPriceText(value);
    }
  }

  function buttonDisabled() {
    if (!dirTypeText || !volumeText || (orderTypeText.value === 'limit' && !priceText)) {
      return true;
    }
    return disabled;
  }

  return (
    <>
      <div className='MakeOrderLine'>
        <div className='blue'> Order Type: &nbsp;</div>
        <Select 
          className='select'
          value={orderTypeText}
          options={orderTypeOption}
          onChange={setOrderTypeText}
          styles={customSelectStyles}
        /> &nbsp;&nbsp;
        <div className='blue'>Direction: &nbsp;</div>
        <Select 
          className='select'
          value={dirTypeText}
          options={directionOption}
          onChange={setDirTypeText}
          styles={customSelectStyles}
        />
      </div>

      <div className='MakeOrderLine'>
        <div className='blue'>Volume: &nbsp;</div>
        <TextareaAutosize
          className='textInput'
          value={volumeText}
          onChange={e => setVolume(e.target.value)}
          rows="1" 
        />
        <div className='gray'>$
          {
            orderTypeText.value==='market'&&dirTypeText.value==='buy' ? 
            props.dominentTicker : props.tokenSymbol
          }
        </div>
        
        &nbsp;&nbsp;&nbsp;

        { orderTypeText.value === 'limit' &&
          <>
            <div className='blue'>Price: &nbsp;</div>
            <TextareaAutosize
              className='textInput'
              value={priceText}
              onChange={e => setPrice(e.target.value)}
              rows="1" 
            />
            <div className='gray'>${props.dominentTicker}&nbsp;</div>
          </>
        }
      </div>

      <div className='tips'>
        Tips: {tips}
      </div>

      <SubmitButton 
        buttonText='Create Order'
        buttonSize='Medium'
        disabled={buttonDisabled()}
        submitTask={onMakeOrder}
      />
    </>
  );
};