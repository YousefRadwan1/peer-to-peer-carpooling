import React, { useEffect } from 'react';
import Web3 from 'web3';

function MetamaskConnect({ renderWithAccount }) {
  useEffect(() => {
    const connectMetamask = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          // Request account access from MetaMask
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const account = accounts[0];
          // Initialize web3 using window.ethereum
          window.web3 = new Web3(window.ethereum);
          renderWithAccount(account); // Call callback to pass the account
        } catch (error) {
          console.error('User denied account access');
        }
      } else if (typeof window.web3 !== 'undefined' && typeof window.web3.currentProvider !== 'undefined') {
        // Use current web3 provider if MetaMask is not available
        window.web3 = new Web3(window.web3.currentProvider);
        const accounts = await window.web3.eth.getAccounts();
        const account = accounts[0];
        renderWithAccount(account); // Call callback to pass the account
      } else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
        renderWithAccount(null); // No account if MetaMask is not detected
      }
    };

    connectMetamask();
  }, [renderWithAccount]);

  return null; // No need to render anything from this component
}

export default MetamaskConnect;
