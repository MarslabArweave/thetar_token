import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { 
  connectContract, 
  connectWallet,
} from './lib/api';
import 'rsuite/dist/rsuite.css';
import './App.css';
import { Home } from './components/Home';
import { AddPair } from './components/AddPair';
import { My } from './components/My';
import { PairDetail } from './components/PairDetail';
import { sleep } from 'warp-contracts';
import { Faucet } from './components/Faucet';
import { About } from './components/About';

const App = () => {
  const [isContractConnected, setIsContractConnected] = React.useState(false);
  const [isWalletConnected, setIsWalletConnected] = React.useState(false);

  React.useEffect(async ()=>{
    await connectContract();
    await sleep(3000);
    setIsContractConnected(true);
    alert('*Note*: It is currently a beta version, and any tokens in the exchange are test tokens and have no value. \
When the mainnet is launched, all listed tokens will be cleared.');
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
            <Route path="/faucet" element={<FaucetFrame walletConnect={isWalletConnected}/>} />
            <Route path="/about" element={<AboutFrame />} />
            <Route path="/my" element={<MyFrame walletConnect={isWalletConnected}/>} />
            <Route path="/pair/:pairId" element={<PairDetailFrame walletConnect={isWalletConnected}/>} />
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

const FaucetFrame = (props) => {
  return (
    <>
      <Faucet walletConnect={props.walletConnect}/>
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

const AboutFrame = () => {
  return (
    <>
      <About />
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

export default App;