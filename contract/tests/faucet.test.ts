import fs from 'fs';
import ArLocal from 'arlocal';
import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import path from 'path';
import { addFunds, mineBlock } from '../utils/_helpers';
import {
  Warp,
  WarpFactory,
  LoggerFactory,
  Contract,
} from 'warp-contracts';

describe('Testing Faucet Module', () => {
  console.log = function() {};

  let arweave: Arweave;
  let arlocal: ArLocal;
  let warp: Warp;

  let walletJwk: JWKInterface;
  let walletAddress: string;
  let customWalletJwk: JWKInterface;
  let customWalletAddress: string;

  let contractSrc: string;
  let contractInit: Object;
  let contractTxId: string;

  let userContract: Contract;
  let customContract: Contract;

  let tarInit: Object;
  let tarTxId: string;

  let userTar: Contract;
  let customTar: Contract;
  

  beforeAll(async () => {
    arlocal = new ArLocal(1821);
    await arlocal.start();

    LoggerFactory.INST.logLevel('error');

    warp = WarpFactory.forLocal(1821);
    arweave = warp.arweave;
  });

  afterAll(async () => {
    await arlocal.stop();
  });

  async function Initialize() {
    walletJwk = await arweave.wallets.generate();
    await addFunds(arweave, walletJwk);
    walletAddress = await arweave.wallets.jwkToAddress(walletJwk);
    await mineBlocks(1);

    customWalletJwk = await arweave.wallets.generate();
    await addFunds(arweave, customWalletJwk);
    customWalletAddress = await arweave.wallets.jwkToAddress(customWalletJwk);
    await mineBlocks(1);

    // deploy TAR token
    const wrcSrc = fs.readFileSync(path.join(__dirname, '../pkg/erc20-contract_bg.wasm'));

    tarInit = {
      symbol: 'TAR',
      name: 'ThetAR exchange token',
      decimals: 2,
      totalSupply: 20000,
      balances: {
        [walletAddress]: 10000,
      },
      allowances: {},
      settings: null,
      owner: walletAddress,
      canEvolve: true,
      evolve: '',
    };

    const tarTxInfo = (await warp.createContract.deploy({
      wallet: walletJwk,
      initState: JSON.stringify(tarInit),
      src: wrcSrc,
      wasmSrcCodeDir: path.join(__dirname, '../src/wrc-20_fixed_supply'),
      wasmGlueCode: path.join(__dirname, '../pkg/erc20-contract.js'),
    }));
    tarTxId = tarTxInfo.contractTxId;

    userTar = warp.contract(tarTxId);
    userTar.setEvaluationOptions({
      internalWrites: true,
      allowUnsafeClient: true,
    }).connect(walletJwk);
    customTar = warp.contract(tarTxId);
    customTar.setEvaluationOptions({
      internalWrites: true,
      allowUnsafeClient: true,
    }).connect(customWalletJwk);
  
    await mineBlocks(1);

    // deploy faucet contract
    contractSrc = fs.readFileSync(path.join(__dirname, '../dist/faucet/contract.js'), 'utf8');
    const initFromFile = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../dist/faucet/initial-state.json'), 'utf8')
    );
    contractInit = {
      ...initFromFile,
      owner: walletAddress,
      tokenAddress: tarTxId,
    };

    contractTxId = (await warp.createContract.deploy({
      wallet: walletJwk,
      initState: JSON.stringify(contractInit),
      src: contractSrc,
    })).contractTxId;
    userContract = warp.contract(contractTxId);
    userContract.setEvaluationOptions({
      internalWrites: true,
      allowUnsafeClient: true,
    }).connect(walletJwk);
    customContract = warp.contract(contractTxId);
    customContract.setEvaluationOptions({
      internalWrites: true,
      allowUnsafeClient: true,
    }).connect(customWalletJwk);
    await mineBlocks(1);
  }

  async function mineBlocks(times: number) {
    for (var i = 0; i < times; i ++) {
      await mineBlock(arweave);
    }
  }

  it('test deploy contract', async () => {
    await Initialize();
    expect(contractTxId.length).toEqual(43);
    expect(tarTxId.length).toEqual(43);
    expect(await (await userContract.readState()).cachedValue.state).toEqual(contractInit);
    expect(await (await customContract.readState()).cachedValue.state).toEqual(contractInit);
    
    expect((await userTar.readState()).cachedValue.state).toEqual(tarInit);
    expect((await customTar.readState()).cachedValue.state).toEqual(tarInit);
  });

  it('test setPrice - ok', async () => {
    await Initialize();
    await userContract.writeInteraction(
      {
        function: 'setPrice',
        params: {
          price: 0.1
        }
      }
    );

    expect(await (await userContract.readState()).cachedValue.state['price']).toEqual(0.1);
  });

  it('test setPrice - denied', async () => {
    await Initialize();
    await customContract.writeInteraction(
      {
        function: 'setPrice',
        params: {
          price: 0.1
        }
      }
    );

    expect(await (await customContract.readState()).cachedValue.state['price']).toEqual(0.0001);
  });

  it('test getPrice', async () => {
    await Initialize();
    const ret = await userContract.viewState(
      {
        function: 'getPrice',
      }
    );

    expect(ret.result['price']).toEqual(0.0001);
  });

  it('test swap - ok', async () => {
    await Initialize();

    await userTar.writeInteraction(
      {
        function: 'approve',
        spender: contractTxId,
        amount: 1000
      }
    );
    expect((await userTar.viewState({
      function: 'allowance', 
      owner: walletAddress, 
      spender: contractTxId
    })).result['allowance']).toEqual(1000);

    await customContract.writeInteraction(
      {
        function: 'swap',
      },
      { transfer: {
          target: walletAddress,
          winstonQty: await arweave.ar.arToWinston("0.001"),
        }
      }
    );

    expect(await (await customTar.viewState({
      function: 'balanceOf', 
      target: customWalletAddress
    })).result['balance']).toEqual(10);

    expect(await (await (await userContract.readState()).cachedValue.state['poured'])).toEqual(10);

    expect((await userTar.viewState({
      function: 'allowance', 
      owner: walletAddress, 
      spender: contractTxId
    })).result['allowance']).toEqual(1000 - 10);

    expect(await (await customTar.viewState({
      function: 'balanceOf', 
      target: walletAddress
    })).result['balance']).toEqual(10000 - 10);
  });

  it('test swap - none pool', async () => {
    await Initialize();

    expect((await userTar.viewState({
      function: 'allowance', 
      owner: walletAddress, 
      spender: contractTxId
    })).result['allowance']).toEqual(0);

    await customContract.writeInteraction(
      {
        function: 'swap',
      },
      { transfer: {
          target: walletAddress,
          winstonQty: await arweave.ar.arToWinston("0.001"),
        }
      }
    );

    expect(await (await customTar.viewState({
      function: 'balanceOf', 
      target: customWalletAddress
    })).result['balance']).toEqual(0);

    expect(await (await (await userContract.readState()).cachedValue.state['poured'])).toEqual(0);

    expect(await (await customTar.viewState({
      function: 'balanceOf', 
      target: walletAddress
    })).result['balance']).toEqual(10000);
  });

  it('test swap - insuffient pool', async () => {
    await Initialize();

    await userTar.writeInteraction(
      {
        function: 'approve',
        spender: contractTxId,
        amount: 1000
      }
    );
    expect((await userTar.viewState({
      function: 'allowance', 
      owner: walletAddress, 
      spender: contractTxId
    })).result['allowance']).toEqual(1000);

    await customContract.writeInteraction(
      {
        function: 'swap',
      },
      { transfer: {
          target: walletAddress,
          winstonQty: await arweave.ar.arToWinston("1"), // wanna swap for 10,000 token
        }
      }
    );

    expect(await (await customTar.viewState({
      function: 'balanceOf', 
      target: customWalletAddress
    })).result['balance']).toEqual(1000);

    expect(await (await (await userContract.readState()).cachedValue.state['poured'])).toEqual(1000);

    expect((await userTar.viewState({
      function: 'allowance', 
      owner: walletAddress, 
      spender: contractTxId
    })).result['allowance']).toEqual(0);

    expect(await (await customTar.viewState({
      function: 'balanceOf', 
      target: walletAddress
    })).result['balance']).toEqual(10000 - 1000);
  });

  it('test swap - wrong target', async () => {
    await Initialize();

    await userTar.writeInteraction(
      {
        function: 'approve',
        spender: contractTxId,
        amount: 1000
      }
    );
    expect((await userTar.viewState({
      function: 'allowance', 
      owner: walletAddress, 
      spender: contractTxId
    })).result['allowance']).toEqual(1000);

    await customContract.writeInteraction(
      {
        function: 'swap',
      },
      { transfer: {
          target: customWalletAddress,
          winstonQty: await arweave.ar.arToWinston("0.0001"),
        }
      }
    );

    expect(await (await customTar.viewState({
      function: 'balanceOf', 
      target: customWalletAddress
    })).result['balance']).toEqual(0);

    expect(await (await (await userContract.readState()).cachedValue.state['poured'])).toEqual(0);

    expect((await userTar.viewState({
      function: 'allowance', 
      owner: walletAddress, 
      spender: contractTxId
    })).result['allowance']).toEqual(1000);

    expect(await (await customTar.viewState({
      function: 'balanceOf', 
      target: walletAddress
    })).result['balance']).toEqual(10000);
  });

});
