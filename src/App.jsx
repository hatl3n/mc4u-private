import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Auth from "./components/Auth";
import ToDoSystem from "./pages/ToDoSystem";
import ClaudeDemo from "./components/ClaudeDemo";

function App() {
  return (
    <div>
      <Router>
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand href="/">MC4U</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">&#x303D;Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/inventory">&#x1F4E6;Inventory</Nav.Link>
                <Nav.Link as={Link} to="/orders">&#x1F4DC;Orders</Nav.Link>
                <Nav.Link as={Link} to="/todosystem">&#x1F4DD;ToDo System</Nav.Link>
                <Nav.Link as={Link} to="/claudedemo">&#x1F4DD;ClaudeMal</Nav.Link>
                <Nav.Link as={Link} to="/customers">&#x1F913;Kunder</Nav.Link>
                <Nav.Link as={Link} to="/bikes">&#x1F3CD;Sykler</Nav.Link>
              </Nav>
              <Auth />
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Container className="mt-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/todosystem" element={<ToDoSystem />} />
            <Route path="/claudedemo" element={<ClaudeDemo />} />
          </Routes>
        </Container>
      </Router>
    </div>
  );
}

export default App;
