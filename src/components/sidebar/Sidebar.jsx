import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        navigate(path);
        if (onClose) onClose();
    };

    const navItems = [
        { path: '/home', label: 'Home', ariaLabel: 'Navigate to Home' },
        { path: '/chatbot', label: 'Chatbot', ariaLabel: 'Navigate to Chatbot' },
        { path: '/history', label: 'History', ariaLabel: 'Navigate to History' },
        { path: '/profile', label: 'Profile', ariaLabel: 'Navigate to Profile' },
        { path: '/settings', label: 'Settings', ariaLabel: 'Navigate to Settings' },
    ];

    return (
        <nav
            className="sidebar"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="my-10">
                <img
                    className="px-6 cursor-pointer"
                    src="/miporis.jpg"
                    alt="Miporis Logo"
                    onClick={() => handleNavigation('/home')}
                    loading="lazy"
                />
                <div className="text-md text-center text-gray-600 mt-2">
                    V 1.2
                </div>
            </div>

            <ul className="px-2" role="list">
                {navItems.map((item) => (
                    <li key={item.path} role="none">
                        <NavLink
                            to={item.path}
                            onClick={() => onClose && onClose()}
                            className={({ isActive }) =>
                                `nav-link ${isActive || location.pathname.startsWith(item.path) ? 'active' : ''}`
                            }
                            aria-label={item.ariaLabel}
                            role="menuitem"
                        >
                            {item.label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Sidebar;
