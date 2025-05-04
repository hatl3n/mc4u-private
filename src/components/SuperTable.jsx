import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, Modal, Spinner, Alert, Badge, InputGroup, ButtonGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { supabase } from '../supabase';
import { data } from 'react-router-dom';

// TODO: Customers should use a <Card> component, also saves loading all the customers at once. Same for Bikes.
// TODO: Finn ut hvordan denne best gjenbrukes til å kunne se Arbeidsordre, Lagerbeholdning, ToDo, etc. (OK å lage custom PAges pr, men bør gjøres så normalisert som mulig, gjerne med no config i toppen)
// Custom views som feks Ny Arbeidsordre som fraviker fra Modal-versjonen som er standard. Og eventuelle strekkode-versjoner feks for fremtiden.
// TODO: Ha en løsning for når det er over 1000 rows, som er Supabase limit. Paginering virker ganske ryddig.
// Mulighet ift lager-trekk; når en arbeidsordre går til "plukk/påbegynt" så trekkes deler fra lageret. Til slutt er den "ferdig", evt 2 for "verksted ferdig" og "betaling helt ferdig" typ.
// TODO IMPORTANT: EACH QUERY TO SUPABASE RUNS TWICE - ONLY IN DEV, OR?
// TODO: Når description (eks) blir lang, så endres alle breddene i tabellen. Ikke ryddig, med samtidig, noen td må være brede og andre ikke for dynamisk data -how to fix?

