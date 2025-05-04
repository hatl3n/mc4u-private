import React, { useState } from 'react';
import { Form, InputGroup, Button, Modal, Table } from 'react-bootstrap';

const EntitySelector = ({
  label,
  placeholder,
  searchPlaceholder,
  value,
  onChange,
  onSearch,
  searchResults,
  searchMinLength = 2,
  columns,
  renderValue,
  isInvalid,
  errorMessage
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  const handleSelect = (item) => {
    onChange(item);
    setShowModal(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <InputGroup>
        <Form.Control
          placeholder={placeholder}
          value={value ? renderValue(value) : ''}
          readOnly
        />
        <Button variant="outline-secondary" onClick={() => setShowModal(true)}>
          &#x1F50D;
        </Button>
        {value && (
          <Button variant="outline-secondary" onClick={handleClear}>
            &#x2715;
          </Button>
        )}
      </InputGroup>
      {isInvalid && (
        <Form.Text className="text-danger">
          {errorMessage}
        </Form.Text>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{label}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearch}
                autoFocus
                autoComplete='one-time-code'
              />
            </InputGroup>
            <Form.Text className="text-muted">
              Type at least {searchMinLength} characters to start searching
            </Form.Text>
          </Form.Group>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {searchResults.length === 0 ? (
              <p className="text-center text-muted my-4">
                {searchTerm.length < searchMinLength
                  ? `Type to search...`
                  : 'No results found'}
              </p>
            ) : (
              <Table hover>
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map(item => (
                    <tr key={item.id}>
                      {columns.map(col => (
                        <td key={col.key}>{col.render ? col.render(item) : item[col.key]}</td>
                      ))}
                      <td>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSelect(item)}
                        >
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </Form.Group>
  );
};

export default EntitySelector;