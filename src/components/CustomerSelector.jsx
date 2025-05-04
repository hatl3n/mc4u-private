import React, { useState } from 'react';
import { supabase } from '../supabase';
import EntitySelector from './EntitySelector';
import CreateEditModal from './CreateEditModal';
import { customersModel } from '../models/customersModel';

const CustomerSelector = ({ value, onChange }) => {
    const [searchResults, setSearchResults] = useState([]);
    const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

    const searchCustomers = async (term) => {
        if (!term || term.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
                .limit(10);

            if (error) throw error;
            setSearchResults(data);
        } catch (error) {
            console.error('Error searching customers:', error);
        }
    };

    const columns = [
        { key: 'name', label: 'Navn' },
        { key: 'email', label: 'Eport' },
        { key: 'phone', label: 'Telefon' }
    ];

    // This should probably be moved to a separate hook, as it's a duplicate-ish of add-method in Customers
    const handleSubmit = async (formItem, action) => {
        if (action !== "add") { alert("Feil skjedd, se konsoll for feilmelding"); console.error(formItem); console.error(action); return; }
        console.debug("Adding new formItem:", formItem);
        const { data, error } = await supabase
            .from("customers")
            .insert([formItem])
            .select();
        console.debug("Data returned from insert:", data);
        if (error) {
            console.error("Error adding item:", error);
            alert(`Error adding item! ${error.message}`);
            return;
        }
        //setCustomers([...customers, data[0]]);
        // Send upstream the data row with the new customer as if it was Selected in EntitySelector
        onChange(data[0]);
        setShowNewCustomerModal(false);
    };

    return (
        <>
            <EntitySelector
                label="Kunde"
                placeholder="Velg kunde"
                searchPlaceholder="Søk etter kunde (navn, epost, telefon)..."
                value={value}
                onChange={onChange}
                onSearch={searchCustomers}
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
                //editItem={editItem} // Some functions in CreateEditModal require editItem to be set, but we don't need it here
                //setEditItem={setEditItem}
            />
        </>
    );
};

export default CustomerSelector;