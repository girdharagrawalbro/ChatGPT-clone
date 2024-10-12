import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const closeMenu = () => {
        setIsOpen(false); // Close menu on navigation
    };

    return (
        <nav className="navbar navbar-expand-lg bg-dark navbar-dark bg-none px-2 py-1 position-fixed w-100 top-0 start-0">
            <div className="container-fluid">
                <Link to="/" className="navbar-brand d-flex align-items-center">
                    <img src="./logo.png" width="60" alt="Logo" className="me-2" />
                    <span className="fw-bold">Agri AI</span>
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    onClick={toggleMenu}
                    aria-controls="navbarNav"
                    aria-expanded={isOpen}
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarNav">
                    <ul className="navbar-nav ms-auto d-flex align-items-center gap-3">
                        <li className="nav-item">
                            <Link
                                to="/"
                                className="btn text-white fw-bold"
                                onClick={closeMenu}
                            >
                                Home
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                to="/about"
                                className="btn text-white fw-bold"
                                onClick={closeMenu}
                            >
                                About
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                to="/prediction"
                                className="btn text-white fw-bold"
                                onClick={closeMenu}
                            >
                                Crop / Fertilizer
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                to="/contact"
                                className="btn text-white fw-bold"
                                onClick={closeMenu}
                            >
                                Contact Us
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Header;
