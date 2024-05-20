import './App.css';
import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Welcome from './components/Welcome';
import Home from './components/Home';

function App() {
  const [walletAddress, setWalletAddress] = useState("");

  const requestAccount = async () => {
    console.log('Requesting account...');
    if (window.ethereum) {
      console.log('Detected');
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
      } catch (error) {
        console.log('Error connecting with MetaMask');
      }
    } else {
      console.log('MetaMask not detected');
      window.alert('Please install MetaMask');
    }
  };

  const connectWallet = async () => {
    await requestAccount();
  };

  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <div className=''>
      {walletAddress === "" ? (
        <div>
          <header className="App-header">
            <h3>Carpooling</h3>
            <Button variant="primary" onClick={connectWallet}>Connect Wallet</Button>
          </header>
        </div>
      ) : (
        <Home walletAddress={walletAddress} />
      )}
    </div>
  );
}

export default App;
