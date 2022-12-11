import {
  WarpFactory,
  LoggerFactory,
  sleep,
} from 'warp-contracts';
import { selectWeightedPstHolder } from 'smartweave';
import { mul, pow } from './math';
/* global BigInt */

LoggerFactory.INST.logLevel('error');

// addresses
const thetARContractAddress = 'mVGUTTi8CmSmh18j9SCw25fQvubuo6oIjZk_ePl7rYA';
const faucetContractAddress = 'KoSadsup0QEYhYr-HOsN8Ym5jYXIQ-hk69cZS9vsI8g';
const ownerWalletAdrress = 'TfflPZkVLnjXcX65y4oNwt-SdWbXqVdkSiMBZ6Dso3k';
export const tarAddress = "Bd_duw2qkRlgv8sztOAnG4qaoUBSR4ybIc0tbHudWCY";
export const tarSymbol = "TAR";
export const tarDecimals = 5;

const warp = WarpFactory.forLocal(1984);
// const warp = WarpFactory.forTestnet();
// const warp = WarpFactory.forMainnet();
const arweave = warp.arweave;
let walletAddress = undefined;
export let isConnectWallet = false;

let thetARContract = undefined;
let faucetContract = undefined;
let tarContract = undefined;

export async function connectWallet(walletJwk) {
  thetARContract.connect(walletJwk);
  faucetContract.connect(walletJwk);
  tarContract.connect(walletJwk);
  isConnectWallet = true;
  walletAddress = await arweave.wallets.jwkToAddress(walletJwk);
}

export async function connectContract() {
  thetARContract = warp.contract(thetARContractAddress);
  thetARContract.setEvaluationOptions({
    internalWrites: true,
    allowUnsafeClient: true,
    // updateCacheForEachInteraction: true,
  });

  faucetContract = warp.contract(faucetContractAddress);
  faucetContract.setEvaluationOptions({
    internalWrites: true,
    allowUnsafeClient: true,
    // updateCacheForEachInteraction: true,
  });

  tarContract = warp.contract(tarAddress);
  tarContract.setEvaluationOptions({
    internalWrites: true,
    allowUnsafeClient: true,
    // updateCacheForEachInteraction: true,
  });

  return {status: true, result: 'Connect contract success!'};
}

export function getWalletAddress() {
  return walletAddress;
}

export function arLessThan(a, b) {
  return arweave.ar.isLessThan(arweave.ar.arToWinston(a), arweave.ar.arToWinston(b));
}

export function checkAmountValidation(text) {
  if (text === '') return true;
  return /^[0-9\.]{1,21}$/.test(text);
}

// function used by thetAR contract

export async function addPair(tokenAddress, description) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  if (!isWellFormattedAddress(tokenAddress, description)) {
    return {status: false, result: 'Pst address not valid!'};
  }

  let result = "";
  let status = true;
  try {
    await thetARContract.writeInteraction(
      {
        function: 'addPair',
        params: {
          tokenAddress: tokenAddress,
          logo: 'INVALID_00lQgApM_a3Z6bGFHYE7SXnBI6C5_2_24MQ',
          description: description
        }
      },
      {
        transfer: {
          target: ownerWalletAdrress,
          winstonQty: await arweave.ar.arToWinston("10"),
        },
        disableBundling: true
      }
    );
    result = 'Add pair succeed!'
  } catch (error) {
    status = false;
    result = error.message;
  }

  return {status: status, result: result};
}

