import { useState, useCallback, useEffect, useRef } from 'react';
import { isConnected, setScriptUrl, clearScriptUrl, testConnection, getSheetUrl, exportReport } from '../services/sheetsApi';
import { runSync, setupOnlineSync } from '../services/syncEngine';

const useGoogleSheets = (tasks, bulkSetTasks) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => isConnected());
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState(null);
    const [syncError, setSyncError] = useState(null);
    const tasksRef = useRef(tasks);

    useEffect(() => {
        tasksRef.current = tasks;
    }, [tasks]);

    // Check connection status on mount
    useEffect(() => {
        setIsAuthenticated(isConnected());
    }, []);

    // Setup online sync listener
    useEffect(() => {
        setupOnlineSync(() => {
            if (isConnected()) {
                performSync();
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const performSync = useCallback(async () => {
        if (isSyncing || !isConnected()) return;
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

    const handleConnect = useCallback(async (scriptUrl) => {
        try {
            setScriptUrl(scriptUrl);
            const result = await testConnection();
            setIsAuthenticated(true);
            // Auto sync after connecting
            setTimeout(performSync, 500);
            return result;
        } catch (e) {
            clearScriptUrl();
            setIsAuthenticated(false);
            throw e;
        }
    }, [performSync]);

    const handleDisconnect = useCallback(() => {
        clearScriptUrl();
        setIsAuthenticated(false);
        setLastSynced(null);
    }, []);

    const handleExportReport = useCallback(async (period = 'weekly') => {
        if (!isConnected()) return false;

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
    }, [tasks]);

    return {
        isAuthenticated,
        isSyncing,
        lastSynced,
        syncError,
        handleSignIn: handleConnect,  // kept same name for compatibility
        handleSignOut: handleDisconnect,
        performSync,
        handleExportReport,
    };
};

export default useGoogleSheets;
