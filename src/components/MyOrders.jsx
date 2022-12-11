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
import { ProgressSpinner } from './ProgressSpinner/ProgressSpinner';

export const MyOrders = (props) => {
  const [userOrders, setUserOrders] = React.useState();

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
        for (const pairId in ret.result) {
          if (Object.hasOwnProperty.call(ret.result, pairId)) {
            const orders = ret.result[pairId];
            items = items.concat(orders.map(e=>{
              return {
                pairId: pairId,
                orderId: e.orderId,
                direction: e.direction,
                price: e.price,
                amount: e.quantity,
              }
            }));
          }
        }
        
        setUserOrders(items);
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
    <div>
      {userOrders.map(e=><OrderItem 
        key={e.orderId}
        onUpdate={fetchUserOrders}
        pairId={e.pairId}
        orderId={e.orderId}
        direction={e.direction}
        price={e.price}
        amount={e.amount}
      />)}
    </div>
  );
};

const OrderItem = (props) => {
  const [tokenSymbol, setTokenSymbol] = React.useState('Loading');
  const [tokenDecimals, setTokenDecimals] = React.useState(0);
  const [isCancelling, setIsCancelling] = React.useState(false);

  React.useEffect(async () => {
    const pairId = parseInt(props.pairId);
    const pairInfoRet = await pairInfo(pairId);
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
    console.log('on cancel: ', props.pairId, props.orderId);
    setIsCancelling(true);
    const ret = await cancelOrder(parseInt(props.pairId), props.orderId);
    alert(ret.result);
    // setIsCancelling(false);
    if (ret.status) {
      props.onUpdate();
    }
  }

  return (
    <div className="item">
      <div className="layout">
        <div>
          <div className="itemRow"> 
          <span className='blue'>Pair:</span> #{props.pairId} (${tokenSymbol} / ${tarSymbol})
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
              <div onClick={onCancel} className='cancelOrder'>cancel</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}