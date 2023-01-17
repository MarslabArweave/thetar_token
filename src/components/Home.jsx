import React from 'react';
import { 
  pairInfos,
  orderInfos,
} from '../lib/api';
import { PageLoading } from './PageLoading/PageLoading';
import { PairList } from './PairList';
import { SearchFrame } from './SearchFrame/SearchFrame';

const trustPairs = [];

export const Home = (props) => {
  const [pairs, setPairInfos] = React.useState();
  const [orders, setOrderInfos] = React.useState();
  const [pairFilter, setPairFilter] = React.useState('');

  async function searchPairs() {
    let status = true;
    let result = '';

    const pairInfosRet = await pairInfos();
    if (pairInfosRet.status === false) {
      setPairInfos(pairInfosRet);
      return pairInfosRet;
    }

    const orderInfosRet = await orderInfos();
    if (orderInfosRet.status === false) {
      setOrderInfos(orderInfosRet);
      return orderInfosRet;
    }

    setPairInfos(pairInfosRet);
    setOrderInfos(orderInfosRet);

    result = 'Pair list pre-load success!';

    return {status: status, result: result};
  }

  function trigger(inputContent) {
    setPairFilter(inputContent);
  }

  function renderPairList() {
    console.log('render pair list: ',
        'pairs: ', pairs,
        'filter: ', pairFilter
    );

    // parse type and filter
    let type = 'address';
    let parsedFilter = pairFilter;
    if (pairFilter.length >= 1 && pairFilter[0] === '$') {
      type = 'ticker';
      parsedFilter = pairFilter.substring(1);
    }
    if (pairFilter.length === 0) {
      type = 'all';
    }

    /// convert 'ticker' to 'address' type
    let addrFilter = [];

    // case1: ticker type
    if (type === 'ticker') {
      for (const addr in pairs.result) {
        if (Object.hasOwnProperty.call(pairs.result, addr)) {
          const info = pairs.result[addr];
          if (info.symbol.toLowerCase().includes(pairFilter.toLocaleLowerCase())) {
            addrFilter.push(info.symbol);
          }
        }
      }
    }

    // case2: address type
    if (type === 'address') {
      addrFilter.push(parsedFilter);
    }

    // case4: all type
    if (type === 'all') {
      addrFilter = Object.keys(pairs.result);
    }

    console.log(
      'addrFilter: ', addrFilter,
    );
    // collect detailed pair infos
    let aggregatedPairInfos = [];
    addrFilter.forEach(addressFilter => {
      const targetPairs = Object.keys(pairs.result).filter(addr=>{
        return addr.toLowerCase().includes(addressFilter.toLowerCase());
      });
      targetPairs.forEach(targetPair => {
        const dmntTicker = 'TAR';
        const price = orders.result[targetPair].currentPrice;
        const trusted = trustPairs.includes(targetPair);
        const pairInfo = pairs.result[targetPair];
        aggregatedPairInfos.push({
          pstTicker: pairInfo.symbol,
          logo: pairInfo.logo,
          description: pairInfo.description,
          decimals: pairInfo.decimals,
          tokenAddress: targetPair,
          price,
          trusted,
        });
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
    <>
      <SearchFrame
        prompt={`Enter '$ticker' OR 'tokenAddress'`}
        onSearch={trigger}
      />
      <PageLoading 
        submitTask={searchPairs}
      />
      { 
        pairs && pairs.result && 
        orders && orders.result &&
        renderPairList() 
      }
    </>
  );
};