// src/pages/OperatorDashboard.js
import React, { useState } from 'react';
import { Container, Button, Card, Spinner, Alert, Table, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import SettlementTable from '../components/SettlementTable'; // Debt Settlements Table

const OperatorDashboard = ({ user, setIsAuthenticated }) => {
    const navigate = useNavigate();

    // ------------------------------
    // PART 1: Debt Settlements
    // ------------------------------
    const [settlements, setSettlements] = useState([]);
    const [settleLoading, setSettleLoading] = useState(false);
    const [settleError, setSettleError] = useState(null);

    const handleFetchSettlements = async () => {
        setSettlements([]);
        setSettleError(null);
        setSettleLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:3000/api/analytics/settlements', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch settlements.');
            const data = await response.json();
            setSettlements(data);
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

    const handleFetchStationPopularity = async () => {
        setPopData([]);
        setPopError(null);
        setPopLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            // Ensure your backend is mounted so that the full path is:
            // GET http://localhost:3000/api/operator/station-popularity?fromDate=...&toDate=...
            const url = `http://localhost:3000/api/analytics/operator/station-popularity?fromDate=${popFromDate}&toDate=${popToDate}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error(`Error fetching station popularity: ${response.status}`);
            }
            const data = await response.json();
            setPopData(data); // Array of objects with { station_name, passthrough_count }
        } catch (err) {
            setPopError(err.message);
        } finally {
            setPopLoading(false);
        }
    };


    // ------------------------------
    // PART 3: Vehicle Type Rankings
    // ------------------------------
    const [rankFromDate, setRankFromDate] = useState('');
    const [rankToDate, setRankToDate] = useState('');
    const [rankData, setRankData] = useState([]);
    const [rankError, setRankError] = useState(null);
    const [rankLoading, setRankLoading] = useState(false);

    const handleFetchVehicleTypeRankings = async () => {
        setRankData([]);
        setRankError(null);
        setRankLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const url = `http://localhost:3000/api/analytics/operator/vehicle-type-rank?fromDate=${
                rankFromDate || '1970-01-01'
            }&toDate=${rankToDate || '3000-01-01'}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error(`Error fetching vehicle type rankings: ${response.status}`);
            const data = await response.json();
            setRankData(data);
        } catch (err) {
            setRankError(err.message);
        } finally {
            setRankLoading(false);
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
                        <Button variant="primary" onClick={handleFetchSettlements} disabled={settleLoading}>
                            {settleLoading ? 'Loading...' : 'Load Debt Settlements'}
                        </Button>
                    </div>
                    {settleError && <Alert variant="danger">{settleError}</Alert>}
                    {!settleLoading && !settleError && settlements.length > 0 && (
                        <SettlementTable settlements={settlements} />
                    )}
                    {!settleLoading && !settleError && settlements.length === 0 && (
                        <p>No data loaded yet.</p>
                    )}
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
                    <Button variant="secondary" onClick={handleFetchStationPopularity} disabled={popLoading}>
                        {popLoading ? 'Loading...' : 'Load Station Popularity'}
                    </Button>
                    {popError && <Alert variant="danger" className="mt-3">{popError}</Alert>}
                    {!popLoading && !popError && popData.length > 0 && (
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
                    )}
                    {!popLoading && !popError && popData.length === 0 && (
                        <p className="mt-3">No popularity data loaded yet.</p>
                    )}
                </Card.Body>
            </Card>

            {/* =============== VEHICLE TYPE RANKINGS =============== */}
            <Card className="my-4">
                <Card.Body>
                    <Card.Title>Vehicle Type Rankings</Card.Title>
                    <Form className="mb-3">
                        <Form.Group className="mb-2">
                            <Form.Label>From Date (YYYY-MM-DD)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., 2022-01-01"
                                value={rankFromDate}
                                onChange={(e) => setRankFromDate(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>To Date (YYYY-MM-DD)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., 2022-01-31"
                                value={rankToDate}
                                onChange={(e) => setRankToDate(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                    <Button variant="info" onClick={handleFetchVehicleTypeRankings} disabled={rankLoading}>
                        {rankLoading ? 'Loading...' : 'Load Vehicle Rankings'}
                    </Button>
                    {rankError && <Alert variant="danger" className="mt-3">{rankError}</Alert>}
                    {!rankLoading && rankData.length > 0 && (
                        <Table striped bordered hover className="mt-3">
                            <thead>
                            <tr>
                                <th>Vehicle Type</th>
                                <th>Passthrough Count</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rankData.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.vehicle_type}</td>
                                    <td>{item.passthrough_count}</td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    )}
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
