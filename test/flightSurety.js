
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(Requirement 5: General) The initial value of isOperational() is correct (it is true)`, async function () {

    // Get operating status
    let status = await config.flightSuretyApp.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(Requirement 5: General) setOperatingStatus() cannot be called by a non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(Requirement 5: General) setOperatingStatus() can be called by the Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Contract Owner should be able to call setOperatingStatus()");
      
  });

  it(`(Requirement 5: General) requireIsOperational can block access to functions when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSuretyData.setTestingMode();
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  /****************************************************************************************/
  /* EMG - Airlines                                                                       */
  /****************************************************************************************/

  // EMG - The first airline must have been registered when contract is deployed
  it('(Requirement 2: Airlines) Register first airline when contract is deployed', async () => {
    
    // ARRANGE

    // ACT
    let result = await config.flightSuretyData.airlineIsRegistered.call(config.firstAirline, {from: config.flightSuretyApp.address}); 

    // ASSERT
    assert.equal(result, true, "First airline should have been registered when contract is deployed");

  });

  // EMG - Only existing airline may register a new airline until there are at least four airlines registered
  it('(Requirement 2: Airlines) Only existing airline may register a new airline until there are at least four airlines registered', async () => {
    
    // ARRANGE
    let secondAirline = accounts[1];
    let thirdAirline = accounts[2];
    let fourthAirline = accounts[3];

    const contributedFunds = web3.toWei(10, "ether")  
    await config.flightSuretyApp.fund({from: config.firstAirline, value: contributedFunds, gasPrice: 0});


    //  ------------ SUCCESSFUL SECOND AIRLINE REGISTRATION -------
    // ACT
    try {
      await config.flightSuretyApp.registerAirline(secondAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.airlineIsRegistered.call(secondAirline, {from: config.flightSuretyApp.address}); 

    // ASSERT
    assert.equal(result, true, "Second airline should have been registered by a funded airline");

    //  ------------ UNSUCCESSFUL THIRD AIRLINE REGISTRATION -------
    // ACT
    try {
      await config.flightSuretyApp.registerAirline(thirdAirline, {from: fourthAirline});
    }
    catch(e) {

    }
    result = await config.flightSuretyData.airlineIsRegistered.call(thirdAirline, {from: config.flightSuretyApp.address}); 

    // ASSERT
    assert.equal(result, false, "Third airline should not have been registered by an unregistered airline");

    //  ------------ SUCCESSFUL THIRD AIRLINE REGISTRATION -------
    // ARRANGE
    await config.flightSuretyApp.fund({from: secondAirline, value: contributedFunds, gasPrice: 0});

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(thirdAirline, {from: secondAirline});
    }
    catch(e) {

    }
    result = await config.flightSuretyData.airlineIsRegistered.call(thirdAirline, {from: config.flightSuretyApp.address}); 

    // ASSERT
    assert.equal(result, true, "Third airline should have been registered by a funded airline");

    //  ------------ SUCCESSFUL FOURTH AIRLINE REGISTRATION -------
    // ARRANGE
    await config.flightSuretyApp.fund({from: thirdAirline, value: contributedFunds, gasPrice: 0});

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(fourthAirline, {from: thirdAirline});
    }
    catch(e) {

    }
    result = await config.flightSuretyData.airlineIsRegistered.call(fourthAirline, {from: config.flightSuretyApp.address}); 

    // ASSERT
    assert.equal(result, true, "Fourth airline should have been registered by a registered airline");


  });

  // EMG - Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines
  it('(Requirement 2: Airlines) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {
    
    // ARRANGE
    let secondAirline = accounts[1];
    let thirdAirline = accounts[2];
    let fifthAirline = accounts[4];

    //  ------------ SECOND AIRLINE VOTING - IT'S NOT ENOUGH YET, IT IS 25% ONLY -------
    // ACT
    try {
      await config.flightSuretyApp.registerAirline(fifthAirline, {from: secondAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.airlineIsRegistered.call(fifthAirline, {from: config.flightSuretyApp.address}); 

    // ASSERT
    assert.equal(result, false, "Fifth airline should not have been registered with 25% of votes only");

    //  ------------ THIRD AIRLINE VOTING - SUCCESSFUL REGISTRATION WITH 50% OF AIRLINES FOR IT -------
    // ACT
    try {
      await config.flightSuretyApp.registerAirline(fifthAirline, {from: thirdAirline});
    }
    catch(e) {

    }
    result = await config.flightSuretyData.airlineIsRegistered.call(fifthAirline, {from: config.flightSuretyApp.address}); 

    // ASSERT
    assert.equal(result, true, "Fifth airline should have been registered with 50% of votes for it");

  });

  // EMG - Airline can be registered, but does not participate in contract until it submits funding of 10 ether
  it('(Requirement 2: Airlines) Airline can be registered, but does not participate in contract until it submits funding of 10 ether', async () => {
    
    // ARRANGE
    let secondAirline = accounts[1];
    let fifthAirline = accounts[4];
    let sixthAirline = accounts[5];

    const contributedFunds = web3.toWei(1, "ether")  
    await config.flightSuretyApp.fund({from: fifthAirline, value: contributedFunds, gasPrice: 0});

    //  ------------ SECOND AIRLINE VOTING - IT'S NOT ENOUGH YET, IT IS 25% ONLY -------
    // ACT
    try {
      await config.flightSuretyApp.registerAirline(sixthAirline, {from: secondAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.airlineIsRegistered.call(sixthAirline, {from: config.flightSuretyApp.address}); 

    // ASSERT
    assert.equal(result, false, "Sixth airline should not have been registered with 25% of votes only");

    //  ------------ FIFTH AIRLINE VOTING - UNSUCCESSFUL REGISTRATION BY AN UNFUNDED AIRLINE -------
    // ACT
    try {
      await config.flightSuretyApp.registerAirline(sixthAirline, {from: fifthAirline});
    }
    catch(e) {

    }
    result = await config.flightSuretyData.airlineIsRegistered.call(sixthAirline, {from: config.flightSuretyApp.address}); 

    // ASSERT
    assert.equal(result, false, "Sixth airline should not have been registered by the vote of an unfunded airline");

  });

  /****************************************************************************************/
  /* EMG - Passengers                                                                     */
  /****************************************************************************************/
 
  // EMG - Passengers may pay up to 1 ether for purchasing flight insurance
  it('(Requirement 3: Passengers) Passengers may pay up to 1 ether for purchasing flight insurance', async () => {
    
    // ARRANGE
    let secondAirline = accounts[1];
    let thirdAirline = accounts[2];

    let firstPassenger = accounts[6];

    let flightNumber = "IB3971";
    // EMG - Get the UTC timestamp in milliseconds
    // See https://stackoverflow.com/questions/221294/how-do-you-get-a-timestamp-in-javascript
    let timestamp = Date.now();

    await config.flightSuretyApp.registerFlight(flightNumber, timestamp, {from: secondAirline});

    let insurancePaid = web3.toWei(1, "ether")  

    // ACT
    try {
      await config.flightSuretyApp.buy(secondAirline, flightNumber, timestamp, {from: firstPassenger, value: insurancePaid, gasPrice: 0});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.insuranceIsRegistered.call(firstPassenger, secondAirline, flightNumber, timestamp, {from: config.flightSuretyApp.address}); 

    // ASSERT
    assert.equal(result, true, "Insurance for first passenger at the specified flight should have been registered");

   // ARRANGE
   
   await config.flightSuretyApp.registerFlight(flightNumber, timestamp, {from: thirdAirline});

   insurancePaid = web3.toWei(2, "ether")  

   // ACT
   try {
     await config.flightSuretyApp.buy(thirdAirline, flightNumber, timestamp, {from: firstPassenger, value: insurancePaid, gasPrice: 0});
   }
   catch(e) {

   }
   result = await config.flightSuretyData.insuranceIsRegistered.call(firstPassenger, thirdAirline, flightNumber, timestamp, {from: config.flightSuretyApp.address}); 

   // ASSERT
   assert.equal(result, false, "Insurance for first passenger at the specified flight should not have been registered because the amount bought exceeds 1 ether");

  });

});
