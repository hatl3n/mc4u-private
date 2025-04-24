import { useState, useEffect } from "react";
import { Tabs, Tab, Container, Spinner, Alert } from "react-bootstrap";
import DynamicTable from "../components/DynamicTable";
import CreateToDoEntry from "../components/CreateToDoEntry";
import useFetchToDoData from "../hooks/useFetchToDoData";
import useFetchCustomersAndBikes from "../hooks/useFetchCustomersAndBikes";
import ClaudeDemo from "../components/ClaudeDemo";
import SuperTable from "../components/SuperTable";
import { supabase } from "../supabase";
import { Badge } from "react-bootstrap";

function ToDoSystem() {
  const { data, loading, error, fetchData } = useFetchToDoData();
  const { customers, bikes } = useFetchCustomersAndBikes();
  const [requireRefresh, setRequireRefresh] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [activeTab, setActiveTab] = useState("todo");
  const [todoData, setTodoData] = useState([]);

  useEffect(() => {
    if (requireRefresh) {
      fetchData();
      setRequireRefresh(false);
    }
  }, [requireRefresh, fetchData]);

  const onEntryAdded = () => {
    setRequireRefresh(true);
    setActiveTab("todo");
  };

  const onEdit = (item) => {
    setEditItem(item);
    setActiveTab("add-new");
  };

  const getCustomerName = (id) => {
    const customer = customers.find((c) => c.id === id);
    return customer ? customer.name : id;
  };

  const getBikeDetails = (id) => {
    const bike = bikes.find((b) => b.id === id);
    return bike ? `${bike.license_plate}: ${bike.model_year} ${bike.make} ${bike.model}` : id;
  };

  const enhancedData = data.map((item) => ({
    ...item,
    fk_customers: getCustomerName(item.fk_customers),
    fk_bikes: getBikeDetails(item.fk_bikes),
  }));

  const filteredData = {
    todo: enhancedData.filter((item) => item.status === "todo"),
    waiting: enhancedData.filter((item) => item.status === "waiting"),
    completed: enhancedData.filter((item) => item.status === "completed"),
  };

  useEffect(() => {
    const fetchTodoData = async () => {
      //setLoading(true);
      const { data: tableData, error } = await supabase
        .from("todo_list")
        .select("*, customers:fk_customers (name), bikes:fk_bikes (license_plate, model_year, make, model)");
      if (error) {
        console.log(error);
        //setError(error.message);
      } else {
        setTodoData(tableData);
        //console.log(tableData);
      }
      //setLoading(false);
    };
    fetchTodoData();
  }, []);

const todoModel = [
  { key: "fk_customers", label: "Kunde", type: "select", valueOverride: ['customers', 'name'] },
  { key: "fk_bikes", label: "Sykkel", type: "select", valueOverride: (i) => i.bikes ? `${i.bikes?.license_plate}: ${i.bikes?.model_year} ${i.bikes?.make} ${i.bikes?.model}` : '-' },
  { key: "hva", label: "Hva", type: "text" },
  { key: "created_at", label: "Opprettet", type: "date" },
  { key: "status", label: "Status", type: "select", options: ["todo", "waiting", "completed"].map((s) => ({ value: s, label: s })) },
];

const todoModel2 = {
  name: "ToDo List",
  endpoint: "todo_list", // Supabase table name
  fields: [
    { 
      key: "fk_customers", 
      label: "Kunde", 
      type: "foreign", 
      valueOverride: ['customers', 'name'],
      searchable: true
    },
    { 
      key: "fk_bikes", 
      label: "Sykkel", 
      type: "foreign", 
      valueOverride: (i) => i.bikes ? `${i.bikes?.license_plate}: ${i.bikes?.model_year} ${i.bikes?.make} ${i.bikes?.model}` : '-',
      searchable: true
    },
    { 
      key: "hva", 
      label: "Hva", 
      type: "text",
      required: true,
      searchable: true 
    },
    { 
      key: "created_at", 
      label: "Opprettet", 
      type: "date",
      editable: false 
    },
    { 
      key: "status", 
      label: "Status", 
      type: "select", 
      options: ["todo", "waiting", "completed"].map((s) => ({ value: s, label: s })),
      valueOverride: (i) => <Badge bg="primary" className="ms-2">{i.status}</Badge>,
      filterable: true
    }
  ],
  defaultSort: {
    key: "created_at",
    direction: "desc"
  },
  actions: {
    create: true,
    edit: true,
    delete: true
  }
};

return (
  <Container className="mt-4">
    <h2 className="mb-3">ToDoSystemet til Morten! &#x1F64C;</h2>
    {loading && <Spinner animation="border" />}
    {error && <Alert variant="danger">Error fetching data: {error}</Alert>}
    {!loading && !error && (
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="all" title="All">
          <DynamicTable tableHeading="Alle ToDo-notater uavhengig av status" tableData={enhancedData} onEdit={onEdit} />
        </Tab>
        <Tab eventKey="todo" title="ToDo">
          <DynamicTable tableHeading="ToDo-notater" tableData={filteredData.todo} onEdit={onEdit} />
        </Tab>
        <Tab eventKey="waiting" title="Waiting">
          <DynamicTable tableHeading="Kunder som venter, men varer er bestilt" tableData={filteredData.waiting} onEdit={onEdit} />
        </Tab>
        <Tab eventKey="completed" title="Completed">
          <DynamicTable tableHeading="Completed ToDos" tableData={filteredData.completed} onEdit={onEdit} />
        </Tab>
        <Tab eventKey="claude" title="SuperTable-test">
          <SuperTable tableData={todoData} dataModel={todoModel2} onEdit={onEdit} />
        </Tab>
        <Tab eventKey="add-new" title={editItem ? "\u270F Rediger" : `\u2795 Ny`} >
          <CreateToDoEntry onEntryAdded={onEntryAdded} editItem={editItem} setEditItem={setEditItem} />
        </Tab>
      </Tabs>
    )}
  </Container>
);
}

export default ToDoSystem;
