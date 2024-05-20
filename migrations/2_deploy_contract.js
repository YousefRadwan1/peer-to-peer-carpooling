var RideContract = artifacts.require("./RideContract.sol");

module.exports = function(deployer) {
  deployer.deploy(RideContract);
};
