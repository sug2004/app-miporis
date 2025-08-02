import React, { useState, useEffect, useRef, useContext, act } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Compliantsbar from '../components/compliantsbar';
import ProfileNav from '../components/navbar/profileNav';
import Chat from '../components/Chat';
import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { AppContext } from '../context/AppContext';
import PdfPreview from '../utils/pdfViewer';

const ComplaintList = () => {
    const { compliant_type } = useParams();
    const { controlData,setControlData, setRouteChange, routeChange } = useContext(AppContext);
    const location = useLocation();
    const navigate = useNavigate();

    const dropdownRef = useRef(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [compliances, setCompliances] = useState([]);
    const [isRelevant, setIsRelevant] = useState(false);

    const [filterValue, setFilterValue] = useState([]);
    const [filteredCompliances, setFilteredCompliances] = useState([]);
    const [activeCompliance, setActiveCompliance] = useState(null);

    const [showComplaintBar, setShowComplaintBar] = useState(false);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);

    const token = Cookies.get('token');
    if (!token) {
        window.location.replace("https://miporis.com/login");
        return null;
    }
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id

    const query = new URLSearchParams(location.search);
    const complaintId = query.get('active');
    const complaintType = query.get('type');
    let complaintRelavance = query.get('rtype');
    const complaintCompliance = query.get('ctype');
    const filter = query.get('filter') || '';
    const filteredData = controlData?.find(data => data.compliant_type === compliant_type)?.controls;

    useEffect(() => {
        if (complaintId) {
            const foundCompliance = compliances.find(compliance => compliance["Control ID"] === complaintId);
            if (foundCompliance) {
                setActiveCompliance(foundCompliance);
            }
        } 
    }, [complaintId,compliances]);

    useEffect(() => {
        applyFilters(compliances);
    }, [filter, complaintType, complaintRelavance, complaintCompliance,compliances]);

    const handleChangeActiveCmplt = (data) => {
        setActiveCompliance(data);
    };

    function replaceActiveFilter(newActiveValue) {
        const url = new URL(window.location.href);
        url.searchParams.set('active', newActiveValue);
        window.history.pushState({}, '', url.toString());
    }

    const applyFilters = (compliancesData) => {
        
        if (filter) {
            const decodedFilter = decodeURIComponent(filter.replace(/\+/g, ' '));
            let filtered = compliancesData.filter(compliance =>
                compliance.Process.replace(/ /g, '+') === decodedFilter.replace(/ /g, '+')
            );
            
            // Apply additional filters if they exist
            if (complaintType) {
                filtered = filtered.filter(compliance => compliance["compliant_result"] === complaintType);
            }
            if (complaintRelavance) {
                filtered = filtered.filter(compliance => compliance["Relevance"] === complaintRelavance);
            }
            if (complaintCompliance) {
                filtered = filtered.filter(compliance => compliance["Compliance"] === complaintCompliance);
            }
            
            setFilteredCompliances(filtered);
        } else if (complaintType) {
            let foundCompliance = compliancesData.filter(compliance => compliance["compliant_result"] === complaintType);
            
            if (complaintRelavance) {
                foundCompliance = foundCompliance.filter(compliance => compliance["Relevance"] === complaintRelavance);
            }
            if (complaintCompliance) {
                foundCompliance = foundCompliance.filter(compliance => compliance["Compliance"] === complaintCompliance);
            }
            
            setFilteredCompliances(foundCompliance);
        } else if (complaintRelavance) {
            let foundCompliance = compliancesData.filter(compliance => compliance["Relevance"] === complaintRelavance);
            
            if (complaintCompliance) {
                foundCompliance = foundCompliance.filter(compliance => compliance["Compliance"] === complaintCompliance);
            }
            
            setFilteredCompliances(foundCompliance);
        } else if (complaintCompliance) {
            const foundCompliance = compliancesData.filter(compliance => compliance["Compliance"] === complaintCompliance);
            setFilteredCompliances(foundCompliance);
        } else {
            setFilteredCompliances(compliancesData);
        }
    };

    const updateComplianceControls = (responseData) => {
        const { _id: controlId, compliant_type: targetType } = responseData;

        setControlData(prev =>
            prev.map(compliance => {
            if (compliance.compliant_type === targetType) {
                return {
                ...compliance,
                controls: compliance.controls.map(control =>
                    control._id === controlId ? responseData : control
                )
                };
            }
            return compliance;
            })
        );
    };



    const handleToggle = async () => {
        try {
            setIsRelevant((prevState) => !prevState);
            const tempToggle = !isRelevant ? "N" : "Y";

            const response = await axios.put("/api/update-compliance", {
                id: activeCompliance._id,
                relevance: tempToggle,
            });

            if (response.status === 200) {
                setActiveCompliance(response.data);
                updateComplianceControls(response.data);
                setCompliances(prev => {
                    const updatedCompliances = prev.map(compliance => 
                        compliance._id === response.data._id ? response.data : compliance
                    ); 

                    setTimeout(() => {
                        applyFilters(updatedCompliances);
                    }, 0);
                    return updatedCompliances;
                });
                
            } else {
                console.error("Failed to update relevance");
            }
        } catch (err) {
            console.error("An error occurred while updating relevance:", err);
        }
    };

  const handleUpdateComplaint = async (data) => {
    try {
        const updatedCompliances = compliances.map(compliance =>
            compliance._id === data._id
                ? data
                : compliance
        );
        setCompliances(updatedCompliances);
        return updatedCompliances;
    } catch (error) {
        console.error("Error updating complaint:", error);
        return null;
    }
};



    const handleFilterChange = (newFilter) => {
        const updatedQuery = new URLSearchParams(location.search);
        updatedQuery.set('filter', newFilter);
        navigate(`${location.pathname}?${updatedQuery.toString()}`, { replace: true });
        setDropdownOpen(false);
    };

    const handleSetActiveCompliance = (data) => {
        replaceActiveFilter(data["Control ID"]);
        setActiveCompliance(data)
    }

useEffect(() => {
    const fetchComplianceData = async () => {
        try {
            // ✅ First: use data from context if available
            if (controlData && controlData.length > 0) {
                setCompliances(controlData[0].controls);
                const uniqueProcesses = [...new Set(controlData[0].controls.map(item => item.Process))];
                setFilterValue(uniqueProcesses);
            } else {
                const response = await axios.get('/get-control-data', {
                    params: {
                        Control_type: compliant_type,
                        userId: userId,
                    }
                });

                if (response.data && response.data.data.length > 0) {
                    const fetchedData = response.data.data;

                    // ✅ Set local state
                    setCompliances(fetchedData);

                    // ✅ Set context so future renders don’t re-fetch
                    setControlData(prev =>
                        prev.map(compliance => {
                            if (compliance.compliant_type === compliant_type) {
                            return {
                                ...compliance,
                                controls: fetchedData
                            };
                            }
                            return compliance;
                        })
                    );
                    const uniqueProcesses = [...new Set(fetchedData.map(item => item.Process))];
                    setFilterValue(uniqueProcesses);
                }
            }

        } catch (error) {
            console.error('Error fetching control data:', error);
        }
    };

    fetchComplianceData();
}, []);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };


    }, []);

    useEffect(() => {
        if (activeCompliance) {
            if (activeCompliance.Relevance === 'N') {
                setIsRelevant(true);
            } else {
                setIsRelevant(false);
            }
        }
    }, [activeCompliance])

    const clearFilter = () => {
        const updatedQuery = new URLSearchParams(location.search);
        updatedQuery.delete('filter');  // Remove the 'filter' query param
        navigate(`${location.pathname}?${updatedQuery.toString()}`, { replace: true });
    };

