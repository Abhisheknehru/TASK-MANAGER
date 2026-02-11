import { useState, useCallback, useEffect } from 'react';
import storage from '../services/localStorage';
import { getDateKey } from '../utils/dateUtils';

const BADGE_DEFINITIONS = [
    { id: 'streak_7', name: '🔥 Week Warrior', description: '7-day streak', requirement: { type: 'streak', value: 7 } },
    { id: 'streak_30', name: '⚡ Monthly Master', description: '30-day streak', requirement: { type: 'streak', value: 30 } },
    { id: 'tasks_10', name: '🎯 Getting Started', description: 'Complete 10 tasks', requirement: { type: 'total_tasks', value: 10 } },
    { id: 'tasks_50', name: '💪 Productive Machine', description: 'Complete 50 tasks', requirement: { type: 'total_tasks', value: 50 } },
    { id: 'tasks_100', name: '🏆 Centurion', description: 'Complete 100 tasks', requirement: { type: 'total_tasks', value: 100 } },
    { id: 'streak_3', name: '🌱 Budding Habit', description: '3-day streak', requirement: { type: 'streak', value: 3 } },
    { id: 'tasks_daily_10', name: '🚀 Hyper Day', description: 'Complete 10 tasks in one day', requirement: { type: 'daily_tasks', value: 10 } },
];

const useStreak = (tasks) => {
    const [streakData, setStreakData] = useState(() => storage.getStreak());
    const [badges, setBadges] = useState(() => storage.getBadges());
    const [newBadge, setNewBadge] = useState(null);

    const calculateStreak = useCallback(() => {
        // Build completion map from tasks
        const completionDates = {};
        tasks.forEach(task => {
            if (task.status === 'completed' && task.completedDate) {
                const key = getDateKey(task.completedDate);
                completionDates[key] = (completionDates[key] || 0) + 1;
            }
        });

        // Calculate current streak (consecutive days ending today or yesterday)
        const today = new Date();
        let currentStreak = 0;
        let checkDate = new Date(today);

        // First check if today has completions
        const todayKey = getDateKey(today);
        if (!completionDates[todayKey]) {
            // Check yesterday
            checkDate.setDate(checkDate.getDate() - 1);
            const yesterdayKey = getDateKey(checkDate);
            if (!completionDates[yesterdayKey]) {
                // Streak is broken
                return { completionDates, currentStreak: 0, longestStreak: streakData.longestStreak };
            }
        }

        // Count backwards
        while (true) {
            const key = getDateKey(checkDate);
            if (completionDates[key]) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        const longestStreak = Math.max(currentStreak, streakData.longestStreak || 0);

        return { completionDates, currentStreak, longestStreak };
    }, [tasks, streakData.longestStreak]);

    const checkBadges = useCallback((streak, totalCompleted) => {
        const earned = [...badges];
        let justEarned = null;

        const todayKey = getDateKey(new Date());
        const todayTasks = tasks.filter(
            t => t.status === 'completed' && t.completedDate && getDateKey(t.completedDate) === todayKey
        ).length;

        BADGE_DEFINITIONS.forEach(badge => {
            if (earned.find(b => b.id === badge.id)) return; // already earned

            let meets = false;
            if (badge.requirement.type === 'streak') {
                meets = streak.currentStreak >= badge.requirement.value;
            } else if (badge.requirement.type === 'total_tasks') {
                meets = totalCompleted >= badge.requirement.value;
            } else if (badge.requirement.type === 'daily_tasks') {
                meets = todayTasks >= badge.requirement.value;
            }

            if (meets) {
                const newB = { ...badge, earnedDate: new Date().toISOString() };
                earned.push(newB);
                justEarned = newB;
            }
        });

        if (earned.length !== badges.length) {
            setBadges(earned);
            storage.setBadges(earned);
            if (justEarned) setNewBadge(justEarned);
        }
    }, [badges, tasks]);

    useEffect(() => {
        const newStreak = calculateStreak();
        setStreakData(newStreak);
        storage.setStreak(newStreak);

        const totalCompleted = tasks.filter(t => t.status === 'completed').length;
        checkBadges(newStreak, totalCompleted);
    }, [tasks, calculateStreak, checkBadges]);

    const dismissBadge = useCallback(() => setNewBadge(null), []);

    return {
        streakData,
        badges,
        newBadge,
        dismissBadge,
        allBadges: BADGE_DEFINITIONS,
    };
};

export default useStreak;
