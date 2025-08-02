import React from "react";
import { FaDownload } from "react-icons/fa";

const DocxPreview = ({ file }) => {
    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = file.fileUrl;
        link.download = file.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-md mx-auto rounded-lg border p-4 flex justify-between items-center gap-4">
            <p className="font-medium text-lg">{file.fileName}</p>
            <button
                onClick={handleDownload}
                className="bg-blue-500 text-white p-3 rounded-full flex items-center gap-2 hover:bg-blue-600"
            >
                <FaDownload />
                
            </button>
        </div>
    );
};

export default DocxPreview;
