import React from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Container, Content, FlexboxGrid, Footer, Header, Panel } from 'rsuite';
import { getBalance, getState, orderInfo, tarAddress } from '../lib/api';
import { MakeOrder } from './MakeOrder';
import { OrderList } from './OrderList';
import { PageLoading } from './PageLoading/PageLoading';
import BackIcon from '@rsuite/icons/legacy/Left';
import { MyOrders } from './MyOrders';
import { ConnectWallet } from './ConnectWallet/ConnectWallet';

const panelStyle = {
  color: 'white', 
  fontSize: '1rem', 
  fontWeight: 700
};

export const Trade = (props) => {
  const params = useParams();
  const navigate = useNavigate();

  const [pair, setPair] = React.useState();
  const [order, setOrder] = React.useState();
  const [tarBalance, setTarBalance] = React.useState();
  const [tokenBalance, setTokenBalance] = React.useState();
  const [refreshCounter, setRefreshCounter] = React.useState(0);
  const [submitDisabled, setSubmitDisabled] = React.useState(false);

  // React.useEffect(() => {
  //   fetchInfos();
  // }, []);

  async function fetchInfos() {
    const addr = params.tokenAddress;

    const pairInfoRet = await getState(addr);
    if (!pairInfoRet.status) {
      return pairInfoRet;
    }
    setPair(pairInfoRet.result);

    const orderInfoRet = await orderInfo(addr);
    if (!orderInfoRet.status) {
      return orderInfoRet;
    }
    setOrder(orderInfoRet.result);

    const tokenBalanceRet = await getBalance(addr);
    if (!tokenBalanceRet.status) {
      return tokenBalanceRet;
    }
    setTokenBalance(tokenBalanceRet.result);

    const tarBalanceRet = await getBalance(tarAddress);
    if (!tarBalanceRet.status) {
      return tarBalanceRet;
    }
    setTarBalance(tarBalanceRet.result);

    return {status: true, result: "Fetch infos sucessful!"}
  }

  if (!props.walletConnect) {
    return (
      <ConnectWallet />
    );
  }

  // if (!order || !pair) {
  //   return (<></>);
  // }

  return (<>
    <PageLoading 
      submitTask={fetchInfos}
    />
    {pair && order && tarBalance !== undefined && tokenBalance !== undefined &&
      <Container>
        <Header>
          <span onClick={()=>{navigate(`/pair/${params.tokenAddress}`)}} style={{cursor: 'pointer'}}>
            {React.cloneElement(<BackIcon />, {
              style: {
                fontSize: '1.5rem',
              }
            })}
          </span>
          &nbsp;&nbsp;&nbsp;&nbsp;
          Trade ${pair.symbol}
        </Header>
        <Container>
          <Content>
            <FlexboxGrid align='middle' justify='space-around'>
              <FlexboxGrid.Item colspan={12}>
                <MakeOrder
                  tokenSymbol={pair.symbol}
                  tokenDecimals={pair.decimals}
                  tokenAddress={params.tokenAddress}
                  currentPrice={order.currentPrice}
                  tarBalance={tarBalance}
                  tokenBalance={tokenBalance}
                  // UI control
                  refreshCounter={refreshCounter} // refresh controller
                  onRefresh={setRefreshCounter} // refresh callback
                  submitDisable={submitDisabled} // submit enable controller
                  onSubmitDisabled={setSubmitDisabled} // submit enable callback
                />
              </FlexboxGrid.Item>
              <FlexboxGrid.Item colspan={12}>
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                  <OrderList 
                    orders={order}
                    tokenAddress={params.tokenAddress}
                    decimals={pair.decimals}
                    tokenSymbol={pair.symbol}
                    // UI control
                    refreshCounter={refreshCounter} // refresh controller
                    onRefresh={setRefreshCounter} // refresh callback
                    submitDisable={submitDisabled} // submit enable controller
                    onSubmitDisabled={setSubmitDisabled} // submit enable callback
                  />
                </div>
              </FlexboxGrid.Item>
            </FlexboxGrid>
            <FlexboxGrid align='middle' justify='space-around'>
              <FlexboxGrid.Item colspan={22} style={{margin: '1rem'}}>
                <Panel 
                  bordered 
                  defaultExpanded 
                  collapsible 
                  header={<p style={panelStyle}>My Orders</p>}
                >
                  <MyOrders
                    tokenAddress={params.tokenAddress}
                    // UI control
                    refreshCounter={refreshCounter} // refresh controller
                    onRefresh={setRefreshCounter} // refresh callback
                    submitDisable={submitDisabled} // submit enable controller
                    onSubmitDisabled={setSubmitDisabled} // submit enable callback
                  />
                </Panel>
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </Content>
        </Container>
        <Footer><p style={{textAlign: 'center',  fontSize: '1rem'}}>©️ 2023 mARsLab</p></Footer>
      </Container>
    }
  </>);
};