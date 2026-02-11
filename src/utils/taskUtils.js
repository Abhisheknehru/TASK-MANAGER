import { v4 as uuidv4 } from 'uuid';

export const CATEGORIES = [
    { value: 'Work', color: 'var(--category-work)', icon: '💼' },
    { value: 'Personal', color: 'var(--category-personal)', icon: '🏠' },
    { value: 'Health', color: 'var(--category-health)', icon: '💪' },
    { value: 'Finance', color: 'var(--category-finance)', icon: '💰' },
    { value: 'Learning', color: 'var(--category-learning)', icon: '📚' },
    { value: 'Other', color: 'var(--category-other)', icon: '📌' },
];

export const PRIORITIES = [
    { value: 'High', color: 'var(--priority-high)', bg: 'var(--priority-high-bg)' },
    { value: 'Medium', color: 'var(--priority-medium)', bg: 'var(--priority-medium-bg)' },
    { value: 'Low', color: 'var(--priority-low)', bg: 'var(--priority-low-bg)' },
];

export const RECURRING_OPTIONS = [
    { value: 'none', label: 'No Repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
];

export const createTask = (data) => ({
    id: uuidv4(),
    title: data.title || '',
    description: data.description || '',
    category: data.category || 'Other',
    priority: data.priority || 'Medium',
    deadline: data.deadline || null,
    status: 'pending',
    createdDate: new Date().toISOString(),
    completedDate: null,
    timeEstimate: data.timeEstimate || 0,
    timeSpent: 0,
    recurring: data.recurring || 'none',
    tags: data.tags || [],
    modifiedDate: new Date().toISOString(),
});

export const sortTasks = (tasks, sortBy = 'deadline') => {
    return [...tasks].sort((a, b) => {
        // Completed tasks at bottom
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;

        const priorityOrder = { High: 0, Medium: 1, Low: 2 };

        switch (sortBy) {
            case 'priority':
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'deadline':
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
            case 'created':
                return new Date(b.createdDate) - new Date(a.createdDate);
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });
};

export const filterTasks = (tasks, filters) => {
    return tasks.filter((task) => {
        if (filters.status && filters.status !== 'all') {
            if (filters.status === 'pending' && task.status !== 'pending') return false;
            if (filters.status === 'completed' && task.status !== 'completed') return false;
        }
        if (filters.priority && filters.priority !== 'all' && task.priority !== filters.priority) return false;
        if (filters.category && filters.category !== 'all' && task.category !== filters.category) return false;
        if (filters.search) {
            const q = filters.search.toLowerCase();
            if (!task.title.toLowerCase().includes(q) && !task.description.toLowerCase().includes(q)) return false;
        }
        return true;
    });
};

export const getTaskStats = (tasks) => {
    const now = new Date();
    const todayStr = now.toDateString();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedToday = tasks.filter(
        (t) => t.status === 'completed' && t.completedDate && new Date(t.completedDate).toDateString() === todayStr
    ).length;

    const completedThisWeek = tasks.filter(
        (t) => t.status === 'completed' && t.completedDate && new Date(t.completedDate) >= startOfWeek
    ).length;

    const completedThisMonth = tasks.filter(
        (t) => t.status === 'completed' && t.completedDate && new Date(t.completedDate) >= startOfMonth
    ).length;

    const totalPending = tasks.filter((t) => t.status === 'pending').length;
    const totalCompleted = tasks.filter((t) => t.status === 'completed').length;
    const overdueTasks = tasks.filter(
        (t) => t.status === 'pending' && t.deadline && new Date(t.deadline) < now
    ).length;

    const categoryBreakdown = {};
    tasks.forEach((t) => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + 1;
    });

    return {
        completedToday,
        completedThisWeek,
        completedThisMonth,
        totalPending,
        totalCompleted,
        totalTasks: tasks.length,
        overdueTasks,
        categoryBreakdown,
    };
};
