import React from 'react';
import { useNavigate } from 'react-router-dom';

function Compliantsbar({ compliances, activeCompliance, setActiveCompliance, isRelevant, handleToggle }) {
    const navigate = useNavigate();

    return (
        <aside className="sidebar bg-white shadow-lg py-2 w-72 h-screen">
            {/* Close button only for mobile view */}
            <div className="md:hidden absolute right-4 top-4">
                <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => {
                        // This is handled by the parent component's state
                        // Just clicking outside will close it due to the overlay
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            {/* Logo Section */}
            <div className="my-6 md:my-10 flex flex-col justify-center items-center">
                <img
                    className="px-6 cursor-pointer max-w-[180px]"
                    src="/miporis.jpg"
                    alt="Miporis Logo - Compliance Management System"
                    loading="lazy"
                    onClick={() => { navigate(`/home`) }}
                />
                <div className="text-md text-center text-gray-600 mt-2 " aria-label="Application Version">
                    V 1.2
                </div>
            </div>
            
            <h1 className="text-lg font-medium text-gray-800 px-3">Compliances</h1>
            
            {/* Compliance List Section */}
            <section className="mb-6 mt-2 overflow-y-auto h-[calc(100vh-180px)]">
                <ul className="space-y-3 px-2">
                    {compliances?.length > 0 ? (
                        compliances.map((compliance, index) => {
                            // Determine the border color based on compliance type
                            const borderColor =
                                compliance.compliant_result === "C"
                                    ? "bg-[#28E42F]"
                                    : compliance.compliant_result === "PC"
                                        ? "bg-[#CCAF39]"
                                        : "bg-[#EC0000]";
                            // Determine if this compliance is active
                            const isActive = activeCompliance?.["Control ID"] === compliance?.["Control ID"];

                            return (
                                <li
                                    key={index}
                                    className={`group flex justify-between items-center py-2 px-3 rounded-md bg-gray-100 relative cursor-pointer overflow-hidden
                                    ${isActive ? 'bg-gray-300' : ''}`}
                                    aria-label={`Compliance ${compliance["Control ID"]}`}
                                    onClick={() => setActiveCompliance(compliance)} // Update activeCompliance on click
                                >
                                    {/* Right Border Animation */}
                                    <span
                                        className={`absolute inset-y-0 right-0 w-1 ${borderColor} transform scale-y-100 transition-all duration-300 group-hover:w-2`}
                                    ></span>

                                    {/* Content */}
                                    <h2 className="text-base font-semibold text-gray-700 z-10">
                                        {compliance["Control ID"]}
                                    </h2>
                                </li>
                            );
                        })
                    ) : (
                        <p className="text-gray-500 text-sm px-3">No compliances available.</p>
                    )}
                </ul>
            </section>
        </aside>
    );
}

export default Compliantsbar;
