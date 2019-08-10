pragma solidity ^0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // EMG - Variable that references the FlightSuretyData contract
    FlightSuretyData flightSuretyData;

    // Flight status codes
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    // EMG - Variable that indicates the number of airlines that can be registered without multiparty
    // consensus.
    uint private constant NUMBER_OF_INITIAL_AIRLINES = 4;

    // EMG - Passengers may pay up to 1 ether for purchasing flight insurance
    uint private constant MAX_FLIGHT_INSURANCE_PRICE = 1 ether;

    // EMG - array to keep track of all the addresses that have called
    address[] multiCalls = new address[](0);

    address private contractOwner;          // Account used to deploy contract

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
         // Modify to call data contract's status
         // EMG - The data contract's status is called here
        require(flightSuretyData.isOperational(), "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "DataContractOwner" account to be the function caller
    */
    modifier requireDataContractOwner()
    {
        address dataContractOwner = flightSuretyData.getDataContractOwner();
        require(msg.sender == dataContractOwner, "Caller is not data contract owner");
        _;
    }
    // EMG - Modifier that requires that an airline is not registered
    modifier requireAirlineNotRegistered(address airline)
    {
        require(!flightSuretyData.airlineIsRegistered(airline), "Airline is already registered");
        _;
    }

    // EMG - Modifier that requires that an airline is registered
    modifier requireAirlineRegistered(address airline)
    {
        require(flightSuretyData.airlineIsRegistered(airline), "Airline is not registered");
        _;
    }

    // EMG - Modifier that requires that an airline is funded
    modifier requireAirlineFunded(address airline)
    {
        require(flightSuretyData.airlineIsFunded(airline), "Airline is not funded");
        _;
    }

    // EMG - Modifier that requires that a flight is registered
    modifier requireFlightRegistered(address airline, string memory flightNumber, uint256 timestamp)
    {
        require(flightSuretyData.flightIsRegistered(airline, flightNumber, timestamp), "Flight is already registered");
        _;
    }

    // EMG - Modifier that requires that a flight is not registered
    modifier requireFlightNotRegistered(address airline, string memory flightNumber, uint256 timestamp)
    {
        require(!flightSuretyData.flightIsRegistered(airline, flightNumber, timestamp), "Flight is already registered");
        _;
    }

    // EMG - Modifier that requires that an insurance is registered
    modifier requireInsuranceNotRegistered(address passenger, address airline, string memory flightNumber, uint256 timestamp)
    {
        require(!flightSuretyData.insuranceIsRegistered(passenger, airline, flightNumber, timestamp), "Insurance is already registered");
        _;
    }

    // EMG - Modifier that requires that an insurance is not registered
    modifier requireInsuranceRegistered(address passenger, address airline, string memory flightNumber, uint256 timestamp)
    {
        require(flightSuretyData.insuranceIsRegistered(passenger, airline, flightNumber, timestamp), "Insurance is not registered");
        _;
    }

    // EMG - Modifier that requires that an insurance has not been paid
    modifier requireInsuranceHasNotBeenPaid(address passenger, address airline, string memory flightNumber, uint256 timestamp)
    {
        require(!flightSuretyData.insuranceHasBeenPaid(passenger, airline, flightNumber, timestamp), "Insurance has already been paid");
        _;
    }

    // EMG - Modifier that requires that an insurance has not been paid
    modifier requireStatusCodeLateAirline(uint8 statusCode)
    {
        require(statusCode == STATUS_CODE_LATE_AIRLINE, "Status code must be late airline, but it is not");
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    // EMG - address where this contract can find the data contract (FlightSuretyData)
    constructor
                                (
                                    address dataContract
                                )
                                public
    {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(dataContract);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational()
                            public
                            view
                            returns(bool)
    {
        // EMG - The data contract's status is called here
        return flightSuretyData.isOperational();  // Modify to call data contract's status
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
                            public
                            requireDataContractOwner()
    {
        flightSuretyData.setOperatingStatus(mode);
    }

    // EMG - Function to obtain the balance of an address
    function getBalance
                        (
                            address account
                        )
                            public
                            view
                            returns(uint256)
    {
        // EMG - The data contract's status is called here
        return account.balance;  // Modify to call data contract's status
    }

    function airlineIsFunded
                            (
                                address airline
                            )
                            public
                            view
                            returns(bool)
    {
        return flightSuretyData.airlineIsFunded(airline);
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


   /**
    * @dev Add an airline to the registration queue
    *
    */
    function registerAirline
                            (
                                address airline
                            )
                            external
                            // EMG - It is not possible to register an airline that has already been registered
                            requireAirlineNotRegistered(airline)
                            // EMG - The airline that supports the registration of another airline must be
                            // be funded, which in turn ensures it has already been registered
                            requireAirlineFunded(msg.sender)
                            // EMG - Operational control status for state changing function
                            requireIsOperational()
    {
        require(msg.sender != airline, "Airline is trying to register itself");
        // EMG - Up until NUMBER_OF_INITIAL_AIRLINES, the airlines are registered without voting
        if (flightSuretyData.numberOfRegisteredAirlines() < NUMBER_OF_INITIAL_AIRLINES) {
            flightSuretyData.registerAirline(airline);
        } else {
            // Double-voting must be avoided
            bool isDuplicate = false;
            for(uint c = 0; c < multiCalls.length; c++) {
                if (multiCalls[c] == msg.sender) {
                    isDuplicate = true;
                    break;
                }
            }
            require(!isDuplicate, "Caller has already voted");

            multiCalls.push(msg.sender);
            //EMG - 50% of airlines have voted for the registration of this particular airline
            uint fiftyPerCent = flightSuretyData.numberOfRegisteredAirlines().div(2);
            if (multiCalls.length >= fiftyPerCent) {
                flightSuretyData.registerAirline(airline);
                multiCalls = new address[](0);
            }
        }
    }

    // EMG - Funds are initially transferred to the App contract, and then from the App contract
    // to the Data contract
    // Any amount of funds are admitted. However, an airline will be considered funded only when the
    // amount contributed is greater than or equal to 10 ether
    function fund
                            (
                            )
                            public
                            payable
                            requireAirlineRegistered(msg.sender)
                            // EMG - Operational control status for state changing function
                            requireIsOperational()

    {
        // EMG - You can see at this link the general syntax for calling a function in another contract with
        // arguments and sending funds
        // https://ethereum.stackexchange.com/questions/9705/how-can-you-call-a-payable-function-in-another-contract-with-arguments-and-send/9722
        flightSuretyData.fund.value(msg.value)(msg.sender);
    }

   /**
    * @dev Register a future flight for insuring.
    *
    */
    // EMG - Flight numbers and timestamps are fixed and defined in the Dapp client
    function registerFlight
                                (
                                    string memory flightNumber,
                                    uint256 timestamp
                                )
                                public
                                // EMG - The airline that registers the flight must be funded. Airlines that are
                                // not funded cannot participate in the contract
                                requireAirlineFunded(msg.sender)
                                // EMG - The flight to be registered must not have been already registered
                                requireFlightNotRegistered(msg.sender, flightNumber, timestamp)
                                // EMG - Operational control status for state changing function
                                requireIsOperational()
    {
        flightSuretyData.registerFlight(msg.sender, flightNumber, timestamp);
    }

    // EMG - Passenger buys flight insurance
    // EMG - The maximum price a passenger can pay to insure a flight is established at 1 ether
    function buy
                                (   address airline,
                                    string memory flightNumber,
                                    uint256 timestamp
                                )
                                public
                                payable
                                // EMG - The insurance to be bought must not have been already registered
                                requireInsuranceNotRegistered(msg.sender, airline, flightNumber, timestamp)
                                // EMG - Operational control status for state changing function
                                requireIsOperational()
    {
        require(msg.value <= MAX_FLIGHT_INSURANCE_PRICE, "Insurance price paid by passenger must not exceed maximum established");
        require(flightSuretyData.flightIsRegistered(airline, flightNumber, timestamp),
                "The insurance to be bought must refer to a registered flight");
        flightSuretyData.buy.value(msg.value)(msg.sender, airline, flightNumber, timestamp);
    }

   /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus
                                (
                                    address airline,
                                    string memory flight,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
                                internal
                                // EMG - Operational control status for state changing function
                                requireIsOperational()
    {
        if (statusCode == STATUS_CODE_LATE_AIRLINE) {
            flightSuretyData.processFlightStatus(airline, flight, timestamp);
        }
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                address airline,
                                string flightNumber,
                                uint256 timestamp
                            )
                            public
                            // EMG - The insurance to be paid must have been registered
                            requireInsuranceRegistered(msg.sender, airline, flightNumber, timestamp)
                            // EMG - The insurance to be paid must not have been already paid
                            requireInsuranceHasNotBeenPaid(msg.sender, airline, flightNumber, timestamp)
                            // EMG - Operational control status for state changing function
                            requireIsOperational()
    {
        flightSuretyData.pay(msg.sender, airline, flightNumber, timestamp);
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string flightNumber,
                            uint256 timestamp
                        )
                        external
                        // EMG - Operational control status for state changing function
                        requireIsOperational()
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flightNumber, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flightNumber, timestamp);
    }


// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
                            // EMG - Operational control status for state changing function
                            requireIsOperational()
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
                        // EMG - Operational control status for state changing function
                        requireIsOperational()
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");

        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (
                                address account
                            )
                            internal
                            returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        // EMG - The contribution of the nonce is changed so that it adds variation not only when registering
        // oracles, but also when called from fetch flight status
        // uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce), account))) % maxValue);
        nonce = nonce + 2;

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}

// EMG - Declaration of an interface that allows FlightSuretyApp contract to call functions from FlightSuretyData
// contract
contract FlightSuretyData {
    function isOperational()
                            public
                            view
                            returns(bool);
    function setOperatingStatus
                            (
                                bool mode
                            )
                            external;
    function getDataContractOwner
                            (
                            )
                            external
                            view
                            returns(address);
    function numberOfRegisteredAirlines
                            (
                            )
                            external
                            view
                            returns(uint256);
    function airlineIsRegistered
                            (
                                address airline
                            )
                            external
                            view
                            returns(bool);
    function registerAirline
                            (
                                address airline
                            )
                            external;
    function fund
                            (
                                address airline
                            )
                            public
                            payable;
    function airlineIsFunded
                            (
                                address airline
                            )
                            external
                            view
                            returns(bool);
    function registerFlight
                                (
                                    address airline,
                                    string flightNumber,
                                    uint256 timestamp
                                )
                                external;
    function flightIsRegistered
                            (
                                address airline,
                                string flightNumber,
                                uint256 timestamp
                            )
                            external
                            view
                            returns(bool);
    function buy
                            (
                                address passenger,
                                address airline,
                                string flightNumber,
                                uint256 timestamp
                            )
                            external
                            payable;
    function insuranceIsRegistered
                            (
                                address passenger,
                                address airline,
                                string flightNumber,
                                uint256 timestamp
                            )
                            external
                            view
                            returns(bool);
    function insuranceHasBeenPaid
                            (
                                address passenger,
                                address airline,
                                string flightNumber,
                                uint256 timestamp
                            )
                            external
                            view
                            returns(bool);
    function processFlightStatus
                                (
                                    address airline,
                                    string flight,
                                    uint256 timestamp
                                )
                                external;
    function pay
                            (
                                address passenger,
                                address airline,
                                string flightNumber,
                                uint256 timestamp
                            )
                            external;
}
