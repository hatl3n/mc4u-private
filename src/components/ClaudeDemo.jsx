import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Spinner, Alert, Badge, InputGroup, ButtonGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { supabase } from '../supabase';

// TODO: Customers should use a <Card> component, also saves loading all the customers at once. Same for Bikes.
// TODO: Finn ut hvordan denne best gjenbrukes til å kunne se Arbeidsordre, Lagerbeholdning, ToDo, etc. (OK å lage custom PAges pr, men bør gjøres så normalisert som mulig, gjerne med no config i toppen)
// Custom views som feks Ny Arbeidsordre som fraviker fra Modal-versjonen som er standard. Og eventuelle strekkode-versjoner feks for fremtiden.
// TODO: Ha en løsning for når det er over 1000 rows, som er Supabase limit. Paginering virker ganske ryddig.
// Mulighet ift lager-trekk; når en arbeidsordre går til "plukk/påbegynt" så trekkes deler fra lageret. Til slutt er den "ferdig", evt 2 for "verksted ferdig" og "betaling helt ferdig" typ.
// TODO IMPORTANT: EACH QUERY TO SUPABASE RUNS TWICE - ONLY IN DEV, OR?
// TODO: Når description (eks) blir lang, så endres alle breddene i tabellen. Ikke ryddig, med samtidig, noen td må være brede og andre ikke for dynamisk data -how to fix?

