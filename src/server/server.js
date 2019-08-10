import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
// EMG - Importing data contract as well
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

// EMG - This variable should be set to true if you want to force that the result of the
// fetch status flight process is always STATUS_CODE_LATE_AIRLINE. This might be interesting
// if you are interested in testing the correct behaviour of the system, and do not want
// to wait for this status code to occur (be verified) by chance.
// As can be seen, the variable is recovered from the file secret-parameters.js
const fs = require('../../secret-parameters.js');
var forceLateAirline = fs.forceLateAirline;
const ALWAYS_RETURN_STATUS_CODE_LATE_AIRLINE = forceLateAirline;

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
// web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
// EMG - Importing data contract as well
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
let appAddress = config.appAddress;

// Flight status codes
const statusCodes = [{name: 'STATUS_CODE_UNKNOWN', code: 0, counter: 0},
                     {name: 'STATUS_CODE_ON_TIME', code: 10, counter: 0},
                     {name: 'STATUS_CODE_LATE_AIRLINE', code: 20, couner: 0},
                     {name: 'STATUS_CODE_LATE_WEATHER', code: 30, counter: 0},
                     {name: 'STATUS_CODE_LATE_TECHNICAL', code: 40, counter: 0},
                     {name: 'STATUS_CODE_LATE_OTHER', code: 50, counter: 0},
                    ];

// EMG - This is the number of Oracles to be registered
const TEST_ORACLES_COUNT = 40;
// EMG - Number of addresses already taken: the first one for the airline registered at contract deployment time, 
// and the following five ones for five passengers
const RESERVED_ADDRESSES_COUNT = 6;

