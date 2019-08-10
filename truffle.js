var HDWalletProvider = require("truffle-hdwallet-provider");
// EMG - command used on the shell terminal prompt to run ganache-cli:
// ganache-cli -l 9999999 -a 200 -e 50000 -m "hurt clarify capable blade concert put grief vivid empower never trip ball"
const fs = require('./secret-parameters.js');
//var mnemonic = "route cost desert lamp level museum supply siege action help ignore shed";
var mnemonic = fs.mnemonic;

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 200);
      },
      network_id: '*',
      gas: 9999999
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};