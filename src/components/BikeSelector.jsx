import React, { useState } from 'react';
import { supabase } from '../supabase';
import EntitySelector from './EntitySelector';
import { bikesModel } from '../models/bikesModel';
import CreateEditModal from './CreateEditModal';

const BikeSelector = ({ value, onChange }) => {
    const [searchResults, setSearchResults] = useState([]);
    const [showNewBikeModal, setShowNewBikeModal] = useState(false);

    const searchBikes = async (term) => {
        if (!term || term.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('bikes')
                .select('*')
                .or(`model.ilike.%${term}%,license_plate.ilike.%${term}%,vin.ilike.%${term}%make.ilike.%${term}%`)
                .limit(10);

            if (error) throw error;
            setSearchResults(data);
        } catch (error) {
            console.error('Error searching bikes:', error);
        }
    };

    const columns = [
        { key: 'make', label: 'Merke' },
        { key: 'model', label: 'Modell' },
        { key: 'license_plate', label: 'Skiltnummer' },
        { key: 'vin', label: 'Rammenummer' }
    ];

    async function handleSubmit(formItem, action) {
        if (action !== "add") { alert("Feil skjedd, se konsoll for feilmelding"); console.error(formItem); console.error(action); return; }
        console.debug("Adding new item:", formItem);
        const { data, error } = await supabase
            .from("bikes")
            .insert([formItem])
            .select();
        console.debug("Data returned from insert:", data);
        if (error) {
            console.error("Error adding item:", error);
            alert(`Error adding item! ${error.message}`);
            return;
        }
        //setBikes([...bikes, data[0]]);
        // Send upstream the data row with the new customer as if it was Selected in EntitySelector
        onChange(data[0]);
        setShowNewBikeModal(false);
    }

    return (
        <>
            <EntitySelector
                label="Sykkel"
                placeholder="Velg sykkel"
                searchPlaceholder="Søk etter sykkel (merke, modell, reg.nr, vin)..."
                value={value}
                onChange={onChange}
                onSearch={searchBikes}
                searchResults={searchResults}
                columns={columns}
                renderValue={(bike) => `${bike.make} ${bike.model} (${bike.license_plate || bike.vin || 'Ingen regnr/vin'})`}
                onAddBtnClick={() => setShowNewBikeModal(true)}
            />
            <CreateEditModal
                show={showNewBikeModal}
                handleClose={() => setShowNewBikeModal(false)}
                handleSubmit={handleSubmit}
                dataModel={bikesModel}
            //editItem={editItem} // Some functions in CreateEditModal require editItem to be set, but we don't need it here
            //setEditItem={setEditItem}
            />
        </>
    );
};

export default BikeSelector;