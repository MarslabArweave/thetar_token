import React from 'react';
import { calculatePriceWithDecimals, orderInfo } from '../lib/api';
import { Table } from 'rsuite';
import { mul, pow } from '../lib/math';
import RefreshIcon from '@rsuite/icons/legacy/Refresh';
const { Column, HeaderCell, Cell } = Table;

export const OrderList = (props) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [orders, setOrders] = React.useState(props.orders);

  React.useEffect(async () => {
    onRefreshButtonClicked();
  }, [props.refreshCounter]);

  function onRefreshButtonClicked() {
    if (refreshing) return;
    setRefreshing(true);
    orderInfo(props.tokenAddress).then(async ret => {
      console.log('onRefreshButtonClicked, orderInfo: ', ret);
      setRefreshing(false);
      if (ret.status === true) {
        setOrders(ret.result);
      }
    });
  }

  function sortOrders() {
    const sortedBuys = orders.orders.filter(e=>e.direction === 'buy').
        sort((a, b)=>a.price < b.price ? 1 : -1);
    const sortedSells = orders.orders.filter(e=>e.direction === 'sell').
        sort((a, b)=>a.price > b.price ? 1 : -1);

    const pickOrders = (sortOrders, cols, style) => {
      let ret = [];

      if (sortOrders.length !== 0) {
        ret = [{...sortOrders[0]}];
        for (let i = 1; i < sortOrders.length; i ++) {
          const retLen = ret.length;
          const lastPrice = ret[retLen-1].price;
          if (sortOrders[i].price === lastPrice) {
            ret[retLen-1].quantity += sortOrders[i].quantity;
          } else {
            if (ret.length === cols) break;
            ret.push({...sortOrders[i]});
          }
        }

        ret.forEach(e => {
          e.price = <p style={style}>{calculatePriceWithDecimals(e.price, props.decimals)}</p>;
          e.quantity = <p style={style}>{mul(e.quantity, pow(10, -props.decimals))}</p>;
        });
      }

      while (ret.length < cols) {
        ret.push({
          price: <p style={style}>-</p>, 
          quantity: <p style={style}>-</p>
        });
      }

      return ret;
    };

    let buys = pickOrders(sortedBuys, 5, {color: 'green'});
    let sells = pickOrders(sortedSells, 5, {color: 'red'});
    
    let data = [];
    data = data.concat(sells);
    data.push({
      price: 
        <p style={{fontSize: '1rem', fontWeight: 700}}>
          {orders.currentPrice ? calculatePriceWithDecimals(orders.currentPrice, props.decimals) : 'N/A'}
        </p>, 
      quantity: 
        <div style={{fontSize: '1rem', fontWeight: 700}}>
          <RefreshIcon spin={refreshing} onClick={onRefreshButtonClicked} />
        </div>, 
    });
    data = data.concat(buys);

    console.log('order book: ', data);
    return data;
  }

  return (
    <div style={{width: 190}}>
      <Table
        data={sortOrders()}
        height={30*12}
        cellBordered={false}
        bordered={false}
        headerHeight={30}
        rowHeight={30}
      >
        <Column align='center' width={80} fullText>
          <HeaderCell style={{ padding: 4 }}>Price($TAR)</HeaderCell>
          <Cell style={{ padding: 4 }} dataKey='price' />
        </Column>

        <Column align='center' width={110} fullText>
          <HeaderCell style={{ padding: 4 }}>Amount(${props.tokenSymbol})</HeaderCell>
          <Cell style={{ padding: 4 }} dataKey='quantity' />
        </Column>
      </Table>
    </div>
  );
};