pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // EMG - A mapping to have the authorized contracts that can call the Data contract.
    mapping(address => uint256) authorizedCallers;

    // EMG - Initial funding for the insurance is 10 ether
    uint private constant INITIAL_FUNDING = 10 ether;

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    // EMG - data structure for the airlines
    struct Airline {
        address airline;
        bool isRegistered;
        uint256 fundsProvided;
    }
    mapping(address => Airline) private airlines;

    // EMG - array to store the registered airlines
    address[] private registeredAirlines = new address[](0);

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        // EMG - These are the passengers of the flight that have bought an insurance
        address[] passengers;
    }
    mapping(bytes32 => Flight) private flights;

    // EMG - data structure for the insurances
    struct Insurance {
        bool isRegistered;
        bool hasBeenPaid;
        uint256 amountBought;
        uint256 amountPaid;
    }
    // EMG - mapping from passenger-flight to insurance
    mapping(bytes32 => Insurance) private insurances;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                )
                                public
    {
        contractOwner = msg.sender;
        // EMG - The first airline is registered as part of the initial deployment of the contract
        airlines[msg.sender] = Airline({
            airline: msg.sender,
            isRegistered: true,
            fundsProvided: 0
        });
        registeredAirlines.push(msg.sender);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    // EMG - A modifier to make sure the caller is authorized to call functions that require that
    modifier isCallerAuthorized()
    {
        require(authorizedCallers[msg.sender] == 1, "Caller is not authorized");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    // EMG - A function to authorize a contract to call the Data contract, and another one to deauthorize
    function authorizeCaller(address dataContract) external requireContractOwner {
        authorizedCallers[dataContract] = 1;
    }

    function deauthorizeCaller(address dataContract) external requireContractOwner {
        delete authorizedCallers[dataContract];
    }

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            isCallerAuthorized()
                            returns(bool)
    {
        return operational;
    }

    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus
                            (
                                bool mode
                            )
                            external
                            requireContractOwner()
    {
        operational = mode;
    }

    function getDataContractOwner
                            (
                            )
                            external
                            view
                            isCallerAuthorized()
                            returns(address)
    {
        return contractOwner;
    }

    // EMG - This is a helper function that can be used for such purposes as testing modifiers
    function setTestingMode
                            (
                            )
                            public
                            view
                            requireIsOperational()
    {
    }

    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    // EMG - This function returns the number of airlines currently registered
    function numberOfRegisteredAirlines
                            (
                            )
                            external
                            view
                            isCallerAuthorized()
                            returns(uint256)
    {
        return registeredAirlines.length;
    }

    // EMG - This function returns whether an airline is registered
    function airlineIsRegistered
                            (
                                address airline
                            )
                            external
                            view
                            isCallerAuthorized()
                            returns(bool)
    {
        return airlines[airline].isRegistered;
    }

    // EMG - This function returns whether an airline is funded (i.e., whether it has already provided the contract
    // with 10 ether or more
    function airlineIsFunded
                            (
                                address airline
                            )
                            external
                            view
                            isCallerAuthorized()
                            returns(bool)
    {
        return (airlines[airline].fundsProvided >= INITIAL_FUNDING);
    }

    // EMG - This function returns whether a flight is registered
    function flightIsRegistered
                            (
                                address airline,
                                string flightNumber,
                                uint256 timestamp
                            )
                            external
                            view
                            isCallerAuthorized()
                            returns(bool)
    {
        bytes32 flightKey = getFlightKey(airline, flightNumber, timestamp);
        return (flights[flightKey].isRegistered);
    }

    // EMG - This function returns whether an insurance is registered
    function insuranceIsRegistered
                            (
                                address passenger,
                                address airline,
                                string flightNumber,
                                uint256 timestamp
                            )
                            external
                            view
                            isCallerAuthorized()
                            returns(bool)
    {
        bytes32 insuranceKey = getInsuranceKey(passenger, airline, flightNumber, timestamp);
        return (insurances[insuranceKey].isRegistered);
    }

    // EMG - This function returns whether an insurance has been paid
    function insuranceHasBeenPaid
                            (
                                address passenger,
                                address airline,
                                string flightNumber,
                                uint256 timestamp
                            )
                            external
                            view
                            isCallerAuthorized()
                            returns(bool)
    {
        bytes32 insuranceKey = getInsuranceKey(passenger, airline, flightNumber, timestamp);
        return (insurances[insuranceKey].hasBeenPaid);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline
                            (
                                address airline
                            )
                            external
                            // EMG - Can only be called from FlightSuretyApp contract
                            isCallerAuthorized()
    {
        airlines[airline] = Airline({
            airline: airline,
            isRegistered: true,
            fundsProvided: 0
        });
        registeredAirlines.push(airline);
    }

    /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    // EMG - A registered airline can provide as many funds as it wants. However, it is not going to be
    // considered funded until the amount provided is greater than or equal to 10 ether
    function fund
                            (
                                address airline
                            )
                            public
                            payable
                            isCallerAuthorized()
    {
        require(airlines[airline].isRegistered, "Airline is not registered");
        airlines[airline].fundsProvided = airlines[airline].fundsProvided.add(msg.value);
    }

    function registerFlight
                                (
                                    address airline,
                                    string flightNumber,
                                    uint256 timestamp
                                )
                                external
                                isCallerAuthorized()
    {
        bytes32 flightKey = getFlightKey(airline, flightNumber, timestamp);
        // EMG - STATUS_CODE_UNKNOWN = 0
        flights[flightKey] = Flight({
            isRegistered: true,
            statusCode: 0,
            passengers: new address[](0)
        });
    }

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy
                            (
                                address passenger,
                                address airline,
                                string flightNumber,
                                uint256 timestamp
                            )
                            external
                            payable
                            isCallerAuthorized()
    {
        bytes32 insuranceKey = getInsuranceKey(passenger, airline, flightNumber, timestamp);
        insurances[insuranceKey] = Insurance({
            isRegistered: true,
            hasBeenPaid: false,
            amountBought: msg.value,
            amountPaid: 0
        });
        // The insured passenger is included within the list of insured passengers of the flight
        bytes32 flightKey = getFlightKey(airline, flightNumber, timestamp);
        flights[flightKey].passengers.push(passenger);
    }

    /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus
                                (
                                    address airline,
                                    string flightNumber,
                                    uint256 timestamp
                                )
                                external
                                isCallerAuthorized()
    {
        creditInsurees(airline, flightNumber, timestamp);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    address airline,
                                    string memory flightNumber,
                                    uint256 timestamp
                                )
                                internal
    {
        bytes32 flightKey = getFlightKey(airline, flightNumber, timestamp);
        for(uint c = 0; c < flights[flightKey].passengers.length; c++) {
            bytes32 insuranceKey = getInsuranceKey(flights[flightKey].passengers[c], airline,
                                                    flightNumber, timestamp);
            // The passenger is credited 1.5X the amount they paid
            insurances[insuranceKey].amountPaid = insurances[insuranceKey].amountBought.mul(3).div(2);
        }
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                address passenger,
                                address airline,
                                string flightNumber,
                                uint256 timestamp
                            )
                            external
                            isCallerAuthorized()
    {
        bytes32 insuranceKey = getInsuranceKey(passenger, airline, flightNumber, timestamp);
        insurances[insuranceKey].hasBeenPaid = true;
        passenger.transfer(insurances[insuranceKey].amountPaid);
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flightNumber,
                            uint256 timestamp
                        )
                        internal
                        pure
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flightNumber, timestamp));
    }

    // EMG - Calculation of the key of the insurances mapping
    function getInsuranceKey
                        (
                            address passenger,
                            address airline,
                            string memory flightNumber,
                            uint256 timestamp
                        )
                        internal
                        pure
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(passenger, airline, flightNumber, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    // EMG - Even though it is not the intended procedure to provide funds to the Data contract,
    // it is possible to call the fallback function in the Data Contract. This will cause the fund
    // function to be executed
    function()
                            external
                            payable
    {
        fund(msg.sender);
    }


}

