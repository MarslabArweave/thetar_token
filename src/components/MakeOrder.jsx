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

  React.useEffect(async ()=>{

    if (orderTypeText.value === 'market') {
      setTips('This is a market order, the amount of token you will get relies on the current orders in orderbook!');
      return;
    }
    const ret = checkOrderInput();
    if (ret.status) {
      const vol = ret.result.volume * Math.pow(10, -props.tokenDecimals);
      const price = ret.result.price * 
          Math.pow(10, tarDecimals)*
          Math.pow(10, -props.tokenDecimals);
      if (dirTypeText.value === 'buy') {
        setTips(`You will swap ${vol*price}$${tarSymbol} for ${vol}$${props.tokenSymbol}`);
      } else {
        setTips(`You will swap ${vol}$${props.tokenSymbol} for ${vol*price}$${tarSymbol}`);
      }
    } else {
      setTips(ret.result);
    }
  }, [volumeText, priceText, dirTypeText, orderTypeText]);

  function checkOrderInput() {
    const decimals = 
        orderTypeText.value==='market' && dirTypeText.value==='buy' ? 
        tarDecimals : props.tokenDecimals;
    const volume = Math.floor(Number(volumeText) * Math.pow(10, decimals));
    if (volume === 0) {
      return {status: false, result: `Amount should be at least ${Math.pow(10, -decimals)} !`};
    }
    const price = orderTypeText.value === 'limit' ? 
        Math.floor(
          Number(priceText)*
          Math.pow(10, -tarDecimals)*
          Math.pow(10, props.tokenDecimals)
        ) : undefined;
    if (price === 0) {
      return {status: false, result: `Price should be greater than $
        ${tarSymbol} 
        ${Math.pow(10, -tarDecimals)*Math.pow(10, props.tokenDecimals)} !`
      };
    }
    return {status: true, result: {volume: volume, price: price}};
  }

  async function onMakeOrder() {
    // check for order type
    if (orderTypeText.value === 'market' && props.orders.length === 0) {
      return {status: false, result: 'No orders in orderbook, cannot create market order now!'};
    }

    const checkRet = checkOrderInput();
    if (checkRet.status === false) {
      return checkRet;
    }
    const volume = checkRet.result.volume;
    const price = checkRet.result.price;

    // check for funds amout
    let targetAmout = 0;
    if (orderTypeText.value === 'market' || dirTypeText.value === 'sell') {
      targetAmout = volume;
    } else {
      targetAmout = volume * price;
    }
    if ((dirTypeText.value === 'buy' && targetAmout > props.dominentBalance) ||
        (dirTypeText.value === 'sell' && targetAmout > props.tokenBalance)) {
      return {status: false, result: 'Insuffient funds!'};
    }
    if (arLessThan(props.arBalance, '0.02')) {
      return {status: false, result: 'You should have at least 0.02$AR in your wallet to pay for fees!'};
    }

    const ret = await createOrder(dirTypeText.value, targetAmout, price, parseInt(props.pairId));
    // await props.onUpdateBalance();
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
        submitTask={onMakeOrder}
        disabled={!dirTypeText || !volumeText || (orderTypeText.value === 'limit' && !priceText)}
      />
    </>
  );
};