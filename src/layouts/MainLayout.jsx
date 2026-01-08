import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const MainLayout = () => {
    const location = useLocation();

    return (
        <div className="layout-container">
            {/* <nav className="navbar">
                <div className="logo">RealMapAI</div>
                <div className="nav-links">
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Map</Link>
                    <Link to="/3d" className={location.pathname === '/3d' ? 'active' : ''}>3D Experience</Link>
                    <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About</Link>
                </div>
            </nav> */}
            <main className="content">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
