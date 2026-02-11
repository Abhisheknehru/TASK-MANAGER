import { useState, useCallback, useEffect, useRef } from 'react';
import { initGoogleAuth, signIn, signOut, isSignedIn, restoreSession, getClientId } from '../services/googleAuth';
import { runSync, setupOnlineSync } from '../services/syncEngine';
import { exportReport } from '../services/sheetsApi';

const useGoogleSheets = (tasks, bulkSetTasks) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState(null);
    const [syncError, setSyncError] = useState(null);
    const tasksRef = useRef(tasks);

    useEffect(() => {
        tasksRef.current = tasks;
    }, [tasks]);

    // Initialize on mount
    useEffect(() => {
        const init = async () => {
            if (!getClientId()) return;
            await initGoogleAuth();
            const restored = await restoreSession();
            if (restored && isSignedIn()) {
                setIsAuthenticated(true);
            }
        };
        init();
    }, []);

    // Setup online sync listener
    useEffect(() => {
        setupOnlineSync(() => {
            performSync();
        });
    }, []);

    const performSync = useCallback(async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        setSyncError(null);

        try {
            const result = await runSync(tasksRef.current);
            if (result.synced) {
                bulkSetTasks(result.tasks);
                setLastSynced(new Date().toISOString());
            }
        } catch (e) {
            setSyncError(e.message);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, bulkSetTasks]);

    const handleSignIn = useCallback(async () => {
        try {
            await initGoogleAuth();
            await signIn();
            setIsAuthenticated(true);
            // Auto sync after login
            setTimeout(performSync, 500);
        } catch (e) {
            setSyncError(e.message || 'Sign in failed');
        }
    }, [performSync]);

    const handleSignOut = useCallback(() => {
        signOut();
        setIsAuthenticated(false);
        setLastSynced(null);
    }, []);

    const handleExportReport = useCallback(async (period = 'weekly') => {
        if (!isAuthenticated) return false;

        const now = new Date();
        const title = `${period === 'weekly' ? 'Weekly' : 'Monthly'} Report - ${now.toLocaleDateString()}`;

        const startDate = new Date(now);
        if (period === 'weekly') {
            startDate.setDate(now.getDate() - 7);
        } else {
            startDate.setMonth(now.getMonth() - 1);
        }

        const filteredTasks = tasks.filter(t => {
            const d = new Date(t.completedDate || t.createdDate);
            return d >= startDate;
        });

        const reportData = [
            ['Task Manager Report', '', '', ''],
            [`Period: ${period === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}`, '', '', ''],
            [`Generated: ${now.toLocaleString()}`, '', '', ''],
            ['', '', '', ''],
            ['Title', 'Status', 'Priority', 'Category', 'Deadline', 'Time Spent (min)'],
            ...filteredTasks.map(t => [
                t.title,
                t.status,
                t.priority,
                t.category,
                t.deadline ? new Date(t.deadline).toLocaleString() : 'N/A',
                String(t.timeSpent || 0),
            ]),
            ['', '', '', ''],
            ['Summary', '', '', ''],
            [`Total Tasks: ${filteredTasks.length}`, '', '', ''],
            [`Completed: ${filteredTasks.filter(t => t.status === 'completed').length}`, '', '', ''],
            [`Pending: ${filteredTasks.filter(t => t.status === 'pending').length}`, '', '', ''],
        ];

        return await exportReport(reportData, title);
    }, [isAuthenticated, tasks]);

    return {
        isAuthenticated,
        isSyncing,
        lastSynced,
        syncError,
        handleSignIn,
        handleSignOut,
        performSync,
        handleExportReport,
    };
};

export default useGoogleSheets;
