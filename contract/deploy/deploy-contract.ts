import fs from 'fs';
import path from 'path';
import {
  WarpFactory,
  LoggerFactory,
} from 'warp-contracts';

const warp = WarpFactory.forMainnet();
const arweave = warp.arweave;
LoggerFactory.INST.logLevel('error');

(async () => {
  console.log('running...');
  const SrcTxId = 'jxB_n6cJo4s-a66oMIGACUjERJXQfc3IoIMV3_QK-1w';

  const walletJwk = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'key-file.json'), 'utf8')
  );
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
    owner: walletAddress,
  };

  const tarTxId = (await warp.createContract.deploy({
    wallet: walletJwk,
    initState: JSON.stringify(tarInit),
    src: wrcSrc,
    wasmSrcCodeDir: path.join(__dirname, '../src/wrc-20_fixed_supply'),
    wasmGlueCode: path.join(__dirname, '../pkg/erc20-contract.js'),
  }, true)).contractTxId;

  // deploy thetAR contract
  const contractSrc = fs.readFileSync(path.join(__dirname, '../dist/thetAR/contract.js'), 'utf8');
  const initFromFile = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../dist/thetAR/initial-state.json'), 'utf8')
  );
  const contractInit = {
    ...initFromFile,
    owner: walletAddress,
    tokenSrcTxs: [SrcTxId],
    thetarTokenAddress: tarTxId,
  };

  const contractTxId = (await warp.createContract.deploy({
    wallet: walletJwk,
    initState: JSON.stringify(contractInit),
    src: contractSrc,
  })).contractTxId;

  console.log('wallet address: ', walletAddress);
  console.log('txid: ', contractTxId);
  console.log('TAR txid: ', tarTxId);
  fs.writeFileSync(path.join(__dirname, 'thetAR-txid.json'), contractTxId);
  fs.writeFileSync(path.join(__dirname, 'tar-txid.json'), tarTxId);
})();
