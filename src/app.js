App = {
  loading: false,
  contracts: {},
  account: null,
  rideContract: null,
  web3Provider: null,
  balance: 0, 



  load: async () => {
    await App.loadWeb3();
    await App.loadAccount();
    await App.loadContract();
    await App.render();
    await App.updateBalance();// Cập nhật số dư khi tải ứng dụng
    // Lấy thời gian hiện tại
    const now = new Date();

    // Định dạng thời gian hiện tại thành YYYY-MM-DDTHH:MM để có thể sử dụng trong thuộc tính "min" của input
    const formattedNow = now.toISOString().slice(0, 16);

    // Gán giá trị cho thuộc tính "min" của input
    document.getElementById("startDateTime").min = formattedNow;

  },

  loadWeb3: async () => {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = window.ethereum;
      web3 = new Web3(window.ethereum);
    } else {
      window.alert("Please connect to Metamask.");
    }

    if (window.ethereum) {
      //App.web3Provider = new Web3(ethereum);
      try {
        await ethereum.request({ method: 'eth_requestAccounts' })
       // web3.eth.sendTransaction({/*...*/});
      } catch (error) {
        console.error('User denied account access');
      }
    } else if (window.web3) {
      App.web3Provider = web3.currentProvider;
      window.web3 = new Web3(web3.currentProvider);
      web3.eth.sendTransaction({});
    } else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  },

  loadAccount: async () => {
    const accounts = await web3.eth.getAccounts();
    App.account = accounts[0];
    $('#account').html(`Account: ${App.account}`);
  },

  loadContract: async () => {
     
      const rideContracts = await $.getJSON('RideContract.json');
      App.contracts.RideContract = TruffleContract(rideContracts )
      App.contracts.RideContract.setProvider(App.web3Provider)

       // Hydrate the smart contract with values from the blockchain
      App.rideContracts  = await App.contracts.RideContract.deployed()
  },

  render: async () => {
    if (App.loading) {
      return;
    }
    App.setLoading(true);
    await App.renderRides();
    App.setLoading(false);
  },
  updateBalance: async () => {
      try {
        // Truy vấn số dư của tài khoản hiện tại
        const accounts = await window.web3.eth.getAccounts();
        const account = accounts[0];
        const balanceWei = await window.web3.eth.getBalance(account);
        const balanceEther = window.web3.utils.fromWei(balanceWei, 'ether');
        App.balance = parseFloat(balanceEther);
        $('#balance').html(`Balance: ${App.balance} ETH`);
        
      } catch (error) {
        console.error('Error updating balance:', error);
      }
    },
  renderRides: async () => {
    const rideCount = await App.rideContracts.rideCount()
    const $rideContractsList = $('#rideContracts');
    $rideContractsList.empty();

    // Render danh sách các ride contracts

    const $rideContractsTable = $('#rideContractsTable');
    $rideContractsTable.empty();

    // Create table header
    const $tableHeader = $('<thead>').addClass('thead-dark');
    $tableHeader.append($('<tr>').append(
        $('<th>').text('Start Point'),
        $('<th>').text('End Point'),
        $('<th>').text('Fare'),
        $('<th>').text('Start Time'),
        $('<th>').text('Status'),
        $('<th>').text('Number of Seats'),
        $('<th>').text('Passengers Joined'),
        $('<th>').text('Actions') // Thêm cột cho các hành động
    ));
    $rideContractsTable.append($tableHeader);

    // Create table body
    const $tableBody = $('<tbody>');
    for (var i = 1; i <= rideCount; i++) {
        const rideContract = await App.rideContracts.rides(i);

        // Convert start time from timestamp to formatted date
        const startTime = new Date(rideContract.startTime * 1000).toLocaleString();

        // Check availability
        const isAvailable = rideContract.isActive ? 'Available' : 'Not Available';

        
        

       
        // Create action button based on user's role
        let $actionButton;
        if (rideContract.isActive)
        if (rideContract.driver.toLowerCase() === App.account.toLowerCase()) {
            $actionButton = $('<button>').text('Complete').addClass('btn btn-primary btn-sm');
            $actionButton.click(() => App.completeRide(rideContract.id));
        } else {
            $actionButton = $('<button>').text('Join').addClass('btn btn-primary btn-sm');
            $actionButton.click(() => App.joinRide(rideContract.id, rideContract.fare));
        }
        const $row = $('<tr>').append(
            $('<td>').text(rideContract.startPoint),
            $('<td>').text(rideContract.endPoint),
            $('<td>').text(rideContract.fare),
            $('<td>').text(startTime),
            $('<td>').text(isAvailable),
            $('<td>').text(rideContract.numOfSeats),
            $('<td>').text(rideContract.numOfPassengers),
            $('<td>').append($actionButton) // Append action button to the row
            
        );
        $tableBody.append($row);
    }
    $rideContractsTable.append($tableBody);
  },
  // Render danh sách các ride contracts đã tạo
  renderCreatedRides: async() => {
    // Render danh sách các ride contracts đã tạo
    const createdRides = await App.rideContracts.getCreatedRides(App.account);
    const $createdRidesTable = $('#createdRidesTable');
    $createdRidesTable.empty();

    // Create table header for created rides
    const $tableHeaderCreated = $('<thead>').addClass('thead-dark');
    $tableHeaderCreated.append($('<tr>').append(
        $('<th>').text('Start Point'),
        $('<th>').text('End Point'),
        $('<th>').text('Fare'),
        $('<th>').text('Start Time'),
        $('<th>').text('Status'),
        $('<th>').text('Number of Seats'),
        $('<th>').text('Passengers Joined'),
        $('<th>').text('Actions') // Thêm cột cho các hành động
    ));
    $createdRidesTable.append($tableHeaderCreated);

    // Create table body for created rides
    const $tableBodyCreated = $('<tbody>');
    for (let i = 0; i < createdRides.length; i++) {
        const rideId = createdRides[i];
        const rideContract = await App.rideContracts.rides(rideId);

        // Convert start time from timestamp to formatted date
        const startTime = new Date(rideContract.startTime * 1000).toLocaleString();

        // Check availability
        const isAvailable = rideContract.isActive ? 'Available' : 'Not Available';

        // Create action button for completing ride
        const $actionButtonComplete = $('<button>').text('Complete').addClass('btn btn-primary btn-sm');
        $actionButtonComplete.click(() => App.completeRide(rideContract.id));

        const $row = $('<tr>').append(
            $('<td>').text(rideContract.startPoint),
            $('<td>').text(rideContract.endPoint),
            $('<td>').text(rideContract.fare),
            $('<td>').text(startTime),
            $('<td>').text(isAvailable),
            $('<td>').text(rideContract.numOfSeats),
            $('<td>').text(rideContract.numOfPassengers),
            $('<td>').append($actionButtonComplete) // Append action button to the row
        );
        $tableBodyCreated.append($row);
    }
    $createdRidesTable.append($tableBodyCreated);

  },
  

  createRide: async () => {
    App.setLoading(true);
    const startPoint = $('#startPoint').val();
    const endPoint = $('#endPoint').val();
    const fare = $('#fare').val();
    // Get the value of the start date and time input field
    const startDateTimeInput = document.getElementById('startDateTime').value;
    const numOfSeats = $('#numOfSeats').val();
    // Convert the start date and time to Unix timestamp
    const startTime = Math.floor(new Date(startDateTimeInput).getTime() / 1000);
    await App.rideContracts.createRide(startPoint, endPoint, fare, startTime, numOfSeats,{ from: App.account });
    window.location.reload();
  },
  joinPendingRide: async(rideId, phoneNumber, numberOfPeople, fare )=> {
    try {
      await App.rideContracts.joinPendingRide(rideId, phoneNumber, numberOfPeople, fare);
      alert('Your joining request is pending now!');
      await App.renderRides(); // Render the rides again after joining
      await App.updateBalance();// Cập nhật số dư khi tải ứng dụng
    } catch (error){
      console.error('Error joining ride:', error);
      alert('An error occurred while joining the ride. Please try again.');
    }
  },
  acceptRide: async (rideId) => {
    try {
      await App.rideContracts.acceptRideRequest(rideId);
      alert('The ride request has been accepted!');
      await App.renderRides(); // Render the rides again after accepting
      await App.updateBalance(); // Update the balance after accepting
    } catch (error) {
      console.error('Error accepting the ride request:', error);
      alert('An error occurred while accepting the ride request. Please try again.');
    }
  },
  
  rejectRide: async (rideId) => {
    try {
      await App.rideContracts.rejectRideRequest(rideId);
      alert('The ride request has been rejected!');
      await App.renderRides(); // Render the rides again after rejecting
      await App.updateBalance(); // Update the balance after rejecting
    } catch (error) {
      console.error('Error rejecting the ride request:', error);
      alert('An error occurred while rejecting the ride request. Please try again.');
    }
  },
  
  enterVerificationCode: async (rideId, verificationCode) => {
    try {
      await App.rideContracts.enterVerificationCode(rideId, verificationCode);
      alert('Verification code entered successfully!');
      await App.renderRides(); // Render the rides again after entering verification code
      await App.updateBalance(); // Update the balance after entering verification code
    } catch (error) {
      console.error('Error entering verification code:', error);
      alert('An error occurred while entering verification code. Please try again.');
    }
  },
  
  joinRide: async (rideId, fare) => {
    try {
        await App.rideContracts.joinRide(rideId,   { from: App.account, value:  numOfPassengers*fare*1e18}); // Pass any required parameters
        alert('Successfully joined the ride!');
        await App.renderRides(); // Render the rides again after joining
        await App.updateBalance();// Cập nhật số dư khi tải ứng dụng
    } catch (error) {
        console.error('Error joining ride:', error);
        alert('An error occurred while joining the ride. Please try again.');
    }
},

completeRide: async (rideId) => {
    try {
        await App.rideContracts.completeRide(rideId, { from: App.account }); // Pass any required parameters
        alert('Ride completed and fares distributed!');
        await App.renderRides(); // Render the rides again after completing
        await App.updateBalance();// Cập nhật số dư khi tải ứng dụng
    } catch (error) {
        console.error('Error completing ride:', error);
        alert('An error occurred while completing the ride. Please try again.');
    }
},


  setLoading: (boolean) => {
    App.loading = boolean;
    const loader = $('#loader');
    const content = $('#content');
    if (boolean) {
      loader.show();
      content.hide();
    } else {
      loader.hide();
      content.show();
    }
  }
}

$(() => {
  $(window).load(() => {
    App.load();
  });
});

