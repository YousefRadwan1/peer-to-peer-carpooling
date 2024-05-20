import Web3 from 'web3';
import React, { useState, useEffect } from 'react';
import { getBalanceHistory, getCurrentBalance } from '../api';

const Balance = ({ account }) => {
    const [balanceChangeHistory, setBalanceChangeHistory] = useState([]);
    const [currentBalance, setCurrentBalance] = useState(0);

    useEffect(() => {
        const fetchBalanceHistory = async () => {
            try {
                const balanceChangeHistory = await getBalanceHistory(account);
                console.log('list', balanceChangeHistory.length);

                const formattedBalanceHistory = balanceChangeHistory.map(balanceChange => ({
                    user: balanceChange[0],
                    amount: balanceChange[1],
                    balanceBefore: balanceChange[2],
                    balanceAfter: balanceChange[3],
                    timestamp: balanceChange[4],
                    description: balanceChange[5]
                }));

                setBalanceChangeHistory(formattedBalanceHistory);
            } catch (error) {
                console.error("Error fetching balance history:", error);
            }
        };

        const fetchCurrentBalance = async () => {
            try {
                const balance = await getCurrentBalance(account);
                const balanceInEther = new Web3(window.ethereum).utils.fromWei(balance, 'ether');
                setCurrentBalance(balanceInEther);
            } catch (error) {
                console.error("Error fetching current balance:", error);
            }
        };

        fetchBalanceHistory();
        fetchCurrentBalance();
    }, [account]);

    return (
        <div className='container'>
            <h5>Balance: {currentBalance} ETH</h5>
            <div>
                <h4>Balance History:</h4>
                <div className="list-group">
                    {balanceChangeHistory.slice().reverse().map((change, index) => (
                        <div key={index} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-1">{change.description}</h5>
                                    <small className="text-muted">{new Date(Number(change.timestamp) * 1000).toLocaleString()}</small>
                                </div>
                                <span>{(Number(change.amount) / 1e18).toFixed(4)} ETH</span>
                            </div>
                            <small className="text-muted">Balance after: {(Number(change.balanceAfter) / 1e18).toFixed(4)} ETH</small>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Balance;
