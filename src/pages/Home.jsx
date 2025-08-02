import { useContext, useEffect, useState } from 'react';
import CircularBar from '../components/graphs/CircularBar';
import HistorySection from '../components/HistorySection';
import HomeBar from '../components/HomeBar';
import { AppContext } from '../context/AppContext';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const Home = () => {
    const { controlData, routeChange } = useContext(AppContext);
    const [controlDataState, setControlDataState] = useState([
        { title: 'GRC' },
        { title: 'Operational' },
        { title: 'Other policies' },
        { title: 'Strategic' },
        { title: 'Financial' }
    ]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState('');
    const location = useLocation();

    const token = Cookies.get('token');
    if (!token) {
        window.location.replace("https://miporis.com/login");
        return null;
    }
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;

    useEffect(() => {
        setLoading(true);
        axios.get(`/api/compliance-overview?userId=${userId}`)
            .then(response => {
                const data = response.data;
                const updatedControlData = controlDataState.map(item => {
                    const matchedData = data.find(apiItem => apiItem.compliant_type === item.title);
                    if (matchedData) {
                        // Calculate compliance percentage
                        const totalRelevant = matchedData.total_Relevance || 0;
                        const compliantCount = matchedData.total_result || 0;
                        const compliancePercentage = totalRelevant > 0 ? 
                            ((compliantCount / totalRelevant) * 100).toFixed(1) : 0;
                            
                        return { 
                            ...item, 
                            ...matchedData,
                            percent: parseFloat(compliancePercentage), // Ensure percent is set for CircularBar
                            compliancePercentage: parseFloat(compliancePercentage)
                        };
                    }                                       
                    return item;
                });
                const sortedControlData = [
                    ...updatedControlData.filter(item => item.compliant_type),
                    ...updatedControlData.filter(item => !item.compliant_type)
                ];

                setControlDataState(sortedControlData);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setLoading(false);
            });
    }, [location.pathname]);

    const dataType = 'Quick View';

    const openPopup = (e) => setIsOpen(e);
    const closePopup = () => setIsOpen('');

    const handleDelete = async () => {
        if (isOpen !== '') {
            try {
                const response = await axios.delete('/delete-control-data', {
                    params: {
                        Control_type: isOpen,
                        userId: userId,
                    },
                });
                if (response.data.success) {
                    alert('Item deleted!');
                    window.location.reload();
                } else {
                    console.error('Error:', response.data.error);
                }
            } catch (error) {
                console.error('API error:', error.response ? error.response.data : error.message);
            }
        }
    };

    if (loading) {
        return (
            <div>
                <div className="flex items-center justify-center h-[70vh]">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-full border-t-8 border-b-8 border-blue-900"></div>
                        <div className="absolute top-0 left-0">
                            <div className="h-24 w-24 rounded-full border-t-8 border-b-8 border-blue-500 animate-spin"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const activeCategories = controlDataState.filter(item => item.compliant_type).length;
const totalPercentage = controlDataState.reduce((sum, item) => sum + (item.percent || 0), 0);
const overallPercentage = activeCategories > 0 ? totalPercentage / activeCategories : 0;
    return (
        <div className="relative flex flex-col gap-12 px-6 lg:px-12 xl:px-10 pt-1">
            <HomeBar overview={overallPercentage} activeCount={activeCategories} />

            <CircularBar 
                data={controlDataState} 
                dataType={dataType} 
                isOpen={isOpen} 
                openPopup={openPopup} 
                closePopup={closePopup} 
                handleDelete={handleDelete} 
            />
            <HistorySection limit={10} />
            {isOpen !== '' && (
                <div className="absolute inset-0 flex -top-28 justify-center bg-gray-900 bg-opacity-60 z-50">
                    <div className="bg-white mt-[30vh] h-52 w-full max-w-md p-8 rounded-lg shadow-lg transform transition-all">
                        <h3 className="text-xl font-semibold text-gray-800">Confirm Deletion</h3>
                        <p className="text-gray-600 mt-4">
                            Are you sure you want to delete <b>{isOpen}</b>? This action cannot be undone.
                        </p>
                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={closePopup}
                                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
