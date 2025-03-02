import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Alert, Form, Button, Container } from 'react-bootstrap';
import Select from "react-select";
import useFetchCustomersAndBikes from "../hooks/useFetchCustomersAndBikes";

// TODO: Rename to CreateOrUpdateToDoEntry

function CreateToDoEntry({ onEntryAdded, editItem, setEditItem }) {
  const { customers, bikes, loading, setLoading, error } = useFetchCustomersAndBikes();
  const [newItem, setNewItem] = useState({ fk_customers: null, fk_bikes: null, hva: "", status: "todo" });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (editItem) {
      prepopulateEntry(editItem.id);
    }
  }, [editItem, customers, bikes]);

  const prepopulateEntry = async (id) => {
    setLoading(true);
    const { data: returnedData, error } = await supabase
      .from("todo_list")
      .select("*")
      .eq("id", id);
    if (error) {
      console.log("Failed to fetch ToDoEntry");
    } else {
      setNewItem(returnedData[0]);
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
      setMessage("Ny oppføring lagt til!");
      setTimeout(() => setMessage(null), 2500);
      setNewItem({ fk_customers: null, fk_bikes: null, hva: "", status: "todo" });
      onEntryAdded();
    }
  };

  const updateToDoEntry = async (entry) => {
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
      setMessage("Oppføring oppdatert!");
      setTimeout(() => setMessage(null), 2500);
      setNewItem({ fk_customers: null, fk_bikes: null, hva: "", status: "todo" });
      onEntryAdded();
      cancelEdit();
    }

  };

  const _isObject = (x) => typeof x === 'object' && !Array.isArray(x) && x !== null;
  const cancelEdit = () => { setEditItem(null); setNewItem({ fk_customers: null, fk_bikes: null, hva: "", status: "todo" }); };

  return (
    <Container className="mt-4">
      <h4>{editItem ? "Rediger oppføring" : "Ny oppføring"}</h4>
      <Form onSubmit={(e) => { e.preventDefault(); editItem ? updateToDoEntry(newItem) : addToDoEntry(newItem); }} className="mt-3">
        <Form.Group className="mb-2">
          <Form.Label>Kunde</Form.Label>
          <Select options={customers.map(cx => ({ value: cx.id, label: `(${cx.id}) ${cx.name} - ${cx.phone}` }))}
            value={ editItem ? ({value: newItem.fk_customers, label: editItem.fk_customers}) : newItem.fk_customers }
            onChange={(e) => setNewItem({ ...newItem, fk_customers: e })}
            placeholder="Velg kunde"
            isSearchable
            isLoading={loading}
            disabled={loading}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Motorsykkel</Form.Label>
          <Select options={bikes.map(c => ({ value: c.id, label: `${c.license_plate}: ${c.model_year} ${c.make} ${c.model}` }))}
            value={ editItem ? ({value: newItem.fk_bikes, label: editItem.fk_bikes}) : newItem.fk_bikes }
            onChange={(e) => setNewItem({ ...newItem, fk_bikes: e })}
            placeholder="Velg motorsykkel"
            isSearchable
            isLoading={loading}
            disabled={loading}
          />
        </Form.Group>
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
        { editItem &&
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
            <Button type="submit" variant="primary">{editItem ? "Oppdater" : "Legg til"}</Button>
            {editItem && <Button variant="secondary" onClick={cancelEdit}>Avbryt</Button>}
        </Form.Group>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
      </Form>
    </Container>
  );
}

export default CreateToDoEntry;