// EMG - The first thing the server must do is to get all of the available accounts
web3.eth.getAccounts((error, accts) => {
  
  let owner = accts[0];
            
  let counter = 0;
  console.log(`--------------------------------------------------`);
  console.log(`---- 1) THESE ARE ALL THE AVAILABLE ACCOUNTS: ----`);
  console.log(`--------------------------------------------------`);
  while(counter < accts.length) {
    console.log(`Account number ${counter}: ${accts[counter]}`);
    counter = counter + 1;
  }
  
  console.log(`-----------------------------------------------------------------------------------------------------`);
  console.log(`----------- 2) THIS IS THE appAddress: ${appAddress} -------------------`);
  console.log(`-----------------------------------------------------------------------------------------------------`);
  console.log(`----------------------------------------------------------------------------------------------------------`);
  console.log(`------------3) THIS IS THE OWNER ADDRESS: ${owner} ---------------------`);
  console.log(`----------------------------------------------------------------------------------------------------------`);

  // EMG - The second thing the server must do is to authorize the App contract to access the Data contract
  flightSuretyData.methods.authorizeCaller(appAddress).send({from: owner})
    .then(function () {
      console.log(`--------------------------------------------------------------------------------------------------------------------------------------------------`);
      console.log(`----------- 4) THE ADDRESS OF THE APP CONTRACT ${appAddress} HAS BEEN AUTHORIZED TO ACCESS THE DATA CONTRACT --------`);
      console.log(`--------------------------------------------------------------------------------------------------------------------------------------------------`);
      // EMG - The third thing the server must do is to recover the REGISTRATION_FEE
      flightSuretyApp.methods.REGISTRATION_FEE().call({from: owner})
        .then(function (fee) {
          
          console.log(`-----------------------------------------------------------------------------------------------`);
          console.log(`----------- 5) THE REGISTRATION_FEE IS ${JSON.stringify(fee)} ----------------------------------`);
          console.log(`-----------------------------------------------------------------------------------------------`);

          console.log(`-----------------------------------------------------------------------------------------------`);
          console.log(`----------- 6) THESE ARE THE ORACLES THAT HAVE BEEN REGISTERED: -------------------------------`);
          console.log(`-----------------------------------------------------------------------------------------------`);
          
          // EMG - In the fourth place, the server must register TEST_ORACLES_COUNT oracles
          for(let a = RESERVED_ADDRESSES_COUNT; a < (TEST_ORACLES_COUNT + RESERVED_ADDRESSES_COUNT); a++) {      
            flightSuretyApp.methods.registerOracle().send({from: accts[a], value: fee, gas: 4712388, gasPrice: 100000000000})
              .then(function () {
                flightSuretyApp.methods.getMyIndexes().call({from: accts[a]})
                  .then(function (result) {
                    console.log(`Oracle ${(a - RESERVED_ADDRESSES_COUNT + 1)} at account ${accts[a]} registered with indexes: ${result[0]}, ${result[1]}, ${result[2]}`);
                    if (a === (TEST_ORACLES_COUNT + RESERVED_ADDRESSES_COUNT - 1)) {
                      console.log(`------------------------------------------------------------------------------------------------`);
                    }
                  })
                  .catch(function (error) {
                    console.log(error);
                  });
              })
              .catch(function (error) {
                console.log(error);
              });
          }


          // EMG - Once the oracles are registered, the server waits for the OracleRequest event
          flightSuretyApp.events.OracleRequest({
            // EMG - fromBlock is set to latest so that we do not get all the events that have happened
            // See https://ethereum.stackexchange.com/questions/41976/how-to-get-only-latest-log-from-my-event
            fromBlock: 'latest'
          }, function (error, event) {
            if (error) console.log(error);
            console.log(`---------------------------------------------------------------------`);    
            console.log(`7) AN ORACLEREQUEST EVENT HAS BEEN RECEIVED WITH THE FOLLOWING DATA: `);
            console.log(`---------------------------------------------------------------------`);    
            console.log(`event name: ${event.event}`);
            console.log(`event return value index: ${event.returnValues.index}`);
            console.log(`event return value airline: ${event.returnValues.airline}`);
            console.log(`event return value flight: ${event.returnValues.flight}`);
            console.log(`event return value timestamp: ${event.returnValues.timestamp}`);
            console.log(`This is the raw data for the event:`);
            console.log(event);
            console.log(`--------------------------------------------------------------------------------------------`);
            console.log(`8) THE REQUEST FOR ORACLES TO FETCH FLIGHT INFORMATION IS GOING TO BE PROCESSED:            `);
            console.log(`--------------------------------------------------------------------------------------------`);
            console.log(`********************************************************************************************`);
            console.log(`****** IMPORTANT!! Please note that if a late airline code is verified by the oracle *******`);
            console.log(`****** responses, this is going to be indicated below as soon as it occurs.          *******`);
            console.log(`****** If you do not see that indication, you can submit as many fetch flight status *******`);
            console.log(`****** requests as you deem aproppriate until you obtain a verified late airline code*******`);
            console.log(`********************************************************************************************`);
            
            // EMG - The next five lines have the only purpose to indicate in the terminal shell for the oracle server
            // whether a late airline code status should have been verified by the contract
            let lateAirlineVerified = false;
            let firstVerificationMade = false;
            for (let a= 0; a < statusCodes.length; a++) { statusCodes[a].counter = 0};

            let firstOracleNonMatchingIndex = true;
            let firstOracleMatchingIndex = true;
            
            for(let a = RESERVED_ADDRESSES_COUNT; a < (TEST_ORACLES_COUNT + RESERVED_ADDRESSES_COUNT); a++) {
              // Get oracle information - its indexes
              flightSuretyApp.methods.getMyIndexes().call({from: accts[a]})
                .then(function (result) {
                  // EMG - Check whether any of the indexes of the oracle match the index of the event
                  if (event.returnValues.index === result[0] || event.returnValues.index === result[1] || event.returnValues.index === result[2]) {
                    let statusCode = getRandomInt(0, 5);
                    flightSuretyApp.methods.submitOracleResponse(event.returnValues.index, event.returnValues.airline, event.returnValues.flight, event.returnValues.timestamp, (statusCode * 10)).send({from: accts[a], gas: 4712388, gasPrice: 100000000000})
                      .then(function () {
                        if (firstOracleMatchingIndex) {
                          console.log(`-------------------------------------------------------------------------------------------------------`);
                          console.log(`-- THESE ARE THE ORACLES THAT MATCH THE INDEX IN THE FETCH FLIGHT REQUEST, I.E. THEY SUBMIT A RESPONSE-`);
                          console.log(`-------------------------------------------------------------------------------------------------------`);
                          firstOracleMatchingIndex = false;  
                        }
                        console.log(`Oracle ${(a - RESERVED_ADDRESSES_COUNT + 1)} at account ${accts[a]} was assigned these indexes at registration time: ${result[0]}, ${result[1]}, ${result[2]}`);
                        console.log(`       As one of its indexes matches the one on the request (${event.returnValues.index}), it has submitted the following response:`);
                        console.log(`       Index ${event.returnValues.index} - airline ${event.returnValues.airline} - flight ${event.returnValues.flight} - timestamp ${event.returnValues.timestamp} - status code ${statusCodes[statusCode].name}`);
                        statusCodes[statusCode].counter = statusCodes[statusCode].counter + 1;
                        //console.log(`${statusCodes[0].counter} ${statusCodes[1].counter} ${statusCodes[2].counter} ${statusCodes[3].counter} ${statusCodes[4].counter} ${statusCodes[5].counter}`);
                        if (statusCodes[statusCode].counter === 3 && !firstVerificationMade) {
                          if (statusCode === 2) {
                            console.log(`-----------------------W---A---T---C---H-----------O---U---T---!---!---!---!---!----------------`);
                            console.log(`-----------------------W---A---T---C---H-----------O---U---T---!---!---!---!---!----------------`);
                            console.log(`-----------------------W---A---T---C---H-----------O---U---T---!---!---!---!---!----------------`);
                            console.log(`-- THE STATUS CODE OF LATE AIRLINE HAS BEEN VERIFIED WITHIN THIS ORACLE REQUEST. AS A RESULT,---`);
                            console.log(`-- INSUREES HAVE BEEN CREDITED.-----------------------------------------------------------------`);
                            console.log(`-----------------------W---A---T---C---H-----------O---U---T---!---!---!---!---!----------------`);
                            console.log(`-----------------------W---A---T---C---H-----------O---U---T---!---!---!---!---!----------------`);
                            console.log(`-----------------------W---A---T---C---H-----------O---U---T---!---!---!---!---!----------------`);
                            lateAirlineVerified === true;
                          }
                          firstVerificationMade = true;
                        }
                      })
                      .catch(function (error) {
                        console.log(error);
                      });
                  } else {
                    if (firstOracleNonMatchingIndex) {
                      console.log(`------------------------------------------------------------------------------------------------`);
                      console.log(`-- THESE ARE THE ORACLES THAT DO NOT MATCH THE INDEX IN THE FETCH FLIGHT REQUEST----------------`);
                      console.log(`------------------------------------------------------------------------------------------------`);
                      firstOracleNonMatchingIndex = false;  
                    }
                    console.log(`Oracle ${(a - RESERVED_ADDRESSES_COUNT + 1)} at account ${accts[a]} was assigned these indexes at registration time: ${result[0]}, ${result[1]}, ${result[2]}`);
                    console.log(`       As its indexes do not match the one on the request (${event.returnValues.index}), it is not going to submit a response`); 
                  }
                })
                .catch(function (error) {
                  console.log(error);
                });
            }
          });
        })
        .catch(function (error) {
          console.log(error);
        });
    })
    .catch(function (error) {
      console.log(error);
    });
});



// EMG - Returns a random integer between min and max
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  // EMG - This variable indicates whether you want LATE_AIRLINE to be forced for testing reasons
  if (!ALWAYS_RETURN_STATUS_CODE_LATE_AIRLINE) {
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  } else {
    return 2;
  }
  
}

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


