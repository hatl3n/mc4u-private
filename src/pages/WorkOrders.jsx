import { useEffect, useState } from "react";
import { Container, Form, Button, Table, Spinner, Badge } from "react-bootstrap";
import { supabase } from "../supabase";
import SuperTable from "../components/SuperTable";
import CreateEditModal from "../components/CreateEditModal";
import { Alert } from "bootstrap";
import { useNavigate } from "react-router-dom";

function WorkOrders() {
    const navigate = useNavigate();
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);

    async function fetchItems() {
        let { data, error } = await supabase
            .from("work_orders")
            .select(`
                *,
                customer:customer_id (*),
                bike:bike_id (*)
            `);
        if (!error) {
            setWorkOrders(data);
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchItems();
    }, []);

    async function handleSubmit(formItem, method) {
        if (method === "edit") {
            console.debug("Updating item:", editItem);
            const { data, error } = await supabase
                .from("work_orders")
                .update(formItem)
                .eq("id", editItem.id)
                .select();
            console.debug("Data returned from update:", data);
            if (!error) {
                setWorkOrders(workOrders.map((item) => (item.id === editItem.id ? data[0] : item)));
                // Should also send success message
            }
            else {
                console.error("Error updating item:", error.m);
                alert(`Error updating item! ${error.message}`);
            }
            setEditItem(null);
        }
        else if (method === "add") {
            console.debug("Adding new item:", formItem);
            const { data, error } = await supabase
                .from("work_orders")
                .insert([formItem])
                .select();
            console.debug("Data returned from insert:", data);
            if (!error) {
                setWorkOrders([...workOrders, data[0]]);
                // Should also send success message
            }
            else {
                console.error("Error adding item:", error);
                alert(`Error adding item! ${error.message}`);
            }
        }
        else if (method === "delete") {
            console.debug("Deleting item:", formItem);
            const { data, error } = await supabase
                .from("work_orders")
                .update({ status: 'deleted' })
                .eq("id", formItem.id);
            if (!error) {
                //setWorkOrders(workOrders.filter((item) => item.id !== formItem.id));
                setWorkOrders(workOrders.map((item) => (item.id === formItem.id ? { ...item, status: 'deleted' } : item)));
                // Should also send success message
            }
            else {
                console.error("Error deleting item:", error);
                alert(`Error deleting item! ${error.message}`);
            }
        }
        setShowModal(false);
    }

    async function onAddBtnClick() {
        //setShowModal(true);
        navigate("/work-orders/new");
        setEditItem(null);
    }
    async function onEditBtnClick(item) {
        //setShowModal(true);
        //setEditItem(item);
        navigate(`/work-orders/edit/${item.id}`);
    }


    const workOrdersModel = {
        name: "Arbeidsordre",
        endpoint: "work_orders", // Supabase table name
        fields: [
            {
                key: "created_at",
                label: "Opprettet",
                type: "date",
                editable: false,
                valueOverride: (i) => i.created_at ? new Date(i.created_at).toLocaleString("no-NO") : '-'
            },
            {
                key: "id",
                label: "Ordre#",
                type: "integer",
                editable: false
            },
            {
                key: "customer_id",
                label: "Kunde",
                type: "text",
                searchable: true,
                valueOverride: (i) => i.customer ? `${i.customer.name}` : '-'
            },
            {
                key: "bike_id",
                label: "Sykkel",
                type: "text",
                searchable: true,
                valueOverride: (i) => i.bike ? `${i.bike.license_plate ? i.bike.license_plate : i.bike.vin} - ${i.bike.model_year || ''} ${i.bike.make || ''} ${i.bike.model || ''}` : '-'
            },
            {
                key: "notes",
                label: "Notater",
                type: "text",
                searchable: true,
                valueOverride: (i) => {
                    const maxLength = 50;
                    const text = i.notes || '-';
                    const truncated = text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
                    return (
                        <span title={text} className="text-truncate d-inline-block" style={{ maxWidth: '300px' }}>
                            {truncated}
                        </span>
                    );
                }
            },
            {
                key: "status",
                label: "Status",
                type: "select",
                options: [
                    { value: "open", label: "Åpen" },
                    { value: "finished", label: "Ferdig" },
                    { value: "paid", label: "Betalt" },
                    { value: "deleted", label: "Slettet" }
                ],
                searchable: true,
                valueOverride: (i) => {
                    const statusColors = {
                        'open': 'warning',
                        'finished': 'primary',
                        'paid': 'success',
                        'deleted': 'danger'
                    };
                    const statusLabel = {
                        'open': 'Åpen',
                        'finished': 'Ferdig',
                        'paid': 'Betalt',
                        'deleted': 'Slettet'
                    };
                    return <Badge bg={statusColors[i.status] || 'secondary'}>{statusLabel[i.status] || i.status}</Badge>;
                }
            },
            {
                key: "total_inc_vat",
                label: "Total",
                type: "number",
                valueOverride: (i) => {
                    return new Intl.NumberFormat('no-NO', {
                        style: 'currency',
                        currency: 'NOK'
                    }).format(i.total_inc_vat);
                }
            }
        ],
        defaultSort: {
            key: "created_at",
            direction: "desc"
        },
        actions: {
            create: true,
            edit: true,
            //delete: true,
            custom: [
                {
                    label: "Print",
                    icon: "🖨️",
                    variant: "info",
                    onClick: (item) => {
                        navigate(`/work-orders/print/${item.id}`);
                    }
                }
            ]
        }
    };

    return (
        <Container className="mt-4">
            {showModal && (
                <CreateEditModal
                    show={showModal}
                    handleClose={() => setShowModal(false)}
                    handleSubmit={handleSubmit}
                    editItem={editItem}
                    dataModel={workOrdersModel}
                    setEditItem={setEditItem}
                    onEntryAdded={fetchItems}
                />
            )}
            <SuperTable tableData={workOrders} dataModel={workOrdersModel} onAddBtnClick={onAddBtnClick} onEditBtnClick={onEditBtnClick} handleSubmit={handleSubmit} loading={loading} />
        </Container>
    );
}

export default WorkOrders;
