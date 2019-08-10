import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
// EMG - Importing data contract as well
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        // EMG - Importing data contract as well
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        // EMG - Declaring appAddress so that it can be used at initialize
        this.appAddress = config.appAddress;
        
        this.owner = null;
        this.airlines = [];
        // EMG - Declaring an array of flights - flights can be hardcoded in the DApp
        this.flights = [];
        this.passengers = [];
        this.initialize(callback);
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];
            
            console.log(`These are the accounts to be used: ${accts}`);
            console.log(`This is de appAddress: ${this.appAddress}`);
            console.log(`This is the owner: ${this.owner}`);
            
            // EMG - authorize App Contract to access Data Contract functions
            this.authorizeCaller(this.appAddress, (error, result) => {
                console.log(`authorizeCaller at contract.js - error is ${error}, and result is ${JSON.stringify(result)}`);
            });

            // EMG - funding of the first registered airline, which was already registered at contract deployment
            let contributedFunds = this.web3.utils.toWei("10", "ether");
            let airline = this.owner;
            this.fund(airline, contributedFunds, (error, result) => {
                console.log(`fund at contract.js - error is ${error}, and result is ${JSON.stringify(result)}`);
            });
            
            // EMG - registration of a number of flights
            // Date.now shows the number of milliseconds since January 1, 1970
            // If it is divided by 1000, the number of seconds is obtained
            // 1 hour = 3600 seconds
            // If 3600 seconds are added to each subsequent flight timestamp, they are going to be different by one hour
            let flightNumber = "IB3971";
            let timestamp = Math.floor(Date.now() / 1000);
            this.registerFlight(airline, flightNumber, timestamp.toString(), (error, result) => {
                console.log(`registerFlight at contract.js - error is ${error}, and result is ${JSON.stringify(result)}`);
            });
            this.flights.push({
                airline: airline,
                flightNumber: flightNumber,
                timestamp: timestamp
            });

            flightNumber = "BA2871";
            timestamp = timestamp + 3600;
            this.registerFlight(airline, flightNumber, timestamp, (error, result) => {
                console.log(`registerFlight at contract.js - error is ${error}, and result is ${JSON.stringify(result)}`);
            });
            this.flights.push({
                airline: airline,
                flightNumber: flightNumber,
                timestamp: timestamp
            });

            flightNumber = "AV4122";
            timestamp = timestamp + 3600;
            this.registerFlight(airline, flightNumber, timestamp, (error, result) => {
                console.log(`registerFlight at contract.js - error is ${error}, and result is ${JSON.stringify(result)}`);
            });
            this.flights.push({
                airline: airline,
                flightNumber: flightNumber,
                timestamp: timestamp
            });
            
            flightNumber = "LF9658";
            timestamp = timestamp + 3600;
            this.registerFlight(airline, flightNumber, timestamp, (error, result) => {
                console.log(`registerFlight at contract.js - error is ${error}, and result is ${JSON.stringify(result)}`);
            });
            this.flights.push({
                airline: airline,
                flightNumber: flightNumber,
                timestamp: timestamp
            });
            
            flightNumber = "SA5381";
            timestamp = timestamp + 3600;
            this.registerFlight(airline, flightNumber, timestamp, (error, result) => {
                console.log(`registerFlight at contract.js - error is ${error}, and result is ${JSON.stringify(result)}`);
            });
            this.flights.push({
                airline: airline,
                flightNumber: flightNumber,
                timestamp: timestamp
            });

            // EMG - Five passengers are defined here
            let counter = 1;
            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    // EMG - Declaration for function authorizeCaller
    authorizeCaller(dataContract, callback) {
        let self = this;
        let payload = {
            dataContract: dataContract
        } 
        self.flightSuretyData.methods
            .authorizeCaller(payload.dataContract)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }
    
    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    // EMG - Declaration for function fund
    fund(airline, contributedFunds, callback) {
        let self = this;
        let payload = {
            airline: airline,
            contributedFunds: contributedFunds
        } 
        self.flightSuretyApp.methods
            .fund()
            .send({ from: payload.airline, value: payload.contributedFunds}, (error, result) => {
                callback(error, payload);
            });
    }

    // EMG - Declaration for function registerFlight
    registerFlight(airline, flightNumber, timestamp, callback) {
        let self = this;
        let payload = {
            airline: airline,
            flightNumber: flightNumber,
            timestamp: timestamp
        }
        self.flightSuretyApp.methods
            .registerFlight(payload.flightNumber, payload.timestamp)
            .send({ from: payload.airline}, (error, result) => {
                callback(error, payload);
            });
    }

    // EMG - Declaration for function buy
    buy(passenger, airline, flightNumber, timestamp, amount, callback) {
        let self = this;
        let payload = {
            passenger: passenger,
            airline: airline,
            flightNumber: flightNumber,
            timestamp: timestamp,
            amount: amount
        }
        self.flightSuretyApp.methods
            .buy(payload.airline, payload.flightNumber, payload.timestamp)
            .send({ from: payload.passenger, value: payload.amount, gas: 4712388, gasPrice: 100000000000}, (error, result) => {
                callback(error, payload);
            });
    }

    // EMG - Declaration for function buy
    fetchFlightStatus(passenger, airline, flightNumber, timestamp, callback) {
        let self = this;
        let payload = {
            passenger: passenger,
            airline: airline,
            flightNumber: flightNumber,
            timestamp: timestamp
        }
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flightNumber, payload.timestamp)
            .send({ from: payload.passenger}, (error, result) => {
                callback(error, payload);
            });
    }

    // EMG - Declaration for function pay
    pay(passenger, airline, flightNumber, timestamp, callback) {
        let self = this;
        let payload = {
            passenger: passenger,
            airline: airline,
            flightNumber: flightNumber,
            timestamp: timestamp
        }
        self.flightSuretyApp.methods
            .pay(payload.airline, payload.flightNumber, payload.timestamp)
            .send({from: payload.passenger}, (error, result) => {
                callback(error, payload);
            });
    }
}