import {
  WarpFactory,
  LoggerFactory,
} from 'warp-contracts/web';
import { selectWeightedPstHolder } from 'smartweave';
import { mul, pow } from './math';
import { intelliContract } from './intelliContract';
import { arweaveWrapper } from './arweaveWrapper';

LoggerFactory.INST.logLevel('error');
const env = 'mainnet';

// addresses
const thetARContractAddress = 'VcqN2E27rB6aa_ZDSfbNxf8X4amiEzA3RnN8Es1XFEQ';
export const tarAddress = "ChpMKQ61-ng4Z16YrEI3HkFnezfJvCqgxGyhxH8z_DY";
export const tarSymbol = "TAR";
export const tarDecimals = 5;

let warp = WarpFactory.forLocal(1984);
if (env === 'mainnet') {
  warp = WarpFactory.forMainnet();
}

const arWrapper = new arweaveWrapper(warp.arweave);

let walletAddress = undefined;
let isConnectWallet = false;

let thetARContract = undefined;
let tarContract = undefined;

export async function connectWallet(walletJwk) {
  thetARContract.connectWallet(walletJwk);
  tarContract.connectWallet(walletJwk);
  isConnectWallet = true;
  walletAddress = await arWrapper.arweave.wallets.jwkToAddress(walletJwk);
}

export async function connectContract() {
  thetARContract = new intelliContract(warp);
  thetARContract.connectContract(thetARContractAddress);

  tarContract = new intelliContract(warp);
  tarContract.connectContract(tarAddress);

  return {status: true, result: 'Connect contract success!'};
}

// function used by thetAR-Token contract

export async function addPair(tokenAddress) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }
  if (!isWellFormattedAddress(tokenAddress)) {
    return {status: false, result: 'Token address not valid!'};
  }

  const txRet = await arWrapper.arweave.transactions.getStatus(tokenAddress);
  if (txRet.status !== 200) {
    return {status: false, result: 'please check address or wait for the block to be mined!'};
  }
  const confirmations = txRet.confirmed.number_of_confirmations;
  if (confirmations < 10) {
    return {status: false, result: `Please wait for network confirmation: ${confirmations} / 10`};
  }

  let result = "";
  let status = true;
  try {
    await tarContract.writeInteraction({
      function: 'approve',
      spender: thetARContractAddress,
      amount: 1e8
    });
    await thetARContract.writeInteraction(
      {
        function: 'addPair',
        params: {
          tokenAddress: tokenAddress
        }
      }
    );
    result = 'Add Token succeed!';
  } catch (error) {
    status = false;
    result = error.message;
  }

  return {status: status, result: result};
}

export async function createOrder(direction, quantity, price, tokenAddress) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }
  if (direction !== 'sell' && direction !== 'buy') {
    return {status: false, result: 'Direction must either be BUY or SELL!'};
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return {status: false, result: 'Quantity must be positive integer!'};
  }
  if (price !== undefined && (!Number.isInteger(price) || price <= 0)) {
    return {status: false, result: 'Price must either be positive integer or undefined!'};
  }
  if (!isWellFormattedAddress(tokenAddress)) {
    return {status: false, result: 'Token address format error!'};
  }

  let result = "";
  let status = true;
  try {
    let token;
    if (direction === 'buy') {
      token = tarContract;
    } else {
      token = warp.contract(tokenAddress);
      token.connect('use_wallet');
    }

    await token.writeInteraction({
      function: 'approve',
      spender: thetARContractAddress,
      amount: quantity
    });

    // order Fee in $TAR
    if (direction === 'buy') {
      await token.writeInteraction({
        function: 'approve',
        spender: thetARContractAddress,
        amount: quantity+1e5
      });
    } else {
      await tarContract.writeInteraction({
        function: 'approve',
        spender: thetARContractAddress,
        amount: 1e5
      });
    }
    
    await thetARContract.writeInteraction({
      function: 'createOrder',
      params: {
        tokenAddress: tokenAddress,
        direction: direction,
        price: price
      }
    });
    
    result = 'Create order succeed!';
  } catch (error) {
    status = false;
    result = error.message;
  }

  // distribute fee to pst holder
  try {
    const balances = (await tarContract.readState())
        .cachedValue.state['balances'];
    delete balances[thetARContractAddress];
    const transaction = await arWrapper.arweave.createTransaction({
      target: selectWeightedPstHolder(balances),
      quantity: arWrapper.arweave.ar.arToWinston('0.01')
    }, 'use_wallet');
    console.log(transaction);
    await arWrapper.arweave.transactions.sign(transaction, 'use_wallet');
    await arWrapper.arweave.transactions.post(transaction);
  } catch {}

  return {status: status, result: result};
}

