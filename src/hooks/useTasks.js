import { useState, useCallback, useEffect, useRef } from 'react';
import storage from '../services/localStorage';
import { createTask } from '../utils/taskUtils';
import { getNextOccurrence } from '../utils/dateUtils';

const useTasks = () => {
    const [tasks, setTasks] = useState(() => storage.getTasks());
    const [isLoading, setIsLoading] = useState(false);
    const tasksRef = useRef(tasks);

    useEffect(() => {
        tasksRef.current = tasks;
        storage.setTasks(tasks);
    }, [tasks]);

    const addTask = useCallback((data) => {
        const task = createTask(data);
        setTasks(prev => [task, ...prev]);

        if (!navigator.onLine) {
            storage.addToSyncQueue({ type: 'add', task });
        }

        return task;
    }, []);

    const updateTask = useCallback((id, updates) => {
        setTasks(prev =>
            prev.map(t =>
                t.id === id ? { ...t, ...updates, modifiedDate: new Date().toISOString() } : t
            )
        );

        if (!navigator.onLine) {
            storage.addToSyncQueue({ type: 'update', taskId: id, updates });
        }
    }, []);

    const deleteTask = useCallback((id) => {
        setTasks(prev => prev.filter(t => t.id !== id));

        if (!navigator.onLine) {
            storage.addToSyncQueue({ type: 'delete', taskId: id });
        }
    }, []);

    const toggleComplete = useCallback((id) => {
        setTasks(prev =>
            prev.map(t => {
                if (t.id !== id) return t;
                const isCompleting = t.status === 'pending';
                const updated = {
                    ...t,
                    status: isCompleting ? 'completed' : 'pending',
                    completedDate: isCompleting ? new Date().toISOString() : null,
                    modifiedDate: new Date().toISOString(),
                };

                // Handle recurring: create next occurrence
                if (isCompleting && t.recurring && t.recurring !== 'none') {
                    const nextDeadline = getNextOccurrence(t);
                    if (nextDeadline) {
                        const recurringTask = createTask({
                            ...t,
                            deadline: nextDeadline,
                        });
                        setTimeout(() => {
                            setTasks(p => [recurringTask, ...p]);
                        }, 0);
                    }
                }

                return updated;
            })
        );
    }, []);

    const updateTimeSpent = useCallback((id, minutes) => {
        updateTask(id, { timeSpent: minutes });
    }, [updateTask]);

    const bulkSetTasks = useCallback((newTasks) => {
        setTasks(newTasks);
    }, []);

    return {
        tasks,
        isLoading,
        setIsLoading,
        addTask,
        updateTask,
        deleteTask,
        toggleComplete,
        updateTimeSpent,
        bulkSetTasks,
        tasksRef,
    };
};

export default useTasks;
