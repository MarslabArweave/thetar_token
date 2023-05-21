import React from 'react';
import { 
  pairInfos,
  orderInfos,
  asyncCall,
  getState
} from '../lib/api';
import { PageLoading } from './PageLoading/PageLoading';
import { PairList } from './PairList';
import { SearchFrame } from './SearchFrame/SearchFrame';
import { Container, Content, Footer, Header } from 'rsuite';

const trustPairs = [];

export const Home = (props) => {
  const [pairs, setPairInfos] = React.useState([]);
  const [orders, setOrderInfos] = React.useState();
  const [pairFilter, setPairFilter] = React.useState('');

  async function searchPairs() {
    let status = true;
    let result = '';

    const pairInfosRet = await pairInfos();
    if (pairInfosRet.status === false) {
      return pairInfosRet;
    }

    const orderInfosRet = await orderInfos();
    if (orderInfosRet.status === false) {
      return orderInfosRet;
    }
    console.log('debug: 1', pairInfosRet, orderInfosRet);

    /// fetch pair infos
    let tokens = [];

    // fill tokens fields with address
    pairInfosRet.result.forEach(address => {
      tokens.push({
        address,
        symbol: '',
        name: '',
        logo: undefined,
        description: ''
      });
    });

    // fetch all tokens' basic info
    await asyncCall(async (token)=>{
      const state = (await getState(token.address)).result;
      token.symbol = state.symbol;
      token.name = state.name;
      token.logo = state.logo;
      token.description = state.description;
    }, tokens);

    setPairInfos(tokens);
    setOrderInfos(orderInfosRet);

    result = 'Pair list pre-load success!';

    return {status: status, result: result};
  }

  function trigger(inputContent) {
    setPairFilter(inputContent);
  }

  function renderPairList() {
    let filteredToken = new Set();

    pairs.forEach(pair => {
      if ((pair.name).toLowerCase().includes(pairFilter.toLowerCase()) ||
          (pair.symbol).toLowerCase().includes(pairFilter.toLowerCase()) ||
          (pair.address).toLowerCase().includes(pairFilter.toLowerCase())) {
        filteredToken.add(pair.address);
      }
    });

    // collect detailed pair infos
    let aggregatedPairInfos = [];
    filteredToken.forEach(targetPair => {
      const price = orders.result[targetPair].currentPrice;
      const trusted = trustPairs.includes(targetPair);
      const pairInfo = pairs.filter(e=>e.address===targetPair)[0];

      aggregatedPairInfos.push({
        pstTicker: pairInfo.symbol,
        name: pairInfo.name,
        logo: pairInfo.logo,
        description: pairInfo.description,
        decimals: pairInfo.decimals,
        tokenAddress: targetPair,
        price,
        trusted,
      });
    });

    console.log('aggregatedPairInfos: ', aggregatedPairInfos);

    return (
      <PairList 
        pairList={aggregatedPairInfos}
      />
    );
  }

  return (
    <Container>
      <Container>
        <Content>
        <SearchFrame
          prompt={`Search token by symbol, name or address`}
          onSearch={trigger}
        />
        <PageLoading 
          submitTask={searchPairs}
        />
        { 
          pairs && 
          orders &&
          renderPairList() 
        }
        </Content>
      </Container>
      <Footer><p style={{textAlign: 'center',  fontSize: '1rem'}}>©️ 2023 mARsLab</p></Footer>
    </Container>
  );
};