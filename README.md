# Architect a Blockchain Flight Delay Insurance for Passengers

This project is intended to create a DApp that implements a flight delay insurance for passengers powered by Ethereum. The main idea is that a number of airlines collaborate to manage the system, which allows passengers to buy an insurance before the flight takes place. Then, if the flight is delayed because of the airline, passengers are entitled to be paid 1.5X what they paid for the insurance. The 1.5 is of course an arbitrary number.

## Table of Contents

* [Some key data](#some-key-data)
* [Description of the Project](#description-of-the-project)
* [Testing smart contract code coverage](#testing-smart-contract-code-coverage)
* [Getting Started](#getting-started)
* [Deployment](#deployment)
* [Resources](#resources)
* [Contributing](#contributing)

## Some key data

In this section, some key data is provided:

* Versions used for a number of tools: 
    * [Node](https://nodejs.org/es/) v10.15.3    
    * [Truffle](https://www.trufflesuite.com/) v4.1.15 (core: 4.1.15)
    * [Solidity](https://solidity.readthedocs.io/en/v0.5.10/) v0.4.25 (solc-js)
    * [web3](https://web3js.readthedocs.io/en/1.0/) @1.0.0-beta.37
    * [truffle-hdwallet-provider](https://www.npmjs.com/package/truffle-hdwallet-provider) @1.0.2
    * [Ganache CLI](https://github.com/trufflesuite/ganache-cli) v6.4.3 (ganache-core: 2.5.5)
    * [Metamask](https://metamask.io/) Version 6.7.3

## Description of the Project

As has already been mentioned, this project develops a Dapp which implements a flight delay insurance for passengers based on Ethereum. The objective is to design and code a solution based on blockchain which has three main components. The first one is found on the blockchain, and consists of two smart contracts: data contract, where data is persisted, and app contract, where the business logic resides. The second one is a server application, which represents the oracles that provide the flight status information to the contracts. The third and last one is the front-end, or client application. The work that has been done is best described by explaining its main areas:

### Part 1 Separation of concerns

As already mentioned, four components are considered: 

* The data contract for data persistance.
* The app contract for app logic, and oracles code.
* The dapp client, which triggers contract calls, for instance, as a result of user input.
* The server app for simulating the oracles and their responses to the requests for flight 
status information.

### Part 2	Airlines

The second part of this project has to do with the airlines:

* The first airline is registered at contract deployment time.
* Only airlines who have already been registered can register a new airline, until at least four of them are registered.
* From the fifth airline onwards, registration requires multiparty consensus of 50% of currently registered airlines.
* Once an airline has been registered, it cannot take part in the contract until it pays 10 ether to the contract. In this way, the amount of funding in the contract increases.

### Part 3	Passengers

The third part of this project has to do with the passengers:

* Passengers may buy a flight insurance for up to 1 ether.
* Flight numbers and timestamps can be fixed within the front-end.
* In case the flight is delayed because of airline fault, insured passengers are entitled to an insurance payout of 1.5X the amount they paid.
* Insurance payouts are transferred to the passenger wallet only when they submit a withdrawal call to the contract.

### Part 4	Oracles

The fourth part of this project has to do with the oracles:

* Oracles are managed via a server application.
* At least 20 oracles are registered at startup.
* The front-end has a button that when clicked calls a contract function which emits an event that is captured by the server app. This event, called OracleRequest, is meant to start the process that updates flight status.
* The update process at the server app looks through all oracles, and those which are concerned by the request, respond by calling a contract function with the appropriate status code.

### Part 5	General

The fifth part of this project has to do with some general considerations:

* Operational status control must be provided. In this way, any function in the contracts that can change state can be paused.
* Functions in the contracts should fail fast. That means that require() statements must be placed as near as possible to the start of functions. This makes it possible that the amount of gas spent by the user is as small as possible.

## Testing smart contract code coverage

In this section, the twelve tests covered are listed:

* (Requirement 5: General) The initial value of isOperational() is correct (it is true).
* (Requirement 5: General) setOperatingStatus() cannot be called by a non-Contract Owner account.
* (Requirement 5: General) setOperatingStatus() can be called by the Contract Owner account.
* (Requirement 5: General) requireIsOperational can block access to functions when operating status is false.
* (Requirement 2: Airlines) Register first airline when contract is deployed. 
* (Requirement 2: Airlines) Only existing airline may register a new airline until there are at least four airlines registered. 
* (Requirement 2: Airlines) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines. 
* (Requirement 2: Airlines) Airline can be registered, but does not participate in contract until it submits funding of 10 ether.
* (Requirement 3: Passengers) Passengers may pay up to 1 ether for purchasing flight insurance.
* (Requirement 4: Oracles) Upon startup, 20+ oracles are registered and their assigned indexes are persisted in memory.
* (Requirement 4: Oracles) Request Flight Status can be invoked so that Flight Status Info is returned by Oracles.
* (Requirement 3: Passengers) If flight is delayed due to airline fault, passenger receives credit of 1.5X the amount they paid.

## Getting Started

The procedure to obtain functional a copy of the project on your local machine so that you can further develop and/or test it is explained in this section. It is assumed that you have already installed [Truffle](https://www.trufflesuite.com/), [Ganache CLI](https://github.com/trufflesuite/ganache-cli), and the [Metamask](https://metamask.io/) extension in your browser. These are the steps to be followed:

* Firstly, you have to download/clone the project files from this repository onto your local machine. Then, cd into the root folder where the project files are located.
* Secondly, type `npm install` on a terminal shell window so that all required npm packages are installed.
* Thirdly, run Ganache by typing `ganache-cli`. This will start Ganache at *http://127.0.0.1:8545/*. This project has been developed assuming that block gas limit is set at 9999999, the number of accounts to generate at startup is 200, and the amount of ether to be assigned to each account is 50000. This can be accomplished by typing `ganache-cli -l 9999999 -a 200 -e 50000`. However, you might prefer to set some other values.
* In the fourth place, you have to set up a *secret-parameters.js* file at the root folder of this project, where you are located just now. This is a secret parameters file where you have to type two parameters for the application:
    * Firstly, your *Ganache seed (mnemonic)*.
    * Secondly, whether you want to force that the oracles always return that the flights have been delayed due to airline reasons. In this case, insurees will be credited the insurance payout. This can come in handy for testing reasons, as you will not have to wait for this result to happen by chance. To obtain this effect, just fill out the *ALWAYS_RETURN_STATUS_CODE_LATE_AIRLINE* constant as *true*.
For convenience, one such file has been provided for you, so that you just have to fill out the data into the corresponding fields.
* In the fifth place, to run the supporting unit tests on Ganache, you have to:
    * Open a new terminal shell window, cd to the same root folder of the project, and type `truffle compile` to compile the smart contracts. Once the contracts have been successfully compiled, type `truffle migrate --reset`, to deploy them to Ganache.
    * Now, you can run `truffle test ./test/flightSurety.js` firstly, and then `truffle test ./test/oracles.js` to run all twelve supporting unit tests.
    ![TruffleTests](/Screenshots/TruffleTests.png)
* In the sixth place, the following steps show you an easy way to make use of the front end of the Dapp:
    * Set the *http://127.0.0.1:8545/* address in Metamask so that the Ganache private network can be accessed. 
    * The first account in the list shown by *Ganache* is the contract owner, and, at the same time, an airline, the one registered at contract deployment. From the second to the sixth ones are passengers. Finally, from the seventh to the forty-sixth ones are oracles. 
    *At least, you should import one of those reserved for passengers into your Metamask*. In this way, you will be able to check in your Metamask how the amount of ether in the passenger's account decreases by the amount spent on the insurance when purchasing it, and how it increases when the insurance payout is withdrawn by the passenger. Of course, the latter happens only if the flight is delayed due to airline reasons.
    * Once this has been done, open a new terminal shell window, cd to the same root folder of the project, and then type `npm run dapp`. This last command starts the *webpack-dev-server* at *http://localhost:8000*. If that is not done automatically for you, open that address in your browser to access the front end of the Dapp.
    ![npmrundapp](/Screenshots/npmrundapp.png)
    * Then, to complete the setup, we need to start the last component of the architecture, the server that manages the oracles. With this aim in view, open yet another terminal shell window, cd to the same root folder of the project, and then type `npm run server`. This last command starts the *webpack* server at *http://localhost:3000*.
    ![npmrunserver](/Screenshots/npmrunserver.png)
    * At this point, and at this terminal shell window for the server managing the oracle functionality, you will observe a number of displays:
        * In the first place, all available accounts are displayed.
        ![npmrunserver1](/Screenshots/npmrunserver1.png)
        * In the second place, the address of the App contract, and the address of the contract owner are also displayed. Then, it is shown that the address of the app contract has been authorized to access the data contract. Moreover, the registration fee is also recovered from the contracts and shown.
        ![npmrunserver2](/Screenshots/npmrunserver2.png)
        * Finally, the oracles that have been registered are shown as well.
        ![npmrunserver3](/Screenshots/npmrunserver3.png)
    * Back to your browser, where the front-end of the Dapp resides, select in Metamask the account for the passenger you want to work with. For instance, in our example, it is the second address shown in Ganache-cli, which we have imported into Metamask:
    ![metamask](/Screenshots/metamask.png)
    * Now, you can test the life cycle of the flight delay insurance DApp throughout its different stages. These stages are represented by the four sections of the front-end page, which can be conveniently located by either scrolling or the navigation bar at the end of the page:
        * *Check Operational Status of Contract*. This first section allows you to check the operational status of the contract, by just clicking the *check* button.
        ![checkoperationalstatus](/Screenshots/checkoperationalstatus.png)
        * *Purchase Insurance for Flight*. This second section allows the chosen passenger to buy an insurance for the chosen flight at the desired amount. This amount can be anything you want up to 1 ether. You can see below the balance of the passenger's account before and after purchasing the insurance. As you can observe, it has decreased by 1 ether (if we do not take into account the gas spent, which is a quite small amount compared to the 1 ether.
        ![purchaseinsurance](/Screenshots/purchaseinsurance.png)
        ![metamask12](/Screenshots/metamask12.png)
        * *Fetch Flight Status Update*. This third section allows the chosen passenger to request a fetch flight status update from the oracles.
        ![fetchflightstatusupdate](/Screenshots/fetchflightstatusupdate.png)
        At this point it is important to turn our attention to the terminal shell window where the server managing the oracles is running. You will see the following messages displayed there:
            * For a start, the data of the event captured by the server is shown. This event has been triggered by the button just clicked at the dapp front-end in the browser. The purpose of the event is of course to fetch flight status update.
            ![npmrunserver4](/Screenshots/npmrunserver4.png)
            * Then, the request is processed. Firstly, the oracles that do not match the request, and, as a result, do not submit a response, are displayed.
            ![npmrunserver5](/Screenshots/npmrunserver5.png)
            * After that, the oracles that do match the request are also shown, together with the submitted response. If, the verified response is the one that credits insurees (credits but not transfers the ether yet), this fact is displayed as well. As you know, the response we are talking about is *STATUS_CODE_LATE_AIRLINE*.
            ![npmrunserver6](/Screenshots/npmrunserver6.png)
        * *Insurance Payout for Flight*. This is the fourth and last section of the front-end dapp which can be seen in the browser. It allows the chosen passenger to withdraw an insurance payout for the chosen flight. This payout will be 1.5X the amount paid when buying the insurance. This can be observed below:
        ![insurancepayout](/Screenshots/insurancepayout.png)
        ![metamask23](/Screenshots/metamask23.png)

## Deployment

To build the DApp for prod, type `npm run dapp:prod`. Then, deploy the contents of the ./dapp folder.

## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)

## Contributing

This repository contains all the work that makes up the project. Individuals and I myself are encouraged to further improve this project. As a result, I will be more than happy to consider any pull requests.