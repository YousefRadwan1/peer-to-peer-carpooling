// JoinRide.js

import React, { useState, useEffect } from 'react';
import { getAvailableRides, joinPendingRide, getEventListener} from '../api';
import { Card, Button, Modal, Form } from 'react-bootstrap';


const JoinRide = ({ account, handleTabChange }) => {
    const [show, setShow] = useState(false);
    const [availableRides, setAvailableRides] = useState([]);
    const [selectedRide, setSelectedRide] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [numOfPeople, setNumOfPeople] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false); 
    const handleCloseSuccessModal = () => setShowSuccessModal(false);
    const handleShowSuccessModal = () => setShowSuccessModal(true); 

    const handleCheckYourRideList = () => {
        handleCloseSuccessModal(); // 
        handleTabChange('home'); // 
    };
    const handleClose = () => setShow(false);
    const handleShow = async() => setShow(true);

    useEffect(() => {
        
   
        const fetchAvailableRides = async () => {
            
            try {
                
               // console.log('join account', account);
                const rides = await getAvailableRides(account);
                setAvailableRides(rides);
                //console.log(rides);
            } catch (error) {
                console.error('Error fetching available rides:', error);
            }
        };

        const listenToEvent = async() =>{
            const listener = await getEventListener();
            listener.on("RideCreated", (rideId, driver, startPoint, endPoint, fare, startTime,numOfSeats)=>{
                console.log('RideCreated event emitted');
                fetchAvailableRides();
            }); 
        }
        listenToEvent();
        fetchAvailableRides();
       

        
       
    }, [account]);

    const handleJoinRide = async() => {
        
        console.log('Joining ride:', selectedRide);
        console.log('Phone number:', phoneNumber);
        console.log('Number of passengers:', numOfPeople);
        try {
           
            await joinPendingRide(selectedRide.id, phoneNumber, numOfPeople, account, selectedRide.fare*numOfPeople);
            handleShowSuccessModal(); 
           //alert('Pending');

        } catch (error) {
            console.error('Error joining ride:', error);
            // Xử lý lỗi nếu có
        }
        //console.log('Joined ride successfully!');
        handleClose();
    };

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Join Ride</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="phoneNumber">
                        <Form.Label>Phone Number:</Form.Label>
                        <Form.Control type="text" placeholder="Enter your phone number" onChange={(e) => setPhoneNumber(e.target.value)} />
                    </Form.Group>
                    <Form.Group controlId="numOfPassengers">
                        <Form.Label>Number of Passengers:</Form.Label>
                        <Form.Control type="number" placeholder="Enter number of passengers"  min='1'      max={selectedRide ? Number(selectedRide.numOfSeats) - Number(selectedRide.numOfPassengers) : 0}  onChange={(e) => setNumOfPeople(e.target.value)} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleJoinRide}>
                        Join Ride
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showSuccessModal} onHide={handleCloseSuccessModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Ride Joined Successfully</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>You have successfully joined the ride!</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseSuccessModal}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleCheckYourRideList}>
                        Check Your Ride List
                    </Button>
                </Modal.Footer>
            </Modal>
            <div className="d-flex flex-wrap justify-content-center">
               {availableRides.length > 0 ? (
                    availableRides.slice().reverse().map((ride, index) => (
                        <Card key={index} style={{ width: '28rem', margin: '5px' }}>
                            <Card.Body className="d-flex justify-content-between align-items-center">
                                <div>
                                    <Card.Title>{ride.startPoint} - {ride.endPoint}</Card.Title>
                                    <Card.Text>
                                        Start Time: {ride.startTime}
                                        <br />
                                        Fare: ETH {ride.fare}
                                        <br />
                                        Seats Available: {Number(ride.numOfSeats) - Number(ride.numOfPassengers)}
                                    </Card.Text>
                                </div>
                                <Button variant="primary" onClick={() => { setSelectedRide(ride); handleShow(); }}>Join</Button>
                            </Card.Body>
                        </Card>
                    ))
                ) : (
                    <p className='text-center fs-5' style={{margin: '5px'}}>No available rides</p>
                )}
            </div>
            
        </>
    );
};

export default JoinRide;