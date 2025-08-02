import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import datetime from 'datetime';
import { useNavigate } from 'react-router-dom';

function HistorySection({ limit }) {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [fromDateSt, setFromDateSt] = useState('');
    const [toDateSt, setToDateSt] = useState('');

    useEffect(() => {

        if (fromDate && toDate && new Date(fromDate) > (new Date(toDate))) {
            setToDate('');
            setToDateSt('');
            return
        }
        if (fromDate && toDateSt && new Date(fromDate) > new Date(toDateSt)) {
            setToDateSt('');
            setToDate('');
            return
        }

        if (fromDate && (toDate || toDateSt)) {
            fetchFilteredData();
        }
    }, [fromDate, toDate]);

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            const token = Cookies.get('token');
            const decodedToken = jwtDecode(token);
            const userId = decodedToken.id;

            const query = {};

            if (userId) {
                query.userId = userId;
            }
            if (limit) {
                query.limit = limit;
            }
            const response = await axios.get('/api/history', { params: query });
            const sortedData = response.data;
            setData(sortedData);
            if (sortedData.length > 0) {
                setFromDateSt(new Date(sortedData[sortedData.length - 1].updatedAt).toISOString().split('T')[0]);
                setToDateSt(new Date(sortedData[0].updatedAt).toISOString().split('T')[0]);
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    const handleNavigateRecent = (compliant_type, filter) => {
        navigate(`/home/${compliant_type}/compliant list?active=${filter}`);
    }

    const fetchFilteredData = async () => {
        try {
            setLoading(true)
            const token = Cookies.get('token');
            const decodedToken = jwtDecode(token);
            const userId = decodedToken.id;

            const query = {};

            if (userId) {
                query.userId = userId;
            }
            if (fromDate) {
                query.from = new Date(fromDate).getTime();
            } else {
                query.from = new Date(fromDateSt).getTime();
            }

            if (toDate) {
                query.to = new Date(toDate).getTime() + (86400 * 1000);
            } else {
                query.to = new Date(toDateSt).getTime() + (86400 * 1000);
            }

            const response = await axios.get('/api/historyBtw', { params: query });
            setData(response.data);
            setLoading(false)
        } catch (error) {
            console.error('Error fetching filtered data:', error);
        }
    };

    var userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    var options = {
        timeZone: userTimeZone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    };

    var formatter = new Intl.DateTimeFormat('en-US', options);

    if (loading && !limit) {
        return <div>
            <div className="flex items-center justify-center h-[70vh]">
                <div className="relative ">
                    <div className=" h-24 w-24 rounded-full border-t-8 border-b-8 border-blue-900"></div>
                    <div className="absolute top-0 left-0">

                        <div className="   h-24 w-24 rounded-full border-t-8 border-b-8 border-blue-500 animate-spin"></div>
                    </div>
                </div>
            </div>
        </div>;
    }
    return (
        <div className='pt-1 w-full'>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 gap-4 sm:gap-0">
                <div>
                    {limit && <h2 className="text-lg md:text-xl text-black font-medium">History</h2>}
                </div>
                <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
                    <div className="flex flex-wrap gap-2 items-center bg-white rounded-md px-2  sm:px-3 py-2 shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto">
                        <div className="flex items-center gap-1 w-full sm:w-auto mb-2 sm:mb-0 ">
                            <label
                                className="text-sm text-gray-700 cursor-pointer whitespace-nowrap"
                                htmlFor="fromDate"
                            >
                                From:
                            </label>
                            <input
                                type="date"
                                id="fromDate"
                                value={fromDate || fromDateSt}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="border-none outline-none bg-transparent text-gray-800 cursor-pointer hover:bg-gray-100 focus:ring-2 focus:ring-blue-400 rounded-md transition-all w-full sm:w-auto"
                            />
                        </div>
                        <div className="flex items-center gap-1 w-full sm:w-auto">
                            <label
                                className="text-sm text-gray-700 cursor-pointer whitespace-nowrap"
                                htmlFor="toDate"
                            >
                                To:
                            </label>
                            <input
                                type="date"
                                id="toDate"
                                value={toDate || toDateSt}
                                onChange={(e) => setToDate(e.target.value)}
                                className="border-none outline-none bg-transparent text-gray-800 cursor-pointer hover:bg-gray-100 rounded-md transition-all w-full sm:w-auto"
                            />
                        </div>
                    </div>

                    <div className="px-3 py-3.5 bg-white rounded-lg hover:bg-gray-200 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="13" viewBox="0 0 21 13" fill="none">
                            <path d="M1.23242 1.13916H19.7411" stroke="black" strokeOpacity="0.57" strokeWidth="2" strokeLinecap="round" />
                            <path d="M4.31641 6.08618H16.6555" stroke="black" strokeOpacity="0.57" strokeWidth="2" strokeLinecap="round" />
                            <path d="M7.40234 11.0332H13.5719" stroke="black" strokeOpacity="0.57" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>
            </div>

            <div>
                {data.length > 0 ?
                    <>
                        {data.map((item, index) => (
                            <div
                                key={index}
                                className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 px-4 sm:px-6 bg-white text-black rounded-lg mb-4 shadow-sm"
                            >
                                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-0">
                                    <h1 className="text-base sm:text-lg font-bold">{item["Control ID"]}</h1>
                                    <span className="hidden sm:inline">-</span>
                                    <p className="text-xs sm:text-sm font-medium">{item["compliant_type"]}</p>
                                </div>
                                <div className="flex gap-2 md:gap-6 lg:gap-12 items-center">
                                    <div className="flex gap-1 md:gap-4 lg:gap-8">
                                        <h3 className="text-sm md:text-md font-normal text-gray-400">
                                            {formatter.format(new Date(item["updatedAt"]))}
                                        </h3>
                                    </div>
                                    <svg
                                        className='cursor-pointer'
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="23"
                                        height="10"
                                        viewBox="0 0 23 10"
                                        fill="none"
                                        onClick={() => { handleNavigateRecent(item["compliant_type"], item["Control ID"]) }}
                                    >
                                        <circle
                                            cx="2.5"
                                            cy="2.5"
                                            r="2.5"
                                            transform="matrix(-5.56409e-08 1 1 3.43396e-08 0.015625 0.900635)"
                                            fill="black"
                                            fillOpacity="0.51"
                                        />
                                        <circle
                                            cx="2.5"
                                            cy="2.5"
                                            r="2.5"
                                            transform="matrix(-5.56409e-08 1 1 3.43396e-08 8.01562 0.900635)"
                                            fill="black"
                                            fillOpacity="0.51"
                                        />
                                        <circle
                                            cx="2.5"
                                            cy="2.5"
                                            r="2.5"
                                            transform="matrix(-5.56409e-08 1 1 3.43396e-08 16.0156 0.900635)"
                                            fill="black"
                                            fillOpacity="0.51"
                                        />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </> :
                    <div
                        className="w-full text-center py-4 sm:py-6 px-4 sm:px-6 bg-white text-black rounded-lg mb-4 shadow-sm text-sm sm:text-base md:text-lg">
                        THERE IS NO HISTORY TO SHOW
                    </div>
                }
            </div>
        </div>
    );
}

export default HistorySection;