export async function cancelOrder(tokenAddress, orderId) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }
  if (!isWellFormattedAddress(tokenAddress)) {
    return {status: false, result: 'Token address format error!'};
  }
  if (!isWellFormattedAddress(orderId)) {
    return {status: false, result: 'orderId not valid!'};
  }

  let result = "";
  let status = true;
  try {
    const txId = await thetARContract.writeInteraction({
      function: 'cancelOrder',
      params: {
        tokenAddress: tokenAddress,
        orderId: orderId
      }
    });
    result = 'Order cancelled successfully!';
  } catch (error) {
    status = false;
    result = error.message;
  }

  return {status: status, result: result};
}

export async function orderInfos() {
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  let result = "";
  let status = true;
  try {
    result = (await thetARContract.viewState({
      function: "orderInfos",
    })).result;
  } catch (error) {
    status = false;
    result = error.message;
  }

  return {status: status, result: result};
}

export async function pairInfos() {
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  let result = "";
  let status = true;
  try {
    result = (await thetARContract.viewState({
      function: "pairInfos",
    })).result;
  } catch (error) {
    status = false;
    result = error.message;
  }

  return {status: status, result: result};
}

export async function orderInfo(tokenAddress) {
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }
  if (!isWellFormattedAddress(tokenAddress)) {
    return {status: false, result: 'Token address format error!'};
  }

  let result = "";
  let status = true;
  try {
    result = (await thetARContract.viewState({
      function: "orderInfo",
      params: {
        tokenAddress: tokenAddress
      }
    })).result;
    console.log('orderInfo', result);
  } catch (error) {
    status = false;
    result = error.message;
  }

  return {status: status, result: result};
}

export async function userOrder(address) {
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }
  if (!isWellFormattedAddress(address)) {
    return {status: false, result: 'Wallet address format error!'};
  }

  let result = "";
  let status = true;
  try {
    result = (await thetARContract.viewState({
      function: "userOrder",
      params: {
        address: address
      }
    })).result;
  } catch (error) {
    status = false;
    result = error.message;
  }

  return {status: status, result: result};
}

export async function uploadImage(imgFile) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  const imgStream = await (await fetch(URL.createObjectURL(imgFile))).arrayBuffer();
  const imgType = imgFile.type;

  let tx = await arWrapper.arweave.createTransaction(
    { data: imgStream }, 
    'use_wallet'
  );
  tx.addTag('Content-Type', imgType);

  await arWrapper.arweave.transactions.sign(tx, 'use_wallet');

  let uploader = await arWrapper.arweave.transactions.getUploader(tx);
  while (!uploader.isComplete) {
    await uploader.uploadChunk();
    console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
  }
}

export async function downloadImage(transaction) {
  let raw = await arWrapper.getData(transaction);
  let imgType = (await arWrapper.getTags(transaction))['Content-Type'];
  let blob = new Blob([raw], { type: imgType });
  raw  = null;
  const url = URL.createObjectURL(blob);
  return url;
}

export const isWellFormattedAddress = (input) => {
  const re = /^[a-zA-Z0-9_-]{43}$/;
  return re.test(input);
}

export const calculatePriceWithDecimals = (price, tradePrecision) => {
  if (price === 0) {
    return 0;
  }
  return Number(mul(price, pow(10, tradePrecision-tarDecimals)).toFixed(tarDecimals));
}

