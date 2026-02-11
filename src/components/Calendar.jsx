import { useState, useMemo } from 'react';
import { getDaysInMonth, getFirstDayOfMonth, getDateKey } from '../utils/dateUtils';
import './Calendar.css';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar = ({ streakData }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const calendarDays = useMemo(() => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const days = [];

        // Empty slots for days before month start
        for (let i = 0; i < firstDay; i++) {
            days.push({ day: null, key: `empty-${i}` });
        }

        // Actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateKey = getDateKey(new Date(currentYear, currentMonth, d));
            const count = streakData.completionDates[dateKey] || 0;
            const isToday = dateKey === getDateKey(today);
            days.push({ day: d, key: dateKey, count, isToday });
        }

        return days;
    }, [currentMonth, currentYear, streakData]);

    const maxCount = useMemo(() => {
        return Math.max(...Object.values(streakData.completionDates || { _: 1 }), 1);
    }, [streakData]);

    const getHeatLevel = (count) => {
        if (!count) return 0;
        const ratio = count / maxCount;
        if (ratio <= 0.25) return 1;
        if (ratio <= 0.5) return 2;
        if (ratio <= 0.75) return 3;
        return 4;
    };

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(y => y - 1);
        } else {
            setCurrentMonth(m => m - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
    };

    return (
        <div className="calendar-view animate-fade-in-up">
            <div className="calendar-header-row">
                <h2>Activity Calendar</h2>
            </div>

            {/* Month navigation */}
            <div className="calendar-nav">
                <button className="btn btn-ghost btn-icon" onClick={prevMonth}>←</button>
                <span className="calendar-month-label">{MONTHS[currentMonth]} {currentYear}</span>
                <button className="btn btn-ghost btn-icon" onClick={nextMonth}>→</button>
            </div>

            {/* Day headers */}
            <div className="calendar-grid">
                {DAYS.map(d => (
                    <div key={d} className="calendar-day-header">{d}</div>
                ))}

                {/* Calendar cells */}
                {calendarDays.map(cell => (
                    <div
                        key={cell.key}
                        className={`calendar-cell ${!cell.day ? 'empty' : ''} ${cell.isToday ? 'today' : ''} heat-${getHeatLevel(cell.count)}`}
                        title={cell.day ? `${cell.count} task${cell.count !== 1 ? 's' : ''} completed` : ''}
                    >
                        {cell.day && (
                            <>
                                <span className="cell-day">{cell.day}</span>
                                {cell.count > 0 && <span className="cell-count">{cell.count}</span>}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="calendar-legend">
                <span className="legend-label">Less</span>
                {[0, 1, 2, 3, 4].map(level => (
                    <div key={level} className={`legend-cell heat-${level}`} />
                ))}
                <span className="legend-label">More</span>
            </div>

            {/* Streak Stats */}
            <div className="streak-stats">
                <div className="streak-stat-card card">
                    <div className="streak-stat-value">{streakData.currentStreak}</div>
                    <div className="streak-stat-label">Current Streak</div>
                </div>
                <div className="streak-stat-card card">
                    <div className="streak-stat-value">{streakData.longestStreak}</div>
                    <div className="streak-stat-label">Longest Streak</div>
                </div>
                <div className="streak-stat-card card">
                    <div className="streak-stat-value">
                        {Object.keys(streakData.completionDates).length}
                    </div>
                    <div className="streak-stat-label">Active Days</div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
