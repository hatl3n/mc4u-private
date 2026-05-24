import { Alert, Button } from "react-bootstrap";

export default function UpdateBanner() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Alert
      variant="warning"
      className="mb-0 rounded-0 d-flex align-items-center justify-content-between"
      style={{ position: "sticky", top: 0, zIndex: 1050 }}
    >
      <span>
        ⚠️ <strong>En ny versjon er tilgjengelig.</strong> Lagre arbeidet ditt
        og oppdater siden for å unngå problemer.
      </span>
      <Button variant="warning" size="sm" onClick={handleReload}>
        Oppdater nå
      </Button>
    </Alert>
  );
}
