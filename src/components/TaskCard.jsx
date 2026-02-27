import { useState, useCallback } from 'react';
import { CATEGORIES } from '../utils/taskUtils';
import { formatRelativeTime, isOverdue, formatDate } from '../utils/dateUtils';
import './TaskCard.css';

const TaskCard = ({ task, onToggleComplete, onEdit, onDelete, onUpdateTime }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showTimer, setShowTimer] = useState(false);
    const [timeInput, setTimeInput] = useState(task.timeSpent || 0);

    const category = CATEGORIES.find(c => c.value === task.category);
    const overdue = task.status === 'pending' && isOverdue(task.deadline);

    const handleDelete = () => {
        setIsDeleting(true);
        setTimeout(() => onDelete(task.id), 300);
    };

    const handleTimeSave = () => {
        onUpdateTime(task.id, Number(timeInput));
        setShowTimer(false);
    };

    return (
        <div
            className={`task-card card animate-fade-in-up ${task.status === 'completed' ? 'completed' : ''} ${overdue ? 'overdue animate-overdue' : ''} ${isDeleting ? 'animate-slide-out' : ''}`}
        >
            {/* Priority bar */}
            <div className={`task-priority-bar priority-${task.priority.toLowerCase()}`} />

            <div className="task-card-content">
                {/* Header row */}
                <div className="task-card-header">
                    <button
                        className={`task-check ${task.status === 'completed' ? 'checked' : ''} ${overdue ? 'overdue-check' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id); }}
                        title={task.status === 'completed' ? 'Mark pending' : 'Mark complete'}
                        aria-label={task.status === 'completed' ? 'Mark as pending' : 'Mark as complete'}
                    >
                        {task.status === 'completed' ? (
                            <span className="check-icon">✓</span>
                        ) : (
                            <span className="check-icon-hover">✓</span>
                        )}
                    </button>

                    <div className="task-card-info" onClick={() => onEdit(task)}>
                        <h4 className={`task-title ${task.status === 'completed' ? 'strike' : ''}`}>
                            {task.title}
                        </h4>
                        {task.description && (
                            <p className="task-desc">{task.description}</p>
                        )}
                    </div>

                    <div className="task-card-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(task)} title="Edit">
                            ✏️
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={handleDelete} title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>

                {/* Meta row */}
                <div className="task-card-meta">
                    {category && (
                        <span className="task-category" style={{ color: category.color }}>
                            {category.icon} {task.category}
                        </span>
                    )}
                    <span className={`badge badge-${task.priority.toLowerCase()}`}>
                        {task.priority}
                    </span>
                    {task.recurring && task.recurring !== 'none' && (
                        <span className="task-recurring">🔁 {task.recurring}</span>
                    )}
                    {task.deadline && (
                        <span className={`task-deadline ${overdue ? 'overdue-text' : ''}`}>
                            {overdue ? '⚠️' : '📅'} {formatRelativeTime(task.deadline)}
                        </span>
                    )}
                    {(task.timeEstimate > 0 || task.timeSpent > 0) && (
                        <span
                            className="task-time"
                            onClick={() => setShowTimer(!showTimer)}
                            style={{ cursor: 'pointer' }}
                        >
                            ⏱️ {task.timeSpent || 0}/{task.timeEstimate || '?'}m
                        </span>
                    )}
                </div>

                {/* Time tracking inline */}
                {showTimer && (
                    <div className="task-timer animate-fade-in">
                        <input
                            type="number"
                            className="input timer-input"
                            value={timeInput}
                            onChange={e => setTimeInput(e.target.value)}
                            min="0"
                            placeholder="Minutes spent"
                        />
                        <button className="btn btn-primary btn-sm" onClick={handleTimeSave}>Save</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowTimer(false)}>Cancel</button>
                    </div>
                )}

                {/* Progress bar for time */}
                {task.timeEstimate > 0 && (
                    <div className="task-time-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${Math.min((task.timeSpent / task.timeEstimate) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
