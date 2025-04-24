import { useEffect, useState } from "react";
import { Form, Button, Alert, Nav, NavDropdown } from "react-bootstrap";
import { supabase } from "../supabase";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // ✅ Check if the user is already logged in on page load
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    fetchUser();

    // ✅ Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setError(error.message);
    setUser(data.user);
    window.location.reload(); // Should possibly be moved to some global context in App.jsx
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setError(error.message);
    setUser(data.user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
  };

  return (
    <Nav className="ms-auto">
      <NavDropdown title={user ? user.email : "Account"} id="auth-dropdown" align="end">
        {user ? (
          <>
            <NavDropdown.Item disabled>Welcome, {user.email}!</NavDropdown.Item>
            <NavDropdown.Item onClick={toggleTheme}>
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
          </>
        ) : (
          <div className="px-3 py-2" style={{ minWidth: "250px" }}>
            {error && <Alert variant="danger" className="mb-2">{error}</Alert>}
            <Form>
              <Form.Group className="mb-2">
                <Form.Control
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Control
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>
              <Button type="submit" variant="primary" className="w-100 mb-2" onClick={handleSignIn}>
                Login
              </Button>
              <Button variant="secondary" className="w-100" onClick={handleSignUp}>
                Sign Up
              </Button>
            </Form>
          </div>
        )}
      </NavDropdown>
    </Nav>
  );
}

export default Auth;
