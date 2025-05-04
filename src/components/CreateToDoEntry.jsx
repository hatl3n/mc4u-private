import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Alert, Form, Button, Container } from 'react-bootstrap';
import CustomerSelector from "./CustomerSelector";
import BikeSelector from "./BikeSelector";

// TODO: Rename to CreateOrUpdateToDoEntry

function CreateToDoEntry({ onEntryAdded, editItem, setEditItem }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Not in use(?)
  const INITIAL_NEW_ITEM = { fk_customers: null, fk_bikes: null, hva: "", status: "todo" };
  const [newItem, setNewItem] = useState(INITIAL_NEW_ITEM);
  const [message, setMessage] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedBike, setSelectedBike] = useState(null);

  useEffect(() => {
    if (editItem) {
      prepopulateEntry(editItem.id);
    }
  }, [editItem]);

  // This shouldn't be necessary, if editItem is passed..? Unless to ensure it's fresh data, if multiple edits are made..
  const prepopulateEntry = async (id) => {
    setLoading(true);
    const { data: returnedData, error } = await supabase
      .from("todo_list")
      .select("*, fk_customers(*), fk_bikes(*)")
      .eq("id", id);
    if (error) {
      console.log("Failed to fetch ToDoEntry");
    } else {
      setNewItem(returnedData[0]);
      setSelectedCustomer(returnedData[0].fk_customers);
      setSelectedBike(returnedData[0].fk_bikes);
    }
    setLoading(false);
  };

  const addToDoEntry = async (entry) => {
    let cleaned_entries = Object.entries(entry).map(([k, v]) => {
      return _isObject(v) === true && v.hasOwnProperty("value") ? [k, v.value] : [k, v];
    });
    let cleaned_object = Object.fromEntries(cleaned_entries);
    const { data: returnedData, error } = await supabase
      .from("todo_list")
      .insert([cleaned_object]);
    if (error) {
      console.log("Failed to add ToDoEntry");
    } else {
      setMessage("Ny oppføring lagt til!"); // Never gets to see this before disappears to other tab..!
      setTimeout(() => setMessage(null), 2500);
      initializeForm();
      onEntryAdded();
    }
  };

  const updateToDoEntry = async (entry) => {
    // Clean react-select objects into simple values
    let cleaned_entries = Object.entries(entry).map(([k, v]) => {
      return _isObject(v) === true && v.hasOwnProperty("value") ? [k, v.value] : [k, v];
    });
    let cleaned_object = Object.fromEntries(cleaned_entries);
    const { data: returnedData, error } = await supabase
      .from("todo_list")
      .update(cleaned_object)
      .eq("id", entry.id);
    if (error) {
      console.log("Failed to update ToDoEntry");
    } else {
      setMessage("Oppføring oppdatert!"); // Never gets to see this before disappears to other tab..!
      setTimeout(() => setMessage(null), 2500);
      initializeForm();
      onEntryAdded();
      initializeForm();
    }

  };

  const _isObject = (x) => typeof x === 'object' && !Array.isArray(x) && x !== null;
  const initializeForm = () => { setEditItem(null); setNewItem(INITIAL_NEW_ITEM); setSelectedCustomer(null); setSelectedBike(null); };

  return (
    <Container className="mt-4">
      <h4>{editItem ? "Rediger oppføring" : "Ny oppføring"}</h4>
      <Form onSubmit={(e) => { e.preventDefault(); editItem ? updateToDoEntry(newItem) : addToDoEntry(newItem); }} className="mt-3">
        <CustomerSelector
          value={selectedCustomer}
          onChange={(customer) => {
            setSelectedCustomer(customer);
            setNewItem({ ...newItem, fk_customers: customer?.id || null });
          }}
        />
        <BikeSelector
          value={selectedBike}
          onChange={(bike) => {
            setSelectedBike(bike);
            setNewItem({ ...newItem, fk_bikes: bike?.id || null });
          }}
        />
        <Form.Group className="mb-2">
          <Form.Label>Huskeliste</Form.Label>
          <Form.Control
            type="text"
            placeholder="Huskeliste"
            value={newItem.hva}
            onChange={(e) => setNewItem({ ...newItem, hva: e.target.value })}
            disabled={loading}
          />
        </Form.Group>
        {editItem &&
          <Form.Group className="mb-2">
            <Form.Label>Status</Form.Label>
            <Form.Select value={newItem.status} onChange={(e) => setNewItem({ ...newItem, status: e.target.value })} disabled={loading}>
              <option value="todo">ToDo</option>
              <option value="waiting">Waiting</option>
              <option value="completed">Completed</option>
            </Form.Select>
          </Form.Group>
        }
        <Form.Group className="mb-2">
          <Button type="submit" variant="primary" className="me-2">{editItem ? "Oppdater" : "Legg til"}</Button>
          <Button variant="secondary" onClick={initializeForm}>Avbryt</Button>
        </Form.Group>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
      </Form>
    </Container>
  );
}

export default CreateToDoEntry;