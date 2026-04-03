import { useState } from "react";
import { Container } from "react-bootstrap";
import SuperTable from "../components/SuperTable";
import CreateEditModal from "../components/CreateEditModal";
import { customersModel } from "../models/customersModel";
import useCustomers from "../hooks/useCustomers";

function Customers() {
    const { customers, loading, addCustomer, updateCustomer, deleteCustomer, fetchCustomers, setError } = useCustomers();
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);

    async function handleSubmit(formItem, method) {
        setError(null);
        if (method === "edit") {
            if (!editItem) return;
            const { error } = await updateCustomer(editItem.id, formItem);
            if (!error) {
                setEditItem(null);
                setShowModal(false);
            } else {
                alert(`Error updating item! ${error.message}`);
            }
        } else if (method === "add") {
            const { error } = await addCustomer(formItem);
            if (!error) {
                setShowModal(false);
            } else {
                alert(`Error adding item! ${error.message}`);
            }
        } else if (method === "delete") {
            const { error } = await deleteCustomer(formItem.id);
            if (!error) {
                setShowModal(false);
            } else {
                alert(`Error deleting item! ${error.message}`);
            }
        }
    }

    function onAddBtnClick() {
        setShowModal(true);
        setEditItem(null);
    }
    function onEditBtnClick(item) {
        setShowModal(true);
        setEditItem(item);
    }

    return (
        <Container className="mt-4">
            {showModal && (
                <CreateEditModal
                    show={showModal}
                    handleClose={() => setShowModal(false)}
                    handleSubmit={handleSubmit}
                    editItem={editItem}
                    dataModel={customersModel}
                    setEditItem={setEditItem}
                    onEntryAdded={fetchCustomers}
                />
            )}
            <SuperTable
                tableData={customers}
                dataModel={customersModel}
                onAddBtnClick={onAddBtnClick}
                onEditBtnClick={onEditBtnClick}
                handleSubmit={handleSubmit}
                loading={loading}
            />
        </Container>
    );
}

export default Customers;
