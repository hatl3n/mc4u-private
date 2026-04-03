import React, { useState } from 'react';
import EntitySelector from './EntitySelector';
import CreateEditModal from './CreateEditModal';
import { customersModel } from '../models/customersModel';
import useCustomers from '../hooks/useCustomers';

const CustomerSelector = ({ value, onChange }) => {
    const { customers, searchCustomers, addCustomer, setError } = useCustomers();
    const [searchResults, setSearchResults] = useState([]);
    const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

    // Wrap searchCustomers to update local searchResults
    const handleSearch = async (term) => {
        if (!term || term.length < 2) {
            setSearchResults([]);
            return;
        }
        setError(null);
        await searchCustomers(term);
        setSearchResults(customers);
    };

    const columns = [
        { key: 'name', label: 'Navn' },
        { key: 'email', label: 'Eport' },
        { key: 'phone', label: 'Telefon' }
    ];

    async function handleSubmit(formItem, action) {
        setError(null);
        if (action !== "add") {
            alert("Feil skjedd, se konsoll for feilmelding");
            console.error(formItem);
            console.error(action);
            return;
        }
        const { data, error } = await addCustomer(formItem);
        if (error) {
            alert(`Error adding item! ${error.message}`);
            return;
        }
        // Send upstream the data row with the new customer as if it was Selected in EntitySelector
        onChange(data[0]);
        setShowNewCustomerModal(false);
    }

    return (
        <>
            <EntitySelector
                label="Kunde"
                placeholder="Velg kunde"
                searchPlaceholder="Søk etter kunde (navn, epost, telefon)..."
                value={value}
                onChange={onChange}
                onSearch={handleSearch}
                searchResults={searchResults}
                columns={columns}
                renderValue={(customer) => `${customer.name} (${customer.email})`}
                onAddBtnClick={() => setShowNewCustomerModal(true)}
            />
            <CreateEditModal
                show={showNewCustomerModal}
                handleClose={() => setShowNewCustomerModal(false)}
                handleSubmit={handleSubmit}
                dataModel={customersModel}
            />
        </>
    );
};

export default CustomerSelector;