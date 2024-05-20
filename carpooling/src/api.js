// api.js

import Web3 from 'web3';
import RideContract from './contracts/RideContract.json';
import {ethers} from "ethers"
const web3 = new Web3(window.ethereum);
const contractAddress = '0x6EAEE1b78eB2f36c6500eCA325831555aDB1eBB3';
const contractABI = RideContract.abi;
const networkId = await web3.eth.net.getId();
const deployedNetwork = await RideContract.networks[networkId];
const accounts = await web3.eth.getAccounts();
const currentAccount = await accounts[0];
const contract =new web3.eth.Contract(
  RideContract.abi,
  deployedNetwork && deployedNetwork.address
);
console.log('contract address',deployedNetwork.address);



export const createRide = async (startPoint, endPoint, fare, startTimeUnix, numOfSeats, account) => {
  try {
    const currentBalance = await getCurrentBalance(account); // Use account parameter directly
    console.log(currentBalance);
    await contract.methods.createRide(startPoint, endPoint, fare, startTimeUnix, numOfSeats, currentBalance).send({ from: account });
  } catch (error) {
    console.log("Error when creating ride: " + error.message);
  }
}

export const getCreatedRides = async (account) => {
  try {
    const createdRides = await contract.methods.getCreatedRides(account).call();
    return createdRides;
  } catch (error) {
    console.error('Error fetching created rides:', error);
    return [];
  }
};

export const getJoinedRides = async (account) => {
  try {
    const joinedRides = await contract.methods.getJoinedRides(account).call();
   // console.log(joinedRides);
    return joinedRides;
  } catch (error) {
    console.error('Error fetching joined rides:', error);
    return [];
  }
};

// Hàm lấy chi tiết của một chuyến đi từ hợp đồng thông minh
export const getRideDetails = async (rideId) => {
    try {
      // Gọi hàm rides trên hợp đồng thông minh để lấy thông tin chi tiết của chuyến đi
      console.log('ID from getRideDetails: ' + rideId);
      const rideDetails = await contract.methods.rides(rideId).call();
      console.log('Ride Detail: ' + rideDetails);
      // Trả về thông tin chi tiết của chuyến đi
      return rideDetails;
    } catch (error) {
      // Xử lý lỗi nếu có
      throw new Error('Error fetching ride details: ' + error.message);
    }
  };



// Hàm để lấy danh sách các chuyến đi có sẵn để tham gia
export const getAvailableRides = async (account) => {
  try {
      const totalRides = await contract.methods.rideCount().call(); // Hàm này cần phải được triển khai trong file api.js của bạn

      const availableRides = [];

      // Lặp qua tất cả các chuyến đi và kiểm tra xem chúng có sẵn để tham gia không
      for (let rideId = 1; rideId <= totalRides; rideId++) {
          const rideDetails = await getRideDetails(rideId); // Hàm này cũng cần phải được triển khai trong file api.js của bạn
          console.log('compare',account);
          if (rideDetails.isActive && rideDetails.numOfPassengers < rideDetails.numOfSeats && rideDetails.driver.toLowerCase() !== account) {
              availableRides.push({
                  id: rideId,
                  startPoint: rideDetails.startPoint,
                  endPoint: rideDetails.endPoint,
                  fare: rideDetails.fare.toString(),
                  startTime: new Date(Number(rideDetails.startTime) * 1000).toLocaleString(),
                  isActive: rideDetails.isActive,
                  numOfSeats: rideDetails.numOfSeats.toString(),
                  numOfPassengers: rideDetails.numOfPassengers
              });
          }
          console.log(rideDetails.driver);
      }
      
      return availableRides;
  } catch (error) {
      throw new Error('Error fetching available rides: ' + error.message);
  }
};


// Khi người dùng bấm join chuyến và nhập các thông tin
export const joinPendingRide = async (_rideId, _phoneNumber, _numberOfPeople, account, calculatedValue) => {
  try {
      //truyền vào số dư tài khoản người gửi
      const currentBalance = await getCurrentBalance(currentAccount);
      console.log(currentBalance);
      // Gọi hàm joinPendingRide từ smart contract
      await contract.methods.joinPendingRide(_rideId, _phoneNumber, _numberOfPeople, currentAccount).send({ from: account, value: calculatedValue*1e18 });
      // Xử lý sau khi join chuyến thành công
      console.log('Joined ride successfully!');
  } catch (error) {
      // Xử lý lỗi nếu có
      console.error('Error joining ride:', error);
  }
};

//xem danh sách pending của một chuyến đi 
export const getPendingPassengers = async (rideId) => {
  try {
      const pendingPassengers = [];
      const numOfPendings =  await contract.methods.numOfPendings(rideId).call();
      for (let i = 0; i< numOfPendings; i++){

        try{
          const passenger = await contract.methods.pendingPassengers(rideId,i).call();
          pendingPassengers.push(passenger);
        }
        catch (error){
          console.log('error when loading pending list', error.message);
        }
       
      }
      
      // Trả về danh sách tất cả các hành khách đang chờ
      return pendingPassengers;

  } catch (error) {
    throw new Error('Error fetching ride pending list: ' + error.message);
  }
};


//chấp nhận một hành khách
// Hàm để chấp nhận một hành khách vào chuyến đi
export const acceptPassenger = async (rideId, passengerIndex,account) => {
  try {
    await contract.methods.acceptPassenger(rideId, passengerIndex).send({ from: account}); // Thay 'yourAddress' bằng địa chỉ của bạn
    console.log('Passenger accepted successfully');
  } catch (error) {
    console.error('Error accepting passenger:', error);
    throw new Error('Error accepting passenger');
  }
};

