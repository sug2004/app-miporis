import { useContext, useEffect, useState } from 'react';
import { AppContext } from './context/AppContext';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Chatbot from './pages/chatbot';
import History from './pages/history';
import Profile from './pages/profile';
import Settings from './pages/settings';
import CtrlFmwk from './pages/CtrlFmwk';
import ComplaintList from './pages/complaints';
import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { ComplianceDashboard } from './components/dashboard/ComplianceDashboard';
import { SaaSHeader } from './components/layout/SaaSHeader';

function App() {
  const location = useLocation();
  const { setControlData, routeChange } = useContext(AppContext);
  const [subscriptionValid, setSubscriptionValid] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const token = Cookies.get('token');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      Cookies.set('token', token, { secure: true, sameSite: 'Strict', expires: 5 });
      // Remove token from URL for security
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const decodedToken = jwtDecode(token);

  useEffect(() => {
    if (decodedToken && decodedToken.id && decodedToken.id !== '') {
      axios.post('/api/auth/subscription/validity', { userId: decodedToken.id })
        .then((response) => {
          const { isValid } = response.data;
          if (isValid) {
            setSubscriptionValid(true);
            return axios.get('/get-all-data', { params: { userId: decodedToken.id } });
          } else {
            console.warn('Subscription is not valid or expired.');
            setSubscriptionValid(false);
            setShowMessage(true);
            setTimeout(() => {
              window.location.replace('https://www.miporis.com/pricing');
            }, 5000);
            return null;
          }
        })
        .then((dataResponse) => {
          if (dataResponse) {
            setControlData(dataResponse.data.data);
          }
        })
        .catch((error) => {
          console.error('Error during API requests:', error);
        });
    }
  }, []);

  return (
    <>
      {/* Main Application Content */}
      {subscriptionValid && (
        <div className="flex flex-col h-screen bg-[#EFEFEF] overflow-hidden">
          {/* SaaSHeader for all routes */}
          <SaaSHeader />
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<ComplianceDashboard />} />
              <Route path="/home" element={<Home />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/home/:compliant_type" element={<CtrlFmwk />} />
              <Route path="/home/:compliant_type/compliant list" element={<ComplaintList />} />
            </Routes>
          </main>
        </div>
      )}

      {/* Subscription Invalid Overlay */}
      {!subscriptionValid && showMessage && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-[#FFF5E1] z-50 p-4"
          role="dialog"
          aria-labelledby="subscription-error-title"
          aria-describedby="subscription-error-description"
        >
          <div className="bg-red-500 px-6 py-8 rounded-xl max-w-md w-full shadow-2xl text-center">
            <h2 
              id="subscription-error-title"
              className="text-white text-lg font-bold mb-4 leading-tight"
            >
              Subscription Required
            </h2>
            <p 
              id="subscription-error-description"
              className="text-white text-sm font-medium mb-6 leading-relaxed"
            >
              Your subscription is not valid or has expired.
            </p>
            <div className="flex justify-center">
              <div className="text-white text-sm font-medium">
                Redirecting in 5 seconds...
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
