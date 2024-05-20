import React, { useState, useEffect } from 'react';
import { getPendingPassengers, acceptPassenger, getPassenger, completeRide, getRideDetails, declinePassenger, getEventListener } from '../api';
import { Table, Button } from 'react-bootstrap';

const ProcessRide = ({ account, rideId, handleTabChange }) => {
  const [pendingPassengers, setPendingPassengers] = useState([]);
  const [acceptedPassengers, setAcceptedPassengers] = useState([]);
  const [rideStatus, setRideStatus] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pending = await getPendingPassengers(rideId);
        const accepted = await getPassenger(rideId);
        const ride = await getRideDetails(rideId);

        setPendingPassengers(pending);
        setAcceptedPassengers(accepted);
        setRideStatus(ride.isActive.toString());
      } catch (error) {
        console.error('Error fetching pending passengers:', error);
      }
    };

    const listenToEvent = async () => {
      const listener = await getEventListener();
      listener.on("PassengerArrived", (_rideId, passenger) => {
        if (rideId === _rideId) fetchData();
      });
      listener.on("PassengerJoined", (_rideId, passenger, phoneNumber, numOfPeople, driver) => {
        if (rideId === _rideId) fetchData();
      });
      listener.on("PassengerCancelled", (_rideId, _passenger) => {
        if (rideId === _rideId) fetchData();
      });
    };

    fetchData();
    listenToEvent();
  }, [rideId, rideStatus]); // Fixed dependency array

  const handleAccept = async (index) => {
    try {
      await acceptPassenger(rideId, index, account);
      const updatedPassengers = [...pendingPassengers];
      updatedPassengers.splice(index, 1);
      setPendingPassengers(updatedPassengers);
      const accepted = await getPassenger(rideId);
      setAcceptedPassengers(accepted);
    } catch (error) {
      console.error('Error accepting passenger:', error);
    }
  };

  const handleDecline = async (passengerIndex) => { // Removed passengerAddress parameter
    try {
      await declinePassenger(rideId, passengerIndex, account);
      const updatedPassengers = pendingPassengers.filter((_, index) => index !== passengerIndex);
      setPendingPassengers(updatedPassengers);
    } catch (error) {
      console.error('Error declining passenger:', error);
    }
  };

  const handleCompleteRide = async () => {
    try {
      await completeRide(rideId, account);
      setRideStatus('false'); // Changed to string 'false'
      handleTabChange('home');
    } catch (error) {
      console.error('Failed to complete ride:', error); // Added colon
    }
  };

  const handleBack = () => { // Removed async keyword
    handleTabChange('home');
  };

  return (
    <div className='container'>
      <Button variant="primary" style={{ marginTop: '1rem', marginRight: '.5rem' }} onClick={() => handleBack()}>Back</Button>
      {rideStatus === 'true' && (
        <Button variant="primary" onClick={() => handleCompleteRide(rideId)} style={{ marginTop: '1rem' }}>Complete Ride</Button>
      )}

      <h2 className='h2'>Pending ({pendingPassengers.length})</h2>
      {pendingPassengers.length > 0 && (
        <>
          <Table hover>
            <thead>
              <tr>
                <th>Phone Number</th>
                <th>Number of People</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingPassengers.map((passenger, index) => (
                <tr key={index}>
                  <td>{passenger.phoneNumber}</td>
                  <td>{passenger.numOfPeople.toString()}</td>
                  <td>
                    <Button variant="success" onClick={() => handleAccept(index)}>Accept</Button>{' '}
                    <Button variant="danger" onClick={() => handleDecline(index)}>Decline</Button> {/* Changed to pass index only */}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <hr />
        </>
      )}
      <h2 className='h2'>Accepted ({acceptedPassengers.length})</h2>

      {acceptedPassengers.length > 0 && (
        <>
          <Table hover>
            <thead>
              <tr>
                <th>Phone Number</th>
                <th>Number of People</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {acceptedPassengers.map((passenger, index) => (
                <tr key={index}>
                  <td>{passenger.phoneNumber}</td>
                  <td>{passenger.numOfPeople.toString()}</td>
                  <td>
                    {passenger.arrived ? 'Arrived' : 'On ride'}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
};

export default ProcessRide;
