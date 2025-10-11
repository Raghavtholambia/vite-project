import React from "react";
import { Link } from "react-router-dom";

const Navbar = (props) => {
  const bgColor = props.mode === "dark" ? "bg-dark" : "bg-light";
  const textColor = props.mode === "dark" ? "navbar-dark" : "navbar-light";

  return (
    <nav className={`navbar navbar-expand-lg ${textColor} ${bgColor} shadow`}>
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/">
          🔥 MySite
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/about">About</Link>
            </li>
          </ul>

          <button
            className={`btn btn-outline-${props.mode === "dark" ? "light" : "dark"} ms-3`}
            onClick={props.toggleMode}
          >
            {props.mode === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
