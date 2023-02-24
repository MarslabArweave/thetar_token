import React from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { 
  pairInfo,
  orderInfo,
  tarSymbol,
  calculatePriceWithDecimals,
  getContractTxInfo,
  getContractData,
  getDateByTx,
  getName,
  getTarget
} from '../lib/api';
import { 
  Container, 
  Header, 
  Content, 
  Footer, 
  Panel,
  Placeholder, 
} from 'rsuite';
import { PageLoading } from './PageLoading/PageLoading';
import BackIcon from '@rsuite/icons/legacy/Left';
import LinkIcon from '@rsuite/icons/legacy/ExternalLink';
import { mul, pow } from '../lib/math';
import { PriceChart } from './PriceChart';
import PlaceholderParagraph from 'rsuite/esm/Placeholder/PlaceholderParagraph';

const contentStyle = {
  padding: '1rem', 
  backgroundColor: 'rgb(37, 49, 61)', 
  margin: '1rem',
  borderRadius: '15px'
};

const panelStyle = {
  color: 'white', 
  fontSize: '1.4em', 
  fontWeight: 700
};

export const PairDetail = (props) => {
  const dominentSymbol = tarSymbol;
  const params = useParams();
  const navigate = useNavigate();

  const [tokenInfoList, setTokenInfoList] = React.useState([]);
  const [pair, setPair] = React.useState();
  const [order, setOrder] = React.useState();

  React.useEffect(async () => {
    if (pair && order) {
      const contractData = JSON.parse(await (await getContractData(params.tokenAddress)).result);
      const contractInfo = (await getContractTxInfo(params.tokenAddress)).result;
      const mintDate = await getDateByTx(params.tokenAddress);
      const totalSupply = mul(contractData.totalSupply, pow(10, -contractData.decimals));
      let creatorContent = contractInfo.owner_address;

      // check if bind to a polaris name
      const polarisNameRet = await getName(contractInfo.owner_address);
      if (polarisNameRet.status === true && 
          polarisNameRet.result !== undefined && 
          polarisNameRet.result !== null &&
          polarisNameRet.result.domain === 'ar') {
        const domain = polarisNameRet.result.domain;
        const name = polarisNameRet.result.name;
        const polarisNameTargetRet = await getTarget(domain, name);
        if (polarisNameTargetRet.status === true && polarisNameTargetRet.result.target) {
          creatorContent = 
            <a 
              href={`https://arweave.net/wbo15PDbhXjpGMSGV8wh-XhlfFgjXKOZPw-wvEE24xI/#/${domain}/${name}`}
            > 
              {`${name}.${domain}`} {<LinkIcon />}
            </a>;
        }
      }
          
      setTokenInfoList([
        {title: 'Token Address', content: <a href={`https://www.arweave.net/G2t61jWAFfoTjaybLtjouWEM9IFZoNdxJMX2GzIXUSA/#/token/${params.tokenAddress}`}>{params.tokenAddress} {<LinkIcon />}</a>}, 
        {title: 'Creator', content: creatorContent},
        {title: 'Decimals', content: pair.decimals},
        {title: 'Mint Date', content: mintDate.status ? mintDate.result : 'Unknown'},
        {title: 'Total Supply', content: totalSupply},
        {title: 'Description', content: pair.description},
      ]);
    }
  }, [pair, order]);

  async function fetchInfos() {
    const addr = params.tokenAddress;

    const pairInfoRet = await pairInfo(addr);
    if (!pairInfoRet.status) {
      return pairInfoRet;
    }
    setPair(pairInfoRet.result);

    const orderInfoRet = await orderInfo(addr);
    if (!orderInfoRet.status) {
      return orderInfoRet;
    }
    setOrder(orderInfoRet.result);
    return {status: true, result: "Fetch infos sucessful!"}
  }

  const renderTokenInfo = (title, content) => {
    return(
      <div style={{padding: '0.8rem'}}>
        <p style={{color: 'white', fontSize: '1rem', fontWeight: 300}}>{title}</p>
        <p style={{color: 'white', fontSize: '1.4rem', fontWeight: 500}}>{content}</p>
      </div>
    );
  };

  return (<>
    <PageLoading 
      submitTask={fetchInfos}
    />
    {pair && order &&
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
          ${pair.symbol} ({pair.name})
        </Header>
        <Container>
          <Content style={contentStyle}>
            <Panel
              bordered 
              defaultExpanded 
              collapsible 
              header={<p style={panelStyle}>Price History</p>}
            >
              <div style={{fontSize: '1.8rem', color: 'white'}}>
                {order.currentPrice ? 
                    calculatePriceWithDecimals(order.currentPrice, pair.decimals).toString()+' $'+tarSymbol : 
                    'N/A'
                }
              </div>
              <PriceChart tokenAddress={params.tokenAddress} tokenDecimals={pair.decimals} />
            </Panel>
            <br />
            <Panel 
              bordered 
              defaultExpanded 
              collapsible 
              header={<p style={panelStyle}>Token Info</p>}
            >
              {
                tokenInfoList.length === 0 ? 
                <Placeholder.Paragraph rows={8} /> :
                tokenInfoList.map((item) => renderTokenInfo(item.title, item.content))
              }
            </Panel>
          </Content>
        </Container>
        <Footer><p style={{textAlign: 'center',  fontSize: '1rem'}}>©️ 2023 mARsLab</p></Footer>
      </Container>
    }
  </>);
};