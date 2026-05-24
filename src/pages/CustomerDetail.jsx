
// CustomerDetail.jsx
//
// Detail view for a single customer. Shows all customer info, currently owned bikes,
// ownership history (bikes previously owned), and related work orders.

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Card, Button, ButtonGroup, Table, Badge, Spinner, Alert, Row, Col } from "react-bootstrap";
import { supabase } from "../supabase";
import CreateEditModal from "../components/CreateEditModal";
import { customersModel } from "../models/customersModel";

const STATUS_LABELS = {
    open: "Åpen",
    quotation: "Tilbud",
    valuation: "Takst",
    finished: "Ferdig",
    paid: "Betalt",
    deleted: "Slettet",
};

const STATUS_COLORS = {
    open: "warning",
    finished: "primary",
    paid: "success",
    deleted: "danger",
};

function CustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Customer state
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Currently owned bikes
    const [ownedBikes, setOwnedBikes] = useState([]);
    const [bikesLoading, setBikesLoading] = useState(true);

    // Ownership history (previously owned bikes)
    const [ownerHistory, setOwnerHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Work orders
    const [workOrders, setWorkOrders] = useState([]);
    const [workOrdersLoading, setWorkOrdersLoading] = useState(true);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editItem, setEditItem] = useState(null);

    // ── Fetch functions ───────────────────────────────────────────────

    async function fetchCustomer() {
        setLoading(true);
        const { data, error } = await supabase
            .from("customers")
            .select("*")
            .eq("id", id)
            .single();
        if (error) {
            setError(error.message);
        } else {
            setCustomer(data);
        }
        setLoading(false);
    }

    async function fetchOwnedBikes() {
        setBikesLoading(true);
        const { data } = await supabase
            .from("bikes")
            .select("*")
            .eq("owner_id", id)
            .order("created_at", { ascending: false });
        setOwnedBikes(data || []);
        setBikesLoading(false);
    }

    async function fetchOwnerHistory() {
        setHistoryLoading(true);
        const { data } = await supabase
            .from("bike_ownership_history")
            .select("*, bikes(id, make, model, model_year, license_plate, vin)")
            .eq("customer_id", id)
            .order("started_at", { ascending: false });
        setOwnerHistory(data || []);
        setHistoryLoading(false);
    }

    async function fetchWorkOrders() {
        setWorkOrdersLoading(true);
        const { data } = await supabase
            .from("work_orders")
            .select("*, bike:bike_id(id, make, model, model_year, license_plate, vin)")
            .eq("customer_id", id)
            .order("created_at", { ascending: false });
        setWorkOrders(data || []);
        setWorkOrdersLoading(false);
    }

    useEffect(() => {
        fetchCustomer();
        fetchOwnedBikes();
        fetchOwnerHistory();
        fetchWorkOrders();
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Customer edit submit ──────────────────────────────────────────

    async function handleCustomerEditSubmit(formItem, method) {
        if (method !== "edit") return;
        const { error } = await supabase
            .from("customers")
            .update(formItem)
            .eq("id", id);
        if (!error) {
            setEditItem(null);
            setShowEditModal(false);
            await fetchCustomer();
        } else {
            alert(`Feil ved oppdatering: ${error.message}`);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────

    function bikeLabel(bike) {
        if (!bike) return "–";
        const ref = bike.license_plate || bike.vin || "Ingen regnr/vin";
        return `${bike.model_year || ""} ${bike.make || ""} ${bike.model || ""} (${ref})`.trim();
    }

    // ── Render ────────────────────────────────────────────────────────

    if (loading) return <Container className="mt-4"><Spinner animation="border" /></Container>;
    if (error) return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
    if (!customer) return null;

    return (
        <Container className="mt-4">
            <Button variant="outline-secondary" size="sm" onClick={() => navigate("/customers")} className="mb-3">
                ← Tilbake til kunder
            </Button>

            {/* ── Customer Info ─────────────────────────────────── */}
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">🧑 {customer.name}</h5>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => { setEditItem(customer); setShowEditModal(true); }}
                    >
                        Rediger
                    </Button>
                </Card.Header>
                <Card.Body>
                    <Row>
                        {customersModel.fields.filter(f => f.editable !== false).map(field => (
                            <Col md={4} key={field.key} className="mb-2">
                                <small className="text-muted d-block">{field.label}</small>
                                <span>{customer[field.key] || "–"}</span>
                            </Col>
                        ))}
                    </Row>
                </Card.Body>
            </Card>

            {/* ── Currently Owned Bikes ─────────────────────────── */}
            <Card className="mb-4">
                <Card.Header><h5 className="mb-0">Eide sykler</h5></Card.Header>
                <Card.Body>
                    {bikesLoading ? (
                        <Spinner animation="border" size="sm" />
                    ) : ownedBikes.length === 0 ? (
                        <p className="text-muted mb-0">Ingen sykler registrert på denne kunden.</p>
                    ) : (
                        <Table responsive hover size="sm">
                            <thead>
                                <tr>
                                    <th>Årsmodell</th>
                                    <th>Merke / Modell</th>
                                    <th>Skiltnummer</th>
                                    <th>Rammenummer</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {ownedBikes.map(bike => (
                                    <tr key={bike.id}>
                                        <td>{bike.model_year || "–"}</td>
                                        <td>{`${bike.make || ""} ${bike.model || ""}`.trim() || "–"}</td>
                                        <td>{bike.license_plate || "–"}</td>
                                        <td>{bike.vin || "–"}</td>
                                        <td>
                                            <Link to={`/bikes/${bike.id}`}>
                                                <Button variant="outline-secondary" size="sm">Vis</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* ── Ownership History ─────────────────────────────── */}
            <Card className="mb-4">
                <Card.Header><h5 className="mb-0">Eierhistorikk</h5></Card.Header>
                <Card.Body>
                    {historyLoading ? (
                        <Spinner animation="border" size="sm" />
                    ) : ownerHistory.length === 0 ? (
                        <p className="text-muted mb-0">Ingen eierhistorikk registrert for denne kunden.</p>
                    ) : (
                        <Table responsive hover size="sm">
                            <thead>
                                <tr>
                                    <th>Sykkel</th>
                                    <th>Fra</th>
                                    <th>Til</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {ownerHistory.map(record => (
                                    <tr key={record.id}>
                                        <td>{bikeLabel(record.bikes)}</td>
                                        <td>{new Date(record.started_at).toLocaleDateString("no-NO")}</td>
                                        <td>
                                            {record.ended_at
                                                ? new Date(record.ended_at).toLocaleDateString("no-NO")
                                                : <Badge bg="success">Nåværende</Badge>}
                                        </td>
                                        <td>
                                            {record.bikes && (
                                                <Link to={`/bikes/${record.bikes.id}`}>
                                                    <Button variant="outline-secondary" size="sm">Vis sykkel</Button>
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* ── Work Orders ───────────────────────────────────── */}
            <Card className="mb-4">
                <Card.Header><h5 className="mb-0">Arbeidsordre</h5></Card.Header>
                <Card.Body>
                    {workOrdersLoading ? (
                        <Spinner animation="border" size="sm" />
                    ) : workOrders.length === 0 ? (
                        <p className="text-muted mb-0">Ingen arbeidsordre for denne kunden.</p>
                    ) : (
                        <Table responsive hover size="sm">
                            <thead>
                                <tr>
                                    <th>Ordre#</th>
                                    <th>Dato</th>
                                    <th>Sykkel</th>
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
                                        <td>
                                            {wo.bike
                                                ? <Link to={`/bikes/${wo.bike.id}`}>{bikeLabel(wo.bike)}</Link>
                                                : "–"}
                                        </td>
                                        <td>
                                            <Badge bg={STATUS_COLORS[wo.status] || "secondary"}>
                                                {STATUS_LABELS[wo.status] || wo.status}
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

            {/* Edit Modal */}
            {showEditModal && (
                <CreateEditModal
                    show={showEditModal}
                    handleClose={() => { setShowEditModal(false); setEditItem(null); }}
                    handleSubmit={handleCustomerEditSubmit}
                    editItem={editItem}
                    dataModel={customersModel}
                    setEditItem={setEditItem}
                />
            )}
        </Container>
    );
}

export default CustomerDetail;
