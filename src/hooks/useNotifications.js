import { useEffect, useRef, useCallback } from 'react';

const useNotifications = (tasks) => {
    const notifiedRef = useRef(new Set());
    const intervalRef = useRef(null);

    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        const result = await Notification.requestPermission();
        return result === 'granted';
    }, []);

    const sendNotification = useCallback((title, body, tag) => {
        if (Notification.permission !== 'granted') return;
        try {
            const n = new Notification(title, {
                body,
                icon: '/favicon.svg',
                tag,
                badge: '/favicon.svg',
                vibrate: [200, 100, 200],
            });
            n.onclick = () => {
                window.focus();
                n.close();
            };
            setTimeout(() => n.close(), 10000);
        } catch (e) {
            // Fallback for some browsers
            console.warn('Notification failed:', e);
        }
    }, []);

    const checkDeadlines = useCallback(() => {
        if (!tasks || Notification.permission !== 'granted') return;

        const now = Date.now();
        const TEN_MIN = 10 * 60 * 1000;
        const FIVE_MIN = 5 * 60 * 1000;

        tasks.forEach(task => {
            if (task.status !== 'pending' || !task.deadline) return;

            const deadline = new Date(task.deadline).getTime();
            const diff = deadline - now;

            // 10-minute warning
            const key10 = `${task.id}-10`;
            if (diff > 0 && diff <= TEN_MIN && diff > FIVE_MIN && !notifiedRef.current.has(key10)) {
                notifiedRef.current.add(key10);
                sendNotification(
                    '⏰ Task Due in 10 Minutes',
                    `"${task.title}" is due at ${new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                    key10
                );
            }

            // 5-minute warning
            const key5 = `${task.id}-5`;
            if (diff > 0 && diff <= FIVE_MIN && !notifiedRef.current.has(key5)) {
                notifiedRef.current.add(key5);
                sendNotification(
                    '🔥 Task Due in 5 Minutes!',
                    `"${task.title}" is almost due! Complete it now.`,
                    key5
                );
            }

            // Overdue notification
            const keyOverdue = `${task.id}-overdue`;
            if (diff < 0 && diff > -60000 && !notifiedRef.current.has(keyOverdue)) {
                notifiedRef.current.add(keyOverdue);
                sendNotification(
                    '❌ Task Overdue!',
                    `"${task.title}" has passed its deadline.`,
                    keyOverdue
                );
            }
        });
    }, [tasks, sendNotification]);

    useEffect(() => {
        requestPermission();
    }, [requestPermission]);

    useEffect(() => {
        // Check every 30 seconds
        intervalRef.current = setInterval(checkDeadlines, 30000);
        checkDeadlines(); // Check immediately

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [checkDeadlines]);

    return { requestPermission, sendNotification };
};

export default useNotifications;
