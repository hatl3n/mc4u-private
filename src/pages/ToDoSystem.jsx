import { useState, useEffect, useCallback } from "react"; // Add useCallback import
import { Tabs, Tab, Container, Spinner, Alert } from "react-bootstrap";
import CreateToDoEntry from "../components/CreateToDoEntry";
import SuperTable from "../components/SuperTable";
import { supabase } from "../supabase";
import { Badge } from "react-bootstrap";

function ToDoSystem() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requireRefresh, setRequireRefresh] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const INITIAL_TAB = "super-table";
  const [activeTab, setActiveTab] = useState(INITIAL_TAB);
  const [todoData, setTodoData] = useState([]);

  const fetchTodoData = useCallback(async () => {
    setLoading(true);
    const { data: tableData, error } = await supabase
      .from("todo_list")
      .select("*, customers:fk_customers (name), bikes:fk_bikes (license_plate, model_year, make, model)");
    if (error) {
      console.log(error);
      setError(error.message);
    } else {
      setTodoData(tableData);
      //console.log(tableData);
    }
    setLoading(false);
  }, []); // Empty dependency array since it doesn't depend on any props or state

  useEffect(() => {
    if (requireRefresh) {
      fetchTodoData();
      setRequireRefresh(false);
    }
  }, [requireRefresh, fetchTodoData]);

  const onEntryAdded = () => {
    setRequireRefresh(true);
    setActiveTab(INITIAL_TAB);
  };

  const onEdit = (item) => {
    setEditItem(item);
    setActiveTab("add-new");
  };

  async function handleSubmit(formItem, method) {
    if (!formItem.id) throw new Error("No ID provided for handleSubmit");

    if (method === "delete") {
      const { error } = await supabase
        .from("todo_list")
        .delete()
        .match({ id: formItem.id });
      if (!error) {
        setTodoData(todoData.filter((item) => item.id !== formItem.id));
      }
      else {
        setError(`Error while deleting: ${error.message}`);
      }
    }
  }

  useEffect(() => {
    fetchTodoData();
  }, [fetchTodoData]);

  const todoModel = {
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
      //create: true,
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
          <Tab eventKey="super-table" title="ToDos">
            <SuperTable tableData={todoData} dataModel={todoModel} onEditBtnClick={onEdit} handleSubmit={handleSubmit} />
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
