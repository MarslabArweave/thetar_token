import React from 'react';
import { Link } from 'react-router-dom';
import { List, FlexboxGrid, useToaster, Message, Placeholder } from 'rsuite';
import DefaultTokenIcon from '@rsuite/icons/legacy/Money';
import LikeIcon from '@rsuite/icons/legacy/Star';
import { calculatePriceWithDecimals, genRaise, getBlockHeight, getPriceByBlockHeight, tarDecimals } from '../lib/api';

const verifiedIcon = <svg width="14px" height="14px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-labelledby="verifiedIconTitle" stroke="#50a2ff" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#50a2ff"> <title id="verifiedIconTitle">Verified</title> <path d="M8 12.5L10.5 15L16 9.5"/> <path d="M12 22C13.2363 22 14.2979 21.2522 14.7572 20.1843C14.9195 19.8068 15.4558 19.5847 15.8375 19.7368C16.9175 20.1672 18.1969 19.9453 19.0711 19.0711C19.9452 18.1969 20.1671 16.9175 19.7368 15.8376C19.5847 15.4558 19.8068 14.9195 20.1843 14.7572C21.2522 14.2979 22 13.2363 22 12C22 10.7637 21.2522 9.70214 20.1843 9.24282C19.8068 9.08046 19.5847 8.54419 19.7368 8.16246C20.1672 7.08254 19.9453 5.80311 19.0711 4.92894C18.1969 4.05477 16.9175 3.83286 15.8376 4.26321C15.4558 4.41534 14.9195 4.1932 14.7572 3.8157C14.2979 2.74778 13.2363 2 12 2C10.7637 2 9.70214 2.74777 9.24282 3.81569C9.08046 4.19318 8.54419 4.41531 8.16246 4.26319C7.08254 3.83284 5.80311 4.05474 4.92894 4.92891C4.05477 5.80308 3.83286 7.08251 4.26321 8.16243C4.41534 8.54417 4.1932 9.08046 3.8157 9.24282C2.74778 9.70213 2 10.7637 2 12C2 13.2363 2.74777 14.2979 3.81569 14.7572C4.19318 14.9195 4.41531 15.4558 4.26319 15.8375C3.83284 16.9175 4.05474 18.1969 4.92891 19.0711C5.80308 19.9452 7.08251 20.1671 8.16243 19.7368C8.54416 19.5847 9.08046 19.8068 9.24282 20.1843C9.70213 21.2522 10.7637 22 12 22Z"/> </svg>

export const PairList = (props) => {
  if (props.pairList) {
    return (
      <List hover>
        {props.pairList.map(item =>
          <PairItem pairInfo={item} />
        )}
      </List>
    );
  }
  return (<></>);
};

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

const PairItem = (props) => {
  const toaster = useToaster();

  const [priceBegin, setPriceBegin] = React.useState();

  React.useEffect(async () => {
    setPriceBegin(await getPriceByBlockHeight(
      props.pairInfo.tokenAddress, 
      await getBlockHeight(7)
    ));
  }, []);

  const toast = (type, message) => 
      <Message type={type} header={message} closable showIcon />

  const renderRaise = React.useCallback(genRaise, []);

  const renderPrice = () => {
    if (props.pairInfo.price === undefined) {
      return 'N/A';
    }
    return calculatePriceWithDecimals(props.pairInfo.price, props.pairInfo.decimals);
  }

  const renderPriceFluncuation = () => {
    if (priceBegin === undefined) {
      return (<Placeholder.Paragraph rows={1} />);
    }
    if (props.pairInfo.price === undefined) {
      return 'N/A';
    }
    return renderRaise(calculatePriceWithDecimals(props.pairInfo.price - priceBegin, props.pairInfo.decimals).toFixed(tarDecimals));
  };

  const renderPriceFluncuationPct = () => {
    if (priceBegin === undefined) {
      return (<Placeholder.Paragraph rows={1} />);
    }
    if (props.pairInfo.price === undefined) {
      return 'N/A %';
    }
    return renderRaise((props.pairInfo.price - priceBegin) / (priceBegin + 1e-20), true);
  };

  if (props.pairInfo) {
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
            colspan={9}
            style={{
              ...styleCenter,
              flexDirection: 'column',
              alignItems: 'flex-start',
              overflow: 'hidden'
            }}
          >
            <Link to={`/pair/${props.pairInfo.tokenAddress}`} style={titleStyle}>
              ${props.pairInfo.pstTicker} &nbsp;
              {props.pairInfo.trusted ? verifiedIcon : ''}
            </Link>
            <div style={slimText}> {props.pairInfo.name} </div>
            <div style={slimText}>
              Address: {props.pairInfo.tokenAddress.substring(0,8)}
            </div>
          </FlexboxGrid.Item>
          {/*price*/}
          <FlexboxGrid.Item colspan={5} style={styleCenter}>
            <div style={{ textAlign: 'right' }}>
              <div style={slimText}>Price</div>
              <div style={dataStyle}>{renderPrice()}</div>
            </div>
          </FlexboxGrid.Item>
          {/*Quote change*/}
          <FlexboxGrid.Item colspan={5} style={styleCenter}>
            <div style={{ textAlign: 'right' }}>
              <div style={slimText}>In 7 days</div>
              <div style={dataStyle}>
                { renderPriceFluncuation() }
              </div>
              <div style={dataStyle}>
                { renderPriceFluncuationPct() }
              </div>
            </div>
          </FlexboxGrid.Item>
          {/*Like*/}
          <FlexboxGrid.Item colspan={2} style={styleCenter} onClick={()=>{
            toaster.push(toast('warning', 'Comming soon!'));
          }}>
            {React.cloneElement(<LikeIcon />, {
              style: {
                color: 'darkgrey',
                fontSize: '1.5em'
              }
            })}
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </List.Item>
    );
  }
}