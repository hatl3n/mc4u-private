
// CustomerDetail.jsx
//
// Detail view for a single customer. Shows all customer info, currently owned bikes,
// ownership history (bikes previously owned), and related work orders.

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Card, Button, Table, Spinner, Alert, Row, Col } from "react-bootstrap";
import { supabase } from "../supabase";
import CreateEditModal from "../components/CreateEditModal";
import WorkOrdersCard from "../components/WorkOrdersCard";
import OwnershipHistoryCard from "../components/OwnershipHistoryCard";
import { customersModel } from "../models/customersModel";
import Fakturaarkiv from "./Fakturaarkiv";

function CustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Customer state
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Currently owned bikes (unique to this view — not a shared component)
    const [ownedBikes, setOwnedBikes] = useState([]);
    const [bikesLoading, setBikesLoading] = useState(true);

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

    useEffect(() => {
        fetchCustomer();
        fetchOwnedBikes();
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
            <OwnershipHistoryCard customerId={id} />

            {/* ── Work Orders ───────────────────────────────────── */}
            <WorkOrdersCard customerId={id} />

            {/* ── Fakturaarkiv Matches ───────────────────────────────────── */}
            <hr />
            <h5>Automatisk oppslag mot fakturaarkiv</h5>
            <Fakturaarkiv initialSearch={customer.phone} />

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