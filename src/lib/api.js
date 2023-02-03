import {
  WarpFactory,
  LoggerFactory,
} from 'warp-contracts';
import { selectWeightedPstHolder } from 'smartweave';
import { mul, pow } from './math';
import { intelliContract } from './intelliContract';
import { stat } from 'fs';

LoggerFactory.INST.logLevel('error');

// addresses
const thetARContractAddress = 'rm4Hf6ZY4j2NitVJk9RigZ1JQTB3W5GMdLz6LdrYdYE';
const faucetContractAddress = 'SMDLkXtVvE5y1ZP0e_fPR2EMKDGp-hqh9s8FS8VF_yo';
const ownerWalletAdrress = '4a9db2YjUGi0K1WfzxjGofkiE94Eo9pAaGwdyXGlr88';
export const tarAddress = "bTEz-5QpqiDKVKYtIB1226rKlcshZIQ9L5KnW91qVg8";
export const tarSymbol = "TAR";
export const tarDecimals = 5;

const warp = WarpFactory.forLocal(1984);
// const warp = WarpFactory.forTestnet();
// const warp = WarpFactory.forMainnet({
//   dbLocation: './cache/warp'+(new Date().getTime()).toString(), 
//   inMemory: false
// });
const arweave = warp.arweave;
let walletAddress = undefined;
export let isConnectWallet = false;

let thetARContract = undefined;
let faucetContract = undefined;
let tarContract = undefined;

export async function connectWallet(walletJwk) {
  thetARContract.connectWallet(walletJwk);
  faucetContract.connectWallet(walletJwk);
  tarContract.connectWallet(walletJwk);
  isConnectWallet = true;
  walletAddress = await arweave.wallets.jwkToAddress(walletJwk);
}

export async function connectContract() {
  thetARContract = new intelliContract(warp);
  thetARContract.connectContract(thetARContractAddress);

  faucetContract = new intelliContract(warp);
  faucetContract.connectContract(faucetContractAddress);

  tarContract = new intelliContract(warp);
  tarContract.connectContract(tarAddress);

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
  if (description.length > 128) {
    return {status: false, result: 'Description length should less than 128!'};
  }
  if (!isWellFormattedAddress(tokenAddress)) {
    return {status: false, result: 'Token address not valid!'};
  }
  const arBalanceRet = await getBalance('ar');
  if (arBalanceRet.status && arLessThan(arBalanceRet.result, '10')) {
    return {status: false, result: 'You should have at least 10$AR in wallet to pay for fee!'};
  }

  const txRet = await arweave.transactions.getStatus(tokenAddress);
  if (txRet.status !== 200) {
    return {status: false, result: 'Cannot find token address on Arweave Network, \
        please check token address or wait for the block to be mined!'};
  }
  const confirmations = txRet.confirmed.number_of_confirmations;
  if (confirmations < 10) {
    return {status: false, result: `Please wait for network confirmation: ${confirmations} / 10`};
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
    result = 'Add pair succeed! Please wait for block to be mined!';
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

    const transferTx = (await token.writeInteraction({
      function: 'approve',
      spender: thetARContractAddress,
      amount: quantity
    })).originalTxId;
    
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
    console.log('balances: ', balances);
    const transaction = await arweave.createTransaction({
      target: selectWeightedPstHolder(balances),
      quantity: arweave.ar.arToWinston('0.01')
    }, 'use_wallet');
    await arweave.transactions.sign(transaction, 'use_wallet');
    await arweave.transactions.post(transaction);
  } catch {}

  return {status: status, result: result};
}

export async function txStatus(tx) {
  return (await arweave.transactions.getStatus(tx)).status;
}

export async function pairInfo(tokenAddress) {
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  let result = "";
  let status = true;
  try {
    result = (await thetARContract.viewState({
      function: "pairInfo",
      params: {
        tokenAddress: tokenAddress
      }
    })).result;
  } catch (error) {
    status = false;
    result = error.message;
  }

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

export async function getPriceByBlockHeight(tokenAddress, blockHeight) {
  let result = 0;
  try {
    const price = (await thetARContract.readState(blockHeight)).cachedValue.state.orderInfos[tokenAddress].currentPrice;
    if (price) {
      result = price;
    }
  } catch {}
  
  return result;
}

export async function getBlockHeight(relativeDays) {
  const height = (await arweave.blocks.getCurrent()).height;
  return parseInt(height - relativeDays * 24 * 60 / 2);
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
  return Number(mul(price, pow(10, tradePrecision-tarDecimals)).toFixed(tarDecimals));
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

export const getContractTxInfo = async (contractAddress) => {
  const tx = await arweave.transactions.get(contractAddress);
  return {status: true, result: tx};
};

export const getContractData = async (contractAddress) => {
  const data = await arweave.transactions.getData(contractAddress, {decode: true, string: true});
  return {status: true, result: data};
};

export const blockHeight2DateTime = async (blockHeight) => {
  // undefined
};

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
    const tx = await faucetContract.writeInteraction(
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
    console.log('faucet swap: ', tx);
    result = 'Succeed. Please wait for block to be mined.';
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