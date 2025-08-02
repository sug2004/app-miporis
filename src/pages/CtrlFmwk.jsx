import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ctrlFmwk/ProgressBar';
import Recent from '../components/ctrlFmwk/Recent';
import CircularBar from '../components/graphs/CircularBar';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

function CtrlFmwk() {
    const { controlData } = useContext(AppContext);
    const { compliant_type } = useParams();
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const dataType = 'Process';

    const [calculatedData, setCalculatedData] = useState({
        filteredData: null,
        result: [],
        totalCount: 0,
        compliantCount: 0,
        partiallyCompliantCount: 0,
        nonCompliantCount: 0,
        fullCompliantCount: 0,
        compliancePercentage: 0
    });

    const token = Cookies.get('token');
    const userId = token ? jwtDecode(token).id : null;

    useEffect(() => {
        if (!userId) return;
        
        const fetchData = () => {
            setLoading(true);
            axios.get(`/api/compliance-overview?userId=${userId}`)
                .then(response => {
                    const apiData = response.data.find(item => item.compliant_type === compliant_type);
                    const filteredControlData = controlData?.find(data => data.compliant_type === compliant_type);
                    
                    if (apiData) {
                        const compliancePercentage = apiData.total_Relevance > 0 ? 
                            ((apiData.total_result / apiData.total_Relevance) * 100).toFixed(1) : 0;
                    
                            const newData = {
                                filteredData: filteredControlData || null,
                                result: [],
                                totalCount: apiData.total_count || 0,
                                compliantCount: apiData.total_Relevance || 0,
                                partiallyCompliantCount: apiData.total_result || 0,
                                nonCompliantCount: apiData.total_NC || 0,
                                fullCompliantCount: apiData.total_result || 0,
                                compliancePercentage: parseFloat(compliancePercentage)
                            };
                            
                        setCalculatedData(newData);
                    }
                    
                    if (filteredControlData?.controls) {
                        const groupedData = filteredControlData.controls.reduce((acc, control) => {
                            const title = control.Process;
                            if (acc[title]) {
                                acc[title].count += 1;
                                if (control.compliant_result === "C") {
                                    acc[title].countOfCompliant += 1;
                                }
                            } else {
                                acc[title] = {
                                    title,
                                    count: 1,
                                    countOfCompliant: control.compliant_result === "C" ? 1 : 0,
                                };
                            }
                            return acc;
                        }, {});
    
                        const result = Object.values(groupedData).map(group => ({
                            ...group,
                            percent: (group.countOfCompliant / group.count) * 100,
                        }));
    
                        setCalculatedData(prev => ({ ...prev, result }));
                    }
                })
                .catch(error => {
                    console.error('Error fetching compliance data:', error);
                })
                .finally(() => {
                    setLoading(false);
                });
        };
    
        fetchData();
    }, [userId, compliant_type, controlData]);
    

    if (loading) {
        return (
            <div className='flex flex-col px-4 sm:px-8 lg:px-12 xl:px-10 gap-6 sm:gap-8 lg:gap-12 mb-8 lg:mb-12 pt-4'>
                <div className='flex flex-col lg:flex-row gap-6 lg:gap-8 items-start'>
                    <ProgressBar loading={true} />
                    <Recent loading={true} />
                </div>
                <div className="w-full h-64 sm:h-96 bg-gray-300 rounded-lg animate-pulse"></div>
            </div>
        );
    }

    const handleNavigateRecent = (filter) => {
        if (filter !== 'viewAll') {
            navigate(`/home/${compliant_type}/compliant list?active=${filter}`);
        } else {
            navigate(`/home/${compliant_type}/compliant list?type=NC`);
        }
    }

    return (
        <div className='flex flex-col px-4 sm:px-8 lg:px-12 xl:px-10 gap-6 sm:gap-8 lg:gap-12 mb-8 lg:mb-12 pt-4'>
            <div className='flex flex-col lg:flex-row gap-6 lg:gap-8 items-start'>
                <div className='w-full lg:w-auto lg:flex-1'>
                    <ProgressBar 
                        totalCount={calculatedData.totalCount} 
                        compliantCount={calculatedData.compliantCount} 
                        partiallyCompliantCount={calculatedData.partiallyCompliantCount} 
                        nonCompliantCount={calculatedData.nonCompliantCount} 
                        compliant_type={compliant_type} 
                        fullCompliantCount={calculatedData.fullCompliantCount}
                        loading={loading}
                    />
                </div>
                <div className='w-full lg:w-auto lg:flex-1'>
                    <Recent 
                        controlData={calculatedData.filteredData} 
                        handleNavigateRecent={handleNavigateRecent} 
                        loading={loading}
                    />
                </div>
            </div>
            {calculatedData.result && calculatedData.result.length !== 0 && 
                <div className='mt-2 lg:mt-4'>
                    <CircularBar data={calculatedData.result} dataType={dataType} />
                </div>
            }
        </div>
    );
}

export default CtrlFmwk;
