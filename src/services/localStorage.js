const STORAGE_KEYS = {
    TASKS: 'taskmanager_tasks',
    THEME: 'taskmanager_theme',
    CUSTOM_HUE: 'taskmanager_custom_hue',
    CUSTOM_SAT: 'taskmanager_custom_sat',
    STREAK: 'taskmanager_streak',
    SETTINGS: 'taskmanager_settings',
    SYNC_QUEUE: 'taskmanager_sync_queue',
    SHEET_ID: 'taskmanager_sheet_id',
    GOOGLE_TOKEN: 'taskmanager_google_token',
    BADGES: 'taskmanager_badges',
    DAILY_GOALS: 'taskmanager_daily_goals',
};

export const storage = {
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('LocalStorage write failed:', e);
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    // Task-specific methods
    getTasks() {
        return this.get(STORAGE_KEYS.TASKS) || [];
    },

    setTasks(tasks) {
        this.set(STORAGE_KEYS.TASKS, tasks);
    },

    getTheme() {
        return this.get(STORAGE_KEYS.THEME) || 'dark';
    },

    setTheme(theme) {
        this.set(STORAGE_KEYS.THEME, theme);
    },

    getCustomColors() {
        return {
            hue: this.get(STORAGE_KEYS.CUSTOM_HUE) || 250,
            sat: this.get(STORAGE_KEYS.CUSTOM_SAT) || 70,
        };
    },

    setCustomColors(hue, sat) {
        this.set(STORAGE_KEYS.CUSTOM_HUE, hue);
        this.set(STORAGE_KEYS.CUSTOM_SAT, sat);
    },

    getStreak() {
        return this.get(STORAGE_KEYS.STREAK) || { completionDates: {}, currentStreak: 0, longestStreak: 0 };
    },

    setStreak(streak) {
        this.set(STORAGE_KEYS.STREAK, streak);
    },

    getBadges() {
        return this.get(STORAGE_KEYS.BADGES) || [];
    },

    setBadges(badges) {
        this.set(STORAGE_KEYS.BADGES, badges);
    },

    getSettings() {
        return this.get(STORAGE_KEYS.SETTINGS) || { dailyGoal: 5, weeklyGoal: 25 };
    },

    setSettings(settings) {
        this.set(STORAGE_KEYS.SETTINGS, settings);
    },

    // Offline sync queue
    getSyncQueue() {
        return this.get(STORAGE_KEYS.SYNC_QUEUE) || [];
    },

    addToSyncQueue(action) {
        const queue = this.getSyncQueue();
        queue.push({ ...action, timestamp: new Date().toISOString() });
        this.set(STORAGE_KEYS.SYNC_QUEUE, queue);
    },

    clearSyncQueue() {
        this.set(STORAGE_KEYS.SYNC_QUEUE, []);
    },

    getSheetId() {
        return this.get(STORAGE_KEYS.SHEET_ID);
    },

    setSheetId(id) {
        this.set(STORAGE_KEYS.SHEET_ID, id);
    },

    getGoogleToken() {
        return this.get(STORAGE_KEYS.GOOGLE_TOKEN);
    },

    setGoogleToken(token) {
        this.set(STORAGE_KEYS.GOOGLE_TOKEN, token);
    },

    removeGoogleToken() {
        this.remove(STORAGE_KEYS.GOOGLE_TOKEN);
    },
};

export default storage;
