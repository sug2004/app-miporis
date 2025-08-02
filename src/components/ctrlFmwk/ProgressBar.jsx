import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ProgressBar({ totalCount, compliantCount, partiallyCompliantCount, nonCompliantCount, compliant_type, fullCompliantCount, loading }) {
    // Configuration variables
    const navigate = useNavigate();
    const radius = 80; // Radius of the circle
    const strokeWidth = 10; // Stroke width of the circle
    const circumference = 2 * Math.PI * radius; // Circumference of the circle
    const progress = (fullCompliantCount / compliantCount) * 100; // Progress percentage (Green circle)
    const remaining = 100 - progress; // Remaining progress (Red/Orange circle)
    const orangeProgress = 65; // Starting point of the orange circle, can be dynamic

    const [hovered, setHovered] = useState(false);

    // Calculate strokeDashoffset for green (progress) and orange (remaining)
    const validProgress = isNaN(progress) ? 0 : progress;
    const greenDashoffset = circumference - (validProgress / 100) * circumference;
    const orangeDashoffset = circumference - (partiallyCompliantCount / 100) * circumference;

    // Skeleton Loading Component
    if (loading) {
        return (
            <div className="flex flex-col items-center w-full px-4">
                {/* Title Skeleton */}
                <div className="h-6 sm:h-7 bg-gray-300 rounded-md w-40 sm:w-48 mb-4 animate-pulse"></div>

                {/* Card Skeleton */}
                <div className="w-full max-w-3xl bg-[#F4F4F4] rounded-2xl shadow-md p-4 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-10">
                        {/* Circle and Center Text */}
                        <div className="relative flex items-center justify-center mx-auto sm:mx-0">
                            {/* Circle Skeleton */}
                            <div className="w-48 sm:w-60 aspect-square rounded-full border-8 border-gray-300 animate-pulse"></div>

                            {/* Center Text */}
                            <div className="absolute flex flex-col items-center">
                                <div className="h-10 sm:h-12 bg-gray-300 rounded-md w-16 sm:w-20 mb-2 animate-pulse"></div>
                                <div className="h-4 sm:h-5 bg-gray-300 rounded-md w-20 sm:w-24 animate-pulse"></div>
                            </div>
                        </div>

                        {/* Stat Blocks */}
                        <div className="grid grid-cols-2 gap-4 sm:gap-6 flex-grow justify-items-center mt-4 sm:mt-0">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="flex flex-col items-center">
                                    <div className="h-7 sm:h-9 bg-gray-300 rounded-md w-12 sm:w-16 mb-2 animate-pulse"></div>
                                    <div className="h-3 sm:h-4 bg-gray-300 rounded-md w-16 sm:w-20 animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Button Skeleton */}
                    <div className="flex justify-center mt-6">
                        <div className="h-10 sm:h-12 bg-gray-300 rounded-lg w-36 sm:w-40 animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full">
            <h3 className="text-base sm:text-lg font-medium mb-4">Overall Progress</h3>
            <div className='flex flex-col bg-[#F4F4F4] rounded-2xl shadow-md px-3 sm:px-4 py-4 sm:py-8 w-full md:min-w-[520px]'>
                <div className='flex flex-col sm:flex-row items-center'>
                    <div
                        className="relative flex items-center justify-center mb-4 sm:mb-0"
                        style={{
                            width: '250px',
                            height: '250px',
                        }}
                    >
                        <svg
                            className="absolute transform -rotate-90"
                            viewBox="0 0 200 200"
                            style={{ width: '100%', height: '100%' }}
                        >
                            {/* Orange Circle (Remaining progress) */}
                            <circle
                                cx="100"
                                cy="100"
                                r={radius}
                                stroke="#C24D4B"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                            />
                            {/* Green Circle (Completed progress) */}
                            <circle
                                cx="100"
                                cy="100"
                                r={radius}
                                stroke="#4DA357"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={greenDashoffset}
                                className={`transition-all duration-300 ${hovered ? 'transform scale-105' : ''}`}
                            />
                            {/* Neutral Circle */}
                            <circle
                                cx="100"
                                cy="100"
                                r="65"
                                stroke="#D2B48C"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={orangeDashoffset}
                                className="transition-all duration-300"
                            />
                        </svg>
                        <span className="absolute text-2xl sm:text-2xl font-bold flex flex-col items-center">
                            {typeof progress === "number" ? (!Number.isInteger(progress) ? progress.toFixed(2) : progress) : progress}%
                            <span className='font-normal text-black text-base sm:text-lg'>COMPLIANT</span>
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-6 p-2 sm:p-4 mt-0 sm:mt-0">
                        <div className='flex flex-col items-center cursor-pointer'
                            onClick={() => { navigate(`/home/${compliant_type}/compliant list`) }}
                        >
                            <h1 className='text-xl sm:text-3xl font-bold text-black'>{totalCount}</h1>
                            <p className='font-normal text-xs sm:text-base'>Total Controls</p>
                        </div>
                        <div className='flex flex-col items-center cursor-pointer'
                            onClick={() => { navigate(`/home/${compliant_type}/compliant list?rtype=N`) }}
                        >
                            <h1 className='text-xl sm:text-3xl font-bold text-[#C24D4B]'>{totalCount - compliantCount}</h1>
                            <p className='font-normal text-xs sm:text-base'>Not Relevant</p>
                        </div>
                        <div className='flex flex-col items-center cursor-pointer'
                            onClick={() => { navigate(`/home/${compliant_type}/compliant list?type=C`) }}
                        >
                            <h1 className='text-xl sm:text-3xl font-bold text-[#1E912C]'>{partiallyCompliantCount}</h1>
                            <p className='font-normal text-xs sm:text-base text-center w-[100px] sm:w-[138px]'>Compliant</p>
                        </div>
                        <div className='flex flex-col items-center cursor-pointer'
                            onClick={() => { navigate(`/home/${compliant_type}/compliant list?type=NC`) }}
                        >
                            <h1 className='text-xl sm:text-3xl font-bold text-[#D2B48C]'>{nonCompliantCount}</h1>
                            <p className='font-normal text-xs sm:text-base'>Non Compliant</p>
                        </div>

                    </div>
                </div>
                <div className='inline-block flex justify-center mt-4'>
                    <button className='bg-[#0064BC] py-2 sm:py-3 px-4 sm:px-5 rounded-lg text-white cursor-pointer text-sm sm:text-base'
                        onClick={() => { navigate(`/home/${compliant_type}/compliant list`) }}
                    >
                        Finish Assessment
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProgressBar;
//     );
// }

// export default ProgressBar;
