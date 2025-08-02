import React, { useState } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');

    const token = Cookies.get('token');
    const decodedToken = jwtDecode(token);

    const [isMinLengthValid, setIsMinLengthValid] = useState(false);
    const [isNumberValid, setIsNumberValid] = useState(false);
    const [isSpecialCharValid, setIsSpecialCharValid] = useState(false);

    const handlePasswordChange = async () => {
        try {
            if (currentPassword === '' || newPassword === '') {
                setErrorMessage('Old password or new password cannot be empty');
                return;
            }

            if (currentPassword === newPassword) {
                alert('The new password must be different from the current one.');
                return;
            }

            if (!isMinLengthValid || !isNumberValid || !isSpecialCharValid) {
                alert('New password is not valid. Please meet all requirements.');
                return;
            }

            const response = await axios.post(
                '/api/auth/change-password',
                { oldPassword: currentPassword, newPassword, userId: decodedToken.id }
            );

            setSuccessMessage(response.data.message);
            setErrorMessage('');
            setCurrentPassword('');
            setNewPassword('');
        } catch (error) {
            setSuccessMessage('');
            setErrorMessage(error.response?.data?.message || 'Error updating password');
        }
    };

    const validateCurrentPassword = (password) => {
        setIsMinLengthValid(password.length >= 8);
        setIsNumberValid(/\d/.test(password));
        setIsSpecialCharValid(/[!@#$%^&*(),.?":{}|<>]/.test(password));
    };

    const handleNewtPasswordChange = (e) => {
        const password = e.target.value;
        setNewPassword(password);
        validateCurrentPassword(password);
    };

    const handleDeleteAccount = async () => {
        try {
            if (confirmationText.toLowerCase() !== 'delete') {
                alert('Please type "delete" to confirm the action.');
                return;
            }

            const response = await axios.delete('/api/delete-account', {
                params: { userId: decodedToken.id }
            });

            if (response.data.success) {
                alert(response.data.message);
                window.location.replace("https://www.miporis.com/session/logout");
            } else {
                alert(response.data.error || 'Failed to delete account.');
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Error deleting account');
        }
    };


    return (
        <div>
            <div className="col-span-8 overflow-hidden rounded-xl sm:bg-gray-50 sm:px-8 sm:shadow">
                {/* Account settings section */}
                <div className="pt-4">
                    <h1 className="py-2 text-2xl font-semibold">Account settings</h1>
                    <p className="text-slate-600">
                        Manage your account preferences, update your email or password, and customize your experience.
                    </p>
                </div>
                <hr className="mt-4 mb-8" />


                {/* Password change section */}
                <p className="py-2 text-xl font-semibold">Password</p>
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <label>
                        <span className="text-sm text-gray-500">New Password</span>
                        <div className="relative flex overflow-hidden rounded-md border-2 transition focus-within:border-blue-600">
                            <input
                                type="password"
                                value={newPassword}
                                onChange={handleNewtPasswordChange}
                                className="w-full flex-shrink appearance-none border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 focus:outline-none"
                                placeholder="New Password"
                            />
                        </div>
                        <div className="text-sm mt-4">
                            <p style={{ color: isMinLengthValid ? 'green' : 'red' }}>Minimum 8 characters</p>
                            <p style={{ color: isNumberValid ? 'green' : 'red' }}>At least 1 number</p>
                            <p style={{ color: isSpecialCharValid ? 'green' : 'red' }}>At least 1 special character</p>
                        </div>
                    </label>
                    <label>
                        <span className="text-sm text-gray-500">Old Password</span>
                        <div className="relative flex overflow-hidden rounded-md border-2 transition focus-within:border-blue-600">
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full flex-shrink appearance-none border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 focus:outline-none"
                                placeholder="Current Password"
                            />
                        </div>
                    </label>
                </div>
                <button
                    onClick={handlePasswordChange}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
                >
                    Change Password
                </button>
                {successMessage && (
                    <p className="mt-2 text-sm font-semibold text-green-600">{successMessage}</p>
                )}
                {errorMessage && (
                    <p className="mt-2 text-sm font-semibold text-red-600">{errorMessage}</p>
                )}

                <hr className="mt-4 mb-8" />

                {/* Account deletion section */}
                <div className="mb-10">
                    <p className="py-2 text-xl font-semibold">Delete Account</p>
                    <p className="inline-flex items-center rounded-full bg-rose-100 px-4 py-1 text-rose-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="mr-2 h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Proceed with caution
                    </p>
                    <p className="mt-2">
                        Deleting your account means you won't be able to recover it. There will be no refund, and all your data will be permanently lost.
                    </p>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="ml-auto text-sm font-semibold text-rose-600 underline decoration-2"
                    >
                        Continue with deletion
                    </button>
                </div>
            </div>

            {/* Delete Account Confirmation Popup */}
            {isOpen && (
                <div className="absolute inset-0 flex justify-center items-center bg-gray-900 bg-opacity-60 z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                        <h3 className="text-xl font-semibold text-gray-800">Confirm Deletion</h3>
                        <p className="text-gray-600 mt-4">
                            Deleting your account means you won't be able to recover it. There will be no refund, and all data will be permanently lost.<br /><br />
                            Type <bold className='font-semibold text-black'>delete</bold> to confirm
                        </p>
                        <input
                            type="text"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            placeholder="Type 'delete' to confirm"
                            className="mt-4 p-2 border rounded"
                        />
                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SettingsPage;
