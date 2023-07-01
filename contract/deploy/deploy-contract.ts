import fs from 'fs';
import path from 'path';
import {
  WarpFactory,
  LoggerFactory,
} from 'warp-contracts';
import { ArweaveSigner, DeployPlugin } from 'warp-contracts-plugin-deploy';

const warp = WarpFactory.forMainnet().use(new DeployPlugin());
const arweave = warp.arweave;
LoggerFactory.INST.logLevel('error');

(async () => {
  console.log('running...');

  const walletJwk = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'key-file.json'), 'utf8')
  );
  const walletAddress = await arweave.wallets.jwkToAddress(walletJwk);
  const walletSigner = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'key-file.json'), 'utf8')
  );
  const tarTxId = 'ChpMKQ61-ng4Z16YrEI3HkFnezfJvCqgxGyhxH8z_DY';

  // deploy thetAR contract
  const contractSrc = fs.readFileSync(path.join(__dirname, '../dist/contract.js'), 'utf8');
  const initFromFile = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../dist/thetAR/initial-state.json'), 'utf8')
  );
  const contractInit = {
    ...initFromFile,
    owner: walletAddress,
    thetarTokenAddress: tarTxId,
  };

  const contractTxId = (await warp.deploy({
    wallet: new ArweaveSigner(walletSigner),
    initState: JSON.stringify(contractInit),
    src: contractSrc,
  })).contractTxId;

  console.log('wallet address: ', walletAddress);
  console.log('txid: ', contractTxId);
  fs.writeFileSync(path.join(__dirname, 'thetAR-txid.json'), contractTxId);
})();
