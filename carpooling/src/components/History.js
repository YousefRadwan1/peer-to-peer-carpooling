import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { getRideHistory, getRideDetails } from '../api';

const RideHistory = ({ account }) => {
    const [rideHistory, setRideHistory] = useState([]);

    useEffect(() => {
        const fetchRideHistory = async () => {
            try {
                const history = await getRideHistory(account.toLowerCase());
                const historyRideDetails = await Promise.all(history.map(async (rideId) => {
                    const rideDetails = await getRideDetails(rideId);
                    return {
                        id: rideId,
                        startPoint: rideDetails[2],
                        endPoint: rideDetails[3],
                        fare: rideDetails[4],
                        startTime: new Date(Number(rideDetails[5]) * 1000).toLocaleString(),
                        isActive: rideDetails[8].toString(),
                        numOfPassengers: rideDetails[7].toString(),
                    };
                }));
                setRideHistory(historyRideDetails);
            } catch (error) {
                console.error('Error fetching ride history:', error);
            }
        };

        fetchRideHistory();
    }, [account]);

    return (
        <div className='container'>
            <h2>Ride History</h2>
            {rideHistory.length > 0 ? (
                rideHistory.slice().reverse().map((ride, index) => (
                    <Card key={index} style={{ width: '28rem', margin: '5px' }}>
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <Card.Title>{ride.startPoint} - {ride.endPoint}</Card.Title>
                                <Card.Text>
                                    Start Time: {ride.startTime}
                                </Card.Text>
                            </div>
                            <div>
                                <Card.Text>
                                    Fare: {ride.fare} ETH
                                </Card.Text>
                                <Card.Text>
                                    Active: {ride.isActive}
                                </Card.Text>
                                <Card.Text>
                                    Passengers: {ride.numOfPassengers}
                                </Card.Text>
                            </div>
                        </Card.Body>
                    </Card>
                ))
            ) : (
                <p className="text-center fs-5">No ride history found</p>
            )}
        </div>
    );
};

export default RideHistory;
