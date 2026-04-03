
// Bikes.jsx
//
// Page for managing the list of bikes in the system.
// Uses the useBikes hook for all bike data logic (fetch, add, edit, delete).
// Renders a SuperTable for listing and editing bikes, and a CreateEditModal for add/edit forms.
// All bike field definitions and rendering logic are centralized in bikesModel.
//
// This page demonstrates the DRY pattern for entity management: all data logic is in hooks, all UI is in reusable components.
//
// Main components:
// - useBikes: Custom hook for all bike CRUD/search logic
// - SuperTable: Generic table for displaying and managing entities
// - CreateEditModal: Generic modal for add/edit forms
// - bikesModel: Field definitions and rendering for bikes
// - VegvesenAutoFormFill: Custom JSX for bike form (optional, for auto-filling from Vegvesen)

import { useState } from "react";
import { Container } from "react-bootstrap";
import SuperTable from "../components/SuperTable";
import CreateEditModal from "../components/CreateEditModal";
import { bikesModel } from "../models/bikesModel";
import { VegvesenAutoFormFill } from "../components/VegvesenAutoFormFill";
import useBikes from "../hooks/useBikes";

function Bikes() {
    // useBikes provides all bike data and CRUD methods
    const { bikes, loading, error, addBike, updateBike, deleteBike, fetchBikes, setError } = useBikes();
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);

    // Unified handleSubmit for CreateEditModal and SuperTable
    async function handleSubmit(formItem, method) {
        setError(null);
        if (method === "edit") {
            if (!editItem) return;
            const { error } = await updateBike(editItem.id, formItem);
            if (!error) {
                setEditItem(null);
                setShowModal(false);
            } else {
                alert(`Error updating item! ${error.message}`);
            }
        } else if (method === "add") {
            const { error } = await addBike(formItem);
            if (!error) {
                setShowModal(false);
            } else {
                alert(`Error adding item! ${error.message}`);
            }
        } else if (method === "delete") {
            const { error } = await deleteBike(formItem.id);
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
            {/* Modal for adding/editing bikes. Controlled by showModal/editItem state. */}
            {showModal && (
                <CreateEditModal
                    show={showModal}
                    handleClose={() => setShowModal(false)}
                    handleSubmit={handleSubmit}
                    editItem={editItem}
                    dataModel={bikesModel}
                    setEditItem={setEditItem}
                    onEntryAdded={fetchBikes}
                    customJsxAfterForm={VegvesenAutoFormFill}
                />
            )}
            {/* SuperTable displays the list of bikes and provides add/edit/delete actions. */}
            <SuperTable
                tableData={bikes}
                dataModel={bikesModel}
                onAddBtnClick={onAddBtnClick}
                onEditBtnClick={onEditBtnClick}
                handleSubmit={handleSubmit}
                loading={loading}
            />
        </Container>
    );
}

export default Bikes;
