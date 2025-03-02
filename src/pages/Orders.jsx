import { useState } from "react";
import { supabase } from "../supabase";

function Orders() {
  const [order, setOrder] = useState([]);
  const [item, setItem] = useState("");

  function addItemToOrder() {
    setOrder([...order, { name: item, quantity: 1 }]);
    setItem("");
  }

  async function saveOrder() {
    const { error } = await supabase.from("orders").insert([{ items: order, status: "to billing" }]);
    if (!error) alert("Order saved!");
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">Orders</h2>
      <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Add item" />
      <button onClick={addItemToOrder}>Add to Order</button>
      <ul>{order.map((i, index) => <li key={index}>{i.name} - {i.quantity}</li>)}</ul>
      <button onClick={saveOrder}>Save Order</button>
    </div>
  );
}

export default Orders;
