import React, { useState, useEffect } from "react";
import { 
    Bell, Check, X, Calendar, Zap, Trash2, 
    ExternalLink, CheckCheck, Trophy
} from "lucide-react";
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from "@/components/ui/pop-over";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notificationApi } from "@/services/api";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : "http://localhost:5000";

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'match_scheduled' | 'match_live' | 'match_completed' | 'system';
    relatedId?: string;
    isRead: boolean;
    createdAt: string;
}

const NotificationPopover = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            const res = await notificationApi.getAll() as any;
            if (res.success) {
                setNotifications(res.data);
                setUnreadCount(res.data.filter((n: Notification) => !n.isRead).length);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetchNotifications();

        // Socket setup
        const socket = io(API_BASE, {
            auth: { token }
        });

        socket.on("connect", () => {
            console.log("Notification socket connected");
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err.message);
            // We don't want to spam toasts for every retry, but once is helpful
            if (isOpen) {
                toast.error("Real-time notifications unavailable", {
                    description: "Please check your internet connection or login again."
                });
            }
        });

        socket.on("new_notification", (notification: Notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Enhanced Real-time Toast
            const isMilestone = notification.type === 'system' && (notification.title.includes('Century') || notification.title.includes('Half'));
            
            toast.info(notification.title, {
                description: (
                    <div className="flex flex-col gap-1">
                        <p>{notification.message}</p>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Just now • Tap to view match</span>
                    </div>
                ),
                duration: isMilestone ? 8000 : 5000,
                icon: isMilestone ? <Trophy className="w-5 h-5 text-yellow-500" /> : <Zap className="w-5 h-5 text-blue-500" />,
                action: {
                    label: "OPEN MATCH",
                    onClick: () => handleNotificationClick(notification)
                }
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };
    const handleDelete = async (id: string) => {
        try {
            await (notificationApi as any).delete(id);
            const deletedNotification = notifications.find(n => n._id === id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (deletedNotification && !deletedNotification.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            toast.success("Notification removed");
        } catch (err) {
            console.error("Failed to delete notification", err);
            toast.error("Failed to delete notification");
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            handleMarkAsRead(notification._id);
        }

        if (notification.type === 'match_live' || notification.type === 'match_scheduled' || notification.type === 'system') {
            navigate(`/match/${notification.relatedId}`);
        }
        
        setIsOpen(false);
    };

    const getTypeIcon = (type: string, title: string = "") => {
        const isMilestone = type === 'system' && (title.includes('Century') || title.includes('Half') || title.includes('runs'));
        
        switch (type) {
            case 'match_scheduled': 
                return <div className="p-1.5 bg-blue-500/10 rounded-lg"><Calendar className="w-4 h-4 text-blue-400" /></div>;
            case 'match_live': 
                return <div className="p-1.5 bg-red-500/10 rounded-lg relative">
                    <Zap className="w-4 h-4 text-red-500 animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                </div>;
            case 'match_completed': 
                return <div className="p-1.5 bg-green-500/10 rounded-lg"><Check className="w-4 h-4 text-green-500" /></div>;
            case 'system': 
                return isMilestone ? (
                    <div className="p-1.5 bg-yellow-500/10 rounded-lg animate-bounce">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                    </div>
                ) : (
                    <div className="p-1.5 bg-slate-500/10 rounded-lg"><Bell className="w-4 h-4 text-slate-400" /></div>
                );
            default: 
                return <div className="p-1.5 bg-slate-500/10 rounded-lg"><Bell className="w-4 h-4 text-slate-400" /></div>;
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-slate-800/50 rounded-full transition-all">
                    <Bell className="w-5 h-5 text-slate-400" />
                    {unreadCount > 0 && (
                        <Badge 
                            className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-red-500 hover:bg-red-600 text-[10px] font-bold border-2 border-slate-950 flex items-center justify-center animate-in zoom-in"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 md:w-96 p-0 bg-slate-900 border-slate-800 shadow-2xl rounded-xl" align="end" sideOffset={8}>
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-500" />
                        <h3 className="font-bold text-white">Notifications</h3>
                    </div>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleMarkAllAsRead}
                            className="text-[11px] h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <CheckCheck className="w-3 h-3 mr-1" /> Mark all read
                        </Button>
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
                                <Bell className="w-6 h-6 text-slate-600" />
                            </div>
                            <p className="text-slate-400 text-sm font-medium">No notifications yet</p>
                            <p className="text-slate-500 text-xs mt-1">When matches start or are scheduled, you'll see them here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <div 
                                    key={notification._id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`group flex gap-3 p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer relative ${!notification.isRead ? 'bg-blue-500/5' : ''}`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getTypeIcon(notification.type, notification.title)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-sm font-bold truncate ${!notification.isRead ? 'text-white' : 'text-slate-300'}`}>
                                                {notification.title}
                                            </p>
                                            {!notification.isRead && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-slate-500 font-medium">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </span>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="w-6 h-6 rounded-full text-slate-500 hover:text-white"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(notification._id);
                                                    }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                                {(notification.type === 'match_live' || notification.type === 'match_scheduled' || notification.type === 'system') && (
                                                    <ExternalLink className="w-3 h-3 text-blue-500" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-slate-800 text-center">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs text-slate-400 hover:text-white rounded-lg h-8"
                        onClick={() => {
                            navigate('/preferences');
                            setIsOpen(false);
                        }}
                    >
                        Notification Settings
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationPopover;
