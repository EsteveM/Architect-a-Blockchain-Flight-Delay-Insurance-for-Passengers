import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // *****************************************************
        // First section: Check Operational Status of Contract *
        // *****************************************************
        display('display-check-operational-status', '1) Check Operational Status of Contract', 'Check if contract is operational', [ { label: 'Operational Status', error: null, value: ''} ]);
        
        // User-submitted transaction
        DOM.elid('check-operational-status').addEventListener('click', () => {
            contract.isOperational((error, result) => {
                console.log(error,result);
                display('display-check-operational-status', '1) Check Operational Status of Contract', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
                let alertMessage = ((error == null) ? String(result) : String(error));
                window.alert(`Operational Status of Contract is ${alertMessage}`);
            });
        });

        // ***********************************************
        // Second section: Purchase insurance for flight *
        // ***********************************************
        // Display dialog box to user of the system for the first time
        display('display-purchase-insurance', '2) Purchase insurance for flight', 'A passenger buys an insurance for a flight. The maximum price a passenger can pay to insure a flight is established at 1 ether', [ { label: 'Insurance Purchase result is', error: null, value: ''} ]);
        
        // Display the dropdown that shows the available flight options to the user for the first time
        removeSelectOptions('purchase-insurance-flight');
        let counter = 0;
        while(counter < contract.flights.length) {
            displaySelect('purchase-insurance-flight', `${contract.flights[counter].airline} - ${contract.flights[counter].flightNumber} - ${contract.flights[counter].timestamp}`);
            counter = counter + 1;
        }
        DOM.elid('purchase-insurance-airline').value = contract.flights[DOM.elid('purchase-insurance-flight').selectedIndex].airline;
        DOM.elid('purchase-insurance-flightNumber').value = contract.flights[DOM.elid('purchase-insurance-flight').selectedIndex].flightNumber;
        DOM.elid('purchase-insurance-timestamp').value = contract.flights[DOM.elid('purchase-insurance-flight').selectedIndex].timestamp;

        // Update the dropdown each time it gets focus
        DOM.elid('purchase-insurance-flight').addEventListener('focus', () => {
            removeSelectOptions('purchase-insurance-flight');
            let counter = 0;
            while(counter < contract.flights.length) {
                displaySelect('purchase-insurance-flight', `${contract.flights[counter].airline} - ${contract.flights[counter].flightNumber} - ${contract.flights[counter].timestamp}`);
                counter = counter + 1;
            }
        });

        // Update the individual flight fields each time the flight field changes
        DOM.elid('purchase-insurance-flight').addEventListener('change', () => {
            DOM.elid('purchase-insurance-airline').value = contract.flights[DOM.elid('purchase-insurance-flight').selectedIndex].airline;
            DOM.elid('purchase-insurance-flightNumber').value = contract.flights[DOM.elid('purchase-insurance-flight').selectedIndex].flightNumber;
            DOM.elid('purchase-insurance-timestamp').value = contract.flights[DOM.elid('purchase-insurance-flight').selectedIndex].timestamp;
        });

        // Display the dropdown that shows the available passengers to the user for the first time
        removeSelectOptions('purchase-insurance-passenger');
        counter = 0;
        while(counter < contract.passengers.length) {
            displaySelect('purchase-insurance-passenger', `${contract.passengers[counter]}`);
            counter = counter + 1;
        }
        DOM.elid('purchase-insurance-passenger').value = contract.passengers[DOM.elid('purchase-insurance-passenger').selectedIndex];

        // Update the dropdown each time it gets focus
        DOM.elid('purchase-insurance-passenger').addEventListener('focus', () => {
            removeSelectOptions('purchase-insurance-passenger');
            let counter = 0;
            while(counter < contract.passengers.length) {
                displaySelect('purchase-insurance-passenger', `${contract.passengers[counter]}`);
                counter = counter + 1;
            }
        });

        // User-submitted transaction
        DOM.elid('purchase-insurance').addEventListener('click', () => {
            let passenger = contract.passengers[DOM.elid('purchase-insurance-passenger').selectedIndex];
            let airline = contract.flights[DOM.elid('purchase-insurance-flight').selectedIndex].airline;
            let flightNumber = contract.flights[DOM.elid('purchase-insurance-flight').selectedIndex].flightNumber;
            let timestamp = contract.flights[DOM.elid('purchase-insurance-flight').selectedIndex].timestamp;
            let amount = contract.web3.utils.toWei(DOM.elid('purchase-insurance-amount').value, "ether");
            contract.buy(passenger, airline, flightNumber, timestamp, amount, (error, result) => {
                console.log(error,result);
                display('display-purchase-insurance', '2) Purchase insurance for flight', 'A passenger buys an insurance for a flight. The maximum price a passenger can pay to insure a flight is established at 1 ether', [ { label: 'Purchase Insurance', error: error, value: `Insurance successfully purchased`} ]);
                let alertMessage = ((!error) ? `Insurance successfully purchased` : String(error));
                window.alert(`Purchase Insurance returns ${alertMessage}`);
            });
        });

        // ***********************************************
        // Third section: Fetch Flight Status            *
        // ***********************************************
        // Display dialog box to user of the system for the first time
        display('display-fetch-flight-status', '3) Fetch Flight Status', 'A passenger can request a flight status update. In this way, a request is sent to oracles to fetch flight information', [ { label: 'Fetch Flight Status Update result is', error: null, value: ''} ]);
        
        // Display the dropdown that shows the available flight options to the user for the first time
        removeSelectOptions('fetch-flight-status-flight');
        counter = 0;
        while(counter < contract.flights.length) {
            displaySelect('fetch-flight-status-flight', `${contract.flights[counter].airline} - ${contract.flights[counter].flightNumber} - ${contract.flights[counter].timestamp}`);
            counter = counter + 1;
        }
        DOM.elid('fetch-flight-status-airline').value = contract.flights[DOM.elid('fetch-flight-status-flight').selectedIndex].airline;
        DOM.elid('fetch-flight-status-flightNumber').value = contract.flights[DOM.elid('fetch-flight-status-flight').selectedIndex].flightNumber;
        DOM.elid('fetch-flight-status-timestamp').value = contract.flights[DOM.elid('fetch-flight-status-flight').selectedIndex].timestamp;

        // Update the dropdown each time it gets focus
        DOM.elid('fetch-flight-status-flight').addEventListener('focus', () => {
            removeSelectOptions('fetch-flight-status-flight');
            let counter = 0;
            while(counter < contract.flights.length) {
                displaySelect('fetch-flight-status-flight', `${contract.flights[counter].airline} - ${contract.flights[counter].flightNumber} - ${contract.flights[counter].timestamp}`);
                counter = counter + 1;
            }
        });

        // Update the individual flight fields each time the flight field changes
        DOM.elid('fetch-flight-status-flight').addEventListener('change', () => {
            DOM.elid('fetch-flight-status-airline').value = contract.flights[DOM.elid('fetch-flight-status-flight').selectedIndex].airline;
            DOM.elid('fetch-flight-status-flightNumber').value = contract.flights[DOM.elid('fetch-flight-status-flight').selectedIndex].flightNumber;
            DOM.elid('fetch-flight-status-timestamp').value = contract.flights[DOM.elid('fetch-flight-status-flight').selectedIndex].timestamp;
        });

        // Display the dropdown that shows the available passengers to the user for the first time
        removeSelectOptions('fetch-flight-status-passenger');
        counter = 0;
        while(counter < contract.passengers.length) {
            displaySelect('fetch-flight-status-passenger', `${contract.passengers[counter]}`);
            counter = counter + 1;
        }
        DOM.elid('fetch-flight-status-passenger').value = contract.passengers[DOM.elid('fetch-flight-status-passenger').selectedIndex];

        // Update the dropdown each time it gets focus
        DOM.elid('fetch-flight-status-passenger').addEventListener('focus', () => {
            removeSelectOptions('fetch-flight-status-passenger');
            let counter = 0;
            while(counter < contract.passengers.length) {
                displaySelect('fetch-flight-status-passenger', `${contract.passengers[counter]}`);
                counter = counter + 1;
            }
        });

        // User-submitted transaction
        DOM.elid('fetch-flight-status').addEventListener('click', () => {
            let passenger = contract.passengers[DOM.elid('fetch-flight-status-passenger').selectedIndex];
            let airline = contract.flights[DOM.elid('fetch-flight-status-flight').selectedIndex].airline;
            let flightNumber = contract.flights[DOM.elid('fetch-flight-status-flight').selectedIndex].flightNumber;
            let timestamp = contract.flights[DOM.elid('fetch-flight-status-flight').selectedIndex].timestamp;
            contract.fetchFlightStatus(passenger, airline, flightNumber, timestamp, (error, result) => {
                console.log(error,result);
                display('display-fetch-flight-status', '3) Fetch Flight Status', 'A passenger can request a flight status update. In this way, a request is sent to oracles to fetch flight information', [ { label: 'Fetch Flight Status', error: error, value: `Fetch Flight Status request successfully sent to oracles`} ]);
                let alertMessage = ((!error) ? `Fetch Flight Status request successfully sent to oracles` : String(error));
                window.alert(`Fetch Flight Status returns ${alertMessage}`);
            });
        });

    
        // ***********************************************
        // Fourth section: Insurance payout for flight   *
        // ***********************************************
        // Display dialog box to user of the system for the first time
        display('display-insurance-payout', '4) Insurance payout for flight', 'A passenger can withdraw the funds owed to them as a result of receiving credit for insurance payout. They are paid 1.5X the amount they paid', [ { label: 'Insurance Payout result is', error: null, value: ''} ]);
        
        // Display the dropdown that shows the available flight options to the user for the first time
        removeSelectOptions('insurance-payout-flight');
        counter = 0;
        while(counter < contract.flights.length) {
            displaySelect('insurance-payout-flight', `${contract.flights[counter].airline} - ${contract.flights[counter].flightNumber} - ${contract.flights[counter].timestamp}`);
            counter = counter + 1;
        }
        DOM.elid('insurance-payout-airline').value = contract.flights[DOM.elid('insurance-payout-flight').selectedIndex].airline;
        DOM.elid('insurance-payout-flightNumber').value = contract.flights[DOM.elid('insurance-payout-flight').selectedIndex].flightNumber;
        DOM.elid('insurance-payout-timestamp').value = contract.flights[DOM.elid('insurance-payout-flight').selectedIndex].timestamp;

        // Update the dropdown each time it gets focus
        DOM.elid('insurance-payout-flight').addEventListener('focus', () => {
            removeSelectOptions('insurance-payout-flight');
            let counter = 0;
            while(counter < contract.flights.length) {
                displaySelect('insurance-payout-flight', `${contract.flights[counter].airline} - ${contract.flights[counter].flightNumber} - ${contract.flights[counter].timestamp}`);
                counter = counter + 1;
            }
        });

        // Update the individual flight fields each time the flight field changes
        DOM.elid('insurance-payout-flight').addEventListener('change', () => {
            DOM.elid('insurance-payout-airline').value = contract.flights[DOM.elid('insurance-payout-flight').selectedIndex].airline;
            DOM.elid('insurance-payout-flightNumber').value = contract.flights[DOM.elid('insurance-payout-flight').selectedIndex].flightNumber;
            DOM.elid('insurance-payout-timestamp').value = contract.flights[DOM.elid('insurance-payout-flight').selectedIndex].timestamp;
        });

        // Display the dropdown that shows the available passengers to the user for the first time
        removeSelectOptions('insurance-payout-passenger');
        counter = 0;
        while(counter < contract.passengers.length) {
            displaySelect('insurance-payout-passenger', `${contract.passengers[counter]}`);
            counter = counter + 1;
        }
        DOM.elid('insurance-payout-passenger').value = contract.passengers[DOM.elid('insurance-payout-passenger').selectedIndex];

        // Update the dropdown each time it gets focus
        DOM.elid('insurance-payout-passenger').addEventListener('focus', () => {
            removeSelectOptions('insurance-payout-passenger');
            let counter = 0;
            while(counter < contract.passengers.length) {
                displaySelect('insurance-payout-passenger', `${contract.passengers[counter]}`);
                counter = counter + 1;
            }
        });

        // User-submitted transaction
        DOM.elid('insurance-payout').addEventListener('click', () => {
            let passenger = contract.passengers[DOM.elid('insurance-payout-passenger').selectedIndex];
            let airline = contract.flights[DOM.elid('insurance-payout-flight').selectedIndex].airline;
            let flightNumber = contract.flights[DOM.elid('insurance-payout-flight').selectedIndex].flightNumber;
            let timestamp = contract.flights[DOM.elid('insurance-payout-flight').selectedIndex].timestamp;
            contract.pay(passenger, airline, flightNumber, timestamp, (error, result) => {
                console.log(error,result);
                display('display-insurance-payout', '4) Insurance payout for flight', 'A passenger can withdraw the funds owed to them as a result of receiving credit for insurance payout. They are paid 1.5X the amount they paid', [ { label: 'Purchase Insurance', error: error, value: `Insurance payout successfully transferred to passenger`} ]);
                let alertMessage = ((!error) ? `Insurance payout successfully transferred to passenger` : String(error));
                window.alert(`Insurance Payout returns ${alertMessage}`);
            });
        });


    });
    

})();


function display(elId, title, description, results) {
    let displayDiv = DOM.elid(elId);

    // EMG - To allow for repeated updates of the section, all section elements are deleted first
    // See https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
    while (displayDiv.firstChild) {
        displayDiv.removeChild(displayDiv.firstChild);
    }

    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}

// EMG - Function to remove the options of a select
function removeSelectOptions(elId) {
    let select = DOM.elid(elId);

    // EMG - To allow for repeated updates of the section, all section elements are deleted first
    // See https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
    while (select.firstChild) {
        select.removeChild(select.firstChild);
    }
}

// EMG - Function to add an option to a select
// See Select add() method at https://www.w3schools.com/jsref/met_select_add.asp
function displaySelect(elId, title) {
    let select = DOM.elid(elId);

    let option = document.createElement("option");
    option.text = title;
    option.value = title;
    select.add(option);
}







