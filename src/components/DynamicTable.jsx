import { useState, useEffect } from 'react';
import { Table, Form, Button, Container } from 'react-bootstrap';

// This component expects a string tableHeading and an object with column_name:value for each row in table/database

const DynamicTable = ({ tableHeading, tableData, onEdit }) => {
  const [columns, setColumns] = useState([]);
  const [filteredData, setFilteredData] = useState([]); // Separate state for filtered data
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});

  useEffect(() => {

    setFilteredData(tableData); // Initially, filtered data is the same as the fetched data

    if (tableData.length > 0) {
      const columnNames = Object.keys(tableData[0]);
      setColumns(columnNames);
    }
  }, [tableData]);

  // Listen for change requests to search, filter and ordering and apply
  useEffect(() => {
    let filtered = [...tableData];

    // Apply text search filtering
    if (searchTerm) {
      filtered = filtered.filter((row) =>
         // Take all the values and flatten them by JSONstringifying them, also makes recursive object searchable, and goes to lowercase for non-sensitive search
        JSON.stringify(Object.values(row)).toLowerCase()
        .includes(searchTerm.toLowerCase())
      );
    }

    // Apply column-based filters
    Object.keys(filters).forEach((col) => {
      if (filters[col]) {
        filtered = filtered.filter((row) => row[col] && row[col].toString().includes(filters[col]));
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered = filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredData(filtered);
  }, [searchTerm, sortConfig, filters]);

  return (
    <Container className="mt-4">
      <h2>{tableHeading}</h2>

      <Form.Group className="mb-2">
        <Form.Control
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form.Group>

      <div className="mb-2">
        {columns.map((col) => (
          <Form.Group key={col} className="d-inline-block mx-2">
            <Form.Control
              type="text"
              placeholder={`Filter by ${col}`}
              value={filters[col] || ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, [col]: e.target.value }))}
            />
          </Form.Group>
        ))}
      </div>

      <Table striped bordered hover className="mt-4">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                onClick={(e) => setSortConfig({ key: col, direction: sortConfig.key === col && sortConfig.direction === 'asc' ? 'desc' : 'asc' })} // Dette KUNNE sett penere ut
                style={{ cursor: 'pointer' }}
              >
                {col}
                {sortConfig.key === col && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
              </th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col}>{row[col]}</td>
                ))}
                <td>
                  <Button variant="warning" onClick={() => onEdit(row)}>Edit</Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + 1}>No data available</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default DynamicTable;
