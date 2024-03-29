import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { 
  connectContract, 
} from './lib/api';
import 'rsuite/dist/rsuite.css';
import './App.css';
import { Home } from './components/Home';
import { AddPair } from './components/AddPair';
import { My } from './components/My';
import { PairDetail } from './components/PairDetail';
import { Trade } from './components/Trade';

const App = () => {
  const [isContractConnected, setIsContractConnected] = React.useState(false);
  const [isWalletConnected, setIsWalletConnected] = React.useState(false);

  React.useEffect(()=>{
    connectContract();
    setIsContractConnected(true);
  }, []);

  if (!isContractConnected) {
    return (
      <div className='darkRow'>
        Loading Contract ...
      </div>
    );
  }
  return (
    <div id="app">
      <div id="content">
        <Navigation setIsWalletConnected={setIsWalletConnected}/>
        <main>
          <Routes>
            <Route path="/" name="" element={<HomeFrame />} />
            <Route path="/addPair" element={<AddPairFrame walletConnect={isWalletConnected}/>} />
            <Route path="/my" element={<MyFrame walletConnect={isWalletConnected}/>} />
            <Route path="/pair/:tokenAddress" element={<PairDetailFrame walletConnect={isWalletConnected}/>} />
            <Route path="/trade/:tokenAddress" element={<TradeFrame walletConnect={isWalletConnected}/>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const HomeFrame = (props) => {
  return (
    <>
      <Home />
    </>
  );
};

const AddPairFrame = (props) => {
  return (
    <>
      <AddPair walletConnect={props.walletConnect}/>
    </>
  );
};

const MyFrame = (props) => {
  return (
    <>
      <My walletConnect={props.walletConnect}/>
    </>
  );
};

const PairDetailFrame = (props) => {
  return (
    <>
      <PairDetail walletConnect={props.walletConnect}/>
    </>
  );
};

const TradeFrame = (props) => {
  return (
    <>
      <Trade walletConnect={props.walletConnect}/>
    </>
  );
};

export default App;