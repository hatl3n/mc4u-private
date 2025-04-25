import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Auth from "./components/Auth";
import ToDoSystem from "./pages/ToDoSystem";
import ClaudeDemo from "./components/ClaudeDemo";
import NewWorkOrderPage from "./pages/NewWorkOrder";
import Customers from "./pages/Customers";
import Bikes from "./pages/Bikes";
import WorkOrders from "./pages/WorkOrders";
import './styles/print.css';
import PrintWorkOrder from "./pages/PrintWorkOrder";

function App() {
  return (
    <div>
      <Router basename="/mc4u-private">
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand as={Link} href="/">MC4U</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">&#x303D;Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/inventory">&#x1F4E6;Inventory</Nav.Link>
                <Nav.Link as={Link} to="/todosystem">&#x1F4DD;ToDo System</Nav.Link>
                <Nav.Link as={Link} to="/claudedemo">&#x1F4DD;ClaudeMal</Nav.Link>
                <Nav.Link as={Link} to="/work-orders">&#x1F527;Arbeidsordre</Nav.Link>
                <Nav.Link as={Link} to="/customers">&#x1F913;Kunder</Nav.Link>
                <Nav.Link as={Link} to="/bikes">&#x1F3CD;Sykler</Nav.Link>
              </Nav>
              <Auth />
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Container className="mt-4">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="todosystem" element={<ToDoSystem />} />
            <Route path="claudedemo" element={<ClaudeDemo />} />
            <Route path="work-orders" element={<WorkOrders />} />
            <Route path="work-orders/new" element={<NewWorkOrderPage />} />
            <Route path="work-orders/edit/:id" element={<NewWorkOrderPage />} />
            <Route path="work-orders/print/:id" element={<PrintWorkOrder />} />
            <Route path="customers" element={<Customers />} />
            <Route path="bikes" element={<Bikes />} />
          </Routes>
        </Container>
      </Router>
    </div>
  );
}

export default App;
