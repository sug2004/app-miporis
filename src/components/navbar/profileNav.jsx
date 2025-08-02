import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const ProfileNav = () => {
    const [showLogout, setShowLogout] = useState(false);
    let timeoutId;
    const location = useLocation();

    const token = Cookies.get('token');
    if (!token) {
        window.location.replace("https://www.miporis.com/login");
        return null;
    }
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id

    const handleMouseEnter = () => {
        clearTimeout(timeoutId); // Clear any existing timeout
        setShowLogout(true);
    };

    const handleMouseLeave = () => {
        timeoutId = setTimeout(() => {
            setShowLogout(false);
        }, 800); // Set a 2-second delay to hide the section
    };

    const generateBreadcrumbs = () => {
        const paths = location.pathname.split("/").filter(Boolean);
        return paths.map((path, index) => {
            const route = `/${paths.slice(0, index + 1).join("/")}`;
            const decodedPath = decodeURIComponent(path); // Decode here

            const isLast = index === paths.length - 1;
            return (
                <span key={index} className={!isLast ? "text-black" : "text-[#005FBC]"}>
                    {!isLast ? (
                        <>
                            <Link to={route} className="hover:underline">
                                {decodedPath.charAt(0).toUpperCase() + decodedPath.slice(1)}
                            </Link>{" "}
                            &gt;{" "}
                        </>
                    ) : (
                        decodedPath.charAt(0).toUpperCase() + decodedPath.slice(1)
                    )}
                </span>
            );
        });
    };

    const handleLogout = () => {
        window.location.replace("https://www.miporis.com/session/logout");
    };

    return (
        <nav className="flex justify-between items-center w-full py-3 md:py-4 mx-auto bg-[#EFEFEF] text-white rounded-md mt-0 md:mt-8">
            {/* Breadcrumbs - Hidden on very small screens, truncated on mobile */}
            <div className="text-sm md:text-lg font-medium flex-1 min-w-0 mr-4">
                <div className="truncate">
                    {generateBreadcrumbs()}
                </div>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                {/* Email icon - Hidden on mobile */}
                <div className="hidden sm:block bg-[#D9D9D9]/40 p-2 md:p-3 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 25 20" fill="none" className="md:w-5 md:h-4">
                        <path d="M13.0357 12.3651C12.8571 12.4481 12.6786 12.5311 12.5 12.5311C12.3214 12.5311 12.1429 12.4481 11.9643 12.3651L0 4.97925V15.8506C0 18.1743 1.96429 20 4.46429 20H20.5357C23.0357 20 25 18.1743 25 15.8506V4.97925L13.0357 12.3651Z" fill="#fff" stroke="black" />
                        <path d="M12.3214 10.6224L24.6429 2.98755C24.1071 1.24481 22.4107 0 20.3571 0H4.28571C2.23214 0 0.535714 1.24481 0 2.98755L12.3214 10.6224Z" fill="#fff" stroke="black" />
                    </svg>
                </div>
                
                {/* Profile section */}
                <div className="relative w-10 md:w-12 h-10 md:h-12 flex items-center justify-center">
                    {/* User Avatar */}
                    <div
                        className="bg-[#D9D9D9]/40 text-[#0064BC] w-full px-3 py-2 md:px-4 md:py-2 uppercase rounded-full font-bold text-base md:text-lg cursor-pointer transition-all duration-200 hover:bg-[#D9D9D9]/60 flex items-center justify-center"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        role="button"
                        aria-label="User profile menu"
                        aria-haspopup="true"
                        aria-expanded={showLogout}
                    >
                        {decodedToken.name.slice(0, 1)}
                    </div>

                    {/* Logout Dropdown */}
                    {showLogout && (
                        <div
                            className="absolute z-50 right-0 mt-2 w-28 md:w-32 bg-white text-black shadow-lg rounded-md border border-gray-200"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            role="menu"
                            aria-label="User menu"
                        >
                            <button
                                onClick={handleLogout}
                                className="w-full px-3 py-2 text-center text-xs md:text-sm rounded-md hover:text-white hover:bg-[#005FBC]/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#005FBC] focus:ring-offset-2"
                                role="menuitem"
                                aria-label="Sign out of your account"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default ProfileNav;
