
var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');

contract('Oracles', async (accounts) => {

  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10;
  const STATUS_CODE_LATE_AIRLINE = 20;
  const STATUS_CODE_LATE_WEATHER = 30;
  const STATUS_CODE_LATE_TECHNICAL = 40;
  const STATUS_CODE_LATE_OTHER = 50;
  
  const TEST_ORACLES_COUNT = 40;

  const MIN_RESPONSES = 3;
  
  var config;
  // EMG - Flight timestamp is declared at this level so that it is the same throughout all the tests
  let timestamp = Math.floor(Date.now() / 1000);
  // EMG - The number of accepted responses from Oracles is declared at this level so that it is also the 
  // same throughout all the tests
  let countAcceptedStatuses = 0;

  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    
    // Watch contract events

  });

  /****************************************************************************************/
  /* EMG - Oracles                                                                        */
  /****************************************************************************************/

  it('(Requirement 4: Oracles) Upon startup, 20+ oracles are registered and their assigned indexes are persisted in memory', async () => {
    
    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for(let a=1; a<=TEST_ORACLES_COUNT; a++) {      
      await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
      let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
      console.log(`Oracle ${accounts[a]} registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });

  it('(Requirement 4: Oracles) Request Flight Status can be invoked so that Flight Status Info is returned by Oracles ', async () => {
    
    // ARRANGE
    
    let flight = 'ND1309'; // Course number

    let passenger = accounts[41];
    let insurancePaid = web3.toWei(1, "ether")
    // Submit a request to fund the first airline
    const contributedFunds = web3.toWei(10, "ether")  
    await config.flightSuretyApp.fund({from: config.firstAirline, value: contributedFunds, gasPrice: 0});
    // Submit a request to register the flight
    await config.flightSuretyApp.registerFlight(flight, timestamp, {from: config.firstAirline});
    // Submit a request to buy a 1 ether insurance for the flight by the passenger
    await config.flightSuretyApp.buy(config.firstAirline, flight, timestamp, {from: passenger, value: insurancePaid, gasPrice: 0});
    let result = await config.flightSuretyData.insuranceIsRegistered.call(passenger, config.firstAirline, flight, timestamp, {from: config.flightSuretyApp.address}); 
    assert.equal(result, true, "Insurance for first passenger at the specified flight should have been registered");

    // Submit a request for oracles to get status information for a flight
    await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp);
    
    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    
    for(let a=1; a<=TEST_ORACLES_COUNT; a++) {

      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});
      for(let idx=0;idx<3;idx++) {
        //console.log(`Looping through all the accounts ${a} ${oracleIndexes[idx]} ${config.firstAirline} ${flight} ${timestamp} ${accounts[a]} ${oracleIndexes}`);
        try {
          // Submit a response...it will only be accepted if there is an Index match
          await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx].toNumber(), config.firstAirline, flight, timestamp, STATUS_CODE_LATE_AIRLINE, { from: accounts[a] });
          console.log(`Response accepted from oracle ${accounts[a]}: airline ${config.firstAirline} flight ${flight} timestamp ${timestamp} status ${STATUS_CODE_LATE_AIRLINE}`);
          countAcceptedStatuses = countAcceptedStatuses + 1;
        }
        catch(e) {
          // Enable this when debugging
          // console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
        }
      }
    }
    if (countAcceptedStatuses >= MIN_RESPONSES) {
      console.log(`Flight Status Info generated because MIN_RESPONSES has been reached`);
    } else {
      console.log(`Only Oracle Reports have been generated because MIN_RESPONSES has not been reached. Please, re-run if you want to try again and have the possibility to reach MIN_RESPONSES`);
    }

  });

  /****************************************************************************************/
  /* EMG - Passengers                                                                     */
  /****************************************************************************************/

  it('(Requirement 3: Passengers) If flight is delayed due to airline fault, passenger receives credit of 1.5X the amount they paid', async () => {
    
    // ARRANGE  
    let flight = 'ND1309'; // Course number

    let passenger = accounts[41];

    let balanceBefore = await config.flightSuretyApp.getBalance(passenger);

    
    // ACT
    // Submit a request to withdraw the amount insured
    await config.flightSuretyApp.pay(config.firstAirline, flight, timestamp, {from: passenger, gasPrice: 0});

    let balanceAfter = await config.flightSuretyApp.getBalance(passenger); 

    // EMG - It is already known that in the previous test, the passenger paid 1 ether for their insurance
    let amountPaid = web3.toWei(1.5, "ether");
    let calculatedBalanceAfter = parseFloat(balanceBefore) + parseFloat(amountPaid);

    // ASSERT
    if (countAcceptedStatuses >= MIN_RESPONSES) {
      assert.equal(balanceAfter, calculatedBalanceAfter, "The passenger should have received 1.5X what they paid when they bought the insurance");
    } else {
      console.log(`*** Warning *** Please re-run the tests because only Oracle Reports have been generated as MIN_RESPONSES has not been reached`);
    }
  });

});