function SuperTable({ tableData, dataModel, loading, onAddBtnClick, onEditBtnClick, handleSubmit }) {
    // Main entity state
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState(null);
    const disableColumnFilters = true; // This is kinda deprecated

    // Trying to make this into descriptive, resuble formats
    /**
     * dataModel holds metadata about table information and processing
     * @param {name} name - The name of the data model
     * @param {endpoint} endpoint - The endpoint to fetch data from
     * @param {fields} fields - Array of the fields in the data model:
     *   * @param {key} key - The key in the data object
     *   * @param {label} label - The label to show in the table
     *   * @param {type} type - The type of data, used for rendering and processing
     *   * @param {valueOverride} valueOverride - Function or Array of keys to override the value of the data (ex ['foo','bar'] will look in sqlData['foo']['bar'])
     *   * @param {searchable} searchable - Boolean to enable search on this field
     *   * @param {options} options - Array of options for select fields
     *   * @param {required} required - Boolean to enable required field
     *   * @param {editable} editable - Boolean to enable editing of field
     *   * @param {filterable} filterable - Boolean to enable filtering on this field
     * @param {defaultSort} defaultSort - Object with key and direction for default sorting
     *   * @param {key} key - The key in the data object
     *   * @param {direction} direction - The direction of the sorting, 'asc' or 'desc'
     * @param {actions} actions - Object with boolean values for create, edit and delete
     *   * @param {create} create - Boolean to enable create action
     *   * @param {edit} edit - Boolean to enable edit action
     *   * @param {delete} delete - Boolean to enable delete action
     * Notice that you can also add other keys not in the sql-data, like 'actions' for buttons etc.
     */

    // Filter state
    const [filteredItems, setFilteredItems] = useState([]);
    const [activeCategoryValue, setActiveCategoryValue] = useState(null); // New state for active category (list filter)
    const [activeCategoryDataModelValue, setActiveCategoryDataModelValue] = useState(null); // New state for active category (list filter)

    // Search state
    const [searchTerm, setSearchTerm] = useState("");

    // Filter state (per-column search/filter)
    const [filters, setFilters] = useState({});

    // Sorting state
    // TODO: This doesnt work in initialize, probably because it's not triggered or something
    const [sortConfig, setSortConfig] = useState(dataModel.defaultSort || { key: null, direction: 'asc' });

    // Fetch data on component mount
    /*useEffect(() => {
        setItems(tableData);
        setFilteredItems(tableData); // Initially, filtered items are the same as the fetched items
        setLoading(false);
    }, []);
    */

    // Filter items based on search, filter or ordering (used in list view)
    useEffect(() => {
        // Array that gets updated by following filters. Resets filtered items in case any state is Null or undefined.
        let filtered = [...tableData];

        // Apply text search filtering
        if (searchTerm) {
            filtered = tableData.filter((row) =>
                // Take all the values and flatten them by JSONstringifying them, also makes recursive object searchable, and goes to lowercase for non-sensitive search
                JSON.stringify(Object.values(row)).toLowerCase()
                    .includes(searchTerm.toLowerCase())
            );
        }

        // Apply category filter
        if (activeCategoryValue) {
            filtered = filtered.filter((i) => i[activeCategoryDataModelValue] === activeCategoryValue);
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
    }, [tableData, searchTerm, activeCategoryValue, filters, sortConfig]);

    useEffect(() => {
        const selectFieldsFromDataModel = dataModel.fields.filter((field) => field.type === 'select');
        if (selectFieldsFromDataModel.length > 0) {
            // Pick first, TODO: make it multiple
            setCategories(selectFieldsFromDataModel[0].options);
            setActiveCategoryDataModelValue(selectFieldsFromDataModel[0].key);
        }
    }, [dataModel.fields]);

    // Format price as currency
    const formatPrice = (price) => {
        return new Intl.NumberFormat('no-NO', {
            style: 'currency',
            currency: 'NOK'
        }).format(price);
    };

    return (
        <Container className="py-4">
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{dataModel.name || "List data"}</h5>
                    {onAddBtnClick &&
                        <Button variant="primary" onClick={onAddBtnClick}>
                            + Legg til
                        </Button>
                    }
                </Card.Header>
                <Card.Body>
                    {loading && <div className="text-center py-4"><Spinner animation="border" /></div>}

                    {error && <Alert variant="danger">{error}</Alert>}

                    {!loading && !error && tableData.length === 0 && (
                        <Alert variant="info">Her var det tomt! Lag din første oppføring.</Alert>
                    )}

                    {/* Filter buttons */}
                    {!loading && !error && tableData.length > 0 && (
                        <><Form.Group className="mb-2">
                            <Form.Control
                                type="text"
                                placeholder="Søk"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoComplete='one-time-code' />
                        </Form.Group>

                            <ButtonGroup aria-label='Filtrer' className="mb-3">
                                <Button
                                    variant={activeCategoryValue === null ? "primary" : "secondary"}
                                    onClick={() => setActiveCategoryValue(null)}
                                >
                                    Alle
                                </Button>
                                {categories.map(category => (
                                    <Button
                                        key={category.value}
                                        variant={activeCategoryValue === category.value ? "primary" : "secondary"}
                                        onClick={() => setActiveCategoryValue(category.value)}
                                    >
                                        {category.label}
                                    </Button>
                                ))}
                            </ButtonGroup>
                        </>
                    )}

                    {!loading && !error && dataModel.fields.length > 0 && (
                        <Table responsive hover>
                            <thead>
                                <tr>
                                    {dataModel.fields.map((field, idx) => (
                                        <th key={idx}
                                            onClick={() => setSortConfig({ key: field.key, direction: sortConfig.key === field.key && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {field.label}
                                            {sortConfig.key === field.key && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                                        </th>
                                    ))}
                                     {dataModel?.actions &&
                                        <th key="actions">
                                            Handlinger
                                        </th>
                                    }
                                </tr>
                                <tr>
                                    {!disableColumnFilters && dataModel.fields.map((field) => (
                                        field.filterable ? (
                                            <td key={field.key}>
                                                <Form.Control
                                                    key={field.key}
                                                    type="text"
                                                    placeholder={`Filter by ${field.label}`}
                                                    value={filters[field.key] || ""}
                                                    onChange={(e) => setFilters((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                                    autoComplete='one-time-code'
                                                />
                                            </td>
                                        ) : (
                                            <td key={field.key}></td>
                                        )
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                { /* Loop through items left after filtering */}
                                {filteredItems.map(item => (
                                    <tr key={item.id}>
                                        {/* Loop through dataModel to display only fields named in model, also override presentation if necessary */}
                                        {dataModel.fields.map((field, idx) => (
                                            <td key={idx}>
                                                { /** Check if dataModel ask for a rewrite of the value, else print item key's value directly */}
                                                {field.valueOverride ? (
                                                    Array.isArray(field.valueOverride) && field.valueOverride.length > 0 ? (
                                                        // Recursively add paths of valueOverride to item to retrieve correct value to use. Example: ['categories', 'name'] will get item.categories.name
                                                        // Note: this is a very simple workaround for type-saftey (String) and should be improved.
                                                        String(field.valueOverride.reduce((acc, key) => acc && acc[key], item))
                                                    ) : (
                                                        // If valueOverride is not an array, apply the function
                                                        // Keep in mind that filters/search will not see post-processed values, only the raw data
                                                        typeof field.valueOverride === 'function' ? (
                                                            field.valueOverride(item)
                                                        ) : (
                                                            "MALFORMED VALUE OVERRIDE:"
                                                        )
                                                    )
                                                ) : (
                                                    item[field.key]
                                                )}
                                            </td>
                                        ))}
                                        <td key={item.id + "actions"}>
                                            <div className="d-flex flex-wrap gap-2">
                                                {dataModel.actions?.edit &&
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => onEditBtnClick(item)}
                                                    >
                                                        Rediger
                                                    </Button>
                                                }
                                                {dataModel.actions?.delete &&
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => window.confirm('Er du sikker på du vil slette oppføringen?') ? handleSubmit(item, "delete") : null}
                                                    >
                                                        Slett
                                                    </Button>
                                                }
                                                {dataModel.actions?.custom?.map((action, index) => (
                                                    <Button
                                                        key={index}
                                                        variant={action.variant || "primary"}
                                                        size="sm"
                                                        onClick={() => action.onClick(item)}
                                                    >
                                                        {action.icon} {action.label}
                                                    </Button>
                                                ))}
                                            </div>

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}

export default SuperTable;