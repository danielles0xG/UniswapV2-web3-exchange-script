## Simple ETH/DAI stoploss script with Uniswap exchange

The script will check prices and sell your ETH when the price goes beyond the support price you define. This is an express server doing web3-js interaction with UniswapV2 exchange contract.
## Install

- Configure eth account to connect to Metamask wallet
- Web3
- Infura node key

## Dependencies

- Node v14
- Web3
- Infura node key



## Ethereum Account Configuration
### .env 
    - RPC INFURA URL
    - ETHREUM ACCOUNT
    - ACCOUNT PRV KEY
    - ETH_SELL_PRICE

## Run
```console
yarn run start
```


