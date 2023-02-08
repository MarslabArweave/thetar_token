import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { 
  genRaise,
  getBlockHeight,
  getPriceByBlockHeight,
  tarDecimals,
  calculatePriceWithDecimals
} from '../lib/api';
import { 
  Row, 
  Col, 
  Button, 
  Dropdown,
  Loader
} from 'rsuite';
import { add } from '../lib/math';

export const PriceChart = (props) => {
  const navigate = useNavigate();

  const [range, setRange] = React.useState(7);
  const [priceList, setPriceList] = React.useState([]);
  const [dateList, setDateList] = React.useState([]);

  const option = {
    tooltip : {
      trigger: 'axis'
    },
    toolbox: {
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis : [
      {
        type : 'category',
        boundaryGap : false,
        data : dateList
      }
    ],
    yAxis : [
      {
        type : 'value'
      }
    ],
    series : [
      {
        name:'price in $TAR',
        type:'line',
        stack: 'price',
        areaStyle: {normal: {}},
        data: priceList
      }
    ]
  };

  React.useEffect(async () => {
    fetchPriceHistory(7);
  }, []);

  const fetchPriceHistory = async (range) => {
    // calc interval
    let interval = 1;
    if (range === 1) {
      interval = 0.1;
    }

    // fill dateList
    let tmpDateList = [];
    const now = new Date();
    for (let relativeDay = -range; relativeDay <= 0; relativeDay+=interval) {
      const ret = new Date();
      ret.setMinutes(now.getMinutes()+(relativeDay)*24*60);
      tmpDateList.push(ret.toLocaleString());
    }
    
    // fill priceList
    let tmpPriceList = [];
    for (let relativeDay = -range; relativeDay <= 0; relativeDay= add(relativeDay,interval)) {
      const plainPrice = await getPriceByBlockHeight(props.tokenAddress, await getBlockHeight(-relativeDay));
      tmpPriceList.push(calculatePriceWithDecimals(plainPrice, props.tokenDecimals));
    }

    setDateList(tmpDateList);
    setPriceList(tmpPriceList);
  };

  const onRangeChange = (eventKey) => {
    if (eventKey === range) return;
    setRange(eventKey);
    setPriceList([]);
    setDateList([]);
    fetchPriceHistory(eventKey);
  };

  const wrappedLoader = () => {
    return (
      <>
      &nbsp;&nbsp;&nbsp;&nbsp;
      <Loader />
      &nbsp;&nbsp;&nbsp;&nbsp;
      </>
    );
  };

  return (
    <div>
      <Row className="show-grid">
        <Col xs={18} style={{fontSize: '1rem', color: 'white'}}>
          {
            priceList.length !== 0 ? 
                genRaise((priceList[priceList.length-1] - priceList[0]).toFixed(tarDecimals)) : 
                wrappedLoader()
          }
          ({
            priceList.length !== 0 ? 
                genRaise(((priceList[priceList.length-1] - priceList[0]) / (priceList[0]+1e-20) * 100).toFixed(3), true) : 
                wrappedLoader()
          })
          &nbsp;&nbsp;
          <Dropdown trigger='click' title={`${range} Day(s)`} onSelect={onRangeChange}>
            <Dropdown.Item eventKey={1}>1 Day(s)</Dropdown.Item>
            <Dropdown.Item eventKey={7}>7 Day(s)</Dropdown.Item>
            <Dropdown.Item eventKey={30}>30 Day(s)</Dropdown.Item>
          </Dropdown>
        </Col>
        <Col xs={6} style={{ textAlign: 'right' }}>
          <Button 
            block 
            size='md' 
            appearance="primary"
            onClick={()=>{navigate(`/trade/${props.tokenAddress}`)}}
          >Trade</Button>
        </Col>
      </Row>
      {
        priceList.length !== 0 && dateList.length !== 0 ?
            <ReactECharts
              option={option}
              style={{ height: 400 }}
            /> :
            <div style={{paddingTop: 150, paddingBottom: 150, textAlign: 'center'}}>
              <Loader inverse content="loading ..." size="md" />
            </div>
      }
    </div>
  );
};