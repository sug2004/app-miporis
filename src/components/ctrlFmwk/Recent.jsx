import React from 'react'

function Recent({ controlData, handleNavigateRecent, loading }) {

    // Skeleton Loading Component
    if (loading) {
        return (
            <div className="w-full">
                <div>
                    <div className="h-7 bg-gray-300 rounded-md w-48 mb-4 animate-pulse"></div>
                </div>

                <div className='w-full bg-white rounded-2xl overflow-hidden shadow-md'>
                    <table className='min-w-full table-auto'>
                        <thead className="bg-[#F4F4F4] border-b border-gray-300">
                            <tr className='font-normal'>
                                <th className="px-4 py-3 text-left font-medium">
                                    <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
                                </th>
                                <th className="px-4 py-3 text-left"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map((item) => (
                                <tr key={item} className="border-b">
                                    <td className="px-4 py-1.5">
                                        <div className='mb-1'>
                                            <div className="h-5 bg-gray-300 rounded w-20 animate-pulse"></div>
                                        </div>
                                        <div>
                                            <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-1">
                                        <div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="h-7 bg-gray-300 rounded-2xl w-20 animate-pulse"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex items-center justify-center px-4 py-2.5 text-center bg-[#F4F4F4] w-full">
                        <div className="h-5 bg-gray-300 rounded w-20 animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="w-full">
            <div>
                <h3 className="text-lg font-medium mb-4">Overall Progress</h3>
            </div>

            <div className='w-full bg-white rounded-2xl overflow-hidden shadow-md'>
                <table className='min-w-full table-auto'>
                    <thead className="bg-[#F4F4F4] border-b border-gray-300">
                        <tr className='font-normal '>
                            <th className="px-4 py-3 text-left font-medium">Compliant ID</th>
                            <th className="px-4 py-3 text-left font-medium">Last Update</th>
                            <th className="px-4 py-3 text-left"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {controlData && controlData.length !== 0 && controlData.controls.slice(0, 5).map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="px-4 py-1.5">
                                    <div className='text-lg font-normal'>{item["Control ID"]}</div>
                                    <div className='text-sm font-normal'>{item.Process}</div>
                                </td>
                                <td className="px-4 py-1">{item.compliant_type}
                                    {/* {item.date} at {item.time} */}
                                </td>
                                <td className="px-4 py-2 cursor-pointer" onClick={() => { handleNavigateRecent(item["Control ID"]) }}>
                                    <button className="bg-[#0064BC] text-white px-3 py-1 rounded-2xl">Continue</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
                <div className="flex items-center justify-center px-4 py-2.5 text-center bg-[#F4F4F4] w-full">
                    <button onClick={() => { handleNavigateRecent('viewAll') }}>
                        View More
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Recent;
