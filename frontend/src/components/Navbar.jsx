import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="logo">PetPulse</Link>
      </div>

      <div className="nav-right">
        <Link to="/auth">Login</Link>
        <Link to="/home" className="btn">Get Started</Link>
      </div>
    </nav>
  );
}
