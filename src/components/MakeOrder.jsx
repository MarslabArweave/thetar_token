import React from 'react';
import { FlexboxGrid, InputGroup, InputNumber, Radio, RadioGroup, SelectPicker, Slider } from 'rsuite';
import { count } from 'rsuite/esm/utils/ReactChildren';
import { 
  createOrder,
  tarDecimals,
  tarSymbol,
  getBalance,
  tarAddress
} from '../lib/api';
import { mul, pow, sub, div, add } from '../lib/math';
import { SubmitButton } from './SubmitButton/SubmitButton';

const elementStyle = {
  marginLeft: '1.5rem', 
  marginRight: '1.5rem', 
  marginBottom: '1.5rem'
};

export const MakeOrder = (props) => {
  const orderTypeOption = [
    {value: 'limit', label: 'Limit Order'},
    {value: 'market', label: 'Market Order'},
  ];

  // priceWithDecimals * priceCoeff = priceWithoutDecimals
  const priceCoeff = pow(10, tarDecimals-props.tokenDecimals);

  const [orderType, setOrderType] = React.useState(orderTypeOption[0].value);
  const [dirType, setdirType] = React.useState('buy');
  const [volume, setVolume] = React.useState();
  const [price, setPrice] = React.useState();
  const [total, setTotal] = React.useState();
  const [tarBalance, setTarBalance] = React.useState(mul(props.tarBalance, pow(10, -tarDecimals)));
  const [tokenBalance, setTokenBalance] = React.useState(mul(props.tokenBalance, pow(10, -props.tokenDecimals)));

  React.useEffect(async ()=>{
    setPrice(
      props.currentPrice === undefined ?
        calcMinPrice() :
        div(props.currentPrice, pow(10, tarDecimals-props.tokenDecimals))
    );
  }, []);

  React.useEffect(async ()=>{
    await fetchBalance();
  }, [props.refreshCounter]);

  React.useEffect(async ()=>{
    // check decimals
    if (price !== undefined) {
      if (tarDecimals-props.tokenDecimals >= 0) {
        setPrice(Number(price.toFixed(tarDecimals-props.tokenDecimals)));
      } else {
        const fac = pow(10, props.tokenDecimals-tarDecimals);
        setPrice(price/fac*fac);
      }
    }
    const decimals = 
        orderType==='market' && dirType==='buy' ? 
        tarDecimals : props.tokenDecimals;
    if (volume !== undefined) {
      setVolume(Number(volume.toFixed(decimals)));
    }
    if (total !== undefined) {
      setTotal(Number(total.toFixed(tarDecimals)));
    }

    // check boundry
    const minPrice = calcMinPrice();
    if (price < minPrice) {
      setPrice(minPrice);
    }
    const minVolume = calcMinVolume();
    if (volume < 0) {
      setVolume(0);
    }
    const minTotal = minPrice * minVolume;
    if (total < 0) {
      setTotal(volume * price);
    }
    const maxVolume = calcMaxVolume();
    if (volume > maxVolume) {
      setVolume(maxVolume);
    }
    const maxTotal = calcMaxVolume() * price;
    if (total > maxTotal) {
      setTotal(maxTotal);
    }

    if (orderType === 'market') {
      setPrice(undefined);
    }
  }, [volume, total, price, dirType, orderType]);

  const fetchBalance = async () => {
    const tokenBalanceRet = await getBalance(props.tokenAddress);
    if (tokenBalanceRet.status) {
      setTokenBalance(mul(tokenBalanceRet.result, pow(10, -props.tokenDecimals)));
    }

    const tarBalanceRet = await getBalance(tarAddress);
    if (tarBalanceRet.status) {
      setTarBalance(mul(tarBalanceRet.result, pow(10, -tarDecimals)));
    }
  };

  const calcMaxVolume = () => {
    if (orderType === 'limit') {
      if (dirType === 'buy') {
        return Number((tarBalance / price).toFixed(props.tokenDecimals));
      } else {
        return tokenBalance;
      }
    } else {
      if (dirType === 'buy') {
        return tarBalance;
      } else {
        return tokenBalance;
      }
    }
  };
  const calcMinVolume = () => {
    const decimals = 
        orderType==='market' && dirType==='buy' ? 
        tarDecimals : props.tokenDecimals;
    const minVolume = pow(10, -decimals);
    return minVolume;
  };

  const calcMinPrice = () => {
    return div(1, priceCoeff);
  }

  const onhandlePricePlus = () => {
    const value = add(price, calcMinPrice());
    setPrice(value);
    setTotal(volume * value);
  };
  const onhandlePriceMinus = () => {
    const value = sub(price, calcMinPrice());
    setPrice(value);
    setTotal(volume * value);
  };
  const onhandleAmountPlus = () => {
    const value = add(volume, calcMinVolume());
    setVolume(value);
    setTotal(value * price);
  };
  const onhandleAmountMinus = () => {
    const value = sub(volume, calcMinVolume());
    setVolume(value);
    setTotal(value * price);
  };

  const onHandlePrice = (value) => {
    setPrice(value);
    setTotal(volume * value);
  }
  const onHandleTotal = (value) => {
    setTotal(value);
    setVolume(value / price);
  };
  const onHandleVolume = (value) => {
    setVolume(value);
    setTotal(value * price);
  };

  const onMakeOrder = async () => {
    // limit:
    // volume -> trade token
    // total -> Tar
    // market buy:
    // volume -> Tar
    // total -> undefined
    // market sell:
    // volume -> trade token
    // total -> undefined
    const volumeDecimals = 
        orderType==='market' && dirType==='buy' ? 
        tarDecimals : props.tokenDecimals;
    const plainVolume = parseInt(mul(volume, pow(10, volumeDecimals)));
    const totalDecimals = orderType==='limit' ?
        tarDecimals: 0;
    const plainTotal = parseInt(mul(total, pow(10, totalDecimals)));
    const plainPrice = orderType === 'limit' ? 
        parseInt(mul(price, priceCoeff)) : 
        undefined;
    const plainQuantity = orderType==='limit' && dirType==='buy' ? 
        plainTotal : plainVolume;

    // make order
    console.log('make order: ', plainVolume, plainTotal, plainPrice);
    const ret = await createOrder(dirType, plainQuantity, plainPrice, props.tokenAddress);

    // trigger refresh signal
    props.onRefresh(props.refreshCounter+1);

    return ret;
  }

  return (
    <>
      <RadioGroup 
        inline 
        name='direction'
        appearance='picker'
        defaultValue='buy'
        onChange={setdirType}
        style={{borderWidth: 0, margin: '1rem', justifyContent: 'center', alignItems: 'center', display: 'flex'}}
      >
        <Radio value='buy'><p style={{fontSize: '1.2rem'}}>Buy</p></Radio>
        <Radio value='sell'><p style={{fontSize: '1.2rem'}}>Sell</p></Radio>
      </RadioGroup>
      <SelectPicker 
        searchable={false} 
        cleanable={false} 
        data={orderTypeOption} 
        style={elementStyle}
        defaultValue={'limit'} 
        onChange={setOrderType}
        block 
      />
      {
        orderType === 'limit' &&
        <div style={elementStyle}>
          <InputGroup>
            <InputGroup.Button onClick={onhandlePriceMinus}>-</InputGroup.Button>
            <InputNumber placeholder='Price($TAR)' value={price} onChange={(value)=>{onHandlePrice(Number(value))}} />
            <InputGroup.Button onClick={onhandlePricePlus}>+</InputGroup.Button>
          </InputGroup>
        </div>
      }
      <div style={elementStyle}>
        <InputGroup>
          <InputGroup.Button onClick={onhandleAmountMinus}>-</InputGroup.Button>
          <InputNumber 
            placeholder={`Amount`} 
            value={volume} 
            onChange={(value)=>{onHandleVolume(Number(value))}} 
            postfix={`$${orderType==='market'&&dirType==='buy'?tarSymbol:props.tokenSymbol}`}
          />
          <InputGroup.Button onClick={onhandleAmountPlus}>+</InputGroup.Button>
        </InputGroup>
      </div>
      <Slider
        style={{...elementStyle, marginBottom: '2.5rem'}}
        defaultValue={0}
        onChange={onHandleVolume}
        value={volume}
        min={0}
        step={calcMinVolume()}
        max={calcMaxVolume()}
        progress
      />
      {
        orderType === 'limit' &&
        <div style={elementStyle}>
          <InputNumber 
            placeholder={`Total`} 
            onChange={(value)=>{onHandleTotal(Number(value))}}
            value={total}
            postfix={`$TAR`}
          />
        </div>
      }
      <div style={elementStyle}>
        <FlexboxGrid>
          <FlexboxGrid.Item colspan={6} style={{fontSize: '1rem'}}>
            Balance: 
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={18} style={{fontSize: '1rem'}}>
            <div style={{ textAlign: 'right' }}> 
              {dirType === 'buy' ? `${tarBalance} $TAR` : `${tokenBalance} $${props.tokenSymbol}`}
            </div>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </div>
      <div style={elementStyle}>
        <SubmitButton 
          block 
          buttonText={dirType}
          color={dirType==='buy'?'green':'red'} 
          submitTask={onMakeOrder}
        />
      </div>
    </>
  );
};