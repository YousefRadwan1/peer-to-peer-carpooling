import React, { useEffect } from 'react';
import logo from '../logo.svg';
import '../App.css';
import Button from 'react-bootstrap/Button';

function Welcome({ connectWallet }) {
  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <h3>Carpooling</h3>
      <Button variant="primary" onClick={connectWallet}>Connect Wallet</Button>{' '}
    </header>
  );
}

export default Welcome;