// tyui

    return (
        <div className="flex flex-col md:flex-row h-screen relative overflow-hidden">
            {/* Mobile Complaints Toggle Button */}
            <div className="md:hidden fixed bottom-4 left-4 z-30">
                <button 
                    onClick={() => setShowComplaintBar(!showComplaintBar)}
                    className="bg-blue-500 text-white p-3 rounded-full shadow-lg"
                    aria-label="Toggle complaints list"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
            </div>

            {/* Mobile Details Toggle Button */}
            {activeCompliance && (
                <div className="md:hidden fixed bottom-4 right-4 z-30">
                    <button 
                        onClick={() => setShowDetailsPanel(!showDetailsPanel)}
                        className="bg-gray-700 text-white p-3 rounded-full shadow-lg"
                        aria-label="Toggle details panel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                    </button>
                </div>
            )}
            
            {/* Complaint Sidebar - hidden on mobile by default */}
            <div className={`${showComplaintBar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 fixed md:relative z-20 h-screen`}>
                <Compliantsbar
                    compliances={filteredCompliances.length === 0 ? compliances : filteredCompliances}
                    activeCompliance={activeCompliance}
                    setActiveCompliance={(compliance) => {
                        handleSetActiveCompliance(compliance);
                        // Auto-hide sidebar after selection on mobile
                        if (window.innerWidth < 768) {
                            setShowComplaintBar(false);
                        }
                    }}
                    isRelevant={isRelevant}
                    handleToggle={handleToggle}
                />
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden px-3 sm:px-6 md:px-12 w-full">
                <ProfileNav />
                <div className="relative flex flex-wrap justify-start items-center my-4 gap-2">
                    <button
                        className="flex justify-center items-center text-black font-bold gap-2 px-4 py-2 rounded"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        Filter
                        <svg className='mt-1' xmlns="http://www.w3.org/2000/svg" width="15px" height="15px" viewBox="0 0 24 24" fill="none">
                            <path fillRule="evenodd" clipRule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="#000000" />
                        </svg>
                    </button>
                    {filter !== '' && <div className='flex justify-center items-center gap-2 bg-white px-3 py-2 rounded-lg'>
                        {filter}
                        <button className='hover:bg-gray-300 rounded-full mt-0.5' onClick={clearFilter}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 24 24" fill="none">
                                <path d="M7 17L16.8995 7.10051" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M7 7.00001L16.8995 16.8995" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>}

                    {dropdownOpen && (
                        <div ref={dropdownRef} className="absolute flex flex-col bg-white shadow-md rounded top-12 z-50">
                            {filterValue.map((type) => (
                                <>
                                    {(filter !== type) && <button
                                        key={type}
                                        className="px-3.5 py-2 text-gray-700 hover:bg-gray-100 text-start"
                                        onClick={() => handleFilterChange(type)}
                                    >
                                        {type}
                                    </button>
                                    }
                                </>
                            ))}
                        </div>
                    )}
                </div>
                
                {activeCompliance ? (
                    <div className="flex flex-1 overflow-hidden relative">
                        {/* Chat Section - Always visible */}
                        <div className="flex-1 flex flex-col mb-4 w-full">
                            <Chat 
                                handleUpdateComplaint={handleUpdateComplaint}
                                activeCompliance={activeCompliance} 
                                compliant_type={compliant_type} 
                                userId={userId} 
                                handleChangeActiveCmplt={handleChangeActiveCmplt} 
                                updateComplianceControls={updateComplianceControls}
                            />
                        </div>

                        {/* Details Panel - Toggleable on mobile */}
                        <div 
                            className={`${showDetailsPanel ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 transition-transform duration-300 
                                fixed md:relative right-0 top-0 md:top-auto h-screen md:h-auto z-10 
                                w-[85%] sm:w-[70%] md:w-auto md:min-w-[380px] md:max-w-[400px] bg-white md:bg-transparent 
                                pt-16 md:pt-0 md:border-r shadow-xl md:shadow-none`}
                        >
                            {/* Close button for mobile */}
                            <button 
                                className="absolute top-4 left-4 md:hidden text-gray-500 p-2"
                                onClick={() => setShowDetailsPanel(false)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                            
                            <div className="h-full p-4 md:p-6 rounded-lg md:shadow-md overflow-y-auto">
                                <div className="space-y-4">
                                    <div>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                value=""
                                                className="sr-only peer"
                                                checked={isRelevant}
                                                onChange={handleToggle}
                                            />
                                            <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                                            <span className="ms-3 text-sm font-medium text-gray-900 ">
                                                {!isRelevant ? "Relevant" : "Non-Relevant"}
                                            </span>
                                        </label>
                                    </div>
                                    {/* Circular Progress Bar */}
                                    <div className="flex justify-center">
                                        <div className="relative size-40">
                                            <svg className="size-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-gray-200" strokeWidth="2"></circle>
                                                <circle
                                                    cx="18"
                                                    cy="18"
                                                    r="16"
                                                    fill="none"
                                                    className={`stroke-current ${activeCompliance["score"] >= 80
                                                        ? "text-[#28E42F]"
                                                        : activeCompliance["score"] >= 60
                                                            ? "text-[#CCAF39]"
                                                            : "text-[#EC0000]"
                                                        }`}
                                                    strokeWidth="2"
                                                    strokeDasharray="100"
                                                    strokeDashoffset={100 - activeCompliance["score"]}
                                                    strokeLinecap="round"
                                                ></circle>
                                            </svg>
                                            <div className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2">
                                                <span
                                                    className={`text-center text-2xl font-bold ${activeCompliance["score"] >= 80
                                                        ? "text-[#28E42F]"
                                                        : activeCompliance["score"] >= 60
                                                            ? "text-[#CCAF39]"
                                                            : "text-[#EC0000]"
                                                        }`}
                                                >
                                                    {activeCompliance["score"]}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 rounded-lg">
                                        {[
                                            ["Control ID", activeCompliance["Control ID"]],
                                            ["IMEX", activeCompliance["IMEX"]],
                                            ["Relevance", activeCompliance["Relevance"]],
                                            ["Compliance", activeCompliance["compliant_result"]],
                                            ["Process", activeCompliance["Process"]],
                                            ["Sub-process", activeCompliance["Sub-process"]],
                                            ["Frequency", activeCompliance["Frequency "]],
                                            ["SAP Sunrise RACM control", activeCompliance["SAP Sunrise RACM \r\ncontrol #"]],
                                            ["SAP Turbo RACM control", activeCompliance["SAP Turbo RACM\r\ncontrol #"]],

                                        ].map(([label, value], idx) => (
                                            <div key={idx} className="border border-gray-200 p-3 rounded">
                                                <h3 className="font-bold text-gray-700">{label}:</h3>
                                                <p className="text-gray-600">{value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            ["Control header", activeCompliance["Control header"]],
                                            ["Risk", activeCompliance["Risk"]],
                                            ["Control description", activeCompliance["Control description"]],
                                            ["Suggested Test Guidance", activeCompliance["Suggested Test Guidance"]],
                                        ].map(([label, value], idx) => (
                                            <div key={idx} className="border border-gray-200 p-3 rounded">
                                                <h3 className="font-bold text-gray-700">{label}:</h3>
                                                <p className="text-gray-600 whitespace-pre-line">{value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {activeCompliance["uploadHistory"] && activeCompliance["uploadHistory"].map((data, index) => (
                                        <div className="grid grid-row-3 gap-4 border border-gray-300 p-4 rounded-lg max-w-lg mx-auto">

                                            <div className="border border-gray-200 p-3 rounded">
                                                <h3 className="font-bold text-gray-700">Score:</h3>
                                                <p className="text-gray-600">{data.score}</p>
                                            </div>

                                            <div className="border border-gray-200 p-3 rounded">
                                                <h3 className="font-bold text-gray-700">Remark:</h3>
                                                <p className="text-gray-600 text-sm">
                                                    {data.remark}
                                                </p>
                                            </div>

                                            <div className="border border-gray-200 p-3 rounded ">
                                                <h3 className="font-bold text-gray-700">File:</h3>
                                                {data.files && data.files.length > 0 ?
                                                    <>
                                                        {
                                                            data.files.map((item) => {
                                                                return item.fileName.endsWith('.pdf') ? (
                                                                    <div key={item._id}>
                                                                        <PdfPreview file={item} />
                                                                    </div>
                                                                ) : item.fileName.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                                                                    <div key={item._id}>
                                                                        <img
                                                                            src={item.fileUrl}
                                                                            alt={item.fileName}
                                                                            className="w-full h-auto rounded"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div key={item._id}>
                                                                        <p className="text-red-500">
                                                                            Unsupported file format: {item.fileName}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })
                                                        }
                                                    </> :
                                                    <></>}

                                            </div>
                                        </div>
                                    ))}



                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <p className="text-base text-gray-400 font-medium">
                            No compliance selected
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                            Please select an item from the list on the left to view details.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComplaintList;