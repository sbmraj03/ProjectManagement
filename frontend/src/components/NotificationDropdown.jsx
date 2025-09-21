/**
 * NOTIFICATION DROPDOWN COMPONENT
 * Displays real-time notifications with Socket.IO integration
 * Features: Real-time updates, invitation handling, responsive design
 */
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function NotificationDropdown({ isOpen, onClose, onNotificationUpdate }) {
    const { token } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${apiUrl}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            await fetch(`${apiUrl}/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setNotifications(prev => 
                prev.map(notif => 
                    notif._id === notificationId 
                        ? { ...notif, isRead: true }
                        : notif
                )
            );
            // Notify parent component to refresh unread count
            if (onNotificationUpdate) {
                onNotificationUpdate();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            await fetch(`${apiUrl}/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remove from local state
            setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
            // Notify parent component to refresh unread count
            if (onNotificationUpdate) {
                onNotificationUpdate();
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleInvitationResponse = async (notificationId, action) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${apiUrl}/projects/invitation/${notificationId}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ action })
            });
            
            if (res.ok) {
                // Remove the notification from the list
                setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
                // Notify parent component to refresh unread count
                if (onNotificationUpdate) {
                    onNotificationUpdate();
                }
            }
        } catch (error) {
            console.error('Error responding to invitation:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No notifications</div>
                ) : (
                    notifications.map((notification) => (
                        <div 
                            key={notification._id} 
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                                !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-800">
                                        {notification.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </p>
                                    
                                    {/* Invitation Actions */}
                                    {notification.type === 'invitation' && 
                                     notification.invitationStatus === 'pending' && (
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => handleInvitationResponse(notification._id, 'accept')}
                                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleInvitationResponse(notification._id, 'decline')}
                                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex gap-1">
                                    {!notification.isRead && (
                                        <button
                                            onClick={() => markAsRead(notification._id)}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                            title="Mark as read"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                    )}
                                    {notification.isRead && (
                                        <button
                                            onClick={() => deleteNotification(notification._id)}
                                            className="p-1 text-gray-400 hover:text-red-600"
                                            title="Delete notification"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={onClose}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
