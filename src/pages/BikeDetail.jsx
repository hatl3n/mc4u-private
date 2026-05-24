
// BikeDetail.jsx
//
// Detail view for a single bike. Shows all bike info, current owner, ownership history, and related work orders.
// Owner can be assigned or changed via CustomerSelector — the DB trigger handles writing the ownership history automatically.

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Card, Button, Table, Badge, Spinner, Alert, Row, Col, ButtonGroup } from "react-bootstrap";
import { supabase } from "../supabase";
import CreateEditModal from "../components/CreateEditModal";
import CustomerSelector from "../components/CustomerSelector";
import { VegvesenAutoFormFill } from "../components/VegvesenAutoFormFill";
import { bikesModel } from "../models/bikesModel";

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

function BikeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Bike state
    const [bike, setBike] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Ownership history state
    const [ownerHistory, setOwnerHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Work orders state
    const [workOrders, setWorkOrders] = useState([]);
    const [workOrdersLoading, setWorkOrdersLoading] = useState(true);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editItem, setEditItem] = useState(null);

    // Owner assignment state
    const [newOwner, setNewOwner] = useState(null);
    const [savingOwner, setSavingOwner] = useState(false);
    const [ownerMessage, setOwnerMessage] = useState(null);

    // ── Fetch functions ───────────────────────────────────────────────

    async function fetchBike() {
        setLoading(true);
        const { data, error } = await supabase
            .from("bikes")
            .select("*, customers(id, name, email, phone)")
            .eq("id", id)
            .single();
        if (error) {
            setError(error.message);
        } else {
            setBike(data);
        }
        setLoading(false);
    }

    async function fetchOwnerHistory() {
        setHistoryLoading(true);
        const { data } = await supabase
            .from("bike_ownership_history")
            .select("*, customers(id, name, email, phone)")
            .eq("bike_id", id)
            .order("started_at", { ascending: false });
        setOwnerHistory(data || []);
        setHistoryLoading(false);
    }

    async function fetchWorkOrders() {
        setWorkOrdersLoading(true);
        const { data } = await supabase
            .from("work_orders")
            .select("*, customer:customer_id(id, name)")
            .eq("bike_id", id)
            .order("created_at", { ascending: false });
        setWorkOrders(data || []);
        setWorkOrdersLoading(false);
    }

    useEffect(() => {
        fetchBike();
        fetchOwnerHistory();
        fetchWorkOrders();
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Owner handlers ────────────────────────────────────────────────

    async function handleSaveOwner() {
        if (!newOwner) return;
        setSavingOwner(true);
        setOwnerMessage(null);
        const { error } = await supabase
            .from("bikes")
            .update({ owner_id: newOwner.id })
            .eq("id", id);
        if (error) {
            alert(`Feil ved lagring av eier: ${error.message}`);
        } else {
            setOwnerMessage(`Eier oppdatert til ${newOwner.name}`);
            setNewOwner(null);
            await fetchBike();
            await fetchOwnerHistory();
        }
        setSavingOwner(false);
    }

    async function handleRemoveOwner() {
        if (!window.confirm("Er du sikker på at du vil fjerne nåværende eier?")) return;
        setSavingOwner(true);
        setOwnerMessage(null);
        const { error } = await supabase
            .from("bikes")
            .update({ owner_id: null })
            .eq("id", id);
        if (error) {
            alert(`Feil ved fjerning av eier: ${error.message}`);
        } else {
            setOwnerMessage("Eier er fjernet.");
            await fetchBike();
            await fetchOwnerHistory();
        }
        setSavingOwner(false);
    }

    // ── Bike edit submit ──────────────────────────────────────────────

    async function handleBikeEditSubmit(formItem, method) {
        if (method !== "edit") return;
        const { error } = await supabase
            .from("bikes")
            .update(formItem)
            .eq("id", id);
        if (!error) {
            setEditItem(null);
            setShowEditModal(false);
            await fetchBike();
        } else {
            alert(`Feil ved oppdatering: ${error.message}`);
        }
    }

    // ── Render ────────────────────────────────────────────────────────

    if (loading) return <Container className="mt-4"><Spinner animation="border" /></Container>;
    if (error) return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
    if (!bike) return null;

    const bikeTitle = `${bike.model_year || ""} ${bike.make || ""} ${bike.model || ""}`.trim();

    return (
        <Container className="mt-4">
            <Button variant="outline-secondary" size="sm" onClick={() => navigate("/bikes")} className="mb-3">
                ← Tilbake til sykler
            </Button>

            {/* ── Bike Info ─────────────────────────────────────── */}
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">🏍️ {bikeTitle || "Sykkel"}</h5>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => { setEditItem(bike); setShowEditModal(true); }}
                    >
                        Rediger
                    </Button>
                </Card.Header>
                <Card.Body>
                    <Row>
                        {bikesModel.fields.filter(f => f.editable !== false).map(field => (
                            <Col md={4} key={field.key} className="mb-2">
                                <small className="text-muted d-block">{field.label}</small>
                                <span>{bike[field.key] || "–"}</span>
                            </Col>
                        ))}
                    </Row>
                </Card.Body>
            </Card>

            {/* ── Owner ─────────────────────────────────────────── */}
            <Card className="mb-4">
                <Card.Header><h5 className="mb-0">Eier</h5></Card.Header>
                <Card.Body>
                    <p className="mb-3">
                        <strong>Nåværende eier: </strong>
                        {bike.customers ? (
                            <>
                                <Link to={`/customers/${bike.customers.id}`}>{bike.customers.name}</Link>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger ms-2 p-0"
                                    onClick={handleRemoveOwner}
                                    disabled={savingOwner}
                                >
                                    Fjern eier
                                </Button>
                            </>
                        ) : (
                            <span className="text-muted">Ingen eier registrert</span>
                        )}
                    </p>
                    {ownerMessage && (
                        <Alert variant="success" dismissible onClose={() => setOwnerMessage(null)}>
                            {ownerMessage}
                        </Alert>
                    )}
                    <div className="d-flex align-items-end gap-2">
                        <div className="flex-grow-1">
                            <CustomerSelector value={newOwner} onChange={setNewOwner} />
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleSaveOwner}
                            disabled={!newOwner || savingOwner}
                            className="mb-2"
                        >
                            {savingOwner ? "Lagrer…" : "Sett eier"}
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* ── Ownership History ─────────────────────────────── */}
            <Card className="mb-4">
                <Card.Header><h5 className="mb-0">Eierhistorikk</h5></Card.Header>
                <Card.Body>
                    {historyLoading ? (
                        <Spinner animation="border" size="sm" />
                    ) : ownerHistory.length === 0 ? (
                        <p className="text-muted mb-0">Ingen eierhistorikk registrert.</p>
                    ) : (
                        <Table responsive hover size="sm">
                            <thead>
                                <tr>
                                    <th>Eier</th>
                                    <th>Fra</th>
                                    <th>Til</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ownerHistory.map(record => (
                                    <tr key={record.id}>
                                        <td>
                                            {record.customers ? (
                                                <Link to={`/customers/${record.customers.id}`}>{record.customers.name}</Link>
                                            ) : "–"}
                                        </td>
                                        <td>{new Date(record.started_at).toLocaleDateString("no-NO")}</td>
                                        <td>
                                            {record.ended_at
                                                ? new Date(record.ended_at).toLocaleDateString("no-NO")
                                                : <Badge bg="success">Nåværende</Badge>}
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
                        <p className="text-muted mb-0">Ingen arbeidsordre for denne sykkelen.</p>
                    ) : (
                        <Table responsive hover size="sm">
                            <thead>
                                <tr>
                                    <th>Ordre#</th>
                                    <th>Dato</th>
                                    <th>Kunde</th>
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
                                            {wo.customer
                                                ? <Link to={`/customers/${wo.customer.id}`}>{wo.customer.name}</Link>
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
                    handleSubmit={handleBikeEditSubmit}
                    editItem={editItem}
                    dataModel={bikesModel}
                    setEditItem={setEditItem}
                    customJsxAfterForm={VegvesenAutoFormFill}
                />
            )}
        </Container>
    );
}

export default BikeDetail;
