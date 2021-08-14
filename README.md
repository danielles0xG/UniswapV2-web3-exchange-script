## Simple ETH/DAI stoploss script to Uniswap exchange

Express server for web3-js interaction with UniswapV2 exchange contract.

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
```console
RPC_URL="https://ropsten.infura.io/v3/<PROJECT_ID>"

# Eth account
ACCOUNT="<0x00...>"
PRIVATE_KEY="7<account private key>"
POLLING_INTERVAL=≤price check interval>
```

## Run
```console
yarn run start
```


