// WorkOrdersCard.jsx
//
// Reusable card that fetches and displays a filtered list of work orders.
// Pass either bikeId or customerId to filter results.
//
// Usage:
//   <WorkOrdersCard bikeId={id} />       — shows work orders for a bike, with a Kunde column
//   <WorkOrdersCard customerId={id} />   — shows work orders for a customer, with a Sykkel column

/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Table, Badge, Spinner, Button, ButtonGroup } from "react-bootstrap";
import { supabase } from "../supabase";
import {
    WORK_ORDER_STATUS_LABELS,
    WORK_ORDER_STATUS_COLORS,
    bikeLabel,
} from "../models/workOrdersModel";

function WorkOrdersCard({ bikeId, customerId }) {
    const navigate = useNavigate();
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchWorkOrders() {
            setLoading(true);
            let query = supabase.from("work_orders");

            if (bikeId) {
                query = query
                    .select("*, customer:customer_id(id, name)")
                    .eq("bike_id", bikeId)
                    .order("created_at", { ascending: false });
            } else if (customerId) {
                query = query
                    .select("*, bike:bike_id(id, make, model, model_year, license_plate, vin)")
                    .eq("customer_id", customerId)
                    .order("created_at", { ascending: false });
            }

            const { data } = await query;
            setWorkOrders(data || []);
            setLoading(false);
        }

        fetchWorkOrders();
    }, [bikeId, customerId]);

    return (
        <Card className="mb-4">
            <Card.Header><h5 className="mb-0">Arbeidsordre</h5></Card.Header>
            <Card.Body>
                {loading ? (
                    <Spinner animation="border" size="sm" />
                ) : workOrders.length === 0 ? (
                    <p className="text-muted mb-0">Ingen arbeidsordre.</p>
                ) : (
                    <Table responsive hover size="sm">
                        <thead>
                            <tr>
                                <th>Ordre#</th>
                                <th>Dato</th>
                                {bikeId && <th>Kunde</th>}
                                {customerId && <th>Sykkel</th>}
                                <th>Status</th>
                                <th>Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {workOrders.map(wo => (
                                <tr key={wo.id}>
                                    <td>{wo.id}</td>
                                    <td>{new Date(wo.created_at).toLocaleDateString("no-NO")}</td>
                                    {bikeId && (
                                        <td>
                                            {wo.customer
                                                ? <Link to={`/customers/${wo.customer.id}`}>{wo.customer.name}</Link>
                                                : "–"}
                                        </td>
                                    )}
                                    {customerId && (
                                        <td>
                                            {wo.bike
                                                ? <Link to={`/bikes/${wo.bike.id}`}>{bikeLabel(wo.bike)}</Link>
                                                : "–"}
                                        </td>
                                    )}
                                    <td>
                                        <Badge bg={WORK_ORDER_STATUS_COLORS[wo.status] || "secondary"}>
                                            {WORK_ORDER_STATUS_LABELS[wo.status] || wo.status}
                                        </Badge>
                                    </td>
                                    <td>
                                        {wo.total_inc_vat != null
                                            ? new Intl.NumberFormat("no-NO", { style: "currency", currency: "NOK" }).format(wo.total_inc_vat)
                                            : "–"}
                                    </td>
                                    <td>
                                        <ButtonGroup>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => navigate(`/work-orders/edit/${wo.id}`)}
                                            >
                                                Åpne
                                            </Button>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => navigate(`/work-orders/print/${wo.id}`)}
                                            >
                                                Print
                                            </Button>
                                        </ButtonGroup>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Card.Body>
        </Card>
    );
}

export default WorkOrdersCard;
