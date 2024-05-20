import React, { useEffect, useState } from 'react';

import { getCreatedRides, getRideDetails, getJoinedRides, getNumOfPendings, arrivedRide, checkPassengerInPendings, checkPassengerInList , cancelRide, getEventListener, confirmDeclined} from '../api'; // Đảm bảo bạn đã triển khai hàm getJoinedRides trong tệp api.js
import { Card, Button } from 'react-bootstrap';

const YourRides = ({ account, handleTabChange, setSelectedRideId }) => {
  const [createdRides, setCreatedRides] = useState([]);
  const [joinedRides, setJoinedRides] = useState([]);
  const [fetch, setFetch] = useState(false);
  const [fetchCreated, setFetchCreated] = useState(false);
  const [fetchJoined, setFetchJoined] = useState(false);
  const processRide = (rideId) => {
    setSelectedRideId(rideId);
    handleTabChange('process');
  };
  async function handleArrivedRide (rideId) {
    try {
      await arrivedRide(rideId, account);
      // setFetch(true);
      setFetchJoined(true);
    }
    catch (error){
      console.log("Error when arrive");

    }
  }
  async function handleCancelRide(rideId) {
    try {
      await  cancelRide(rideId, account);
      // setFetch(true);
      setFetchJoined(true);
    }
    catch (error) {
      console.log('Error when cancelling ride', error.message);
    }
  }
  async function handleConfirmDeclined(rideId){
    try {
      await confirmDeclined(rideId, account);
      setFetchJoined(true);
    }
    catch (error) {
      console.log('Error when confirm declined', error.message);
    }
  }
  const fetchCreatedRides = async () => {
    const createdRideIds = await getCreatedRides(account);
    const createdRidesData = await Promise.all(createdRideIds.map(async (rideId) => {
      const rideDetails = await getRideDetails(rideId);
      const numOfPendings = await getNumOfPendings(rideId);
      return {
        id: rideId,
        startPoint: rideDetails[2],
        endPoint: rideDetails[3],
        fare: rideDetails[4],
        startTime: new Date(Number(rideDetails[5]) * 1000).toLocaleString(),
        isActive: rideDetails[8].toString(),
        numOfPassengers: rideDetails[7].toString(),
      numOfPendings: numOfPendings.toString()
      };
    }));
    setCreatedRides(createdRidesData);
    setFetchCreated(false);
    
  };
  const fetchJoinedRides = async () => {
    const joinedRideIds = await getJoinedRides(account);
    const joinedRidesData = await Promise.all(joinedRideIds.map(async (rideId) => {
      const rideDetails = await getRideDetails(rideId);
      // kiểm tra xem còn trong pending không
      const isPending = await checkPassengerInPendings(account, rideId);
      const isPassenger = await checkPassengerInList(account, rideId);
      console.log('isPending' ,isPending, 'isPassenger', isPassenger);
      return {
        id: rideId,
        startPoint: rideDetails[2],
        endPoint: rideDetails[3],
        fare: rideDetails[4],
        startTime: new Date(Number(rideDetails[5]) * 1000).toLocaleString(),
        isActive: rideDetails[8],
        numOfPassengers: rideDetails[7].toString(),
        isPending: isPending,
        isPassenger: isPassenger
      };
    }));
    setJoinedRides(joinedRidesData);
  }

  
  // useEffect(() => {
  //   const fetchData = async () => {
      
  //     try {
  //       console.log('getRideOf', account);
  //       const createdRideIds = await getCreatedRides(account);
  //       const joinedRideIds = await getJoinedRides(account);

  //       const createdRidesData = await Promise.all(createdRideIds.map(async (rideId) => {
  //         const rideDetails = await getRideDetails(rideId);
  //         const numOfPendings = await getNumOfPendings(rideId);
  //         return {
  //           id: rideId,
  //           startPoint: rideDetails[2],
  //           endPoint: rideDetails[3],
  //           fare: rideDetails[4],
  //           startTime: new Date(Number(rideDetails[5]) * 1000).toLocaleString(),
  //           isActive: rideDetails[8].toString(),
  //           numOfPassengers: rideDetails[7].toString(),
  //          numOfPendings: numOfPendings.toString()
  //         };
  //       }));

  //       const joinedRidesData = await Promise.all(joinedRideIds.map(async (rideId) => {
  //         const rideDetails = await getRideDetails(rideId);
  //         // kiểm tra xem còn trong pending không
  //         const isPending = await checkPassengerInPendings(account, rideId);
  //         const isPassenger = await checkPassengerInList(account, rideId);
  //         console.log(isPending);
  //         return {
  //           id: rideId,
  //           startPoint: rideDetails[2],
  //           endPoint: rideDetails[3],
  //           fare: rideDetails[4],
  //           startTime: new Date(Number(rideDetails[5]) * 1000).toLocaleString(),
  //           isActive: rideDetails[8],
  //           numOfPassengers: rideDetails[7].toString(),
  //           isPending: isPending,
  //           isPassenger: isPassenger
  //         };
  //       }));

  //       setCreatedRides(createdRidesData);
  //       setJoinedRides(joinedRidesData);
  //       setFetch(false);
  //     } catch (error) {
  //       console.error('Error fetching rides:', error);
  //     }
  //   };


  //   fetchData();
  // }, [account, setSelectedRideId, fetch]);
  //Lần đầu, nạp lại cả danh sách chuyến tạo và danh sách chuyến tham gia
  useEffect(() => {
    console.log(account);
    fetchCreatedRides();
    fetchJoinedRides();
    // lắng nghe sự kiện có người join, hoặc được accept, hoặc bị từ chối
    const listenToEvent = async() =>{
      console.log('PassengerJoined listener added');
      const listener = await getEventListener();
      // lắng nghe sự kiện có người join
      listener.on("PassengerJoined", (rideId, passenger, phoneNumber, numOfPeople, driver) => {
        let data={driver};
        //console.log('driver', data, 'account', account);
        console.log('PassengerJoined event emitted');
        if (account.toLowerCase() === driver.toLowerCase())setFetchCreated(true);
      })
      // lắng nghe sự kiện được tài xế chấp nhận
      listener.on("PassengerAccepted", (rideId, passenger)=>{
          let data = {rideId, passenger};
          console.log(data);
          
          console.log('PassengerAccept event emitted');
          if(account === passenger.toLowerCase()) setFetchJoined(true);
      }); 
      // lắng nghe event bị từ chối bởi tài xế
      listener.on("PassengerDeclined", (rideId, passenger)=>{
        let data = {rideId, passenger};
        console.log(data);
        
        console.log('PassengerDeclined event emitted');
        if(account === passenger.toLowerCase()) setFetchJoined(true);
    }); 

    }
    listenToEvent();
  },[])
  useEffect(() => {
    fetchCreatedRides();
  }, [fetchCreated]);  
  useEffect(()=>{
    fetchJoinedRides();
    setFetchJoined(false);
  }, [fetchJoined]);
  return (
    <div className='container'>
      <h2 className='h2'>Your Rides:</h2>
      <h3 className='h3'>Created Rides: </h3>
      <div className="row">
        {createdRides.slice().reverse().map((ride, index) => (
          <div key={index} className="col-md-4 mb-3">
            <Card>
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title>From: {ride.startPoint}</Card.Title>
                  <Card.Text>
                    To: {ride.endPoint}<br />
                    Time: {ride.startTime}<br />
                    Status: {ride.isActive ==='true' ? 'Active' : 'Inactive'}<br />
                    Passengers: {ride.numOfPassengers} - Pendings: {ride.numOfPendings}
                  </Card.Text>
                </div>
                <Button onClick={() => processRide(ride.id) } variant="primary">
                  Process
                </Button>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
      <h3 className='h3'>Joined Rides: </h3>
      <div className="row">
        {joinedRides.slice().reverse().map((ride, index) => (
          <div key={index} className="col-md-4 mb-3">
          <Card>
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <Card.Title>From: {ride.startPoint}</Card.Title>
                <Card.Text>
                  To: {ride.endPoint}<br />
                  Time: {ride.startTime}<br />
                  Status: {ride.isActive ? 'Active' : 'Inactive'}<br />
                  Number of passengers: {ride.numOfPassengers}
                </Card.Text>
              </div>
              {/* Kiểm tra nếu ride đang pending, hiển thị nút Pending và nút Cancel */}
              {ride.isPending ? (
                  <div className="d-flex flex-column">
                  <Button variant="secondary" style={{ marginBottom: '5px' }} disabled>Pending</Button>
                  <Button onClick={() => handleCancelRide(ride.id)} variant="danger" className="my-auto">
                    Cancel
                  </Button>
                </div>
             
              ) : (
                // Kiểm tra nếu ride đã isPassenger, chỉ hiển thị nút Arrive
                ride.isPassenger ? (
                  <Button onClick={() => handleArrivedRide(ride.id)} variant="success" className="ml-auto">
                    Arrived
                  </Button>
                ) : (
                  // Nếu ride không phải là pending và không phải đã isPassenger, hiển thị nút Complete
                  <div className="d-flex flex-column ">
                    <Button variant="secondary" disabled style={{ marginBottom: '5px' }}>Declined</Button>
                    <Button variant="primary" onClick= {() => handleConfirmDeclined(ride.id)} className="ml-auto">
                      Complete
                    </Button>
                  </div>
                )
              )}
            </Card.Body>
          </Card>

          </div>
        ))}
      </div>
    </div>
  );
};

export default YourRides;