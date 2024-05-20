import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Modal, Button } from 'react-bootstrap';
import RideContract from '../contracts/RideContract.json';
import SearchLocation from './SearchLocation';

function CreateRide({ account, handleTabChange }) {
    const [startPoint, setStartPoint] = useState('');
    const [endPoint, setEndPoint] = useState('');
    const [fare, setFare] = useState(0);
    const [startTime, setStartTime] = useState('');
    const [numOfSeats, setNumOfSeats] = useState(0);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [contract, setContract] = useState(null);
    
    const now = new Date();
    const formattedNow = now.toISOString().slice(0, 16);

    useEffect(() => {
        const loadWeb3 = async () => {
            if (window.ethereum) {
                const web3 = new Web3(window.ethereum);
                const networkId = await web3.eth.net.getId();
                const deployedNetwork = RideContract.networks[networkId];
                const contractInstance = new web3.eth.Contract(
                    RideContract.abi,
                    deployedNetwork && deployedNetwork.address
                );
                setContract(contractInstance);
            } else {
                alert('Please install MetaMask to use this application.');
            }
        };
        loadWeb3();
    }, []);

    const handleCheckYourRideList = () => {
        setShowSuccessModal(false);
        handleTabChange('home');
    };

    const handleClose = () => setShowSuccessModal(false);

    const handleCreateRide = async () => {
        console.log('startPoint:', startPoint);
        console.log('endPoint:', endPoint);
        console.log('fare:', fare);
        console.log('startTime:', startTime);
        console.log('numOfSeats:', numOfSeats);

        // Ensure fare and numOfSeats are numbers and greater than 0
        if (!startPoint || !endPoint || !fare || fare <= 0 || !startTime || !numOfSeats || numOfSeats <= 0) {
            alert('Please fill in all required fields.');
            return;
        }
        try {
            if (!contract) {
                alert('Contract not initialized. Please check your MetaMask connection.');
                return;
            }
            const startTimeUnix = Math.floor(new Date(startTime).getTime() / 1000);
            await contract.methods.createRide(startPoint, endPoint, fare, startTimeUnix, numOfSeats).send({ from: account });
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error creating ride:', error);
            alert('Failed to create ride. Please try again.');
        }
    };

    return (
        <div>
            <h2>Create Ride</h2>
            <div className="row">
                <div className="col-md-6">
                    <label>From:</label>
                    <SearchLocation setLocation={setStartPoint} />
                </div>
                <div className="col-md-6">
                    <label>To:</label>
                    <SearchLocation setLocation={setEndPoint} />
                </div>
            </div>
            <div className="row">
                <div className="col-md-6">
                    <label>Fare:</label>
                    <input
                        type="number"
                        className="form-control"
                        required
                        value={fare}
                        min="0"
                        onChange={(e) => setFare(Number(e.target.value))}
                    />
                </div>
                <div className="col-md-6">
                    <label>Start Time:</label>
                    <input
                        type="datetime-local"
                        className="form-control"
                        required
                        value={startTime}
                        min={formattedNow}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                </div>
            </div>
            <div className="row">
                <div className="col-md-6">
                    <label>Number of Seats:</label>
                    <input
                        type="number"
                        className="form-control"
                        required
                        value={numOfSeats}
                        min="1"
                        onChange={(e) => setNumOfSeats(Number(e.target.value))}
                    />
                </div>
            </div>
            <button className="btn btn-primary mt-3" onClick={handleCreateRide}>
                Create Ride
            </button>
            <Modal show={showSuccessModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Ride Created Successfully</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Your ride has been created successfully!</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleCheckYourRideList}>
                        Check Your Ride List
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default CreateRide;
