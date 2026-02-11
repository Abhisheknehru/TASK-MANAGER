import { useMemo } from 'react';
import { getTaskStats, CATEGORIES } from '../utils/taskUtils';
import './Dashboard.css';

const Dashboard = ({ tasks, settings, onExportReport, isAuthenticated }) => {
    const stats = useMemo(() => getTaskStats(tasks), [tasks]);

    const dailyProgress = Math.min((stats.completedToday / (settings.dailyGoal || 5)) * 100, 100);
    const weeklyProgress = Math.min((stats.completedThisWeek / (settings.weeklyGoal || 25)) * 100, 100);

    // Time tracking stats
    const timeStats = useMemo(() => {
        const tasksWithTime = tasks.filter(t => t.timeEstimate > 0 || t.timeSpent > 0);
        const totalEstimated = tasksWithTime.reduce((sum, t) => sum + (t.timeEstimate || 0), 0);
        const totalSpent = tasksWithTime.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
        return { totalEstimated, totalSpent, count: tasksWithTime.length };
    }, [tasks]);

    // Category distribution
    const categoryData = useMemo(() => {
        const total = tasks.length || 1;
        return CATEGORIES.map(cat => ({
            ...cat,
            count: stats.categoryBreakdown[cat.value] || 0,
            percent: ((stats.categoryBreakdown[cat.value] || 0) / total) * 100,
        })).filter(c => c.count > 0);
    }, [tasks, stats]);

    const conicGradient = useMemo(() => {
        if (categoryData.length === 0) return 'conic-gradient(var(--bg-tertiary) 0% 100%)';
        let segments = [];
        let acc = 0;
        categoryData.forEach(cat => {
            segments.push(`${cat.color} ${acc}% ${acc + cat.percent}%`);
            acc += cat.percent;
        });
        if (acc < 100) segments.push(`var(--bg-tertiary) ${acc}% 100%`);
        return `conic-gradient(${segments.join(', ')})`;
    }, [categoryData]);

    return (
        <div className="dashboard animate-fade-in-up">
            <h2>Dashboard</h2>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-value">{stats.completedToday}</div>
                    <div className="stat-label">Done Today</div>
                </div>
                <div className="stat-card card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-value">{stats.completedThisWeek}</div>
                    <div className="stat-label">This Week</div>
                </div>
                <div className="stat-card card">
                    <div className="stat-icon">📆</div>
                    <div className="stat-value">{stats.completedThisMonth}</div>
                    <div className="stat-label">This Month</div>
                </div>
                <div className="stat-card card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-value">{stats.totalPending}</div>
                    <div className="stat-label">Pending</div>
                </div>
                {stats.overdueTasks > 0 && (
                    <div className="stat-card card overdue-card">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-value overdue-value">{stats.overdueTasks}</div>
                        <div className="stat-label">Overdue</div>
                    </div>
                )}
                <div className="stat-card card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{stats.totalCompleted}</div>
                    <div className="stat-label">Total Done</div>
                </div>
            </div>

            {/* Progress Bars */}
            <div className="progress-section">
                <div className="progress-card card">
                    <div className="progress-header">
                        <h4>Daily Goal</h4>
                        <span className="progress-count">{stats.completedToday} / {settings.dailyGoal || 5}</span>
                    </div>
                    <div className="progress-bar progress-bar-lg">
                        <div className="progress-fill" style={{ width: `${dailyProgress}%` }} />
                    </div>
                </div>

                <div className="progress-card card">
                    <div className="progress-header">
                        <h4>Weekly Goal</h4>
                        <span className="progress-count">{stats.completedThisWeek} / {settings.weeklyGoal || 25}</span>
                    </div>
                    <div className="progress-bar progress-bar-lg">
                        <div className="progress-fill" style={{ width: `${weeklyProgress}%` }} />
                    </div>
                </div>
            </div>

            {/* Time Tracking + Category Distribution */}
            <div className="dashboard-row">
                {/* Time Tracking */}
                <div className="time-section card">
                    <h4>Time Tracking</h4>
                    <div className="time-bars">
                        <div className="time-bar-row">
                            <span className="time-bar-label">Estimated</span>
                            <div className="time-bar-track">
                                <div
                                    className="time-bar-fill estimated"
                                    style={{ width: `${timeStats.totalEstimated > 0 ? 100 : 0}%` }}
                                />
                            </div>
                            <span className="time-bar-value">{timeStats.totalEstimated}m</span>
                        </div>
                        <div className="time-bar-row">
                            <span className="time-bar-label">Actual</span>
                            <div className="time-bar-track">
                                <div
                                    className="time-bar-fill actual"
                                    style={{
                                        width: `${timeStats.totalEstimated > 0
                                            ? Math.min((timeStats.totalSpent / timeStats.totalEstimated) * 100, 100)
                                            : 0}%`
                                    }}
                                />
                            </div>
                            <span className="time-bar-value">{timeStats.totalSpent}m</span>
                        </div>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="category-section card">
                    <h4>Categories</h4>
                    <div className="category-chart-container">
                        <div
                            className="category-donut"
                            style={{ background: conicGradient }}
                        >
                            <div className="donut-hole">
                                <span className="donut-total">{stats.totalTasks}</span>
                                <span className="donut-label">Total</span>
                            </div>
                        </div>
                        <div className="category-legend">
                            {categoryData.map(cat => (
                                <div key={cat.value} className="category-legend-item">
                                    <span className="cat-dot" style={{ background: cat.color }} />
                                    <span className="cat-name">{cat.icon} {cat.value}</span>
                                    <span className="cat-count">{cat.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Export */}
            {isAuthenticated && (
                <div className="export-section">
                    <h4>Export Reports</h4>
                    <div className="export-buttons">
                        <button className="btn btn-secondary" onClick={() => onExportReport('weekly')}>
                            📄 Weekly Report
                        </button>
                        <button className="btn btn-secondary" onClick={() => onExportReport('monthly')}>
                            📄 Monthly Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
