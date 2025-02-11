// src/pages/OperatorDashboard.js
import React, { useState } from 'react';
import {
    Container,
    Button,
    Card,
    Spinner,
    Alert,
    Table,
    Form,
    Collapse
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import SettlementTable from '../components/SettlementTable'; // For the debt settlements table

const OperatorDashboard = ({ user, setIsAuthenticated }) => {
    const navigate = useNavigate();

    // ------------------------------
    // PART 1: Debt Settlements
    // ------------------------------
    const [settlements, setSettlements] = useState([]);
    const [settleLoading, setSettleLoading] = useState(false);
    const [settleError, setSettleError] = useState(null);
    const [showSettlements, setShowSettlements] = useState(false);

    const handleFetchSettlements = async () => {
        setSettlements([]);
        setSettleError(null);
        setSettleLoading(true);
        setShowSettlements(false); // Hide old data while loading

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:3000/api/analytics/settlements', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch settlements.');
            const data = await response.json();
            setSettlements(data);
            setShowSettlements(true); // Show the new data once fetched
        } catch (err) {
            setSettleError(err.message);
        } finally {
            setSettleLoading(false);
        }
    };

    // ------------------------------
    // PART 2: Station Popularity
    // ------------------------------
    const [popFromDate, setPopFromDate] = useState('');
    const [popToDate, setPopToDate] = useState('');
    const [popData, setPopData] = useState([]);
    const [popError, setPopError] = useState(null);
    const [popLoading, setPopLoading] = useState(false);
    const [showPopularity, setShowPopularity] = useState(false);

    const handleFetchStationPopularity = async () => {
        setPopData([]);
        setPopError(null);
        setPopLoading(true);
        setShowPopularity(false); // Hide old data while loading

        try {
            const token = localStorage.getItem('authToken');
            const url = `http://localhost:3000/api/analytics/operator/station-popularity?fromDate=${popFromDate}&toDate=${popToDate}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error(`Error fetching station popularity: ${response.status}`);
            }
            const data = await response.json();
            setPopData(data);
            setShowPopularity(true); // Show the new data once fetched
        } catch (err) {
            setPopError(err.message);
        } finally {
            setPopLoading(false);
        }
    };

    // ------------------------------
    // PART 3: Vehicle Model Rankings
    // ------------------------------
    const [vrFromDate, setVrFromDate] = useState('');
    const [vrToDate, setVrToDate] = useState('');
    const [vrData, setVrData] = useState([]);
    const [vrError, setVrError] = useState(null);
    const [vrLoading, setVrLoading] = useState(false);
    const [showVR, setShowVR] = useState(false);

    const handleFetchVehicleRankings = async () => {
        setVrData([]);
        setVrError(null);
        setVrLoading(true);
        setShowVR(false); // Hide old data while loading

        try {
            const token = localStorage.getItem('authToken');
            // Make sure the URL matches your backend mount point
            const url = `http://localhost:3000/api/analytics/operator/vehicle-type-rank?fromDate=${vrFromDate}&toDate=${vrToDate}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error(`Error fetching vehicle rankings: ${response.status}`);
            }
            const data = await response.json();
            setVrData(data);
            setShowVR(true); // Show the new data once fetched
        } catch (err) {
            setVrError(err.message);
        } finally {
            setVrLoading(false);
        }
    };

    // ------------------------------
    // Logout
    // ------------------------------
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        navigate('/');
    };

    return (
        <Container className="mt-5">
            <h1 className="text-center">Welcome, {user.username}</h1>

            {/* =============== DEBT SETTLEMENTS =============== */}
            <Card className="my-4">
                <Card.Body>
                    <Card.Title>Debt Settlements</Card.Title>
                    <div className="mb-3">
                        <Button
                            variant="primary"
                            onClick={handleFetchSettlements}
                            disabled={settleLoading}
                            className="me-2"
                        >
                            {settleLoading ? 'Loading...' : 'Load Debt Settlements'}
                        </Button>
                        {showSettlements && !settleLoading && (
                            <Button
                                variant="outline-secondary"
                                onClick={() => {
                                    setSettlements([]);
                                    setShowSettlements(false);
                                }}
                            >
                                Hide Results
                            </Button>
                        )}
                    </div>
                    {settleError && <Alert variant="danger">{settleError}</Alert>}
                    <Collapse in={showSettlements}>
                        <div>
                            {settlements.length > 0 ? (
                                <SettlementTable settlements={settlements} />
                            ) : (
                                !settleLoading && <p>No data loaded yet.</p>
                            )}
                        </div>
                    </Collapse>
                </Card.Body>
            </Card>

            {/* =============== STATION POPULARITY =============== */}
            <Card className="my-4">
                <Card.Body>
                    <Card.Title>Station Popularity</Card.Title>
                    <Form className="mb-3">
                        <Form.Group controlId="popFromDate" className="mb-2">
                            <Form.Label>From Date (YYYY-MM-DD)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., 2022-01-01"
                                value={popFromDate}
                                onChange={(e) => setPopFromDate(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group controlId="popToDate" className="mb-2">
                            <Form.Label>To Date (YYYY-MM-DD)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., 2022-01-31"
                                value={popToDate}
                                onChange={(e) => setPopToDate(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                    <Button
                        variant="secondary"
                        onClick={handleFetchStationPopularity}
                        disabled={popLoading}
                        className="me-2"
                    >
                        {popLoading ? 'Loading...' : 'Load Station Popularity'}
                    </Button>
                    {showPopularity && !popLoading && (
                        <Button
                            variant="outline-secondary"
                            onClick={() => {
                                setPopData([]);
                                setShowPopularity(false);
                            }}
                        >
                            Hide Results
                        </Button>
                    )}
                    {popError && <Alert variant="danger" className="mt-3">{popError}</Alert>}
                    <Collapse in={showPopularity}>
                        <div>
                            {popData.length > 0 ? (
                                <Table striped bordered hover className="mt-3">
                                    <thead>
                                    <tr>
                                        <th>Station Name</th>
                                        <th>Passthrough Count</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {popData.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.station_name}</td>
                                            <td>{item.passthrough_count}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            ) : (
                                !popLoading && <p className="mt-3">No popularity data loaded yet.</p>
                            )}
                        </div>
                    </Collapse>
                </Card.Body>
            </Card>

            {/* =============== VEHICLE MODEL RANKINGS =============== */}
            <Card className="my-4">
                <Card.Body>
                    <Card.Title>Vehicle Model Rankings</Card.Title>
                    <Form className="mb-3">
                        <Form.Group controlId="vrFromDate" className="mb-2">
                            <Form.Label>From Date (YYYY-MM-DD)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., 2022-01-01"
                                value={vrFromDate}
                                onChange={(e) => setVrFromDate(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group controlId="vrToDate" className="mb-2">
                            <Form.Label>To Date (YYYY-MM-DD)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., 2022-01-31"
                                value={vrToDate}
                                onChange={(e) => setVrToDate(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                    <Button
                        variant="secondary"
                        onClick={handleFetchVehicleRankings}
                        disabled={vrLoading}
                        className="me-2"
                    >
                        {vrLoading ? 'Loading...' : 'Load Vehicle Model Rankings'}
                    </Button>
                    {showVR && !vrLoading && (
                        <Button
                            variant="outline-secondary"
                            onClick={() => {
                                setVrData([]);
                                setShowVR(false);
                            }}
                        >
                            Hide Results
                        </Button>
                    )}
                    {vrError && <Alert variant="danger" className="mt-3">{vrError}</Alert>}
                    <Collapse in={showVR}>
                        <div>
                            {vrData.length > 0 ? (
                                <Table striped bordered hover className="mt-3">
                                    <thead>
                                    <tr>
                                        <th>Vehicle Model</th>
                                        <th>Passthrough Count</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {vrData.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.vehicle_model}</td>
                                            <td>{item.passthrough_count}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            ) : (
                                !vrLoading && <p className="mt-3">No vehicle ranking data loaded yet.</p>
                            )}
                        </div>
                    </Collapse>
                </Card.Body>
            </Card>

            <div className="text-center">
                <Button variant="danger" onClick={handleLogout}>
                    Logout
                </Button>
            </div>
        </Container>
    );
};

export default OperatorDashboard;
