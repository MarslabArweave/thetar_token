import React from 'react';
import { 
  cancelOrder,
  getWalletAddress, 
  pairInfo, 
  tarDecimals, 
  tarSymbol, 
  userOrder
} from '../lib/api';
import { mul, pow } from '../lib/math';
import { Loader, useToaster, Message } from 'rsuite';
import { ProgressSpinner } from './ProgressSpinner/ProgressSpinner';

export const MyOrders = (props) => {
  const [userOrders, setUserOrders] = React.useState();
  const [cancelling, setCancelling] = React.useState(false);

  React.useEffect(async () => {
    fetchUserOrders();
  }, []);

  function fetchUserOrders() {
    userOrder(getWalletAddress()).then(async ret=>{
      console.log('userInfo: ', ret);
      if (ret.status === false) {
        setUserOrders([]);
      } else {
        let items = [];
        for (const tokenAddress in ret.result) {
          if (Object.hasOwnProperty.call(ret.result, tokenAddress)) {
            const orders = ret.result[tokenAddress];
            items = items.concat(orders.map(e=>{
              return {
                tokenAddress: tokenAddress,
                orderId: e.orderId,
                direction: e.direction,
                price: e.price,
                amount: e.quantity,
              }
            }));
          }
        }
        
        setUserOrders(items);
        setCancelling(false);
      }
    });
  }

  if (userOrders === undefined) {
    return (<ProgressSpinner />);
  }

  if (userOrders.length === 0) {
    return (
      <div className='ordersText'>
        <div class='gray'>You have no active orders!</div>
      </div>
    );
  }
  
  return (
    <>
      {
        cancelling && 
        <Loader 
          center inverse backdrop 
          content= 'cancelling ...' 
          style= {{height: document.body.scrollHeight*1.8}}
        />
      }

      {userOrders.map(e=><OrderItem 
        key={e.orderId}
        onUpdate={fetchUserOrders}
        tokenAddress={e.tokenAddress}
        orderId={e.orderId}
        direction={e.direction}
        price={e.price}
        amount={e.amount}
        onCancelling={setCancelling}
      />)}
    </>
  );
};

const OrderItem = (props) => {
  const [tokenSymbol, setTokenSymbol] = React.useState('Loading');
  const [tokenDecimals, setTokenDecimals] = React.useState(0);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const toaster = useToaster();

  const toast = (type, message) => 
    <Message type={type} header={message} closable showIcon />

  React.useEffect(async () => {
    const pairInfoRet = await pairInfo(props.tokenAddress);
    console.log('OrderItem: ', props, pairInfoRet);
    if (!pairInfoRet.status) {
      return;
    }
    setTokenSymbol(pairInfoRet.result.symbol);
    setTokenDecimals(pairInfoRet.result.decimals);
  }, []);

  function renderDirection() {
    if (props.direction === 'buy') {
      return (<span className='green'>buy</span>);
    } else {
      return (<span className='red'>sell</span>);
    }
  }

  async function onCancel() {
    console.log('on cancel: ', props.tokenAddress, props.orderId);
    props.onCancelling(true);
    setIsCancelling(true);
    const ret = await cancelOrder(parseInt(props.tokenAddress), props.orderId);
    toaster.push(toast(ret.status === true ? 'success' : 'error', ret.result));
    if (ret.status) {
      props.onUpdate();
    }
  }

  return (
    <div className="item">
      <div className="layout">
        <div>
          <div className="itemRow"> 
          <span className='blue'>Pair:</span> (${tokenSymbol} / ${tarSymbol})
          </div>
          <div className="itemRow"> 
            <span className='blue'>Direction:</span> {renderDirection()}
            &nbsp;&nbsp;&nbsp;
            <span className='blue'>Price:</span> {mul(props.price, pow(10, tokenDecimals-tarDecimals))} ${tarSymbol}
            &nbsp;&nbsp;&nbsp;
            <span className='blue'>Amount:</span> {mul(props.amount, pow(10, -tokenDecimals))} ${tokenSymbol}
          </div>
          <div className="itemRow"> 
            { isCancelling ? 
              <div className='cancelOrder'>cancelling...</div> :
              <div onClick={onCancel} className='cancelOrder'> cancel </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}