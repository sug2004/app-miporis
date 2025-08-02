import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

const PdfPreview = ({ file }) => {
    const getFileNameFromUrl = (url) => {
        return url.substring(url.lastIndexOf('/') + 1);
    };

    const handleDownload = (fileUrl) => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = getFileNameFromUrl(fileUrl);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div key={file.fileUrl} className="max-w-md mx-auto rounded-lg border p-4">
                <object width="100%" height="200" data={file.fileUrl} type="application/pdf">   </object>
                <div className="flex justify-between items-center mt-4 font-medium text-lg">
                    {file.fileName}
                    <div >
                        <button
                            onClick={() => handleDownload(file.fileUrl)}
                            className="flex items-center justify-center w-10 h-10 p-2 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M12 3V16M12 16L16 11.625M12 16L8 11.625"
                                    stroke="#fff"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M15 21H9C6.17157 21 4.75736 21 3.87868 20.1213C3 19.2426 3 17.8284 3 15M21 15C21 17.8284 21 19.2426 20.1213 20.1213C19.8215 20.4211 19.4594 20.6186 19 20.7487"
                                    stroke="#fff"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

            </div>
        </>
    );
};

export default PdfPreview;
