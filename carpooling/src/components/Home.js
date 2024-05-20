import React, { useEffect, useState } from 'react';
import { Nav, Navbar, Container } from 'react-bootstrap';
import CreateRide from './CreateRide';
import YourRides from './YourRides';
import JoinRide from './JoinRide';
import ProcessRide from './ProcessRide';
import RideHistory from './History';
import Balance from './Balance';

function Home({ walletAddress }) {
    const [activeTab, setActiveTab] = useState('home');
    const [selectedRideId, setSelectedRideId] = useState(null);

    const handleSelect = (selectedTab) => {
        setActiveTab(selectedTab);
    };

    useEffect(() => {
        // Run code when walletAddress or selectedRideId changes
        // For example: console.log("Home account", walletAddress);
        return () => {
            // Clean up function
            console.log('I am being cleaned up!');
        };
    }, [walletAddress, selectedRideId]);

    return (
        <div>
            <Navbar collapseOnSelect bg="light" expand="lg">
                <Container>
                    <Navbar.Brand href="#">Carpooling</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto" activeKey={activeTab} onSelect={handleSelect}>
                            <Nav.Item>
                                <Nav.Link eventKey="home">Home</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="create">Create Ride</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="join">Join Ride</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="history">Ride History</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="balance">Balance History</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="account">Account</Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <div className="container">
                {activeTab === 'home' && (
                    <YourRides account={walletAddress} handleTabChange={handleSelect} setSelectedRideId={setSelectedRideId} />
                )}
                {activeTab === 'create' && (
                    <CreateRide account={walletAddress} handleTabChange={handleSelect} />
                )}
                {activeTab === 'join' && (
                    <JoinRide account={walletAddress} handleTabChange={handleSelect} />
                )}
                {activeTab === 'history' && (
                    <RideHistory account={walletAddress} />
                )}
                {activeTab === 'process' && selectedRideId && (
                    <ProcessRide account={walletAddress} rideId={selectedRideId} handleTabChange={handleSelect} />
                )}
                {activeTab === 'balance' && (
                    <Balance account={walletAddress} />
                )}
            </div>
        </div>
    );
}

export default Home;
