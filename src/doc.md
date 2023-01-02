### What is ThetAR exchange?

ThetAR exchange is a fully decentralized exchange application hosted on Arweave blockchain developed by mARsLab.

Not only the smart contract code, but all front-end code and icons are permanently stored on Arweave blockchain.

ThetAR exchange is built on top of Warp contract protocol, which ensures the real-time of token trade.

As long as your token follows the [WRC-20](https://github.com/warp-contracts/wrc) specification, it can be [added to exchange](#/addPair). Token security is vetted by the contract code.

### What is $TAR token?

\$TAR token is the profit sharing token of ThetAR exchange. Anyone who holds the $TAR token(s) can obtain the transaction fee of the exchange according to the token holding ratio.

The total amount of $TAR is 22M, with an accuracy of 0.00001.

Among them: 

- 15M will be sold in three stages on the [faucet tab](#/faucet) when the mainnet launches:

  - 4M with price of 0.01$AR

  - 5M with price of 0.02$AR

  - 6M with price of 0.03$AR

- 3M will be distributed to developers of the Arweave ecosystem when the mainnet launches.

- 4M will be stored in the team wallet, which is used for airdrop and developer incentives.

### About transaction fee

For every order you create on the exchange (when you click the `Create Order` button), we charge a fixed 0.01 $AR token as a transaction fee. Transaction fees will be distributed to $TAR token holders in accordance with standard Arweave community profit sharing rules.

### About pair adding fee

In order to avoid flooding attacks, there is a fee for adding pairs.

### About order price

When your order is a market order, you cannot specify trade price. The smart contract will automatically match the best price for you to trade according to the counterparty's order in the current market. When creating a market order, you need to pay special attention to:

1. If the order book of the current trading pair is empty, you cannot create a market order.

2. If the total quantity of your order exceeds the total quantity of the counterparty in the current market, the excess tokens will be returned to your wallet when you place the order. You do not need to worry about token loss.

3. When the market fluctuates violently, there will be higher slippage, please trade with caution.

When your order is a limit order, the order price is denominated in $TAR. The minimum value of the price is related to the current trading pair, and the calculation formula is `1e(DEC-5)`, where `DEC` is the decimal place of the trading currency. For example, if the token $EG has 2 decimal places, the minimum trading price is 0.001. When your trading information is filled in incorrectly, you cannot click the `Make Order` button, there will be text prompts indicating the current error.

### About certification for pair

Anyone can add trading pairs on the exchange, and there are no restrictions on the name or symbol of the token. In order to ensure the safety of users, To protect users' security, we will mark verified tokens that have been security-authenticated with a verified icon in the list of trading pairs, to make it easy for users to choose.

The verified mark only indicates that this token has audited by the MarsLab team, and team is not responsible for the price fluctuations of the token itself.

If you are the owner of token and have token certification needs, please contact the team for token security audit.

### For developers

If you are a developer and need to integrate tokens that have already been listed on the exchange in ThetAR exchange dApp, you need to pay attention to the following points:

1. You should use [Warp contract](https://github.com/warp-contracts/warp) for contract evaluation.

2. When using Warp contract, you need to set the contract evaluation options like:

``` javascript
const contract = warp.contract(tokenAddress);
contract.setEvaluationOptions({
  internalWrites: true,
  allowUnsafeClient: true
});
```

3. And then use the following code to get token information: 

```javascript
// get wallet balance:
result = (await contract.viewState({
  function: 'balanceOf',
  target: walletAddress
})).result;
```

You can refer to [Warp SDK](https://github.com/warp-contracts/warp) and [WRC Standard](https://github.com/marslab2022/wrc) for more information.

### Contact Us

Any questions? Please contact us by:

- E-mail: marslab.2022@gmail.com

- Twitter: [@mARsLab_2022](https://twitter.com/mARsLab_2022)

- GitHub: [marslab2022](https://github.com/marslab2022)