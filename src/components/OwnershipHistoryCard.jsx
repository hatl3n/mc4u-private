// OwnershipHistoryCard.jsx
//
// Reusable card that fetches and displays bike ownership history.
// Pass either bikeId or customerId to filter results.
//
// Usage:
//   <OwnershipHistoryCard bikeId={id} />       — shows all owners of a bike (Eier column)
//   <OwnershipHistoryCard customerId={id} />   — shows all bikes owned by a customer (Sykkel column)

/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Table, Badge, Spinner, Button } from "react-bootstrap";
import { supabase } from "../supabase";
import { bikeLabel } from "../models/workOrdersModel";

function OwnershipHistoryCard({ bikeId, customerId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHistory() {
            setLoading(true);
            let query = supabase.from("bike_ownership_history");

            if (bikeId) {
                query = query
                    .select("*, customers(id, name, email, phone)")
                    .eq("bike_id", bikeId)
                    .order("started_at", { ascending: false });
            } else if (customerId) {
                query = query
                    .select("*, bikes(id, make, model, model_year, license_plate, vin)")
                    .eq("customer_id", customerId)
                    .order("started_at", { ascending: false });
            }

            const { data } = await query;
            setHistory(data || []);
            setLoading(false);
        }

        fetchHistory();
    }, [bikeId, customerId]);

    return (
        <Card className="mb-4">
            <Card.Header><h5 className="mb-0">Eierhistorikk</h5></Card.Header>
            <Card.Body>
                {loading ? (
                    <Spinner animation="border" size="sm" />
                ) : history.length === 0 ? (
                    <p className="text-muted mb-0">Ingen eierhistorikk registrert.</p>
                ) : (
                    <Table responsive hover size="sm">
                        <thead>
                            <tr>
                                {bikeId && <th>Eier</th>}
                                {customerId && <th>Sykkel</th>}
                                <th>Fra</th>
                                <th>Til</th>
                                {customerId && <th></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(record => (
                                <tr key={record.id}>
                                    {bikeId && (
                                        <td>
                                            {record.customers
                                                ? <Link to={`/customers/${record.customers.id}`}>{record.customers.name}</Link>
                                                : "–"}
                                        </td>
                                    )}
                                    {customerId && (
                                        <td>{bikeLabel(record.bikes)}</td>
                                    )}
                                    <td>{new Date(record.started_at).toLocaleDateString("no-NO")}</td>
                                    <td>
                                        {record.ended_at
                                            ? new Date(record.ended_at).toLocaleDateString("no-NO")
                                            : <Badge bg="success">Nåværende</Badge>}
                                    </td>
                                    {customerId && (
                                        <td>
                                            {record.bikes && (
                                                <Link to={`/bikes/${record.bikes.id}`}>
                                                    <Button variant="outline-secondary" size="sm">Vis sykkel</Button>
                                                </Link>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Card.Body>
        </Card>
    );
}

export default OwnershipHistoryCard;
