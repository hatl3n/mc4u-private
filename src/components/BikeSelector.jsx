import React, { useState } from 'react';
import { supabase } from '../supabase';
import EntitySelector from './EntitySelector';

const BikeSelector = ({ value, onChange }) => {
  const [searchResults, setSearchResults] = useState([]);

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
    { key: 'vin', label: 'Rammenummer'}
  ];

  return (
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
    />
  );
};

export default BikeSelector;