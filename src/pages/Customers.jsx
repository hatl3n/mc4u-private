import { useEffect, useState } from "react";
import { Container, Form, Button, Table, Spinner } from "react-bootstrap";
import { supabase } from "../supabase";
import SuperTable from "../components/SuperTable";
import CreateEditModal from "../components/CreateEditModal";
import { ValueContainer } from "react-select/animated";

function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);

    async function fetchItems() {
        let { data, error } = await supabase.from("customers").select("*");
        if (!error) {
            setCustomers(data);
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
                .from("customers")
                .update(formItem)
                .eq("id", editItem.id)
                .select();
            console.debug("Data returned from update:", data);
            if (!error) {
                setCustomers(customers.map((item) => (item.id === editItem.id ? data[0] : item)));
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
                .from("customers")
                .insert([formItem])
                .select();
            console.debug("Data returned from insert:", data);
            if (!error) {
                setCustomers([...customers, data[0]]);
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
                .from("customers")
                .delete()
                .eq("id", formItem.id);
            if (!error) {
                setCustomers(customers.filter((item) => item.id !== formItem.id));
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
        setShowModal(true);
        setEditItem(null);
    }
    async function onEditBtnClick(item) {
        setShowModal(true);
        setEditItem(item);
    }


    const customersModel = {
        name: "Customers",
        endpoint: "customers", // Supabase table name
        fields: [
            {
                key: "created_at",
                label: "Opprettet",
                type: "date",
                editable: false,
                valueOverride: (i) => i.created_at ? new Date(i.created_at).toLocaleString("no-NO") : '-'
            },
            {
                key: "name",
                label: "Kunde",
                type: "text",
                searchable: true
            },
            {
                key: "street",
                label: "Adresse",
                type: "text",
                searchable: true
            },
            {
                key: "zip",
                label: "Postnummer",
                type: "integer",
                searchable: true
            },
            {
                key: "city",
                label: "Poststed",
                type: "text",
                searchable: true
            },
            {
                key: "country",
                label: "Land",
                type: "text",
                searchable: true
            },
            {
                key: "phone",
                label: "Telefon",
                type: "text",
                searchable: true
            },
            {
                key: "email",
                label: "Epost",
                type: "text",
                searchable: true
            }
        ],
        defaultSort: {
            key: "created_at",
            direction: "desc"
        },
        actions: {
            create: true,
            edit: true,
            delete: true
        }
    };

    return (
        <Container className="mt-4">
            <h2>Customers</h2>
                {showModal && (
                    <CreateEditModal
                        show={showModal}
                        handleClose={() => setShowModal(false)}
                        handleSubmit={handleSubmit}
                        editItem={editItem}
                        dataModel={customersModel}
                        setEditItem={setEditItem}
                        onEntryAdded={fetchItems}
                    />
                )}
            <SuperTable tableData={customers} dataModel={customersModel} onAddBtnClick={onAddBtnClick} onEditBtnClick={onEditBtnClick} handleSubmit={handleSubmit} loading={loading} />
        </Container>
    );
}

export default Customers;