export async function getBalance(tokenAddress) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  if (!isWellFormattedAddress(tokenAddress) && tokenAddress !== 'ar') {
    return {status: false, result: 'Pst address not valid!'};
  }

  let result = "";
  let status = true;
  try {
    if (tokenAddress === 'ar') {
      result = arweave.ar.winstonToAr(await arweave.wallets.getBalance(getWalletAddress()));
    } else {
      result = await (await warp.contract(tokenAddress).viewState({
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

export async function createOrder(direction, quantity, price, pairId) {
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
  if (!Number.isInteger(pairId) || pairId < 0) {
    return {status: false, result: 'PairId must be non-negative integer!'};
  }

  let result = "";
  let status = true;
  try {
    const pairInfo = (await thetARContract.dryWrite({
      function: 'pairInfo',
      params: {
        pairId: pairId
      }
    })).result;
    
    let token;
    if (direction === 'buy') {
      token = tarContract;
    } else {
      token = warp.contract(pairInfo['tokenAddress']);
      token.connect('use_wallet');
    }

    const transferTx = (await token.writeInteraction({
      function: 'approve',
      spender: thetARContractAddress,
      amount: quantity
    })).originalTxId;
    
    await thetARContract.writeInteraction({
      function: 'createOrder',
      params: {
        pairId: pairId,
        direction: direction,
        price: price
      }
    });
    
    result = 'Create order success!';
  } catch (error) {
    status = false;
    result = error.message;
  }

  return {status: status, result: result};
}

export async function txStatus(tx) {
  return (await arweave.transactions.getStatus(tx)).status;
}

export async function pairInfo(pairId) {
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  let result = "";
  let status = true;
  try {
    result = (await thetARContract.dryWrite({
      function: "pairInfo",
      params: {
        pairId: pairId
      }
    })).result;
  } catch (error) {
    status = false;
    result = error.message;
  }

  return {status: status, result: result};
}

export async function cancelOrder(pairId, orderId) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }
  if (!Number.isInteger(pairId) || pairId < 0) {
    return {status: false, result: 'PairId must be non-negative integer!'};
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
        pairId: pairId,
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

export async function pairInfos() {
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  let result = "";
  let status = true;
  try {
    result = (await thetARContract.dryWrite({
      function: "pairInfos",
    })).result;
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
    result = (await thetARContract.dryWrite({
      function: "orderInfos",
    })).result;
  } catch (error) {
    status = false;
    result = error.message;
  }

  return {status: status, result: result};
}

export async function orderInfo(pairId) {
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }
  if (!Number.isInteger(pairId) || pairId < 0) {
    return {status: false, result: 'PairId must be non-negative integer!'};
  }

  let result = "";
  let status = true;
  try {
    result = (await thetARContract.viewState({
      function: "orderInfo",
      params: {
        pairId: pairId
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
    result = (await thetARContract.dryWrite({
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

  let tx = await arweave.createTransaction(
    { data: imgStream }, 
    'use_wallet'
  );
  tx.addTag('Content-Type', imgType);

  await arweave.transactions.sign(tx, 'use_wallet');

  let uploader = await arweave.transactions.getUploader(tx);
  while (!uploader.isComplete) {
    await uploader.uploadChunk();
    console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
  }
}

export async function downloadImage(transaction) {
  let raw = await arweave.transactions.getData(transaction, {decode: true});
  let imgType = 'image/jpeg';
  (await arweave.transactions.get(transaction)).get('tags').forEach(tag => {
    let key = tag.get('name', {decode: true, string: true});
    if (key === 'Content-Type') {
      imgType = tag.get('value', {decode: true, string: true});
    }
  });
  let blob = new Blob([raw], { type: imgType });
  raw  = null;
  const url = URL.createObjectURL(blob);
  return url;
}

export async function readState() {
  console.log('contract state: ', (await thetARContract.readState()));
}

export const isWellFormattedAddress = (input) => {
  const re = /^[a-zA-Z0-9_-]{43}$/;
  return re.test(input);
}

export const calculatePriceWithDecimals = (price, tradePrecision) => {
  return mul(price, pow(10, tradePrecision-tarDecimals));
}

// function used by faucet contract

export const swap = async (ar) => {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!faucetContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  let status = true;
  let result;
  try {
    await faucetContract.writeInteraction(
      {
        function: 'swap',
      },
      { 
        transfer: {
          target: ownerWalletAdrress,
          winstonQty: await arweave.ar.arToWinston(ar),
        },
        disableBundling: true
      },
    );
    result = 'Claim succeed. Please wait for block mined by Arweave network. This process will take several minutes.';
  } catch (err) {
    status = false;
    result = err;
  }
  return {status: true, result: result};
}

export const getPrice = async () => {
  if (!faucetContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  const ret = (await faucetContract.viewState({
    function: 'getPrice',
  })).result['price'];
  return {status: true, result: ret};
}

export const getPoured = async () => {
  if (!faucetContract) {
    return {status: false, result: 'Please connect contract first!'};
  }
  
  const ret = (await faucetContract.viewState({
    function: 'getPoured',
  })).result['amount'];
  
  return {status: true, result: ret};
}

export const getAllowance = async () => {
  const allowance = (await tarContract.viewState({
    function: 'allowance', 
    owner: ownerWalletAdrress, 
    spender: faucetContractAddress
  })).result['allowance'];

  return {status: true, result: allowance};
}