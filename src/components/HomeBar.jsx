import React from 'react';

function HomeBar({ overview, activeCount = 5 }) {
    return (
        <div
            className="w-full bg-blue-400 h-auto min-h-[8rem] md:h-44 rounded-xl bg-cover bg-center flex flex-col justify-between p-3 sm:p-4 md:p-6"
            style={{ backgroundImage: "url('/banner.webp')" }}
        >
            <div className="text-white font-normal text-base sm:text-lg">
                Overview <span className='bg-white px-2 py-1 rounded-2xl font-normal text-black text-xs sm:text-sm ml-2'>{overview.toFixed(1)}%</span>
            </div>
            <div className='flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 mt-4 sm:mt-0'>
                <div className='flex flex-col text-white'>
                    <div className='text-sm sm:text-md font-normal'>
                        <span className='text-xl sm:text-2xl md:text-3xl font-bold mr-2'>{overview.toFixed(1)}%</span> completed
                    </div>
                    <p className='text-sm sm:text-md font-normal'>Average of {activeCount} items</p>
                </div>
                <div className='flex gap-3 sm:gap-6 sm:pt-6'>
                    <button className='py-1 px-4 sm:px-6 bg-white rounded-lg text-black font-normal text-base sm:text-lg whitespace-nowrap'>
                        Export
                    </button>
                    <button className='py-1 px-4 sm:px-6 bg-white rounded-lg text-black font-normal text-base sm:text-lg'>
                        New
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HomeBar;
