export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (date) => {
    if (!date) return '';
    return `${formatDate(date)} ${formatTime(date)}`;
};

export const formatRelativeTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const d = new Date(date);
    const diff = d - now;
    const absDiff = Math.abs(diff);

    const minutes = Math.floor(absDiff / 60000);
    const hours = Math.floor(absDiff / 3600000);
    const days = Math.floor(absDiff / 86400000);

    if (diff < 0) {
        if (minutes < 60) return `${minutes}m overdue`;
        if (hours < 24) return `${hours}h overdue`;
        return `${days}d overdue`;
    }
    if (minutes < 60) return `${minutes}m left`;
    if (hours < 24) return `${hours}h left`;
    return `${days}d left`;
};

export const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
};

export const isToday = (date) => {
    const d = new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
};

export const isThisWeek = (date) => {
    const d = new Date(date);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return d >= startOfWeek && d < endOfWeek;
};

export const isThisMonth = (date) => {
    const d = new Date(date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

export const getDateKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
};

export const toInputDatetime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
};

export const getNextOccurrence = (task) => {
    const now = new Date();
    const deadline = new Date(task.deadline);
    if (!task.recurring || task.recurring === 'none') return null;

    const next = new Date(deadline);
    while (next <= now) {
        if (task.recurring === 'daily') next.setDate(next.getDate() + 1);
        else if (task.recurring === 'weekly') next.setDate(next.getDate() + 7);
        else if (task.recurring === 'monthly') next.setMonth(next.getMonth() + 1);
    }
    return next.toISOString();
};
