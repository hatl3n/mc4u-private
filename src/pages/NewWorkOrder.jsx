// TODO: Move VAT into per line
// TODO: Qualify all supabase calls.
// TODO: Add category, and force no change of billed work orders in postgres.
// TODO: Add rabatt-felt

import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Form, Button, Card, Table,
  Spinner, Badge
} from 'react-bootstrap';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import CustomerSelector from '../components/CustomerSelector';
import BikeSelector from '../components/BikeSelector';

const NewWorkOrderPage = () => {
  const { id } = useParams(); // Used to fetch id out of url, to know we're going to edit an existing work order
  const isEditing = !!id;
  const navigate = useNavigate(); // Prepare navigation router
  const location = useLocation(); // Access to location state to fetch passed state

  // Work Order State
  const [workOrder, setWorkOrder] = useState({
    id: null,
    created_at: new Date().toISOString(),
    status: 'open',
    customer_id: location.state?.customer_id || null,
    bike_id: location.state?.bike_id || null,
    notes: location.state?.notes || '',
    total_ex_vat: 0,
    total_vat: 0,
    total_inc_vat: 0,
    items: []
  });

  // Search State
  const [selectedCustomer, setSelectedCustomer] = useState(location.state?.customer || null);
  const [selectedBike, setSelectedBike] = useState(location.state?.bike || null);

  // UI State
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

    /*if (!workOrder.customer_id) {
      errors.id = 'Velg en kunde';
    }

    if (!workOrder.bike_id) {
      errors.bike_id = 'Velg en sykkel';
    }*/

    if (!workOrder.items.length) {
      errors.items = 'Legg til minst en varelinje';
    } else {
      // Check if all items have descriptions
      const hasEmptyDescriptions = workOrder.items.some(item => !item.description.trim());
      if (hasEmptyDescriptions) {
        errors.itemDescription = 'Alle varelinjer må ha en beskrivelse';
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
      setSaveMessage('Arbeidsordre lagret!');
      setTimeout(() => {
        navigate('/work-orders');
      }, 1500);

    } catch (error) {
      console.error('Error saving work order:', error);
      setSaveMessage('Lagring av arbeidsordre FEILET!');
    } finally {
      setLoading(false);
    }
  };

  // Create new item line if tabbing away from the last item line
  const handleDiscountKeyDown = (event, index) => {
    if (event.key === 'Tab' && !event.shiftKey && index === workOrder.items.length - 1) {
      event.preventDefault();
      addItemLine();
      // Use setTimeout to ensure the new row is rendered before focusing
      setTimeout(() => {
        const inputs = document.querySelectorAll('input[placeholder="Beskrivelse"]');
        const lastInput = inputs[inputs.length - 1];
        lastInput?.focus();
      }, 0);
    }
  };

  return (
    <Container className="my-4">
      <Card>
        <Card.Header as="h4">
          {isEditing ? 'Rediger arbeidsordre' : 'Ny arbeidsordre'}
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
              <p className="mt-2">Laster...</p>
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
                  <CustomerSelector
                    value={selectedCustomer}
                    onChange={(customer) => {
                      setSelectedCustomer(customer);
                      setWorkOrder({ ...workOrder, customer_id: customer?.id || null });
                    }}
                  />
                </Col>
                <Col md={6}>
                  <BikeSelector
                    value={selectedBike}
                    onChange={(bike) => {
                      setSelectedBike(bike);
                      setWorkOrder({ ...workOrder, bike_id: bike?.id || null });
                    }}
                    isInvalid={!!validationErrors.bike_id}
                    errorMessage={validationErrors.bike_id}
                  />
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label>Notater</Form.Label>
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
                      <option value="open">Åpen</option>
                      <option value="finished">Ferdig</option>
                      <option value="paid">Betalt</option>
                      <option value="deleted">Slettet</option>
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
                <h5 className="mb-0">Varelinjer</h5>
                <Button variant="primary" size="sm" onClick={addItemLine}>
                  <span style={{ "color": "transparent", "textShadow": "0 0 0 #fff" }}>&#x2795;</span> Legg til
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
                    <th style={{ width: '30%' }}>Beskrivelse</th>
                    <th style={{ width: '10%' }}>Antall</th>
                    <th style={{ width: '12%' }}>Pris (eks MVA)</th>
                    <th style={{ width: '12%' }}>Pris (ink MVA)</th>
                    <th style={{ width: '10%' }}>MVA %</th>
                    <th style={{ width: '10%' }}>Rabatt %</th>
                    <th style={{ width: '12%' }}>Linjetotal</th>
                    <th style={{ width: '4%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.items.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-3 text-muted">
                        Ingen varer lagt til ennå. Klikk "Legg til vare" for å legge til produkter eller tjenester.
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
                            placeholder="Beskrivelse"
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
                            onKeyDown={(e) => handleDiscountKeyDown(e, index)}
                          />
                        </td>
                        <td className="text-end">
                          {item.line_total_inc_vat.toFixed(2)}
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            tabIndex={-1}
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
                    <td colSpan="6" className="text-end fw-bold">Subtotal (eks MVA):</td>
                    <td className="text-end">{workOrder.total_ex_vat.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan="6" className="text-end fw-bold">MVA:</td>
                    <td className="text-end">{workOrder.total_vat.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan="6" className="text-end fw-bold">Total (ink MVA):</td>
                    <td className="text-end fw-bold">{workOrder.total_inc_vat.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => window.confirm('Er du sikker på du vil lukke og miste ulagret data?') ? navigate('/work-orders') : null}
                >
                  <span style={{ "color": "transparent", "textShadow": "0 0 0 #fff" }}>&#x2716;</span> Avbryt
                </Button>
                <Button
                  variant="success"
                  onClick={saveWorkOrder}
                  disabled={loading}
                >
                  &#x1F4BE; {isEditing ? 'Oppdater' : 'Lagre'} arbeidsordre
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default NewWorkOrderPage;