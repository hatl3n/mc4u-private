import React, { useState } from 'react';
import EntitySelector from './EntitySelector';
import { bikesModel } from '../models/bikesModel';
import CreateEditModal from './CreateEditModal';
import { VegvesenAutoFormFill } from './VegvesenAutoFormFill';
import useBikes from '../hooks/useBikes';

const BikeSelector = ({ value, onChange }) => {
    const { bikes, searchBikes, addBike, loading, error, setError } = useBikes();
    const [searchResults, setSearchResults] = useState([]);
    const [showNewBikeModal, setShowNewBikeModal] = useState(false);

    // Wrap searchBikes to update local searchResults
    const handleSearch = async (term) => {
        if (!term || term.length < 2) {
            setSearchResults([]);
            return;
        }
        setError(null);
        await searchBikes(term);
        setSearchResults(bikes);
    };

    const columns = [
        { key: 'make', label: 'Merke' },
        { key: 'model', label: 'Modell' },
        { key: 'license_plate', label: 'Skiltnummer' },
        { key: 'vin', label: 'Rammenummer' }
    ];

    async function handleSubmit(formItem, action) {
        setError(null);
        if (action !== "add") {
            alert("Feil skjedd, se konsoll for feilmelding");
            console.error(formItem);
            console.error(action);
            return;
        }
        const { data, error } = await addBike(formItem);
        if (error) {
            alert(`Error adding item! ${error.message}`);
            return;
        }
        // Send upstream the data row with the new bike as if it was Selected in EntitySelector
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
                onSearch={handleSearch}
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
                customJsxAfterForm={VegvesenAutoFormFill}
            />
        </>
    );
};

export default BikeSelector;