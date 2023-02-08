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
import DefaultTokenIcon from '@rsuite/icons/legacy/Money';
import CancelIcon from '@rsuite/icons/Close';
import { Loader, useToaster, Message, List, FlexboxGrid } from 'rsuite';
import { ProgressSpinner } from './ProgressSpinner/ProgressSpinner';

const listItem = {
  'background-color': 'transparent',
  color: 'rgb(80, 162, 255)',
};

const styleCenter = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '60px',
  color: '#97969B',
};

const slimText = {
  fontSize: '0.8em',
  color: '#97969B',
  fontWeight: '600',
  paddingBottom: 5
};

const titleStyle = {
  paddingTop: 4,
  fontSize: '1.2em',
  paddingBottom: 5,
  whiteSpace: 'nowrap',
  fontWeight: 700
};

const dataStyle = {
  fontSize: '1.2em',
  fontWeight: 500
};

export const MyOrders = (props) => {
  const [userOrders, setUserOrders] = React.useState();
  const [cancelling, setCancelling] = React.useState(false);

  React.useEffect(async () => {
    fetchUserOrders();
  }, []);

  React.useEffect(async () => {
    fetchUserOrders();
  }, [props.refreshCounter]);

  React.useEffect(async () => {
    props.onSubmitDisabled(cancelling);
  }, [cancelling]);

  React.useEffect(async () => {
    setCancelling(props.submitDisable);
  }, [props.submitDisable]);

  const onRefresh = () => {
    props.onRefresh(props.refreshCounter+1);
  }

  const fetchUserOrders = () => {
    userOrder(getWalletAddress()).then(async ret=>{
      console.log('userInfo: ', ret);
      if (ret.status === false) {
        setUserOrders([]);
      } else {
        let items = [];
        for (const tokenAddress in ret.result) {
          if (props.tokenAddress !== undefined && props.tokenAddress !== tokenAddress) {
            continue;
          }
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
          style= {{height: document.body.scrollHeight*1.8}}
        />
      }

      <List hover>
        {userOrders.map(e=><OrderItem 
          key={e.orderId}
          onUpdate={onRefresh}
          tokenAddress={e.tokenAddress}
          orderId={e.orderId}
          direction={e.direction}
          price={e.price}
          amount={e.amount}
          onCancelling={setCancelling}
        />)}
      </List>
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
      return (<span className='green'>Buy</span>);
    } else {
      return (<span className='red'>Sell</span>);
    }
  }

  async function onCancel() {
    console.log('on cancel: ', props.tokenAddress, props.orderId);
    props.onCancelling(true);
    setIsCancelling(true);
    const ret = await cancelOrder(props.tokenAddress, props.orderId);
    toaster.push(toast(ret.status === true ? 'success' : 'error', ret.result));
    if (ret.status) {
      props.onUpdate();
    }
  }

  return (
    <List.Item style={listItem}>
      <FlexboxGrid>
        {/*token logo*/}
        <FlexboxGrid.Item colspan={3} style={styleCenter}>
          {React.cloneElement(<DefaultTokenIcon />, {
            style: {
              color: 'darkgrey',
              fontSize: '2em'
            }
          })}
        </FlexboxGrid.Item>
        {/*base info*/}
        <FlexboxGrid.Item
          colspan={7}
          style={{
            ...styleCenter,
            flexDirection: 'column',
            alignItems: 'flex-start',
            overflow: 'hidden'
          }}
        >
          <p style={titleStyle}>
            ${tokenSymbol}
          </p>
          <div style={slimText}>
            Address: {props.tokenAddress.substring(0,8)}
          </div>
        </FlexboxGrid.Item>
        {/*price*/}
        <FlexboxGrid.Item colspan={4} style={styleCenter}>
          <div style={{ textAlign: 'right' }}>
            <div style={slimText}>Price</div>
            <div style={dataStyle}>{mul(props.price, pow(10, tokenDecimals-tarDecimals))} ${tarSymbol}</div>
          </div>
        </FlexboxGrid.Item>
        {/*amount*/}
        <FlexboxGrid.Item colspan={4} style={styleCenter}>
          <div style={{ textAlign: 'right' }}>
            <div style={slimText}>Amount</div>
            <div style={dataStyle}>{mul(props.amount, pow(10, -tokenDecimals))} ${tokenSymbol}</div>
          </div>
        </FlexboxGrid.Item>
        {/*direction*/}
        <FlexboxGrid.Item colspan={4} style={styleCenter}>
          <div style={{ textAlign: 'right' }}>
            <div style={slimText}>Direction</div>
            <div style={dataStyle}>{renderDirection()}</div>
          </div>
        </FlexboxGrid.Item>
        {/*cancel*/}
        <FlexboxGrid.Item colspan={2} style={styleCenter} onClick={onCancel}>
            {React.cloneElement(<CancelIcon />, {
              style: {
                color: 'darkgrey',
                fontSize: '1.5em',
              }
            })}
          </FlexboxGrid.Item>
      </FlexboxGrid>
    </List.Item>
  );

  // return (
  //   <div className="item">
  //     <div className="layout">
  //       <div>
  //         <div className="itemRow"> 
  //         <span className='blue'>Pair:</span> (${tokenSymbol} / ${tarSymbol})
  //         </div>
  //         <div className="itemRow"> 
  //           <span className='blue'>Direction:</span> {renderDirection()}
  //           &nbsp;&nbsp;&nbsp;
  //           <span className='blue'>Price:</span> {mul(props.price, pow(10, tokenDecimals-tarDecimals))} ${tarSymbol}
  //           &nbsp;&nbsp;&nbsp;
  //           <span className='blue'>Amount:</span> {mul(props.amount, pow(10, -tokenDecimals))} ${tokenSymbol}
  //         </div>
  //         <div className="itemRow"> 
  //           { isCancelling ? 
  //             <div className='cancelOrder'>cancelling...</div> :
  //             <div onClick={onCancel} className='cancelOrder'> cancel </div>
  //           }
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
}