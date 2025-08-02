import React, { useContext, useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { SemiCircleProgress } from 'react-semicircle-progressbar';

const CircularBar = ({ isOpen, openPopup, closePopup, handleDelete, data, dataType }) => {
    const [fileInput, setFileInput] = useState(null);

    const { compliant_type } = useParams();
    const navigate = useNavigate();
    const { setControlData } = useContext(AppContext);

    const token = Cookies.get('token');
    if (!token) {
        window.location.replace("https://miporis.com/login");
        return null;
    }
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id

    const circumference = 2 * Math.PI * 70;


    const handleFileUpload = (e, compliant_type) => {
        const fileInput = e.target;
        const file = fileInput.files[0];
        setFileInput(file);

        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const binaryString = event.target.result;
                const workbook = XLSX.read(binaryString, { type: 'binary' });

                if (workbook.SheetNames.length > 1) {
                    const selectedSheet = prompt(
                        `The file contains multiple sheets: \n${workbook.SheetNames.join('\n')}\n\nEnter the name of the sheet you want to upload:`
                    );

                    if (!selectedSheet || !workbook.Sheets[selectedSheet]) {
                        alert('Invalid sheet name. Please try again.');
                        fileInput.value = "";
                        return;
                    }

                    validateAndProcessSheet(workbook.Sheets[selectedSheet], compliant_type);
                } else {
                    const sheetName = workbook.SheetNames[0];
                    validateAndProcessSheet(workbook.Sheets[sheetName], compliant_type);
                }
            };
            reader.readAsBinaryString(file);
        } else {
            alert('Please upload a valid Excel file.');
            fileInput.value = "";
        }
    };

    const validateAndProcessSheet = async (worksheet, compliant_type) => {
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: '' });

        if (jsonData.length > 0 && jsonData[0].hasOwnProperty('Control ID')) {
            const updatedJsonData = jsonData.map(item => ({
                ...item,
                userId,
                compliant_type,
            }));

            try {
                const response = await axios.post('/upload-control-data', { data: updatedJsonData });
                if (response.status === 200) {
                    setControlData([{
                        controls: response.data.data,
                        compliant_type: compliant_type,
                    }]);
                    navigate(`/home/${compliant_type}`);
                }
            } catch (err) {
                alert('Failed to upload data');
            }
        } else {
            alert('The selected sheet does not contain the required "Control ID" required column.');
        }
    };

    const handleNavigate = (compliant_type) => {
        navigate(`/home/${compliant_type}`);
    }

    const handleNavigateFilter = (filter) => {
        navigate(`/home/${compliant_type}/compliant list?filter=${filter.replace(/ /g, '+')}`);
    }




    return (
        <div className='flex flex-col gap-4 sm:gap-6'>
            <div>
                <p className='text-lg font-medium'> {dataType}</p>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4">
                {data.map((item, index) => {
                    const borderColor =
                        item.percent >= 80
                            ? "bg-[#28E42F]"
                            : item.percent >= 60
                                ? "bg-[#CCAF39]"
                                : "bg-[#EC0000]"
                    return (
                        <div
                            key={index}
                            className={`relative group  flex flex-col justify-center items-center bg-white w-[90%] sm:w-full md:w-56 p-8 md:p-3 sm:p-4 rounded-lg shadow-lg mx-auto sm:mx-0`}
                        >
                            <div
                                className={`flex justify-center items-center text-black text-base sm:text-lg text-center font-semibold mb-3 md::mb-2`}
                                onClick={() => {
                                    if (item?.percent >= 0) { handleNavigate(item.title) };
                                    if (dataType === 'Process') handleNavigateFilter(item.title)
                                }}
                            >
                                {item.title}
                            </div>

                            <div className={`relative w-full h-full max-h-[180px] sm:max-h-[200px] flex items-center justify-center ${(item.percent || dataType === 'Process') ? 'cursor-pointer' : ''}`} >
                                {(item?.percent >= 0) && (dataType !== 'Process') ? (
                                    <span className="text-white font-bolder text-2xl sm:text-3xl cursor-pointer">
                                        <div className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px]">
                                            <div className="relative ml-4 md:ml-6 -mt-6" >
                                                <SemiCircleProgress
                                                    percentage={100}
                                                    size={{
                                                        width: 110,
                                                        height: 110,
                                                        sm: {
                                                            width: 130,
                                                            height: 130
                                                        }
                                                    }}
                                                    strokeWidth={6}
                                                    strokeLinecap="butt"
                                                    strokeColor="#d3d3d3"
                                                    fontStyle={{ fill: "transparent" }}
                                                />
                                                {/* Dynamic progress bar */}
                                                <div className="absolute top-0 left-0" onClick={() => {
                                                    if (item?.percent >= 0) { handleNavigate(item.title) };
                                                    if (dataType === 'Process') handleNavigateFilter(item.title)
                                                }}>
                                                    <SemiCircleProgress
                                                        percentage={
                                                            typeof item.percent === "string" && item.percent.includes("%")
                                                                ? parseFloat(Number(item.percent.replace("%", ""))).toFixed(1)
                                                                : parseFloat(Number(item.percent)).toFixed(1)
                                                        }
                                                        size={{
                                                            width: 110,
                                                            height: 110,
                                                            sm: {
                                                                width: 130,
                                                                height: 130
                                                            }
                                                        }}
                                                        strokeWidth={6}
                                                        strokeLinecap="butt"
                                                        strokeColor="#5A97C4" /* Dynamic color */
                                                    />
                                                </div>
                                            </div>
                                            <div className="p-0 -space-y-3 sm:-space-y-4 -mt-10 md:-mt-[35px]">
                                                <div className="text-black text-[12px] sm:text-[14px] font-medium flex justify-between">
                                                    <span>Total Controls:</span>
                                                    <span className='font-bold'>{item.total_count}</span>
                                                </div>
                                                <div className="text-black text-[12px] sm:text-[14px] font-medium flex justify-between">
                                                    <span>Not Relevant:</span>
                                                    <span className='text-[#C24D4B] font-bold'>{item.total_count - item.total_Relevance}</span>
                                                </div>
                                                <div className="text-black text-[12px] sm:text-[14px] font-medium flex justify-between">
                                                    <span>Compliant:</span>
                                                    <span className='text-[#1E912C] font-bold'>{item.total_result}</span>
                                                </div>
                                                <div className="text-black text-[12px] sm:text-[14px] font-medium flex justify-between">
                                                    <span>Non Compliant:</span>
                                                    <span className='text-[#D2B48C] font-bold'>{item.total_NC}</span>
                                                </div>

                                            </div>
                                        </div>
                                    </span>
                                ) : (dataType === 'Process') ? (
                                    <span onClick={() => {
                                        if (item.percent) handleNavigate(item.title);
                                        if (dataType === 'Process') handleNavigateFilter(item.title)
                                    }} className="text-white font-bolder text-2xl sm:text-3xl cursor-pointer">
                                        <div className="relative">
                                            <svg
                                                onClick={() => {
                                                    if (item.percent) handleNavigate(item.title);
                                                    if (dataType === 'Process') handleNavigateFilter(item.title);
                                                }}
                                                className="transform -rotate-90 w-full h-full max-w-[140px] max-h-[140px] sm:max-w-[180px] sm:max-h-[180px] cursor-pointer"
                                            >
                                                <circle
                                                    cx="50%"
                                                    cy="50%"
                                                    r="65"
                                                    stroke="currentColor"
                                                    strokeWidth="10"
                                                    fill="#5A97C4"
                                                    className="text-white"
                                                    style={{ pointerEvents: 'visible' }}
                                                />
                                            </svg>
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-lg sm:text-xl">
                                                {typeof item.percent === "number"
                                                    ? `${item.percent.toFixed(1)}%`
                                                    : `${parseFloat(item.percent).toFixed(1)}%`}
                                            </div>
                                        </div>
                                    </span>
                                ) : (
                                    <div className="relative">
                                        <svg
                                            onClick={() => {
                                                if (item.percent) handleNavigate(item.title);
                                                if (dataType === 'Process') handleNavigateFilter(item.title);
                                            }}
                                            className="transform -rotate-90 w-full h-full max-w-[140px] max-h-[140px] sm:max-w-[180px] sm:max-h-[180px] cursor-pointer"
                                        >
                                            <circle
                                                cx="50%"
                                                cy="50%"
                                                r="65"
                                                stroke="currentColor"
                                                strokeWidth="10"
                                                fill="#5A97C4"
                                                className="text-white"
                                                style={{ pointerEvents: 'visible' }}
                                            />
                                        </svg>

                                        {/* Overlay for the Upload Button */}
                                        <div className="absolute inset-0 flex items-center justify-center text-black font-bold text-xl">
                                            <input
                                                type="file"
                                                accept=".xls,.xlsx"
                                                onChange={(e) => handleFileUpload(e, item.title)}
                                                className="hidden"
                                                id={`file-upload-${index}`}
                                            />
                                            <label
                                                htmlFor={`file-upload-${index}`}
                                                className="cursor-pointer text-blue-500 flex items-center justify-center"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="50px"
                                                    height="50px"
                                                    className="sm:w-[60px] sm:h-[60px]"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15"
                                                        stroke="#ffffff"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                    <path
                                                        d="M12 16V3M12 3L16 7.375M12 3L8 7.375"
                                                        stroke="#ffffff"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Bottom border */}
                            <span
                                className={`absolute inset-x-0 bottom-0 h-1 ${borderColor} transform scale-y-100 rounded-b-lg transition-all duration-300 group-hover:h-2`}
                            ></span>

                            {/* Delete button */}
                            {(item?.percent >= 0 && (dataType !== 'Process')) ?
                                <div
                                    onClick={() => openPopup(item.title)}
                                    className='flex absolute top-2 right-2 hover:bg-gray-300 h-7 w-7 sm:h-8 sm:w-8 justify-center items-center rounded-full'
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 14" fill="none" className="sm:w-[14px] sm:h-[15px]">
                                        <path d="M2.0078 13.3249C2.0236 13.7023 2.33411 14.0001 2.71174 14.0001H9.28913C9.66675 14.0001 9.97727 13.7023 9.99307 13.3249L10.4628 3.40918H1.53809L2.0078 13.3249ZM7.48832 5.87208C7.48832 5.71408 7.61643 5.58594 7.7745 5.58594H8.23221C8.39018 5.58594 8.5184 5.71405 8.5184 5.87208V11.5372C8.5184 11.6952 8.39028 11.8233 8.23221 11.8233H7.7745C7.6165 11.8233 7.48832 11.6953 7.48832 11.5372V5.87208ZM5.48543 5.87208C5.48543 5.71408 5.61354 5.58594 5.77157 5.58594H6.22929C6.38726 5.58594 6.51544 5.71405 6.51544 5.87208V11.5372C6.51544 11.6952 6.38736 11.8233 6.22929 11.8233H5.77157C5.61357 11.8233 5.48543 11.6953 5.48543 11.5372V5.87208ZM3.48247 5.87208C3.48247 5.71408 3.61058 5.58594 3.76862 5.58594H4.22637C4.38437 5.58594 4.51252 5.71405 4.51252 5.87208V11.5372C4.51252 11.6952 4.3844 11.8233 4.22637 11.8233H3.76862C3.61062 11.8233 3.48247 11.6953 3.48247 11.5372V5.87208Z" fill="#8C8C8C" />
                                        <path d="M10.7756 0.72121H7.7412V0.147546C7.7412 0.0660786 7.67516 0 7.59366 0H4.40725C4.32578 0 4.25973 0.0660786 4.25973 0.147546V0.721176H1.22533C0.981131 0.721176 0.783203 0.919137 0.783203 1.16333V2.55232H11.2177V1.16337C11.2177 0.919172 11.0198 0.72121 10.7756 0.72121Z" fill="#8C8C8C" />
                                    </svg>
                                </div>
                                : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CircularBar;
