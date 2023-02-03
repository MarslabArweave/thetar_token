import { Message } from 'rsuite';

export const ConnectWallet = (props) => {
  return (
    <Message showIcon type="info" header="Wallet Not Connected">
      Please connect your wallet first!
    </Message>
  );
}