// SPDX-License-Identifier: MIT
//pragma solidity >=0.4.22 <0.9.0;
pragma solidity ^0.5.0;
contract RideContract {
    uint public rideCount;
    uint public balanceChangeCounter;

    struct Ride {
        uint id; 
        address payable driver; 
        string startPoint; //departure
        string endPoint;    //destination
        uint256 fare;   
        uint256 startTime;
        uint numOfSeats; 
        uint numOfPassengers; 
        address payable[] passengers;
        bool isActive;
    }
  
    //cấu trúc thông tin khách hàng
    struct Passenger {
        address payable addr; 
        string phoneNumber;
        uint numOfPeople ; 
        uint256 verificationCode;
        bool arrived; 
      

    }


    struct BalanceChange {
        address user;           
        int256 amount;          
        int256 balanceBefore;   
        int256 balanceAfter;    
        uint256 timestamp;      
        string description;     
    }


    mapping(address => uint[]) private createdRides; 
    mapping(address => uint[]) private joinedRides; 
    mapping(address => uint[]) private history;
    mapping(uint => Ride) public rides;
    mapping(uint =>  Passenger []) public passengers;
    mapping(uint => Passenger[]) public pendingPassengers;
    mapping(uint => uint) public numOfPendings; 
    mapping(address => uint[]) public balanceChangeHistory;
    mapping (uint => BalanceChange) public balanceChanges;
    // Mapping từng địa chỉ tài khoản đến số dư
    
    mapping(address => int256) public balances;


    event RideCreated(uint indexed rideId, address indexed driver, string startPoint, string endPoint, uint256 fare, uint256 startTime, uint numOfSeats);
    event PassengerJoined(uint indexed rideId, address indexed passenger, string phoneNumber, uint numOfPeople, address indexed driver);
    event PassengerCancelled(uint indexed rideId, address indexed passenger);
    event RideCompleted(uint indexed rideId, address indexed driver);
    event PassengerArrived(uint indexed rideId, address indexed passenger);
    event PassengerAccepted(uint indexed rideId, address indexed passenger);
    event PassengerDeclined(uint indexed rideId, address indexed passenger);
    // Khai báo sự kiện
    event BalanceChanged(address indexed account, int256 amount);



    constructor() public {
        // createRide("Start Point", "End Point", 100); 
        rideCount = 0;
        balanceChangeCounter = 0;
       
       
    }
    function getCreatedRides(address _driver) external view returns (uint[] memory) {
        return createdRides[_driver];
    }

    function getJoinedRides(address _passenger) external view returns (uint[] memory) {
        return joinedRides[_passenger];
    }
    function getRideDetails(uint _rideId) external view returns (string memory, string memory, uint256, uint256, bool, uint256, uint256) {
        require(_rideId > 0 && _rideId <= rideCount, "Invalid ride ID");
        Ride memory ride = rides[_rideId];
        return (ride.startPoint, ride.endPoint, ride.fare, ride.startTime, ride.isActive, ride.numOfSeats, ride.numOfPassengers);
    }
    function getHistory(address _account) external view returns (uint[] memory) {
        return history[_account];
    }

    function getBalanceChangeHistory(address _address) external view returns (uint[] memory) {
        return balanceChangeHistory[_address];
    }

    // function withdrawFunds(address payable _receiver, uint256 _amount) internal {
    // (bool success, ) = _receiver.call.value(_amount)("");
    // require(success, "Transfer failed.");
    // }

    function createRide(string calldata _startPoint, string calldata _endPoint, uint256 _fare, uint256 _startTime, uint _numOfSeats, int256 balance) external {
        require(_fare > 0, "Fare must be greater than zero");
        rideCount++; // Tăng số lượng chuyến xe

        Ride memory newRide;
        newRide.id = rideCount;
        newRide.driver = msg.sender;
        newRide.startPoint = _startPoint;
        newRide.endPoint = _endPoint;
        newRide.fare = _fare;
        newRide.startTime = _startTime;
        newRide.isActive = true;
        newRide.numOfSeats = _numOfSeats; 
        newRide.passengers ;
        newRide.numOfPassengers = 0;
        balances[msg.sender] = balance;
    }
    function joinPendingRide(uint _rideId, string memory _phoneNumber, uint256 _numberOfPeople, int256 balance) public payable{
        require(_rideId <= rideCount, "Invalid ride ID");
        require(msg.sender != rides[_rideId].driver, "Join Ride: This is driver address, the ride need a passenger join");
        //kiểm tra nếu còn đủ chỗ để thêm hành khách vào pending
        require(rides[_rideId].numOfPassengers < rides[_rideId].numOfSeats, "");
        //kiểm tra thêm hành khách đó đã nằm trong danh sách pending của chuyến đó chưa
        require(isPassengerInPendingList(_rideId, msg.sender)==uint(0), "Join Ride: Passenger is already in pending list");
        require(msg.value == _numberOfPeople*rides[_rideId].fare*1e18, "Incorrect fare amount");
         numOfPendings[_rideId]++; //tăng lượng khách trong danh sách chờ 
        pendingPassengers[_rideId].push(Passenger(msg.sender, _phoneNumber, _numberOfPeople, 0, false));
       
        joinedRides[msg.sender].push(_rideId);
        emit PassengerJoined(_rideId, msg.sender, _phoneNumber, _numberOfPeople,rides[_rideId].driver);
        addBalanceChange(msg.sender, -int256(msg.value), "Request for joining ride");

        balances[msg.sender] = balance;
    }
  
    function acceptPassenger(uint _rideId, uint _passengerIndex) public {
        require(_passengerIndex < pendingPassengers[_rideId].length, "Passenger index out of range");
        
        Passenger memory passenger = pendingPassengers[_rideId][_passengerIndex];
        //Đổi mã code
        uint256 randomCode = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, _rideId)));
        passenger.verificationCode = randomCode;
        rides[_rideId].passengers.push(passenger.addr);
        passengers[_rideId].push(passenger);
        rides[_rideId].numOfPassengers += passenger.numOfPeople;
         //xoá hành khách đó khỏi pendings
        numOfPendings[_rideId]--;
        pendingPassengers[_rideId][_passengerIndex] = pendingPassengers[_rideId][pendingPassengers[_rideId].length - 1];
        // Giảm độ dài của mảng đi một
        pendingPassengers[_rideId].pop();
        emit PassengerAccepted(_rideId, passenger.addr);
    }

    function declinePassenger(uint _rideId, uint _passengerIndex) public {
        require(_rideId <= rideCount, "Invalid ride ID");
        require(msg.sender == rides[_rideId].driver, "Only driver can call this function");
        //hoàn lại tiền cho hành khách đó
        Passenger memory passenger = pendingPassengers[_rideId][_passengerIndex];
        address payable passengerAddr = passenger.addr;
        uint totalFare = passenger.numOfPeople*rides[_rideId].fare*1e18;
        passengerAddr.transfer(totalFare);
        addBalanceChange(passengerAddr, int256(totalFare), "Joining request declined");
        numOfPendings[_rideId]--;
        pendingPassengers[_rideId][_passengerIndex] = pendingPassengers[_rideId][pendingPassengers[_rideId].length - 1];
        // Giảm độ dài của mảng đi một
        pendingPassengers[_rideId].pop();
        emit PassengerDeclined(_rideId, passenger.addr);
  
        
    }

    function cancelRide(uint256 _rideId,  address payable _pendingPassenger) external {
        //Hành khách đó còn nằm trong pending, nghĩa là chưa được tài xế chấp nhận
        uint pendingPassengerId = isPassengerInPendingList(_rideId, _pendingPassenger);
        require(pendingPassengerId != uint(0), "Passenger is not in the pending list "); 
         //trả lại tiền cho hành khách đó
         uint256  totalFare = rides[_rideId].fare*pendingPassengers[_rideId][pendingPassengerId-1].numOfPeople*1e18;
        (msg.sender).transfer(totalFare);
        
        addBalanceChange(msg.sender, int256(totalFare), "Cancel ride joining request");
       //phát sự kiện hành khách huỷ chuyến
        emit PassengerCancelled(_rideId, msg.sender);
         //xoá hành khách đó khỏi pendings
        numOfPendings[_rideId]--;
        pendingPassengers[_rideId][pendingPassengerId-1] = pendingPassengers[_rideId][pendingPassengers[_rideId].length - 1];
        // Giảm độ dài của mảng đi một
        pendingPassengers[_rideId].pop();

        removeRideFromList(joinedRides[msg.sender], _rideId);



    }
    function completeRide(uint256 _rideId) external {
        require(_rideId <= rideCount, "Invalid ride ID");
        require(msg.sender == rides[_rideId].driver, "Only driver can call this function");
        Ride storage ride = rides[_rideId];
        require(ride.isActive, "Ride is not active");

        

        // Deactivate ride
        ride.isActive = false;

        removeRideFromList(createdRides[msg.sender], _rideId);
        
        uint numOfArrivals = 0;
        for (uint i = 0; i < ride.passengers.length; i++) {
           if (passengers[_rideId][i].arrived) numOfArrivals +=passengers[_rideId][i].numOfPeople ;
           else {
                // Hoàn trả tiền cho hành khách trong chuyến xe nhưng không bấm arrive
                address payable passengerAddr = passengers[_rideId][i].addr;
                uint totalFare = rides[_rideId].fare*passengers[_rideId][i].numOfPeople*1e18;
                passengerAddr.transfer(totalFare);
                addBalanceChange(passengerAddr, int256(totalFare), "Join completed without arrival");

           }
           removeRideFromList(joinedRides[passengers[_rideId][i].addr], _rideId);
        }
        for(uint i = 0 ; i < pendingPassengers[_rideId].length ; i++){
            address payable passengerAddr = pendingPassengers[_rideId][i].addr;
            uint totalFare = pendingPassengers[_rideId][i].numOfPeople*rides[_rideId].fare*1e18;
            passengerAddr.transfer(totalFare);
            //thêm vào lịch sử biến động số dư
            addBalanceChange(passengerAddr, int256(totalFare), "Join completed");
            numOfPendings[_rideId]--;
            pendingPassengers[_rideId][i] = pendingPassengers[_rideId][pendingPassengers[_rideId].length - 1];
            pendingPassengers[_rideId].pop();
            emit PassengerDeclined(_rideId, passengerAddr);

        }

        uint256 totalFare = ride.fare * numOfArrivals *1e18;
        msg.sender.transfer(totalFare); 
        addBalanceChange(msg.sender, int256(totalFare), "Withdraw ride fare");
        
        history[msg.sender].push(_rideId);
        emit RideCompleted(_rideId, msg.sender);

    }
    function confirmDeclined(uint _rideId) external {
        removeRideFromList(joinedRides[msg.sender], _rideId);
    }
    function arrive(uint256 _rideId) external {
        
        for (uint i = 0; i < rides[_rideId].passengers.length; i++){
            if(passengers[_rideId][i].addr == msg.sender){
                passengers[_rideId][i].arrived =true;
            }
        }
        
        removeRideFromList(joinedRides[msg.sender], _rideId);


        history[msg.sender].push(_rideId);
       
        emit PassengerArrived(_rideId, msg.sender);


    }

    function generateVerificationCode() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % 9000 + 1000;
    }
    
    //2. Hàm tài xế chấp nhận hành khách và tạo mã xác nhận
    // function acceptPassenger(uint _rideId, address _passenger) public {
    //     Passenger storage passenger = pendingPassengers[_passenger][_rideId];
    //     require(!passenger.accepted, "Passenger already accepted");
    //     passenger.verificationCode = generateVerificationCode();
    //     passenger.accepted = true;
    // }
    //3. Driver từ chối hành khách
    // function rejectPendingPassenger(uint _rideId, address payable _passenger) public {
    //     // Kiểm tra xem người gọi hàm có phải là tài xế của chuyến đi không
    //     require(msg.sender == rides[_rideId].driver, "Only driver can reject pending passenger");

    //     // Kiểm tra xem hành khách có tồn tại trong danh sách hàng đợi không
    //     require(pendingPassengers[_passenger][_rideId].id == _rideId, "Passenger not found in pending list");

    //     // Hoàn trả tiền đã gửi của hành khách
    //     uint256 fareAmount = pendingPassengers[_passenger][_rideId].numOfPeople * rides[_rideId].fare * 1e18;
    //    withdrawFunds(_passenger, fareAmount);

    //     // Xóa hành khách khỏi danh sách hàng đợi
    //     delete pendingPassengers[_passenger][_rideId];
    // }

    //4. Hàm hành khách nhập mã xác nhận và tham gia chuyến đi
    // function enterVerificationCode(uint _rideId, uint256 _verificationCode) public {
    //     Passenger storage passenger = pendingPassengers[msg.sender][_rideId];
    //     require(passenger.accepted, "Passenger not accepted yet");
    //     require(passenger.verificationCode == _verificationCode, "Incorrect verification code");
    //     // Thêm hành khách vào danh sách của chuyến đi
    //     addPassenger(_rideId, passenger.phoneNumber, passenger.numOfPeople);
    //     // Xóa thông tin hành khách khỏi danh sách pending
    //     delete pendingPassengers[msg.sender][_rideId];
    // }

    
    // Hàm này bỏ
    //khi người dùng nhấn join vào chuyến có thể đi
    function joinRide(uint256 _rideId) external payable {
        require(_rideId <= rideCount, "Invalid ride ID");
        require(msg.sender != rides[_rideId].driver, "Join Ride: This is driver address, the ride need a passenger join");
        //kiểm tra nếu còn đủ chỗ để thêm hành khách vapf 
        require(rides[_rideId].numOfPassengers < rides[_rideId].numOfSeats, "");
        require(msg.value == rides[_rideId].fare*1e18, "Incorrect fare amount");
        
        // thêm tài khoản của hành khách vào danh sách hành khách của chuyến
        rides[_rideId].passengers.push(msg.sender);
        rides[_rideId].numOfPassengers ++ ; 

       
        // Thêm chuyến xe vào danh sách chuyến đi đã tham gia của hành khách
        joinedRides[msg.sender].push(_rideId);
        


    }

    
    function getPassengers(uint rideId) external view returns (address payable[] memory) {
        require(rideId <= rideCount, "Invalid ride ID");
        return rides[rideId].passengers;
    }

    // Hàm để xoá một chuyến đi khỏi một danh sách chuyến đi
    function removeRideFromList(uint[] storage list, uint256 _rideId) private {
        for (uint i = 0; i < list.length; i++) {
            if (list[i] == _rideId) {
                list[i] = list[list.length - 1];
                delete list[list.length - 1];
                list.pop();
                break;
            }
        }
    }

    // Kiểm tra xem một hành khách đã nằm trong danh sách pending của chuyến đi đó chưa để tránh join 2 lần
    function isPassengerInPendingList(uint _rideId, address _passengerAddress) public view returns(uint) {
        uint i;
        for ( i = 0; i < pendingPassengers[_rideId].length; i++) {
            if (pendingPassengers[_rideId][i].addr== _passengerAddress) {
                return i+1; // Hành khách đã nằm trong danh sách pending
            }
        }
        return uint(0); // Hành khách chưa nằm trong danh sách pending
    }
    
    // Kiểm tra xem một hành khách đã nằm trong danh sách khách của chuyến đi đó
    function isPassengerInList(uint _rideId, address _passengerAddress) public view returns(uint) {
        uint i;
        for ( i = 0; i < passengers[_rideId].length; i++) {
            if (passengers[_rideId][i].addr== _passengerAddress) {
                return i+1; // Hành khách đã nằm trong danh sách pending
            }
        }
        return uint(0); // Hành khách chưa nằm trong danh sách pending
    }

    // Hàm để thêm lịch sử thay đổi số dư
    function addBalanceChange(address _user, int256 _amount, string memory _description) internal {
        // Thêm số tiền đã thay đổi vào số dư của tài khoản
        balances[_user] += _amount;
        
        balanceChangeCounter ++;
        // Ghi lại lịch sử thay đổi số dư
        balanceChangeHistory[_user].push(balanceChangeCounter);
        balanceChanges[balanceChangeCounter] =  BalanceChange({
            user: _user,
            amount: _amount,
            balanceBefore: balances[_user] - _amount,
            balanceAfter: balances[_user],
            timestamp: block.timestamp,
            description: _description
           
        });
        emit BalanceChanged(_user, _amount);
    }
    
    
}
