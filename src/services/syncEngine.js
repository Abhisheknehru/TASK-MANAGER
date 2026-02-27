/* Sync Engine - Simple sync between local and Google Sheets via Apps Script */
import { fetchTasks, syncTasks, isConnected } from './sheetsApi';
import storage from './localStorage';

// Merge local and remote tasks, latest modifiedDate wins
export const mergeTasks = (localTasks, remoteTasks) => {
    const merged = new Map();

    // Add all local tasks
    localTasks.forEach(t => {
        merged.set(t.id, { ...t });
    });

    // Merge remote tasks
    if (remoteTasks) {
        remoteTasks.forEach(rt => {
            const local = merged.get(rt.id);
            if (!local) {
                // New task from remote
                merged.set(rt.id, { ...rt });
            } else {
                // Conflict: pick latest modifiedDate
                const localMod = new Date(local.modifiedDate || local.createdDate);
                const remoteMod = new Date(rt.modifiedDate || rt.createdDate);
                if (remoteMod > localMod) {
                    merged.set(rt.id, { ...rt });
                }
            }
        });
    }

    return Array.from(merged.values());
};

// Run a full sync cycle
export const runSync = async (localTasks) => {
    if (!isConnected() || !navigator.onLine) {
        return { tasks: localTasks, synced: false };
    }

    try {
        // 1. Fetch remote
        const remoteTasks = await fetchTasks();

        // 2. Merge
        const merged = mergeTasks(localTasks, remoteTasks || []);

        // 3. Push merged back to Sheets
        await syncTasks(merged);

        // 4. Process offline queue
        const queue = storage.getSyncQueue();
        if (queue.length > 0) {
            storage.clearSyncQueue();
        }

        return { tasks: merged, synced: true };
    } catch (e) {
        console.error('Sync failed:', e);
        return { tasks: localTasks, synced: false };
    }
};

// Listen for online events
export const setupOnlineSync = (syncCallback) => {
    window.addEventListener('online', () => {
        console.log('Back online, triggering sync...');
        syncCallback();
    });
};
