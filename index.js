/** @format */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const moment = require('moment-timezone');
const numeral = require('numeral');
const _ = require('lodash');
const { DAI_ABI, EXCHANGE_ABI } = require('./abis');
const cLog = (args) => console.log('\n', args, '\n');

// SERVER CONFIG
const PORT = process.env.PORT || 3000;
const app = express();
const server = http
    .createServer(app)
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

// WEB3 CONFIG
const web3 = new Web3(
    new HDWalletProvider(process.env.PRIVATE_KEY, process.env.RPC_URL)
);

// Ropsten Uniswap Dai Exchange: https://ropsten.etherscan.io/address/0xc0fc958f7108be4060F33a699a92d3ea49b0B5f0
const EXCHANGE_ADDRESS = '0xc0fc958f7108be4060F33a699a92d3ea49b0B5f0';
let EXCHANGE_CONTRACT;
const DAI_ADDRESS = '0xc2118d4d90b274016cb7a54c03ef52e6c537d957';
let DAI_CONTRACT;

try {
    DAI_CONTRACT = new web3.eth.Contract(DAI_ABI, DAI_ADDRESS);
    cLog('DAI_CONTRACT  loaded ...');
    EXCHANGE_CONTRACT = new web3.eth.Contract(EXCHANGE_ABI, EXCHANGE_ADDRESS);
    cLog('UNISWAP_V2_DAI_EXCHANGE_CONTRACT loaded ...');
} catch (e) {
    cLog(e);
}

// Minimum eth to swap
const ETH_AMOUNT = web3.utils.toWei('1', 'Ether');
cLog('ETH_AMOUNT', ETH_AMOUNT);

const ETH_SELL_PRICE = web3.utils.toWei('400', 'Ether'); // 200 Dai a.k.a. $200 USD
cLog('ETH_SELL_PRICE', ETH_SELL_PRICE);


 /**
 * Uniswap uses one exchange (contract) for crypto pair.
 * 
 * @param {uint} ethAmount - Ether Amount to swap.
 * @param {uint} daiAmount - Dai Amount to get.
 */
async function sellEth(ethAmount, daiAmount) {
    // Set Deadline 1 minute from now
    const moment = require('moment'); // import moment.js library
    const now = moment().unix(); // fetch current unix timestamp
    const DEADLINE = now + 120; // add 60 seconds
    cLog('Deadline', DEADLINE);

    // Transaction Settings
    const SETTINGS = {
        gasLimit: 8000000, // Override gas settings: https://github.com/ethers-io/ethers.js/issues/469
        gasPrice: web3.utils.toWei('50', 'Gwei'),
        from: process.env.ACCOUNT, // Use your account here
        value: ethAmount, // Amount of Ether to Swap
    };

    // Perform Swap
    cLog('Performing swap...');
    let result = await EXCHANGE_CONTRACT.methods
        .ethToTokenSwapInput(daiAmount.toString(), DEADLINE)
        .send(SETTINGS);
    cLog(
        `Successful Swap: https://ropsten.etherscan.io/tx/${result.transactionHash}`
    );
}

/*
 *   CHECK THE BALANCES
 */
async function checkBalances() {
    // Check Ether balance swap
    try {
        // balance = await web3.eth.getBalance(process.env.ACCOUNT)
         let balance = await web3.eth
            .getBalance(process.env.ACCOUNT);

          balance = web3.utils.fromWei(balance, 'Ether');
        console.log('Ether Balance:', balance);

        // Check Dai balance swap
        balance = await DAI_CONTRACT.methods
            .balanceOf(process.env.ACCOUNT)
            .call();

        balance = web3.utils.fromWei(balance, 'Ether');
        cLog('Dai Balance:', balance);
    } catch (e) {
        console.log(e);
    }
}

let priceMonitor;
let monitoringPrice = false;

/*
 *   MONITOR PRICEs
 */
async function monitorPrice() {
    if (monitoringPrice) {
        return;
    }

    console.log('Checking price...');
    monitoringPrice = true;

    try {
        // Check Eth Price
        let daiAmount;

        daiAmount = await EXCHANGE_CONTRACT.methods
            .getEthToTokenInputPrice(ETH_AMOUNT)
            .call()
            .catch((e) => console.log('ERROR on getEthToTokenInputPrice: ', e));

        const price = web3.utils.fromWei(daiAmount.toString(), 'Ether');
        console.log('Eth Price:', price, ' DAI');

        if (price <= ETH_SELL_PRICE) {
            console.log('Selling Eth...');
            // Check balance before sale
            await checkBalances();

            // Sell Eth
            await sellEth(ETH_AMOUNT, daiAmount);

            // Check balances after sale
            await checkBalances();

            // Stop monitoring prices
            clearInterval(priceMonitor);
        }
    } catch (error) {
        console.error(error);
        monitoringPrice = false;
        clearInterval(priceMonitor);
        return;
    }
    monitoringPrice = false;
}

// Check markets every n seconds
const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 1000; // 1 Second

priceMonitor = setInterval(async() => {

    await checkBalances();
    await monitorPrice();

}, POLLING_INTERVAL);