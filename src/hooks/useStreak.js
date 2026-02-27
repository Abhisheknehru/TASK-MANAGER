import { useState, useCallback, useEffect, useRef } from 'react';
import storage from '../services/localStorage';
import { getDateKey } from '../utils/dateUtils';

const BADGE_DEFINITIONS = [
    { id: 'streak_3', name: '🌱 Budding Habit', description: '3-day streak', requirement: { type: 'streak', value: 3 } },
    { id: 'streak_7', name: '🔥 Week Warrior', description: '7-day streak', requirement: { type: 'streak', value: 7 } },
    { id: 'streak_30', name: '⚡ Monthly Master', description: '30-day streak', requirement: { type: 'streak', value: 30 } },
    { id: 'tasks_10', name: '🎯 Getting Started', description: 'Complete 10 tasks', requirement: { type: 'total_tasks', value: 10 } },
    { id: 'tasks_50', name: '💪 Productive Machine', description: 'Complete 50 tasks', requirement: { type: 'total_tasks', value: 50 } },
    { id: 'tasks_100', name: '🏆 Centurion', description: 'Complete 100 tasks', requirement: { type: 'total_tasks', value: 100 } },
    { id: 'tasks_daily_10', name: '🚀 Hyper Day', description: 'Complete 10 tasks in one day', requirement: { type: 'daily_tasks', value: 10 } },
];

const useStreak = (tasks) => {
    const [streakData, setStreakData] = useState(() => storage.getStreak());
    const [badges, setBadges] = useState(() => storage.getBadges());
    const [newBadge, setNewBadge] = useState(null);

    // Use refs to avoid stale closures without triggering re-renders
    const badgesRef = useRef(badges);
    badgesRef.current = badges;
    const streakDataRef = useRef(streakData);
    streakDataRef.current = streakData;

    useEffect(() => {
        // ── 1. Build completion map ──────────────────────────────────────────
        const completionDates = {};
        tasks.forEach(task => {
            if (task.status === 'completed' && task.completedDate) {
                // completedDate is an ISO string — convert to Date first
                const key = getDateKey(new Date(task.completedDate));
                completionDates[key] = (completionDates[key] || 0) + 1;
            }
        });

        // ── 2. Calculate current streak ──────────────────────────────────────
        const today = new Date();
        const todayKey = getDateKey(today);

        let currentStreak = 0;
        let checkDate = new Date(today);

        // Start from today; if no completions today, allow yesterday as start
        if (!completionDates[todayKey]) {
            checkDate.setDate(checkDate.getDate() - 1);
            const yesterdayKey = getDateKey(checkDate);
            if (!completionDates[yesterdayKey]) {
                // Streak is broken — reset to 0 but keep longestStreak
                const updated = {
                    completionDates,
                    currentStreak: 0,
                    longestStreak: streakDataRef.current.longestStreak || 0,
                };
                setStreakData(updated);
                storage.setStreak(updated);
                return;
            }
        }

        // Count consecutive days backwards
        while (true) {
            const key = getDateKey(checkDate);
            if (completionDates[key]) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        const longestStreak = Math.max(currentStreak, streakDataRef.current.longestStreak || 0);
        const newStreak = { completionDates, currentStreak, longestStreak };

        setStreakData(newStreak);
        storage.setStreak(newStreak);

        // ── 3. Check badges ──────────────────────────────────────────────────
        const totalCompleted = tasks.filter(t => t.status === 'completed').length;
        const todayTasks = tasks.filter(
            t => t.status === 'completed' && t.completedDate &&
                getDateKey(new Date(t.completedDate)) === todayKey
        ).length;

        const currentBadges = badgesRef.current;
        const earned = [...currentBadges];
        let justEarned = null;

        BADGE_DEFINITIONS.forEach(badge => {
            if (earned.find(b => b.id === badge.id)) return; // already earned

            let meets = false;
            if (badge.requirement.type === 'streak') {
                meets = currentStreak >= badge.requirement.value;
            } else if (badge.requirement.type === 'total_tasks') {
                meets = totalCompleted >= badge.requirement.value;
            } else if (badge.requirement.type === 'daily_tasks') {
                meets = todayTasks >= badge.requirement.value;
            }

            if (meets) {
                const newB = { ...badge, earnedDate: new Date().toISOString() };
                earned.push(newB);
                if (!justEarned) justEarned = newB; // show first new badge
            }
        });

        if (earned.length !== currentBadges.length) {
            setBadges(earned);
            storage.setBadges(earned);
            if (justEarned) setNewBadge(justEarned);
        }

        // Only re-run when tasks change — NOT when streakData/badges change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tasks]);

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