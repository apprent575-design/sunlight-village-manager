
import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Shield, Smartphone, RefreshCw, Loader2 } from 'lucide-react';
import { subHours, formatDistance } from 'date-fns';
import { User } from '../types';

interface SecurityAlert {
    userId: string;
    userName: string;
    userEmail: string;
    deviceCount: number;
    lastActive: string;
}

export const AdminNotifications = () => {
    const { t, state, isRTL, language } = useApp();
    const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSecurityAlerts = async () => {
        setIsLoading(true);
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        try {
            // Logic: Get active sessions in last 24 hours
            const cutoffTime = subHours(new Date(), 24).toISOString();
            
            // Note: In a real backend we would use a GROUP BY query. 
            // Here we fetch recent logs and process client side for simplicity.
            const { data: recentLogs } = await supabase
                .from('session_logs')
                .select('user_id, device_id, last_active_at')
                .gt('last_active_at', cutoffTime);

            if (recentLogs) {
                // Group by User
                const userDevices = new Map<string, Set<string>>();
                const lastSeen = new Map<string, string>();

                recentLogs.forEach(log => {
                    if (!userDevices.has(log.user_id)) {
                        userDevices.set(log.user_id, new Set());
                    }
                    userDevices.get(log.user_id)?.add(log.device_id || 'unknown');
                    
                    // Keep track of latest time
                    const currentLast = lastSeen.get(log.user_id);
                    if (!currentLast || new Date(log.last_active_at) > new Date(currentLast)) {
                        lastSeen.set(log.user_id, log.last_active_at);
                    }
                });

                const newAlerts: SecurityAlert[] = [];
                
                userDevices.forEach((devices, userId) => {
                    // Rule: If devices > 1, create alert
                    if (devices.size > 1) {
                        const user = state.allUsers.find(u => u.id === userId);
                        if (user) {
                            newAlerts.push({
                                userId: user.id,
                                userName: user.full_name || 'Unknown',
                                userEmail: user.email,
                                deviceCount: devices.size,
                                lastActive: lastSeen.get(userId) || new Date().toISOString()
                            });
                        }
                    }
                });

                setAlerts(newAlerts);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSecurityAlerts();
    }, [state.allUsers]); // Re-check when users change

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('notifications')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">System security & activity alerts</p>
                </div>
                <button 
                    onClick={fetchSecurityAlerts} 
                    className="p-2 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-gray-600 dark:text-gray-300"
                    title="Refresh"
                >
                    {isLoading ? <Loader2 size={20} className="animate-spin"/> : <RefreshCw size={20} />}
                </button>
            </div>

            <div className="grid gap-4">
                {alerts.length === 0 && !isLoading && (
                    <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-[24px] border border-gray-100 dark:border-slate-700">
                        <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">No Security Issues</h3>
                        <p className="text-gray-500 dark:text-gray-400">Everything looks good. No multi-device conflicts detected.</p>
                    </div>
                )}

                {alerts.map((alert) => (
                    <div key={alert.userId} className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border-l-4 border-l-amber-500 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-bottom-2">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl shrink-0">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('multiDeviceAlert')}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{t('multiDeviceDesc')}</p>
                                <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-slate-900/50 w-fit px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="font-bold text-gray-700 dark:text-gray-200">{alert.userName}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-gray-500">{alert.userEmail}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 w-full md:w-auto mt-2 md:mt-0 pl-14 md:pl-0">
                            <div className="flex items-center gap-2 text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/10 px-3 py-1 rounded-lg">
                                <Smartphone size={16} />
                                <span>{alert.deviceCount} {t('devices')}</span>
                            </div>
                            <div className="text-xs text-gray-400 font-medium">
                                Active {formatDistance(new Date(alert.lastActive), new Date(), { addSuffix: true })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
