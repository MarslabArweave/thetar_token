import { MyOrders } from './MyOrders';

export const Faucet = (props) => {
  if (!props.walletConnect) {
    return (
      <div className='darkRow'>
        Please connect wallet first!
      </div>
    );
  }
  
  return (
    <>
      TODO...
    </>
  );
};