export async function getPriceByBlockHeight(tokenAddress, blockHeight) {
  let result = 0;
  try {
    result = (await thetARContract.readState(blockHeight)).cachedValue.state.orderInfos[tokenAddress].currentPrice;
  } catch {}
  
  return result;
}

// common api

async function minARBalanceCheck(threshInAR) {
  const arBalanceRet = await getBalance('ar');
  if (arBalanceRet.status && arLessThan(arBalanceRet.result, threshInAR)) {
    return false;
  }
  return true;
}

export async function txStatus(tx) {
  return (await arWrapper.arweave.transactions.getStatus(tx)).status;
}

export function arLessThan(a, b) {
  return arWrapper.arweave.ar.isLessThan(arWrapper.arweave.ar.arToWinston(a), arWrapper.arweave.ar.arToWinston(b));
}

export function checkAmountValidation(text) {
  if (text === '') return true;
  return /^[0-9\.]{1,21}$/.test(text);
}

export async function getBlockHeight(relativeDays) {
  const height = (await arWrapper.arweave.blocks.getCurrent()).height;
  return parseInt(height - relativeDays * 24 * 60 / 2);
}

export const genRaise = (number, showPct) => {
  const isPositive = number > 0;
  const isNegative = number < 0;
  return (
    <span style={{ paddingLeft: 5, color: isNegative ? 'red' : 'green' }}>
      <span>{isPositive ? '+' : null}</span>
      <span>{number > 1e6 ? '>1000000' : number}{showPct ? '%' : ''}</span>
    </span>
  );
}

export const getTxFromWarpGW = async (contractAddress) => {
  try {
    const resp = await fetch(`https://gateway.warp.cc/gateway/contract?txId=${contractAddress}`);
    const respJson = await resp.json();
    console.log('debug: tx', respJson);
    return respJson;
  } catch (err) {
    console.error(err);
  }
};

export const getTx = async (contractAddress) => {
  return await arWrapper.getTx(contractAddress);
};

export const getDateByTx = async (txId) => {
  const txRet = await arWrapper.arweave.transactions.getStatus(txId);
  if (txRet.status !== 200) {
    return {status: false, result: 'Cannot find specific TxID on Arweave Network!'};
  }
  const blockHeight = txRet.confirmed.block_height;
  var elapsed = (await arWrapper.arweave.blocks.getCurrent()).height - blockHeight;
  const date = new Date();
  date.setMinutes(date.getMinutes() - elapsed * 2);
  return {status: true, result: date.toLocaleDateString()};
};

export const getData = async (contractAddress) => {
  return await arWrapper.getData(contractAddress);
};

export const blockHeight2DateTime = async (blockHeight) => {
  // undefined
};

export async function getBalance(tokenAddress) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  if (!isWellFormattedAddress(tokenAddress) && tokenAddress !== 'ar') {
    return {status: false, result: 'Token address not valid!'};
  }

  let result = "";
  let status = true;
  try {
    if (tokenAddress === 'ar') {
      result = arWrapper.arweave.ar.winstonToAr(await arWrapper.arweave.wallets.getBalance(getWalletAddress()));
    } else {
      const tokenContract = new intelliContract(warp);
      tokenContract.connectContract(tokenAddress);
      result = await (await tokenContract.viewState({
        function: 'balanceOf',
        target: getWalletAddress(),
      })).result.balance;
    }
  } catch (error) {
    status = false;
    result = error.message;
  }

  return {status: status, result: result};
}

export function getWalletAddress() {
  return walletAddress;
}

export async function getTags(txId) {
  return await arWrapper.getTags(txId);
}

export async function getState(txID) {
  const contract = new intelliContract(warp);
  contract.connectContract(txID);

  let status = true;
  let result = '';
  try {
    result = (await contract.readState()).cachedValue.state;
  } catch (err) {
    status = false;
    result = err;
  }

  return {status, result};
}

export async function asyncCall(callback, args) {
  const promises = [];
  for (const arg of args) {
    promises.push(callback(arg));
  }
  return await Promise.all(promises);
}