import fs from 'fs';
import path from 'path';
import { addFunds } from '../utils/_helpers';
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
  
  const testTokenTxId = testTokenTxInfo.contractTxId;

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

  console.log('new test token: ', (await warp.createContract.deployFromSourceTx({
    srcTxId: testTokenTxInfo.srcTxId,
    wallet: walletJwk,
    initState: JSON.stringify(initialState),
  })).contractTxId);

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

  await contract.writeInteraction(
    {
      function: 'addPair',
      params: {
        tokenAddress: testTokenTxId,
        logo: 'TEST_00000lQgApM_a3Z6bGFHYE7SXnBI6C5_2_24MQ',
        description: 'test token'
      }
    }
  );
  
  console.log('wallet address: ', walletAddress);
  console.log('thetar txid: ', contractTxId);
  console.log('TAR txid: ', tarTxId);
  console.log('test token txid: ', testTokenTxId);
  fs.writeFileSync(path.join(__dirname, 'key-file-for-test.json'), JSON.stringify(walletJwk));
  fs.writeFileSync(path.join(__dirname, 'thetAR-txid-for-test.json'), contractTxId);
  fs.writeFileSync(path.join(__dirname, 'test-txid-for-test.json'), testTokenTxId);
  fs.writeFileSync(path.join(__dirname, 'tar-txid-for-test.json'), tarTxId);
})();