// Hàm để chấp nhận một hành khách vào chuyến đi
export const declinePassenger = async (rideId, passengerIndex,account) => {
  try {
    console.log('decline rideID', rideId, 'index', passengerIndex );
    const addr =await contract.methods.pendingPassengers(rideId, passengerIndex).call();
    console.log('addr to refund:', addr.addr);
    await contract.methods.declinePassenger(rideId, passengerIndex).send({ from: account}); 
    console.log('Passenger declined successfully');
  } catch (error) {
    console.error('Error  decline passenger:', error);
    throw new Error('Error decline passenger');
  }
};
// Hàm để lấy thông tin của một hành khách từ danh sách pendingPassengers
export const getPassenger = async (rideId, passengerIndex) => {
    try {
      const passengers = [];
      const rideDetails = await contract.methods.rides(rideId).call();
      const numOfPassengers = rideDetails[7];
      console.log(numOfPassengers);
     
      for (let i = 0; i< numOfPassengers; i++){
       
        try{
          const passenger = await contract.methods.passengers(rideId,i).call();
          passengers.push(passenger);
        }
        catch (error){
          //Hết pending
        }
      }
      
      // Trả về danh sách tất cả các hành khách đang chờ
      return passengers;

  } catch (error) {
    throw new Error('Error fetching ride pending list: ' + error.message);
  }
};

//Hàm cancelRide cho hành khách đang ở trong pending có thể huỷ chuyến và lấy lại tiền
export const cancelRide = async (_rideId, account) => {
  try {
    await contract.methods.cancelRide(_rideId, account).send({ from: account}); 
  }
  catch (error) {
    throw new Error('Error cancelling ride' , error.message);
  }
}
//Hàm kết thúc chuyến đi
export const completeRide = async (_rideId, account) => {
  try {
   
    await contract.methods.completeRide(_rideId).send({ from: account});
    console.log('Ride completed');

  }
  catch (error) {
    throw new Error('Error when completing ride ' + error.message);
  }
}

//Khách hàng confirm là chuyến đã bị huỷ 
export const confirmDeclined = async (_rideId, account) => {
  try {
    await contract.methods.confirmDeclined(_rideId).send({from: account});
  }catch(error) {
    console.log(error.message);
    throw new Error ('Error when confirming decline');
  }
}
//Lấy ra số lượng pending của một chuyến đi 
export const getNumOfPendings = async (_rideId)=>{
  try {
    const numOfPendings = await contract.methods.numOfPendings(_rideId).call();
    return numOfPendings;
  }
  catch (error){
    throw new Error ('Error when getNumOfPendings');
  }
}
// khi hành khách bấm đến nơi => tài xế mới lấy được tiền
export const arrivedRide = async( _rideId, account) =>{
  try {
    await contract.methods.arrive(_rideId).send({from: account});
  }
  catch (error){
    throw new Error('Error when arrive Ride');
  }
}
//lấy lịch sử đi xe của một hành khách (bao gồm cả các chuyên đã tạo và các chuyến đã tham gia)
export const getRideHistory = async (account) => {
  try {
    const history = await contract.methods.getHistory(account).call();
    return history;
  } catch (error) {
    console.error('Error fetching history', error);
    return [];
  }
};

//kiểm tra một hành khách ở trong danh sách pendings 
export const checkPassengerInPendings = async (account, _rideId) => {
  try {
    const isPending = await contract.methods.isPassengerInPendingList(_rideId, account).call();
    console.log('isPending',isPending);
    if (isPending != 0) return true;
    return false;

  }
  catch (error){
    console.log('Error when checking pending list: ' + error.message);
  }
}

//check một tài khoản đã có trong danh sách hành khách của mmootj chuyến xe chưa
export const checkPassengerInList= async (account, _rideId) => {
  try {
    const isPassenger = await contract.methods.isPassengerInList(_rideId, account).call();
    console.log('isPassenger',isPassenger);
    if (isPassenger !=0) return true;
    return false;

  }
  catch (error){
    console.log('Error when checking passenger list: ' + error.message);
  }
}

//lấy lịch sử biến động số dư
export const getBalanceHistory  = async (account) => {
    // try {
    //   const history = await contract.methods.balanceChangeHistory(account,1).call();
    //   return history;
    // }
    // catch (error){
    //   console.log("Error when getting balance history" +  error.message);
    // }
    try {
      const balanceChanges = [];
      console.log('getting balance history');
      const balanceChangeIdList = await contract.methods.getBalanceChangeHistory(account).call() ;
      console.log('Balance chane History list', balanceChangeIdList);
      for (let i = 0; i< balanceChangeIdList.length; i++){
       
        try{
          
            
          const balanceChange =  await contract.methods.balanceChanges(balanceChangeIdList[i]).call();
          console.log('balancechange' + balanceChange[0]);
          balanceChanges.push(balanceChange);
        }
        catch (error){
          //Hết pending
          console.log('Error getting ' + error.message);
        }
      }
      // Trả về danh sách tất cả các hành khách đang chờ
      return balanceChanges;
    }catch(error){
      console.log("Error when getting balance history" +  error.message);
    }
}

export const getCurrentBalance = async (account) => {
  const balance = await window.ethereum.request({
    method: 'eth_getBalance',
    params: [account, 'latest'], // Truyền vào địa chỉ tài khoản và block number là 'latest'
  });
  const balanceInEther = web3.utils.fromWei(balance, 'ether'); // Chuyển đổi số dư từ wei sang ether
  return balance;
}

//các hàm lắng nghe sự kiện để update front-end

export const getEventListener = async() =>{
  console.log('listener added');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  //console.log('signer', signer);
  let subContract = new ethers.Contract(deployedNetwork.address, RideContract.abi,signer);
  return subContract;
}
