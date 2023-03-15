import React from 'react';
import { ConnectWallet } from './ConnectWallet/ConnectWallet';
import { MyOrders } from './MyOrders';
import { Container, Content, Footer, Header } from 'rsuite';
import BackIcon from '@rsuite/icons/legacy/Left';
import { useNavigate } from 'react-router-dom';

export const My = (props) => {
  const navigate = useNavigate();

  const [refreshCounter, setRefreshCounter] = React.useState(0);

  if (!props.walletConnect) {
    return (
      <ConnectWallet />
    );
  }

  return (
    <Container>
      <Header>
        <span onClick={()=>{navigate(`/`)}} style={{cursor: 'pointer'}}>
          {React.cloneElement(<BackIcon />, {
            style: {
              fontSize: '1.5rem',
            }
          })}
        </span>
        &nbsp;&nbsp;&nbsp;&nbsp;
        My
      </Header>
      <Container>
        <Content>
          <MyOrders 
            refreshCounter={refreshCounter} // refresh controller
            onRefresh={setRefreshCounter} // refresh callback
            onSubmitDisabled={()=>{}}
          />
        </Content>
      </Container>
      <Footer><p style={{textAlign: 'center',  fontSize: '1rem'}}>©️ 2023 mARsLab</p></Footer>
    </Container>
  );
};