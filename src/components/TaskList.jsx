import { useMemo, useState } from 'react';
import TaskCard from './TaskCard';
import { sortTasks, filterTasks } from '../utils/taskUtils';
import './TaskList.css';

const TaskList = ({ tasks, onToggleComplete, onEdit, onDelete, onUpdateTime, focusMode, searchQuery }) => {
    const [sortBy, setSortBy] = useState('deadline');

    const processedTasks = useMemo(() => {
        const filtered = filterTasks(tasks, {
            status: focusMode,
            search: searchQuery,
        });
        return sortTasks(filtered, sortBy);
    }, [tasks, focusMode, searchQuery, sortBy]);

    return (
        <div className="task-list-container">
            {/* Sort controls */}
            <div className="task-list-header">
                <div className="task-count">
                    <span className="task-count-number">{processedTasks.length}</span>
                    <span className="task-count-label">
                        {focusMode === 'completed' ? 'completed' : focusMode === 'pending' ? 'pending' : 'tasks'}
                    </span>
                </div>
                <div className="sort-controls">
                    <span className="sort-label">Sort:</span>
                    {['deadline', 'priority', 'created', 'title'].map(s => (
                        <button
                            key={s}
                            className={`sort-btn ${sortBy === s ? 'active' : ''}`}
                            onClick={() => setSortBy(s)}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Task Cards */}
            {processedTasks.length === 0 ? (
                <div className="empty-state animate-fade-in">
                    <div className="empty-state-icon">
                        {focusMode === 'completed' ? '🎉' : searchQuery ? '🔍' : '✨'}
                    </div>
                    <div className="empty-state-title">
                        {focusMode === 'completed'
                            ? 'No completed tasks yet'
                            : searchQuery
                                ? 'No matching tasks'
                                : 'All clear! Ready to add a task?'}
                    </div>
                    <div className="empty-state-text">
                        {!searchQuery && focusMode !== 'completed' && 'Click the + button to create your first task'}
                    </div>
                </div>
            ) : (
                <div className="task-list stagger-children">
                    {processedTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onToggleComplete={onToggleComplete}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onUpdateTime={onUpdateTime}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TaskList;
