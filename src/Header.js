import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="navbar navbar-expand-lg py-2 px-4 position-fixed top-0 start-0 w-100 header text-white">
            <div className='d-flex align-items-center position-relative w-100 justify-content-between'>
                <Link to="/" className="navbar-brand">
                    <img src="./logo.png" width="80px" alt="Logo" />
                </Link>
                <button className="navbar-toggler position-absolute" type="button" onClick={toggleMenu}>
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className={` collapse navbar-collapse ${isOpen ? 'show' : ''}`}>
                    <ul className="links navbar-nav ms-auto d-flex gap-2 align-items-center">
                        <li className="nav-item">
                            <Link to="/" className="btn text-white fw-bold">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/about" className="btn text-white fw-bold">About</Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/prediction" className="btn text-white fw-bold">Crop / Fertilizer</Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/contact" className="btn text-white fw-bold">Contact Us</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Header;
