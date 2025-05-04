// NEXT UT: Denne fungerer faktisk fint nå, push til customers og andre steder!
// Vurder refactor for å minske repetition. (Flytt all handling inn i SUperTable og Modal og heller send kun hooks for sql?)
// Mangler: Select/multiselect og foreign key
// Mangler: DELETE handling!

import { useEffect, useState } from "react";
import { Container, Form, Button, Table, Spinner } from "react-bootstrap";
import { supabase } from "../supabase";
import SuperTable from "../components/SuperTable";
import CreateEditModal from "../components/CreateEditModal";
import { bikesModel } from "../models/bikesModel";

function Bikes() {
    const [bikes, setBikes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);

    async function fetchItems() {
        let { data, error } = await supabase.from("bikes").select("*");
        if (!error) {
            setBikes(data);
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
                .from("bikes")
                .update(formItem)
                .eq("id", editItem.id)
                .select();
            console.debug("Data returned from update:", data);
            if (!error) {
                setBikes(bikes.map((item) => (item.id === editItem.id ? data[0] : item)));
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
                .from("bikes")
                .insert([formItem])
                .select();
            console.debug("Data returned from insert:", data);
            if (!error) {
                setBikes([...bikes, data[0]]);
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
                .from("bikes")
                .delete()
                .eq("id", formItem.id);
            if (!error) {
                setBikes(bikes.filter((item) => item.id !== formItem.id));
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
        //const { data, error } = await supabase.from("inventory").insert([newItem]);
        //if (!error) setItems([...items, newItem]);
    }

    const customJsxAfterForm = (formItem, setFormItem) => {
        const fetchVehicleInfo = async () => {
            if (!formItem.license_plate) {
                alert('Please enter a license plate number first');
                return;
            }

            const { data, error } = await supabase.functions.invoke('api-call-with-secret-header', {
                body: {
                    name: 'Functions',
                    regnr: formItem.license_plate
                }
            });
            if (!error) {
                console.log('Fetched vehicle info:', data);
                // Update form with the fetched data
                setFormItem(prev => ({
                    ...prev,
                    make: data?.kjoretoydataListe?.[0]?.godkjenning?.tekniskGodkjenning?.tekniskeData?.generelt?.merke?.[0]?.merke || data.make,
                    model: data?.kjoretoydataListe?.[0]?.godkjenning?.tekniskGodkjenning?.tekniskeData?.generelt?.handelsbetegnelse?.[0] || prev.model,
                    model_year: data?.kjoretoydataListe?.[0]?.forstegangsregistrering?.registrertForstegangNorgeDato || data.year,
                    vin: data?.kjoretoydataListe[0]?.kjoretoyId?.understellsnummer || data.vin
                }));
            } else {
                alert('Failed to fetch vehicle information');
                console.error(error);
            }
        };

        return (
            <Button variant='info' onClick={fetchVehicleInfo}>
                Hent regnr-info fra Vegvesen
            </Button>
        );
    };

    return (
        <Container className="mt-4">
            {showModal && (
                <CreateEditModal
                    show={showModal}
                    handleClose={() => setShowModal(false)}
                    handleSubmit={handleSubmit}
                    editItem={editItem}
                    dataModel={bikesModel}
                    setEditItem={setEditItem}
                    onEntryAdded={fetchItems}
                    customJsxAfterForm={customJsxAfterForm}
                />
            )}
            <SuperTable tableData={bikes} dataModel={bikesModel} onAddBtnClick={onAddBtnClick} onEditBtnClick={onEditBtnClick} handleSubmit={handleSubmit} loading={loading} />
        </Container>
    );
}

export default Bikes;
