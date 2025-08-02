import React, { useRef, useState, useContext, useEffect } from 'react';
import Markdown from 'react-markdown'
import Markdownn from 'markdown-to-jsx'
import axios from 'axios';
import PdfPreview from '../utils/pdfViewer';
import remarkGfm from 'remark-gfm';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import DocxPreview from '../utils/DocxPreview';
import { AppContext } from '../context/AppContext';


function Chat({ activeCompliance, compliant_type, userId, handleChangeActiveCmplt, handleUpdateComplaint, updateComplianceControls }) {
    const { setControlData, controlData } = useContext(AppContext);
    const [prevMessages, setPrevMessages] = useState([]);
    const [message, setMessage] = useState(``);
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [filePreviews, setFilePreviews] = useState([]);
    const inputRef = useRef(null)

    useEffect(() => {
        const chatContainer = document.getElementById('chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, [prevMessages]);

    const token = Cookies.get('token');
    if (!token) {
        window.location.replace("https://www.miporis.com/login");
        return null;
    }
    const decodedToken = jwtDecode(token);

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const response = await axios.get('/chat-history', {
                    params: {
                        userId: userId,
                        controlId: activeCompliance["Control ID"],
                    },
                });
                if (response.data.result && response.data.result.length > 0) {
                    setPrevMessages(response.data.result);
                } else {
                    setPrevMessages([])
                    startNewConversation();
                }
            } catch (error) {
                console.error('Error fetching chat history:', error);
            }
        };

        fetchChatHistory();
    }, [activeCompliance, userId]);

    useEffect(() => {
        const textarea = inputRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            const maxHeight = textarea.scrollHeight >
                4 * parseFloat(getComputedStyle(textarea).lineHeight)
                ? `6em`
                : `${textarea.scrollHeight}px`;
            textarea.style.height = maxHeight;
            textarea.scrollTop = textarea.scrollHeight;
        }
    }, [message]);

    const startNewConversation = async () => {
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

        setPrevMessages((prevMessages) => [
            ...prevMessages,
            {
                type: 'bot',
                text: '',
                createdAt: nowTime,
                compliant_type: activeCompliance["Control ID"],
                userId: userId,
            },
        ]);

        const prompt = "greet and give the list of required document to get compliant?";
        try {
            const response = await fetch(
                `/chat-completions?query=${encodeURIComponent(prompt)}&userId=${userId}&controlId=${activeCompliance["Control ID"]}&controlType=${compliant_type}`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch conversation');
            }

            const result = await response.json();
            const newMessageContent = result.content || '';
            const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

            setPrevMessages((prevMessages) => {
                const lastbotMessageIndex = prevMessages
                    .map((msg) => msg.type)
                    .lastIndexOf('bot');
                if (lastbotMessageIndex !== -1) {
                    const updatedMessages = [...prevMessages];
                    updatedMessages[lastbotMessageIndex].text += ` ${newMessageContent}`;
                    return updatedMessages;
                } else {
                    const botMessage = { type: 'bot', text: newMessageContent, createdAt: nowTime };
                    return [...prevMessages, botMessage];
                }
            });

            setMessage('');
            setFiles([]);
            setFilePreviews([]);

        } catch (error) {
            console.error('Error fetching new conversation:', error);
            alert('An error occurred while starting a new conversation. Please try again.');
        }
    };
    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);

        const newPreviews = newFiles.map(file => ({
            name: file.name,
            url: URL.createObjectURL(file)
        }));
        setFilePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
        e.target.value = "";
    };

    const removeFile = (fileName) => {
        setFiles(files.filter(file => file.name !== fileName));
        setFilePreviews(filePreviews.filter(file => file.name !== fileName));
    };

    const uploadFiles = async (activeCompliance, userId, files) => {
        if (!files || files.length === 0) {
            console.error("No files to upload.");
            return;
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        const nowtime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        if (files.length > 0) {
            try {
                setLoading(true)
                setFilePreviews([])
                const formData = new FormData();

                files.forEach(file => {
                    formData.append('files', file);
                });

                formData.append('controlId', activeCompliance["Control ID"]);
                formData.append('userId', userId);
                formData.append('controlType', compliant_type);

                const response = await axios.post('/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);

                    },
                });
                if (response.data.status) {
                    setFiles([]);
                    setPrevMessages((prev) => [...prev, ...response.data.chat]);
                    handleUpdateComplaint(response.data.controlData);
                    handleChangeActiveCmplt(response.data.controlData);
                    updateComplianceControls(response.data.controlData);
                }
                return
            } catch (error) {
                console.error("Error uploading files:", error.response?.data || error.message);
                return
            } finally {
                setLoading(false);
                setFiles([]);
            }
        }
        if (message === '') return
        setPrevMessages(prevMessages => [
            ...prevMessages,
            { type: 'user', text: messageView(message), createdAt: nowtime, compliant_type: activeCompliance["Control ID"], userId: userId },
            { type: 'bot', text: '', createdAt: nowtime, compliant_type: activeCompliance["Control ID"], userId: userId }
        ]);
        setMessage('');
        setLoading(true)
        const response = await fetch(
            `/chat-completions?query=${encodeURIComponent(messageView(message))}&userId=${userId}&controlId=${activeCompliance["Control ID"]}&controlType=${compliant_type}`,
            {
                method: 'GET',
                credentials: 'include',
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch conversation');
        }

        const result = await response.json();
        const nowTime = new Date().toLocaleTimeString();
        const newMessageContent = result.content || '';

        setPrevMessages((prevMessages) => {
            const lastbotMessageIndex = prevMessages
                .map((msg) => msg.type)
                .lastIndexOf('bot');
            if (lastbotMessageIndex !== -1) {
                const updatedMessages = [...prevMessages];
                updatedMessages[lastbotMessageIndex].text += ` ${newMessageContent}`;
                return updatedMessages;
            } else {
                const botMessage = { type: 'bot', text: newMessageContent, time: nowTime };
                return [...prevMessages, botMessage];
            }
        });

        setFiles([]);
        setFilePreviews([]);
        setLoading(false)
    };

    function formatTime(input) {
        if (/^\d{1,2}:\d{2} [APap][Mm]$/.test(input)) {
            return input;
        }
        const date = new Date(input);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    const renderTextWithNewlines = (text) => {
        if (!text) return null;
        const temp = text.split('\n').map((str, index) => (
            `${str}\\`
        ));
        return temp.join(" ");
    };

    const messageView = (text) => {
        return text.replace(/\n/g, '\n\n');
    }

    return (
        <div className="relative w-full h-full">
            {/* Conditionally render the loader when loading is true */}
            {loading && <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 flex items-center gap-3 animate-fade-in">
                <div className="relative w-6 h-6">
                    <div className="absolute inset-0 border-t-2 border-r-2 border-[#0067BC] rounded-full animate-spin"></div>
                </div>
                <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-700">Analyzing document with AI Agent</p>
                    <div className="flex space-x-1">
                        <span className="h-1.5 w-1.5 bg-[#0067BC] rounded-full animate-pulse"></span>
                        <span className="h-1.5 w-1.5 bg-[#0067BC] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></span>
                        <span className="h-1.5 w-1.5 bg-[#0067BC] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></span>
                    </div>
                </div>
            </div>}

            {activeCompliance && activeCompliance['compliant_result'] === 'C' && <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-10">
                <div className='flex flex-col justify-center items-center bg-white p-6 rounded-xl'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="104" height="104" viewBox="0 0 104 104" fill="none">
                        <path d="M81.3945 24.2538C80.1099 24.2538 78.5684 24.4251 76.5986 24.682C74.6288 25.0245 73.2586 25.3671 72.4878 25.7953C71.6314 26.2235 70.4324 27.3369 68.7196 29.1353C67.0924 30.8482 64.9513 33.6744 62.3821 37.2713C59.8128 40.9539 57.5861 44.4652 55.702 47.8909C53.9892 50.8883 52.2764 54.2284 50.5635 57.7397C49.3645 56.1981 48.0799 54.9991 46.7953 54.0571C45.1681 52.9437 43.5409 52.3442 42.085 52.3442C40.6291 52.3442 38.9163 53.0294 37.2034 54.314C35.4049 55.6843 34.4629 57.2258 34.4629 58.853C34.4629 60.1376 35.2337 61.5935 36.8609 63.3064C39.1732 65.8756 41.0573 68.2736 42.4276 70.4146C43.4553 71.9562 44.1404 72.9839 44.5686 73.4977C45.0825 74.0116 45.6819 74.4398 46.3671 74.6967C47.0522 74.9537 48.2512 75.0393 49.8784 75.0393C52.1907 75.0393 53.7323 74.7824 54.6743 74.2685C55.6164 73.7547 56.3015 73.0695 56.8154 72.1275C57.2436 71.2711 58.0144 69.6439 59.0421 67.0746C61.6113 60.6515 65.1226 53.8858 69.4903 47.0345C73.8581 40.1831 78.0545 34.8733 82.0797 31.1051C83.1074 30.2487 83.7069 29.5636 83.9638 29.1353C84.4776 28.7928 84.6489 28.1933 84.6489 27.5082C84.6489 26.6517 84.3063 25.881 83.7069 25.2815C83.193 24.5963 82.3366 24.2538 81.3945 24.2538Z" fill="#87D18A" />
                        <path d="M70.9907 24.4476C72.0843 22.8575 71.6886 20.6657 70.0019 19.7279C63.2277 15.9614 55.4057 14.4172 47.6535 15.3691C38.7405 16.4634 30.5361 20.7815 24.5879 27.5089C18.6397 34.2363 15.359 42.9079 15.3645 51.8878C15.3701 60.8677 18.6616 69.5352 24.6182 76.2552C30.5747 82.9752 38.7845 87.2831 47.6988 88.3664C56.6132 89.4497 65.6158 87.2334 73.0084 82.1355C80.4011 77.0377 85.6727 69.4109 87.8288 60.6936C89.7041 53.1117 89.1099 45.1609 86.1836 37.9836C85.455 36.1966 83.3266 35.5407 81.6167 36.4356C79.9069 37.3304 79.2675 39.4369 79.956 41.2397C82.1137 46.8892 82.5099 53.0915 81.0446 59.0156C79.2983 66.076 75.0286 72.2533 69.0411 76.3822C63.0535 80.5112 55.7619 82.3062 48.5419 81.4288C41.3218 80.5515 34.6724 77.0623 29.848 71.6195C25.0235 66.1767 22.3576 59.1566 22.3531 51.8834C22.3486 44.6103 25.0058 37.5869 29.8235 32.1381C34.6411 26.6893 41.2862 23.1919 48.5052 22.3056C54.5624 21.5618 60.6722 22.6996 66.022 25.5197C67.7292 26.4197 69.8971 26.0377 70.9907 24.4476Z" fill="#87D18A" />
                    </svg>
                    <p className=" font-normal text-xl text-black">Fully Compliant</p>
                </div>
            </div>
            }

            <div className="flex flex-col flex-grow w-full h-full max-w-4xl bg-[#D9D9D9] rounded-lg overflow-hidden ">
                <div id="chat-container" className="flex flex-col flex-grow p-4 overflow-auto space-y-4">
                    {prevMessages.map((message, index) => (
                        <div key={index} className={`flex w-full mt-2 space-x-3 ${message.type === 'user' ? 'ml-auto justify-end' : ''}`}>
                            <div className={` ${message.type === 'user' ? 'flex  flex-row-reverse gap-2' : 'flex flex-row gap-2 '} ${message.text !== '' && message.type !== 'user' ? 'w-full' : ''}`}>
                                <div className={`flex-shrink-0 h-10 w-10 rounded-full ${message.type === 'user' ? 'flex justify-center items-center bg-gray-300' : 'bg-[#0067BC38] p-2'}`}>
                                    {message.type === 'user' ?
                                        <div
                                            className="bg-black/20 text-[#0064BC] px-4 py-2 uppercase  rounded-full font-bold text-lg"
                                        >
                                            {decodedToken.name.slice(0, 1)}
                                        </div> :
                                        <img src="/miporisicon.webp" alt="miporis logo" />
                                    }
                                </div>
                                <div className='w-full'>
                                    <div className={`relative max-w-[520px] px-3 py-5 bg-white text-black rounded-lg ${message.type === 'user' ? ' rounded-br-lg' : ''}`}>
                                        <p className="text-sm">
                                            {(message.files && message.files.length > 0) ?
                                                <>
                                                    {message.files.map((item) => {
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
                                                                <DocxPreview file={item} />
                                                            </div>
                                                        );
                                                    })}


                                                </>
                                                :
                                                <div className="w-full">
                                                    {message.text !== '' ?
                                                        <Markdownn options={{
                                                            overrides: {
                                                                a: { props: { target: '_blank', rel: 'noopener noreferrer' } },
                                                            },
                                                            forceBlock: true,
                                                        }}>
                                                            {message.text}</Markdownn>

                                                        // <Markdown
                                                        //     remarkPlugins={[remarkGfm]}
                                                        // >{message.text}</Markdown>
                                                        :
                                                        <div className='flex space-x-2 justify-center items-center bg-white p-1'>
                                                            <span className='sr-only'>Loading...</span>
                                                            <div className='h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                                                            <div className='h-1.5 w-1.5 bg-gray-400  rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                                                            <div className='h-1.5 w-1.5 bg-gray-400  rounded-full animate-bounce'></div>
                                                        </div>}
                                                </div>

                                            }
                                            <span
                                                className={`absolute inset-y-0  ${message.type === 'user' ? ' right-0 rounded-r-lg' : 'left-0 rounded-l-lg'} w-1 bg-[#0067BC] `}
                                            ></span>
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500 leading-none">{formatTime(message.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filePreviews.length > 0 && (
                    <div className="p-4 space-y-2">
                        {filePreviews.map((file, index) => (
                            <div key={index} className="flex items-center space-x-3">
                                <div className="text-sm text-gray-800">{file.name}</div>
                                <button
                                    onClick={() => removeFile(file.name)}
                                    className="text-xs text-red-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="flex items-end space-x-3 bg-white rounded-lg h-full ">
                        <textarea
                            ref={inputRef}
                            style={{
                                lineHeight: "1.4em",
                                height: "3.5em",
                                resize: "none",
                                padding: "0.5em 1em",
                                scrollbarWidth: "none",
                                marginTop: '4px',
                            }}
                            className="w-full rounded text-sm focus:outline-none"
                            type="text"
                            placeholder="Type a new message here"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === "Enter" && !e.shiftKey && message.trim()) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                } else if (e.key === "Enter" && e.shiftKey) {
                                    e.preventDefault();
                                    setMessage((prev) => prev + "\n");
                                }
                            }}
                        />
                        <div className='h-full flex items-end'>
                            <div className='h-full py-5'>
                                <label htmlFor="file-upload" className='cursor-pointer '>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="23" viewBox="0 0 21 23" fill="none">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M6.94538 2.65599C10.0238 -0.290684 15.0012 -0.290684 18.0795 2.65599C21.1773 5.62119 21.1773 10.4435 18.0795 13.4087L9.76509 21.3675C7.57868 23.4603 4.04741 23.4603 1.861 21.3675C-0.344767 19.2561 -0.344768 15.818 1.861 13.7066L10.0558 5.86239C11.3503 4.62331 13.4354 4.62331 14.7298 5.86239C16.0436 7.11998 16.0436 9.17376 14.7298 10.4314L6.4752 18.3328C6.16218 18.6325 5.66553 18.6216 5.36591 18.3086C5.06628 17.9956 5.07714 17.4989 5.39016 17.1993L13.6448 9.29781C14.3131 8.65808 14.3131 7.63566 13.6448 6.99593C12.9571 6.33767 11.8285 6.33767 11.1409 6.99593L2.94604 14.8401C1.38575 16.3337 1.38575 18.7404 2.94604 20.2339C4.52568 21.746 7.10041 21.746 8.68005 20.2339L16.9945 12.2752C19.4468 9.92785 19.4468 6.13687 16.9945 3.78953C14.5229 1.42367 10.502 1.42367 8.03042 3.78953L1.331 10.2023C1.01799 10.5019 0.521339 10.4911 0.221712 10.1781C-0.0779139 9.86506 -0.0670576 9.36841 0.245961 9.06878L6.94538 2.65599Z" fill="#5F5F5F" />
                                    </svg>
                                </label>
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onClick={() => {
                                        setFiles([]);
                                        setFilePreviews([]);
                                    }}
                                    onChange={handleFileChange}
                                    multiple
                                />

                            </div>
                        </div>
                        <button className={`${message !== '' && !loading ? 'bg-[#0067BC]' : 'bg-[#0067BC]/70'} py-4 px-3 rounded-r-md`}>
                            <div role="status" className='p-1'>
                                {loading ? <div >
                                    <svg aria-hidden="true" className="w-6 h-6 text-white animate-spin fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                    </svg>
                                    <span className="sr-only">Loading...</span>
                                </div> :
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M8.90152 2.26632L16.0816 5.88553C18.2642 6.98568 19.982 7.85152 21.1472 8.67145C22.2982 9.4813 23.1976 10.4415 23.1976 11.8348C23.1976 13.228 22.2982 14.1882 21.1472 14.9981C19.982 15.818 18.2642 16.6838 16.0816 17.784L8.90152 21.4032C7.56748 22.0756 6.52968 22.5987 5.71933 22.9382C4.92637 23.2705 4.21767 23.4886 3.58751 23.4119C2.05907 23.2256 0.743851 22.0514 0.425538 20.3936C0.290626 19.691 0.479272 18.9049 0.75031 18.0884C1.03094 17.243 1.47697 16.1575 2.04519 14.7745L2.06052 14.7373C2.50461 13.6564 2.67552 13.2299 2.76273 12.8045C2.89391 12.1644 2.89391 11.5051 2.76273 10.8651C2.67552 10.4396 2.50461 10.0131 2.06052 8.93225L2.04519 8.89496C1.47697 7.51205 1.03094 6.42653 0.750309 5.58109C0.479271 4.76456 0.290626 3.97855 0.425539 3.27592C0.743853 1.61812 2.05907 0.443859 3.58751 0.257646C4.21767 0.180872 4.92637 0.39905 5.71933 0.731264C6.52968 1.07076 7.56748 1.59388 8.90152 2.26632ZM5.16177 2.40178C4.38261 2.07535 3.98458 2.00327 3.75961 2.03068C2.81714 2.14551 2.13651 2.84541 1.98183 3.651C1.95305 3.80089 1.97314 4.14838 2.24236 4.95943C2.49947 5.734 2.91972 6.75826 3.50655 8.18647C3.5194 8.21776 3.53211 8.24867 3.54467 8.27922C3.93841 9.23718 4.18573 9.83891 4.31424 10.4659C4.49926 11.3686 4.49926 12.3009 4.31424 13.2036C4.18573 13.8306 3.9384 14.4323 3.54466 15.3903C3.53211 15.4208 3.5194 15.4518 3.50655 15.483C2.91972 16.9112 2.49947 17.9355 2.24236 18.7101C1.97314 19.5211 1.95305 19.8686 1.98183 20.0185C2.13651 20.8241 2.81714 21.524 3.75961 21.6388C3.98458 21.6662 4.38261 21.5942 5.16176 21.2677C5.91772 20.951 6.90833 20.4522 8.27711 19.7622L15.3641 16.19C17.6249 15.0504 19.2403 14.2338 20.3006 13.4877C21.3866 12.7236 21.6057 12.2272 21.6057 11.8348C21.6057 11.4424 21.3866 10.9459 20.3006 10.1818C19.2403 9.43574 17.6249 8.61913 15.3641 7.47954L8.27712 3.90727C6.90834 3.21732 5.91772 2.71849 5.16177 2.40178Z" fill="white" />
                                    </svg>
                                }
                            </div>
                        </button>
                    </div>
                </form>
            </div>
        </div>

    );
}

export default Chat;
