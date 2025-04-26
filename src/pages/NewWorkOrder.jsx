// TODO: Move VAT into per line
// TODO: Qualify all supabase calls.
// TODO: Add category, and force no change of billed work orders in postgres.
// TODO: Add rabatt-felt

import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Form, Button, Card, Table,
  InputGroup, Modal, Spinner, Badge
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const NewWorkOrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  // Work Order State
  const [workOrder, setWorkOrder] = useState({
    id: null,
    created_at: new Date().toISOString(),
    status: 'open',
    customer_id: null,
    bike_id: null,
    notes: '',
    total_ex_vat: 0,
    total_vat: 0,
    total_inc_vat: 0,
    items: []
  });

  // Search State
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [bikeSearchTerm, setBikeSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [bikeSearchResults, setBikeSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedBike, setSelectedBike] = useState(null);

  // UI State
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showBikeModal, setShowBikeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Load work order data if editing
  useEffect(() => {
    if (isEditing) {
      fetchWorkOrder();
    }
  }, [id]);

  // Fetch work order data when editing
  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('work_orders')
        .select('*, items:work_order_lines(*), customer:customer_id (*), bike:bike_id (*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // Normalize the items data
        const normalizedItems = data.items.map(normalizeWorkOrderItem);

        // Calculate totals
        const totalExVat = normalizedItems.reduce((sum, item) => sum + item.line_total_ex_vat, 0);
        const totalIncVat = normalizedItems.reduce((sum, item) => sum + item.line_total_inc_vat, 0);
        const totalVat = totalIncVat - totalExVat;

        const normalizedWorkOrder = {
          ...data,
          items: normalizedItems,
          total_ex_vat: parseFloat(totalExVat.toFixed(2)),
          total_vat: parseFloat(totalVat.toFixed(2)),
          total_inc_vat: parseFloat(totalIncVat.toFixed(2))
        };

        setWorkOrder(normalizedWorkOrder);
        setSelectedCustomer(data.customer);
        setSelectedBike(data.bike);
      }
    } catch (error) {
      console.error('Error fetching work order:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function for fetchWorkOrder to import or generate missing nulls and non-existant columns
  const normalizeWorkOrderItem = (item) => {
    const quantity = item.quantity || 1;
    const price_ex_vat = item.price_ex_vat || 0;
    const vat_percent = item.vat_rate ? ((item.vat_rate - 1) * 100) : 25;
    const discount_percent = item.discount_percent || 0;

    // Calculate prices including VAT
    const price_inc_vat = parseFloat((price_ex_vat * (1 + vat_percent / 100)).toFixed(2));

    // Calculate base totals before discount
    const baseLineTotalExVat = price_ex_vat * quantity;
    const baseLineTotalIncVat = price_inc_vat * quantity;

    // Apply discount
    const discountMultiplier = 1 - (discount_percent / 100);
    const line_total_ex_vat = parseFloat((baseLineTotalExVat * discountMultiplier).toFixed(2));
    const line_total_inc_vat = parseFloat((baseLineTotalIncVat * discountMultiplier).toFixed(2));

    return {
      id: item.id,
      description: item.description || '',
      quantity: quantity,
      price_ex_vat: price_ex_vat,
      price_inc_vat: price_inc_vat,
      vat_percent: vat_percent,
      vat_amount: parseFloat((line_total_inc_vat - line_total_ex_vat).toFixed(2)),
      discount_percent: discount_percent,
      discount_amount: parseFloat((baseLineTotalExVat - line_total_ex_vat).toFixed(2)),
      line_total_ex_vat: line_total_ex_vat,
      line_total_inc_vat: line_total_inc_vat
    };
  };

  // Search for customers
  const searchCustomers = async (term) => {
    if (!term || term.length < 2) {
      setCustomerSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      setCustomerSearchResults(data);
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  // Search for bikes
  const searchBikes = async (term) => {
    if (!term || term.length < 2) {
      setBikeSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .or(`model.ilike.%${term}%,license_plate.ilike.%${term}%,make.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      setBikeSearchResults(data);
    } catch (error) {
      console.error('Error searching bikes:', error);
    }
  };

  // Handle customer search input
  const handleCustomerSearch = (e) => {
    const term = e.target.value;
    setCustomerSearchTerm(term);
    searchCustomers(term);
  };

  // Handle bike search input
  const handleBikeSearch = (e) => {
    const term = e.target.value;
    setBikeSearchTerm(term);
    searchBikes(term);
  };

  // Select a customer
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setWorkOrder({ ...workOrder, customer_id: customer.id });
    setShowCustomerModal(false);
  };

  // Select a bike
  const handleSelectBike = (bike) => {
    setSelectedBike(bike);
    setWorkOrder({ ...workOrder, bike_id: bike.id });
    setShowBikeModal(false);
  };

  // Add a new item line
  const addItemLine = () => {
    const newItem = {
      id: `temp_${Date.now()}`, // Temporary ID until saved
      description: '',
      quantity: 1,
      price_ex_vat: 0,
      price_inc_vat: 0,
      vat_percent: 25, // Changed from vat_rate to vat_percent
      vat_amount: 0,
      discount_percent: 0, // New discount field
      discount_amount: 0, // Calculated discount amount
      line_total_ex_vat: 0,
      line_total_inc_vat: 0
    };

    setWorkOrder({
      ...workOrder,
      items: [...workOrder.items, newItem]
    });
  };

  // Remove an item line
  const removeItemLine = (index) => {
    const updatedItems = [...workOrder.items];
    updatedItems.splice(index, 1);

    const newWorkOrder = {
      ...workOrder,
      items: updatedItems
    };

    // Recalculate totals
    calculateOrderTotals(newWorkOrder);
  };

  // Update an item field
  const updateItemField = (index, field, value) => {
    const updatedItems = [...workOrder.items];
    const item = { ...updatedItems[index] };

    // Update the specific field
    item[field] = value;

    // Calculate base prices first (before discount)
    if (field === 'price_ex_vat') {
      // When ex VAT price changes, update inc VAT price
      item.price_inc_vat = parseFloat((value * (1 + item.vat_percent / 100)).toFixed(2));
    } else if (field === 'price_inc_vat') {
      // When inc VAT price changes, update ex VAT price
      item.price_ex_vat = parseFloat((value / (1 + item.vat_percent / 100)).toFixed(2));
    } else if (field === 'vat_percent') {
      // When VAT percent changes, recalculate inc VAT price from ex VAT
      item.price_inc_vat = parseFloat((item.price_ex_vat * (1 + value / 100)).toFixed(2));
    }

    // Calculate line totals with discount
    const discountMultiplier = 1 - (item.discount_percent / 100);

    // Calculate base line totals (before discount)
    const baseLineTotalExVat = item.price_ex_vat * item.quantity;
    const baseLineTotalIncVat = item.price_inc_vat * item.quantity;

    // Apply discount to line totals
    item.line_total_ex_vat = parseFloat((baseLineTotalExVat * discountMultiplier).toFixed(2));
    item.line_total_inc_vat = parseFloat((baseLineTotalIncVat * discountMultiplier).toFixed(2));

    // Calculate VAT amount based on final line totals
    item.vat_amount = parseFloat((item.line_total_inc_vat - item.line_total_ex_vat).toFixed(2));

    // Calculate discount amount based on base line total
    item.discount_amount = parseFloat((baseLineTotalExVat - item.line_total_ex_vat).toFixed(2));

    updatedItems[index] = item;

    const newWorkOrder = {
      ...workOrder,
      items: updatedItems
    };

    // Update state and recalculate totals
    calculateOrderTotals(newWorkOrder);
  };

  // Calculate order totals
  const calculateOrderTotals = (orderData) => {
    const items = orderData.items || [];

    // Calculate totals
    const totalExVat = items.reduce((sum, item) => sum + item.line_total_ex_vat, 0);
    const totalIncVat = items.reduce((sum, item) => sum + item.line_total_inc_vat, 0);
    const totalVat = totalIncVat - totalExVat;

    // Update work order with new totals
    const updatedOrder = {
      ...orderData,
      total_ex_vat: parseFloat(totalExVat.toFixed(2)),
      total_vat: parseFloat(totalVat.toFixed(2)),
      total_inc_vat: parseFloat(totalIncVat.toFixed(2))
    };

    setWorkOrder(updatedOrder);
  };

  // Validate the work order before saving
  const validateWorkOrder = () => {
    const errors = {};

    if (!workOrder.customer_id) {
      errors.id = 'Please select a customer';
    }

    if (!workOrder.bike_id) {
      errors.bike_id = 'Please select a bike';
    }

    if (!workOrder.items.length) {
      errors.items = 'Please add at least one item';
    } else {
      // Check if all items have descriptions
      const hasEmptyDescriptions = workOrder.items.some(item => !item.description.trim());
      if (hasEmptyDescriptions) {
        errors.itemDescription = 'All items must have a description';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save the work order
  const saveWorkOrder = async () => {
    // Validate first
    if (!validateWorkOrder()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare work order data (without items)
      const { items, ...workOrderData } = workOrder;

      let workOrderId = workOrder.id;

      const workOrderDataToInsert = {
        customer_id: workOrder.customer_id,
        bike_id: workOrder.bike_id,
        status: workOrder.status,
        notes: workOrder.notes,
        odometer: workOrder.odometer,
        total_inc_vat: workOrder.total_inc_vat
      }

      // Insert or update work order
      if (isEditing) {
        // Update existing work order
        const { error } = await supabase
          .from('work_orders')
          .update(workOrderDataToInsert)
          .eq('id', id);

        if (error) throw error;
        workOrderId = id;
      } else {
        // Insert new work order
        const { data, error } = await supabase
          .from('work_orders')
          .insert(workOrderDataToInsert)
          .select('id')
          .single();

        if (error) throw error;
        workOrderId = data.id;
      }

      // Handle items - first delete existing items if editing
      if (isEditing) {
        await supabase
          .from('work_order_lines')
          .delete()
          .eq('work_order_id', workOrderId);
      }

      // Insert all items
      const itemsToInsert = items.map(item => ({
        work_order_id: workOrderId,
        description: item.description,
        quantity: item.quantity,
        price_ex_vat: item.price_ex_vat,
        vat_rate: 1 + (item.vat_percent / 100), // Convert percent to multiplier
        discount_percent: item.discount_percent,
        line_total_inc_vat: item.line_total_inc_vat
      }));

      console.log("workOrderData:", workOrderData);
      console.log("workOrderDataToInsert", workOrderDataToInsert);
      console.log("Items:", itemsToInsert);

      const { error: itemsError } = await supabase
        .from('work_order_lines')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Show success message and redirect
      setSaveMessage('Work order saved successfully!');
      setTimeout(() => {
        navigate('/work-orders');
      }, 1500);

    } catch (error) {
      console.error('Error saving work order:', error);
      setSaveMessage('Error saving work order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-4">
      <Card>
        <Card.Header as="h4">
          {isEditing ? 'Edit Work Order' : 'New Work Order'}
          <Badge
            bg={workOrder.status === 'open' ? 'warning' :
              workOrder.status === 'finished' ? 'primary' :
                workOrder.status === 'paid' ? 'success' :
                  workOrder.status === 'deleted' ? 'danger' : 'info'}
            className="ms-2"
          >
            {workOrder.status.toUpperCase()}
          </Badge>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center p-4">
              <Spinner animation="border" />
              <p className="mt-2">Loading...</p>
            </div>
          ) : (
            <>
              {saveMessage && (
                <div className={`alert ${saveMessage.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
                  {saveMessage}
                </div>
              )}

              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Customer</Form.Label>
                    <InputGroup>
                      <Form.Control
                        placeholder="Select a customer"
                        value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.email})` : ''}
                        readOnly
                        isInvalid={!!validationErrors.id}
                      />
                      <Button variant="outline-secondary" onClick={() => setShowCustomerModal(true)}>
                        &#x1F50D;
                      </Button>
                    </InputGroup>
                    {validationErrors.id && (
                      <Form.Text className="text-danger">
                        {validationErrors.id}
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Bike</Form.Label>
                    <InputGroup>
                      <Form.Control
                        placeholder="Select a bike"
                        value={selectedBike ? `${selectedBike.make} ${selectedBike.model} (${selectedBike.license_plate})` : ''}
                        readOnly
                        isInvalid={!!validationErrors.bike_id}
                      />
                      <Button variant="outline-secondary" onClick={() => setShowBikeModal(true)}>
                        &#x1F50D;
                      </Button>
                    </InputGroup>
                    {validationErrors.bike_id && (
                      <Form.Text className="text-danger">
                        {validationErrors.bike_id}
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={workOrder.notes}
                  onChange={(e) => setWorkOrder({ ...workOrder, notes: e.target.value })}
                  placeholder="Enter work order notes, issues, or special instructions..."
                />
              </Form.Group>

              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={workOrder.status}
                      onChange={(e) => setWorkOrder({ ...workOrder, status: e.target.value })}
                    >
                      <option value="open">Open</option>
                      <option value="finished">Finished</option>
                      <option value="paid">Betalt</option>
                      <option value="deleted">Deleted</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label>Odometer (km/miles)</Form.Label>
                    <Form.Control
                      type="number"
                      step="1"
                      value={workOrder.odometer}
                      onChange={(e) => setWorkOrder({ ...workOrder, odometer: parseInt(e.target.value) || 0 })}
                      placeholder="Enter the current odometer reading"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="mb-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Items</h5>
                <Button variant="primary" size="sm" onClick={addItemLine}>
                  <span style={{ "color": "transparent", "textShadow": "0 0 0 #fff" }}>&#x2795;</span> Add Item
                </Button>
              </div>

              {validationErrors.items && (
                <div className="alert alert-danger">{validationErrors.items}</div>
              )}

              {validationErrors.itemDescription && (
                <div className="alert alert-danger">{validationErrors.itemDescription}</div>
              )}

              <Table responsive>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Description</th>
                    <th style={{ width: '10%' }}>Quantity</th>
                    <th style={{ width: '12%' }}>Price (ex VAT)</th>
                    <th style={{ width: '12%' }}>Price (inc VAT)</th>
                    <th style={{ width: '10%' }}>VAT %</th>
                    <th style={{ width: '10%' }}>Discount %</th>
                    <th style={{ width: '12%' }}>Line Total</th>
                    <th style={{ width: '4%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.items.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-3 text-muted">
                        No items added yet. Click "Add Item" to add products or services.
                      </td>
                    </tr>
                  ) : (
                    workOrder.items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>
                          <Form.Control
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItemField(index, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.1"
                            value={item.quantity}
                            onChange={(e) => updateItemField(index, 'quantity', parseFloat(e.target.value) || 1)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.01"
                            value={item.price_ex_vat}
                            onChange={(e) => updateItemField(index, 'price_ex_vat', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.01"
                            value={item.price_inc_vat}
                            onChange={(e) => updateItemField(index, 'price_inc_vat', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={item.vat_percent} // Changed from vat_rate * 100
                            onChange={(e) => updateItemField(index, 'vat_percent', parseFloat(e.target.value) || 0)}
                            placeholder="25"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={item.discount_percent}
                            onChange={(e) => updateItemField(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </td>
                        <td className="text-end">
                          {item.line_total_inc_vat.toFixed(2)}
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeItemLine(index)}
                          >
                            <span style={{ "fontSize": "small" }}>&#x274C;</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="6" className="text-end fw-bold">Subtotal (ex VAT):</td>
                    <td className="text-end">{workOrder.total_ex_vat.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan="6" className="text-end fw-bold">VAT:</td>
                    <td className="text-end">{workOrder.total_vat.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan="6" className="text-end fw-bold">Total (inc VAT):</td>
                    <td className="text-end fw-bold">{workOrder.total_inc_vat.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => window.confirm('Are you sure you want to navigate away and loose unsaved data?') ? navigate('/work-orders') : null}
                >
                  <span style={{ "color": "transparent", "textShadow": "0 0 0 #fff" }}>&#x2716;</span> Cancel
                </Button>
                <Button
                  variant="success"
                  onClick={saveWorkOrder}
                  disabled={loading}
                >
                  &#x1F4BE; {isEditing ? 'Update' : 'Save'} Work Order
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Customer Search Modal */}
      <Modal
        show={showCustomerModal}
        onHide={() => setShowCustomerModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Select Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search customers by name, email or phone..."
                value={customerSearchTerm}
                onChange={handleCustomerSearch}
                autoFocus
                autoComplete='one-time-code'
              />
              <Button variant="outline-secondary">
                &#x1F50D;
              </Button>
            </InputGroup>
            <Form.Text className="text-muted">
              Type at least 2 characters to start searching
            </Form.Text>
          </Form.Group>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {customerSearchResults.length === 0 ? (
              <p className="text-center text-muted my-4">
                {customerSearchTerm.length < 2
                  ? 'Type to search for customers'
                  : 'No customers found matching your search'}
              </p>
            ) : (
              <Table hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {customerSearchResults.map(customer => (
                    <tr key={customer.id}>
                      <td>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSelectCustomer(customer)}
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
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCustomerModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bike Search Modal */}
      <Modal
        show={showBikeModal}
        onHide={() => setShowBikeModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Select Bike</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search bikes by make, model or licenseplate number..."
                value={bikeSearchTerm}
                onChange={handleBikeSearch}
                autoFocus
                autoComplete='off'
              />
              <Button variant="outline-secondary">
                &#x1F50D;
              </Button>
            </InputGroup>
            <Form.Text className="text-muted">
              Type at least 2 characters to start searching
            </Form.Text>
          </Form.Group>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {bikeSearchResults.length === 0 ? (
              <p className="text-center text-muted my-4">
                {bikeSearchTerm.length < 2
                  ? 'Type to search for bikes'
                  : 'No bikes found matching your search'}
              </p>
            ) : (
              <Table hover>
                <thead>
                  <tr>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Licenseplate</th>
                    <th>Owner</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bikeSearchResults.map(bike => (
                    <tr key={bike.id}>
                      <td>{bike.make}</td>
                      <td>{bike.model}</td>
                      <td>{bike.license_plate}</td>
                      <td>{bike.owner_name}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSelectBike(bike)}
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
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBikeModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container >
  );
};

export default NewWorkOrderPage;