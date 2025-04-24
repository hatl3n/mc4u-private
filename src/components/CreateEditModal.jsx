import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, Modal, Spinner, Alert, Badge, InputGroup, ButtonGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { supabase } from '../supabase';

function CreateEditModal({ show, handleClose, handleSubmit, onEntryAdded, editItem, dataModel, setEditItem }) {
    const [formItem, setFormItem] = useState({});
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Prepopulate data if editItem is provided
        // Run this only if editItem exists
        if (!editItem) {
            return;
        }
        const placeholderItem = {};
        // Loop through the editItem and only keep the keys that are in dataModel.fields
        // and are not null or undefined
        Object.entries(editItem).forEach( ([k,v]) => {
            if (dataModel.fields.filter( x => x.key === k).length > 0 && v !== null && v !== undefined) {
                placeholderItem[k] = v;
            }
        });
        setFormItem(placeholderItem);
    }, [editItem, dataModel]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Update form item. Also, if the value is empty string, set it to null
        setFormItem((prevItem) => ({ ...prevItem, [name]: value === "" ? null : value }));
    };
    const handleSelectChange = (name, selectedOption) => {
        setFormItem((prevItem) => ({ ...prevItem, [name]: selectedOption }));
    };

    const handleCloseModal = () => {
        handleClose();
        setEditItem(null);
    };
    return (
        <Modal show={show} onHide={handleCloseModal}>
            <Modal.Header closeButton>
                <Modal.Title>{editItem ? 'Edit Entry' : 'Add New Entry'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {message && <Alert variant="success">{message}</Alert>}
                    {dataModel.fields.map((field) => {
                        if (field.type === 'text' || field.type === 'integer') {
                            return (
                                <Form.Group key={field.key} controlId={field.key} className='mb-2'>
                                    <Form.Label>{field.label}</Form.Label>
                                    <Form.Control
                                        type={field.type}
                                        name={field.key}
                                        value={formItem[field.key] || ''}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            );
                        }
                        if (field.type === 'select') {
                            return (
                                <Form.Group key={field.key} controlId={field.key} className='mb-2'>
                                    <Form.Label>{field.label}</Form.Label>
                                    <Form.Select
                                        name={field.key}
                                        value={formItem[field.key] || ''}
                                        onChange={(e) => handleSelectChange(field.key, e.target.value)}
                                    >
                                        {field.options.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            );
                        }
                    })}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="primary" type="submit" onClick={() => handleSubmit(formItem, editItem ? "edit" : "add")}>
                    {editItem ? 'Update' : 'Add'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
export default CreateEditModal;
// Note: This code assumes that the supabase client is correctly configured and connected to your database.
// Make sure to handle any errors and edge cases as needed.