import fs from 'fs';
import path from 'path';
import { addFunds, mineBlock } from '../utils/_helpers';
import {
  WarpFactory,
  LoggerFactory,
} from 'warp-contracts';

const warp = WarpFactory.forLocal(1984);
const arweave = warp.arweave;
LoggerFactory.INST.logLevel('error');

(async () => {
  console.log('running...');

  const walletJwk = await arweave.wallets.generate();
  await addFunds(arweave, walletJwk);
  const walletAddress = await arweave.wallets.jwkToAddress(walletJwk);
  
  // deploy TAR pst
  const wrcSrc = fs.readFileSync(path.join(__dirname, '../pkg/erc20-contract_bg.wasm'));

  const tarInit = {
    symbol: 'TAR',
    name: 'ThetAR exchange pst',
    decimals: 5,
    totalSupply: 2200000000000,
    balances: {
      [walletAddress]: 2200000000000,
    },
    allowances: {},
    owner: walletAddress
  };

  const tarTxId = (await warp.createContract.deploy({
    wallet: walletJwk,
    initState: JSON.stringify(tarInit),
    src: wrcSrc,
    wasmSrcCodeDir: path.join(__dirname, '../src/wrc-20_fixed_supply'),
    wasmGlueCode: path.join(__dirname, '../pkg/erc20-contract.js'),
  })).contractTxId;

  // deploy test pst
  let initialState = {
    symbol: 'TEST',
    name: 'TEST token',
    decimals: 2,
    totalSupply: 1000000,
    balances: {
      [walletAddress]: 1000000,
    },
    allowances: {},
    owner: walletAddress
  };

  const testTokenTxInfo = (await warp.createContract.deploy({
    wallet: walletJwk,
    initState: JSON.stringify(initialState),
    src: wrcSrc,
    wasmSrcCodeDir: path.join(__dirname, '../src/wrc-20_fixed_supply'),
    wasmGlueCode: path.join(__dirname, '../pkg/erc20-contract.js'),
  }));

  // deploy thetAR contract
  const contractSrc = fs.readFileSync(path.join(__dirname, '../dist/thetAR/contract.js'), 'utf8');
  const initFromFile = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../dist/thetAR/initial-state.json'), 'utf8')
  );
  const contractInit = {
    ...initFromFile,
    owner: walletAddress,
    tokenSrcTxs: [testTokenTxInfo.srcTxId],
    thetarTokenAddress: tarTxId,
  };

  const contractTxId = (await warp.createContract.deploy({
    wallet: walletJwk,
    initState: JSON.stringify(contractInit),
    src: contractSrc,
  })).contractTxId;
  const contract = warp.contract(contractTxId);
  contract.setEvaluationOptions({
    internalWrites: true,
    allowUnsafeClient: true,
  }).connect(walletJwk);

  // deploy faucet contract
  const faucetSrc = fs.readFileSync(path.join(__dirname, '../dist/faucet/contract.js'), 'utf8');
  const faucetInitFromFile = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../dist/faucet/initial-state.json'), 'utf8')
  );
  const faucetContractInit = {
    ...faucetInitFromFile,
    owner: walletAddress,
    tokenAddress: tarTxId,
    price: 0.0000002
  };
  const faucetContractTxId = (await warp.createContract.deploy({
    wallet: walletJwk,
    initState: JSON.stringify(faucetContractInit),
    src: faucetSrc,
  })).contractTxId;

  // add funds to faucet
  const tarContract = warp.contract(tarTxId);
  tarContract.connect(walletJwk);
  await tarContract.writeInteraction(
    {
      function: 'approve',
      spender: faucetContractTxId,
      amount: 1500000000000
    }
  );

  // pressure tests
  const tokenNum = 10;
  const txNum = 100;
  for (let i1 = 0; i1 < tokenNum; i1++) {
    const tokenAddr = (await warp.createContract.deployFromSourceTx({
      srcTxId: testTokenTxInfo.srcTxId,
      wallet: walletJwk,
      initState: JSON.stringify(initialState),
    })).contractTxId;
  
    await contract.writeInteraction(
      {
        function: 'addPair',
        params: {
          tokenAddress: tokenAddr,
          logo: 'TEST_00000lQgApM_a3Z6bGFHYE7SXnBI6C5_2_24MQ',
          description: 'test token '+i1.toString()
        }
      }
    );
    for (let _ = 0; _ < 10; _++) {
      await mineBlock(arweave);
    }

    for (let i2 = 0; i2 < txNum; i2++) {
      process.stdout.write('pairs: ' + i1 + ' / ' + tokenNum +
          '; buy: ' + i2 + ' / ' + txNum + '          \r'
      );
      await tarContract.writeInteraction({
        function: 'approve',
        spender: contractTxId,
        amount: 1
      });
      await contract.writeInteraction({
        function: 'createOrder',
        params: {
          pairId: i1,
          direction: 'buy',
          price: 1
        }
      });
    }

    const testTokenContract = warp.contract(tokenAddr);
    testTokenContract.connect(walletJwk);
    for (let i3 = 0; i3 < txNum+5; i3++) {
      process.stdout.write('pairs: ' + i1 + ' / ' + tokenNum +
          '; sell: ' + i3 + ' / ' + (txNum+5).toString() + '          \r'
      );
      await testTokenContract.writeInteraction(
        {
          function: 'approve',
          spender: contractTxId,
          amount: 1
        }
      );
      await contract.writeInteraction({
        function: 'createOrder',
        params: {
          pairId: i1,
          direction: 'sell',
          price: 1
        }
      });
    }
  }
  
  console.log('wallet address: ', walletAddress);
  console.log('thetar txid: ', contractTxId);
  console.log('TAR txid: ', tarTxId);
  console.log('faucet txid: ', faucetContractTxId);
})();
