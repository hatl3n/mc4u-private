import { useEffect, useState } from "react";
import { Container, Form, Button, Table } from "react-bootstrap";
import { supabase } from "../supabase";
import DynamicTable from "../components/DynamicTable";

function Inventory() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ item_number: "", description: "", in_stock: 0, price_in: 0, price_out: 0, vat: 25, barcode: ""});

  async function fetchItems() {
    let { data, error } = await supabase.from("inventory").select("*");
    if (!error) setItems(data);
  }

  useEffect(() => {
    fetchItems();
  }, []);

  async function addItem(e) {
    //e.preventDefault();
    const { data, error } = await supabase.from("inventory").insert([newItem]);
    if (!error) setItems([...items, newItem]);
  }

  return (
    <Container className="mt-4">
      <h2>Inventory</h2>
      <Form onSubmit={(e) => { e.preventDefault(); addItem(newItem); }} className="mt-3">
        <Form.Group className="mb-2">
          <Form.Control
            type="text"
            placeholder="Varenummer"
            value={newItem.item_number}
            onChange={(e) => setNewItem({ ...newItem, item_number: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Control
            type="text"
            placeholder="Beskrivelse"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Control
            type="number"
            placeholder="Antall på lager"
            value={newItem.in_stock}
            onChange={(e) => setNewItem({ ...newItem, in_stock: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Control
            type="number"
            placeholder="Innkjøpspris i øre(!)"
            value={newItem.price_in}
            onChange={(e) => setNewItem({ ...newItem, price_in: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Control
            type="number"
            placeholder="Utsalgspris i øre(!)"
            value={newItem.price_out}
            onChange={(e) => setNewItem({ ...newItem, price_out: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Control
            type="number"
            placeholder="MVA-sats"
            value={newItem.vat}
            onChange={(e) => setNewItem({ ...newItem, vat: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Control
            type="text"
            placeholder="Strekkode"
            value={newItem.barcode}
            onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })}
          />
        </Form.Group>
        <Button type="submit" variant="primary">Add</Button>
      </Form>

      <hr></hr>

      <DynamicTable tableHeading="Inventory" tableData={items} />
    </Container>
  );
}

export default Inventory;
