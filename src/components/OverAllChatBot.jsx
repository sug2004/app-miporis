import React, { useRef, useState, useEffect } from 'react';
import Markdown from 'react-markdown'
import Markdownn from 'markdown-to-jsx'
import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

function OverAllChatBot() {
    const [prevMessages, setPrevMessages] = useState([
    ]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null)

    const token = Cookies.get('token');
    if (!token) {
        window.location.replace("https://www.miporis.com/login");
        return null;
    }
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;

    useEffect(() => {
        const chatContainer = document.getElementById('chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, [prevMessages]);

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

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const response = await axios.get('/chat-history', {
                    params: {
                        userId: userId,
                        controlId: "MAINBOT",
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
    }, [userId]);

    const startNewConversation = async () => {
        const nowTime = new Date().toLocaleTimeString();
        setPrevMessages((prevMessages) => [
            ...prevMessages,
            {
                type: 'bot',
                controlId: "MAINBOT",
                text: '',
                time: nowTime,
                userId: userId,
            },
        ]);

        const prompt = "greet and guide me with the analytics you have?";
        try {
            const response = await axios.get('/getsd-data', {
                params: {
                    prompt: prompt,
                    userId: userId,
                },
                withCredentials: true,
            });

            if (response.status !== 200) {
                throw new Error('Failed to fetch conversation');
            }

            const result = response.data;
            const newMessageContent = result.data || '';
            const nowTime = new Date().toLocaleTimeString();

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

        } catch (error) {
            console.error('Error fetching new conversation:', error);
            alert('An error occurred while starting a new conversation. Please try again.');
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        const nowtime = new Date().toLocaleTimeString();
        if (message === '') return
        setMessage('');
        setLoading(true)
        setPrevMessages(prevMessages => [
            ...prevMessages,
            { type: 'user', text: messageView(message), createdAt: nowtime, userId: userId },
            { type: 'bot', text: '', createdAt: nowtime, userId: userId }
        ]);
        const response = await axios.get(`/getsd-data`, {
            params: {
                prompt: messageView(message),
                userId: userId,
            },
            withCredentials: true,
        });

        if (response.status !== 200) {
            throw new Error('Failed to fetch conversation');
        }

        const result = response.data;
        const nowTime = new Date().toLocaleTimeString();
        const newMessageContent = result.data || '';

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
        setLoading(false)
    };

    const messageView = (text) => {
        return text.replace(/\n/g, '\n\n');
    }

    return (
        <div className="flex flex-col flex-grow w-full h-full bg-[#D9D9D9] rounded-lg overflow-hidden ">
            <div id="chat-container" className="flex flex-col flex-grow p-4 overflow-auto space-y-4">
                {prevMessages.map((message, index) => (
                    <div key={index} className={`flex w-full mt-2 space-x-3 ${message.type === 'user' ? 'ml-auto justify-end' : ''}`}>
                        <div className={` ${message.type === 'user' ? 'flex  flex-row-reverse gap-2' : 'flex flex-row gap-2'} ${message.text !== '' && message.type !== 'user' ? 'w-full' : ''} `}>
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
                                        <>
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
                                        </>
                                        <span
                                            className={`absolute inset-y-0  ${message.type === 'user' ? ' right-0 rounded-r-lg' : 'left-0 rounded-l-lg'} w-1 bg-[#0067BC] `}
                                        ></span>
                                    </p>
                                </div>
                                <span className="text-xs text-gray-500 leading-none">{message.time}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="p-4">
                <div className="flex items-end space-x-3 bg-white rounded-lg">
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
                    <button
                        className={`h-full ${message !== "" ? "bg-[#0067BC]" : "bg-[#0067BC]/70"
                            } py-4 px-4 rounded-r-md`}

                    >
                        {loading ? (
                            <div role="status">
                                <svg
                                    aria-hidden="true"
                                    className="w-6 h-6 text-white animate-spin"
                                    viewBox="0 0 100 101"
                                    fill="none"
                                >
                                    <path
                                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                        fill="currentFill"
                                    />
                                </svg>
                            </div>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M8.90152 2.26632L16.0816 5.88553C18.2642 6.98568 19.982 7.85152 21.1472 8.67145C22.2982 9.4813 23.1976 10.4415 23.1976 11.8348C23.1976 13.228 22.2982 14.1882 21.1472 14.9981C19.982 15.818 18.2642 16.6838 16.0816 17.784L8.90152 21.4032C7.56748 22.0756 6.52968 22.5987 5.71933 22.9382C4.92637 23.2705 4.21767 23.4886 3.58751 23.4119C2.05907 23.2256 0.743851 22.0514 0.425538 20.3936C0.290626 19.691 0.479272 18.9049 0.75031 18.0884C1.03094 17.243 1.47697 16.1575 2.04519 14.7745L2.06052 14.7373C2.50461 13.6564 2.67552 13.2299 2.76273 12.8045C2.89391 12.1644 2.89391 11.5051 2.76273 10.8651C2.67552 10.4396 2.50461 10.0131 2.06052 8.93225L2.04519 8.89496C1.47697 7.51205 1.03094 6.42653 0.750309 5.58109C0.479271 4.76456 0.290626 3.97855 0.425539 3.27592C0.743853 1.61812 2.05907 0.443859 3.58751 0.257646C4.21767 0.180872 4.92637 0.39905 5.71933 0.731264C6.52968 1.07076 7.56748 1.59388 8.90152 2.26632ZM5.16177 2.40178C4.38261 2.07535 3.98458 2.00327 3.75961 2.03068C2.81714 2.14551 2.13651 2.84541 1.98183 3.651C1.95305 3.80089 1.97314 4.14838 2.24236 4.95943C2.49947 5.734 2.91972 6.75826 3.50655 8.18647C3.5194 8.21776 3.53211 8.24867 3.54467 8.27922C3.93841 9.23718 4.18573 9.83891 4.31424 10.4659C4.49926 11.3686 4.49926 12.3009 4.31424 13.2036C4.18573 13.8306 3.9384 14.4323 3.54466 15.3903C3.53211 15.4208 3.5194 15.4518 3.50655 15.483C2.91972 16.9112 2.49947 17.9355 2.24236 18.7101C1.97314 19.5211 1.95305 19.8686 1.98183 20.0185C2.13651 20.8241 2.81714 21.524 3.75961 21.6388C3.98458 21.6662 4.38261 21.5942 5.16176 21.2677C5.91772 20.951 6.90833 20.4522 8.27711 19.7622L15.3641 16.19C17.6249 15.0504 19.2403 14.2338 20.3006 13.4877C21.3866 12.7236 21.6057 12.2272 21.6057 11.8348C21.6057 11.4424 21.3866 10.9459 20.3006 10.1818C19.2403 9.43574 17.6249 8.61913 15.3641 7.47954L8.27712 3.90727C6.90834 3.21732 5.91772 2.71849 5.16177 2.40178Z"
                                    fill="white"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </form>

        </div>
    );
}

export default OverAllChatBot;