function ClaudeDemo({ tableHeading, tableData, onEdit }) {
    // Main entity state
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const tableHeads = ['Name', 'Description', 'Category', 'Price', 'Actions'];
    const disableColumnFilters = true;

    // Form state
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category_id: ''
    });

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [alertMessage, setAlertMessage] = useState(null);
    const [alertVariant, setAlertVariant] = useState('success');

    // Category search state (in new/edit mode)
    const [categorySearchTerm, setCategorySearchTerm] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [filteredCategories, setFilteredCategories] = useState([]);

    // Filter state
    const [filteredItems, setFilteredItems] = useState([]);
    const [activeCategoryId, setActiveCategoryId] = useState(null); // New state for active category (list filter)

    // Search state
    const [searchTerm, setSearchTerm] = useState("");

    // Filter state (per-column search/filter)
    const [filters, setFilters] = useState({});

    // Sorting state
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Fetch data on component mount
    useEffect(() => {
        fetchData();
    }, []);

    // Filter items based on search, filter or ordering (used in list view)
    useEffect(() => {
        // Array that gets updated by following filters. Resets filtered items in case any state is Null or undefined.
        let filtered = [...items];

        // Apply text search filtering
        if (searchTerm) {
            filtered = items.filter((row) =>
                // Take all the values and flatten them by JSONstringifying them, also makes recursive object searchable, and goes to lowercase for non-sensitive search
                JSON.stringify(Object.values(row)).toLowerCase()
                    .includes(searchTerm.toLowerCase())
            );
        }

        // Apply category filter
        if (activeCategoryId) {
            filtered = filtered.filter((i) => i.category_id === activeCategoryId);
        }

        // Apply column-based filters
        // TODO!!!! MAKE CASE INSENSITIVE!
        Object.keys(filters).forEach((col) => {
            if (filters[col]) {
                filtered = filtered.filter((row) => row[col] && row[col].toString().includes(filters[col]));
            }
        });

        // Apply sorting
        if (sortConfig.key) {
            filtered = filtered.sort((a, b) => {
                const aValue = a[sortConfig.key.toLowerCase()]; // WOOPSIE-DOOPISE; need to use other than toLowerCase(), should have one data tag for column key and one for display name, also bad typesafety
                const bValue = b[sortConfig.key.toLowerCase()];

                // Can use, to parse floats/ints as numeric: isNaN(b[sortConfig.key]), cuz price is currently string in supabase.

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredItems(filtered);
    }, [items, searchTerm, activeCategoryId, filters, sortConfig]);

    // Update filtered categories when search term changes (used in create modal!)
    useEffect(() => {
        // Apply category filter
        if (categories.length > 0) {
            const filtered = categories.filter(category =>
                category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
            );
            setFilteredCategories(filtered);
        }
    }, [categorySearchTerm, categories]);

    // Fetch both items and categories
    // TODO: I think this should be rebuilt to syncronous, cuz now it runs two times, likely due to async-stuff maybe?
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch categories first
            const { data: categoryData, error: categoryError } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (categoryError) throw categoryError;
            setCategories(categoryData);
            setFilteredCategories(categoryData);

            // Then fetch items with their related category information
            const { data: itemData, error: itemError } = await supabase
                .from('items')
                .select(`*, categories:category_id (id, name)`);
            if (itemError) throw itemError;
            setItems(itemData);
            setFilteredItems(itemData); // Initially, filtered items are the same as the fetched items
            setError(null);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    // Open modal for creating a new item
    const handleCreate = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            category_id: ''
        });
        setCategorySearchTerm('');
        setModalMode('create');
        setShowModal(true);
    };

    // Open modal for editing an existing item
    const handleEdit = (item) => {
        setSelectedItem(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            price: item.price || '',
            category_id: item.category_id || ''
        });

        // Set the search term to show the currently selected category
        if (item.category_id) {
            const category = categories.find(c => c.id === item.category_id);
            if (category) {
                setCategorySearchTerm(category.name);
            }
        } else {
            setCategorySearchTerm('');
        }

        setModalMode('edit');
        setShowModal(true);
    };

    // Delete an item
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            setLoading(true);
            try {
                const { error } = await supabase
                    .from('items')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                // Update local state
                setItems(items.filter(item => item.id !== id));
                showAlert('Item deleted successfully!', 'success');
            } catch (err) {
                console.error('Error deleting item:', err);
                showAlert('Failed to delete item.', 'danger');
            } finally {
                setLoading(false);
            }
        }
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle category search input changes
    const handleCategorySearchChange = (e) => {
        setCategorySearchTerm(e.target.value);
        setShowCategoryDropdown(true);
    };

    // Handle category selection from dropdown
    const handleCategorySelect = (category) => {
        setFormData({
            ...formData,
            category_id: category.id
        });
        setCategorySearchTerm(category.name);
        setShowCategoryDropdown(false);
    };

    // Clear category selection
    const handleClearCategory = () => {
        setFormData({
            ...formData,
            category_id: ''
        });
        setCategorySearchTerm('');
    };

    // Submit form data (create or update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (modalMode === 'create') {
                // Create a new item
                const { data, error } = await supabase
                    .from('items')
                    .insert([formData])
                    .select(`*, categories:category_id (id, name)`);

                if (error) throw error;

                setItems([...items, data[0]]);
                showAlert('Item created successfully!', 'success');
            } else {
                // Update existing item
                const { data, error } = await supabase
                    .from('items')
                    .update(formData)
                    .eq('id', selectedItem.id)
                    .select(`*, categories:category_id (id, name)`);

                if (error) throw error;

                // Update local state
                setItems(items.map(item => item.id === selectedItem.id ? data[0] : item));
                showAlert('Item updated successfully!', 'success');
            }

            setShowModal(false);
        } catch (err) {
            console.error('Error saving item:', err);
            showAlert('Failed to save item.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    // Show alert message
    const showAlert = (message, variant) => {
        setAlertMessage(message);
        setAlertVariant(variant);

        // Auto-hide alert after 3 seconds
        setTimeout(() => {
            setAlertMessage(null);
        }, 3000);
    };

    // Format price as currency
    const formatPrice = (price) => {
        return new Intl.NumberFormat('no-NO', {
            style: 'currency',
            currency: 'NOK'
        }).format(price);
    };

    // Get selected category name
    const getSelectedCategoryName = () => {
        if (formData.category_id) {
            const category = categories.find(c => c.id === formData.category_id);
            return category ? category.name : '';
        }
        return '';
    };

    return (
        <Container className="py-4">
            <h1 className="mb-4">{tableHeading || "List data"}</h1>

            {/* Alert for notifications */}
            {alertMessage && (
                <Alert variant={alertVariant} dismissible onClose={() => setAlertMessage(null)}>
                    {alertMessage}
                </Alert>
            )}

            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Items</h5>
                    <Button variant="primary" onClick={handleCreate}>
                        Add New Item
                    </Button>
                </Card.Header>
                <Card.Body>
                    {loading && <div className="text-center py-4"><Spinner animation="border" /></div>}

                    {error && <Alert variant="danger">{error}</Alert>}

                    {!loading && !error && items.length === 0 && (
                        <Alert variant="info">No items found. Create your first item!</Alert>
                    )}

                    {/* Filter buttons */}
                    {!loading && !error && items.length > 0 && (
                        <><Form.Group className="mb-2">
                            <Form.Control
                                type="text"
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoComplete='one-time-code' />
                        </Form.Group>

                            <ButtonGroup aria-label='Filtrer' className="mb-3">
                                <Button
                                    variant={activeCategoryId === null ? "primary" : "secondary"}
                                    onClick={(e) => setActiveCategoryId(null)}
                                >
                                    All
                                </Button>
                                {categories.map(category => (
                                    <Button
                                        key={category.id}
                                        variant={activeCategoryId === category.id ? "primary" : "secondary"}
                                        onClick={(e) => setActiveCategoryId(category.id)}
                                    >
                                        {category.name}
                                    </Button>
                                ))}
                            </ButtonGroup></>
                    )}

                    {!loading && !error && tableHeads.length > 0 && (
                        <Table responsive hover>
                            <thead>
                                <tr>
                                    {tableHeads.map((head, idx) => (
                                        <th key={idx}
                                            onClick={() => setSortConfig({ key: head, direction: sortConfig.key === head && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {head}
                                            {sortConfig.key === head && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                                        </th>
                                    ))}
                                </tr>
                                <tr>
                                    { !disableColumnFilters && tableHeads.map((col) => (
                                        <td key={col}>
                                            <Form.Control
                                                key={col.toLowerCase()}
                                                type="text"
                                                placeholder={`Filter by ${col.toLowerCase()}`}
                                                value={filters[col.toLowerCase()] || ""}
                                                onChange={(e) => setFilters((prev) => ({ ...prev, [col.toLowerCase()]: e.target.value }))}
                                                /* TODO: TEMP WORKAROUND UNTIL COLUMNS ARE ACTUAL KEYS AND DISPLAY NAMES */
                                            />
                                        </td>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td>{item.description}</td>
                                        <td>
                                            {item.categories ? (
                                                <Badge bg="secondary">{item.categories.name}</Badge>
                                            ) : (
                                                <Badge bg="light" text="dark">None</Badge>
                                            )}
                                        </td>
                                        <td>{item.price ? formatPrice(item.price) : '-'}</td>
                                        <td style={{ minWidth: "130px" }}>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => handleEdit(item)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{modalMode === 'create' ? 'Add New Item' : 'Edit Item'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                autoComplete='off'
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Price</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                autoComplete='off'
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Category</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type="text"
                                    placeholder="Search for a category..."
                                    value={categorySearchTerm}
                                    onChange={handleCategorySearchChange}
                                    onFocus={() => setShowCategoryDropdown(true)}
                                    autoComplete="off"
                                />
                                {formData.category_id && (
                                    <Button
                                        variant="outline-secondary"
                                        onClick={handleClearCategory}
                                    >
                                        ×
                                    </Button>
                                )}
                            </InputGroup>

                            {/* Searchable dropdown */}
                            {showCategoryDropdown && (
                                <div
                                    className="position-absolute mt-1 w-100 shadow bg-white rounded z-index-1000"
                                    style={{
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        zIndex: 1000,
                                        border: '1px solid #ced4da'
                                    }}
                                >
                                    {filteredCategories.length === 0 ? (
                                        <div className="p-2 text-muted">No categories found</div>
                                    ) : (
                                        filteredCategories.map(category => (
                                            <div
                                                key={category.id}
                                                className="p-2 border-bottom cursor-pointer hover-bg-light"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleCategorySelect(category)}
                                                onMouseDown={(e) => e.preventDefault()} // Prevent blur event
                                            >
                                                {category.name}
                                                {formData.category_id === category.id && (
                                                    <Badge bg="primary" className="ms-2">Selected</Badge>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Currently selected category (for visual confirmation) */}
                            {formData.category_id && (
                                <div className="mt-2">
                                    <small className="text-muted">Selected category:</small>
                                    <Badge bg="secondary" className="ms-1">{getSelectedCategoryName()}</Badge>
                                </div>
                            )}
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? <Spinner animation="border" size="sm" /> : 'Save'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}

export default ClaudeDemo;