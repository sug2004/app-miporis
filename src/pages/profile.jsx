import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);
    const [error, setError] = useState(null);

    const token = Cookies.get('token');
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true)
                const response = await axios.get(`/api/auth/user-details/${userId}`);
                const userData = response.data;
                setUser(userData);
                if (userData?.priceId) {
                    const subResponse = await axios.get(`/api/plan-name/${userData.priceId}`);
                    setSubscriptionDetails(subResponse.data);
                } else {
                    setSubscriptionDetails({ planName: 'No Active Subscription', pricing: {} });
                }
                setLoading(false);
            } catch (err) {
                setError('Failed to load user data', err);
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId]);

    const handleManageSubscription = async () => {
        try {
            const sessionId = user.sessionId;
            const response = await axios.post('/api/manage-payment', { sessionId });
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (err) {
            alert('Error managing subscription');
        }
    };

    if (loading) {
        return <div>
            <div className="flex items-center justify-center h-[70vh]">
                <div className="relative ">
                    <div className=" h-24 w-24 rounded-full border-t-8 border-b-8 border-blue-900"></div>
                    <div className="absolute top-0 left-0">

                        <div className="   h-24 w-24 rounded-full border-t-8 border-b-8 border-blue-500 animate-spin"></div>
                    </div>
                </div>
            </div>
        </div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="px-12 pt-1">

            <div className="bg-white p-3 shadow-md rounded-lg">
                <div className="flex items-center space-x-2 font-semibold text-gray-900 leading-8">
                    <span className="text-green-500">
                        <svg className="h-5" xmlns="http://www.w3.org/2000/svg" fill="#0167BE" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </span>
                    <span className="tracking-wide">About</span>
                </div>
                <div className="text-gray-700">
                    <div className="grid md:grid-cols-1 text-sm">
                        <div className="grid grid-cols-2">
                            <div className="px-4 py-2 font-semibold">User Name</div>
                            <div className="px-4 py-2">{user && user.userName}</div>
                        </div>
                        {/* <div className="grid grid-cols-2">
                            <div className="px-4 py-2 font-semibold">Gender</div>
                            <div className="px-4 py-2">{user.gender}</div>
                        </div>
                        <div className="grid grid-cols-2">
                            <div className="px-4 py-2 font-semibold">Contact No.</div>
                            <div className="px-4 py-2">{user.contactNo}</div>
                        </div>
                        <div className="grid grid-cols-2">
                            <div className="px-4 py-2 font-semibold">Current Address</div>
                            <div className="px-4 py-2">{user.currentAddress}</div>
                        </div>
                        <div className="grid grid-cols-2">
                            <div className="px-4 py-2 font-semibold">Permanent Address</div>
                            <div className="px-4 py-2">{user.permanentAddress}</div>
                        </div> */}
                        <div className="grid grid-cols-2">
                            <div className="px-4 py-2 font-semibold">Email</div>
                            <div className="px-4 py-2">
                                <a className="text-blue-800" href={`mailto:${user && user.email}`}>{user && user.email}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription Section */}
            <div className="bg-white p-3 shadow-md  mt-6 rounded-lg">
                <div className="flex items-center space-x-2 font-semibold text-gray-900 leading-8">
                    <span className="text-blue-500">
                        <svg className="h-4 rounded-lg" xmlns="http://www.w3.org/2000/svg" fill="#0167BE" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 4a2 2 0 012-2h14a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2V4z" />
                        </svg>
                    </span>
                    <span className="tracking-wide">Subscription</span>
                </div>
                <div className="text-gray-700">
                    <div className="grid grid-cols-2 text-sm">
                        <div className="px-4 py-2 font-semibold">Subscription Plan</div>
                        <div className="px-4 py-2">{subscriptionDetails?.planName || 'N/A'}</div>
                        <div className="px-4 py-2 font-semibold">Price</div>
                        <div className="px-4 py-2">
                            {subscriptionDetails?.pricing?.amount ? `${subscriptionDetails.pricing.amount} ${subscriptionDetails.pricing.currency}` : 'N/A'}
                        </div>
                        <div className="px-4 py-2 font-semibold">Billing Interval</div>
                        <div className="px-4 py-2">{subscriptionDetails?.pricing?.interval || 'N/A'}</div>
                    </div>
                </div>
                <button
                    className="block  text-white bg-red-500 text-sm font-semibold rounded-lg hover:bg-gray-200 hover:text-red-500 focus:outline-none focus:shadow-outline focus:bg-gray-100 hover:shadow-xs px-3 py-2 my-4"
                    onClick={handleManageSubscription}
                >
                    Manage Subscription
                </button>
            </div>
        </div>
    );
};

export default Profile;
