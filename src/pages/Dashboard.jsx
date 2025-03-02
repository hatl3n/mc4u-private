import { Container, Row, Col, Card } from "react-bootstrap";

function Dashboard() {
  return (
    <Container className="mt-4">
      <h2 className="mb-4">Welcome to Your Dashboard</h2>
      <Row>
        <Col md={6} lg={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Total Sales</Card.Title>
              <Card.Text className="fs-3 fw-bold">$12,340</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>New Orders</Card.Title>
              <Card.Text className="fs-3 fw-bold">45</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Active Users</Card.Title>
              <Card.Text className="fs-3 fw-bold">1,235</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;