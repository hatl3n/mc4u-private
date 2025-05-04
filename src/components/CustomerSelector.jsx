import React, { useState } from 'react';
import { supabase } from '../supabase';
import EntitySelector from './EntitySelector';

const CustomerSelector = ({ value, onChange }) => {
  const [searchResults, setSearchResults] = useState([]);

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

  return (
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
    />
  );
};

export default CustomerSelector;