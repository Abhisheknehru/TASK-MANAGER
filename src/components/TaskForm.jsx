import { useState, useEffect } from 'react';
import { CATEGORIES, PRIORITIES, RECURRING_OPTIONS } from '../utils/taskUtils';
import { toInputDatetime } from '../utils/dateUtils';
import './TaskForm.css';

const TaskForm = ({ task, onSave, onClose }) => {
    const isEdit = !!task;
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: 'Work',
        priority: 'Medium',
        deadline: '',
        timeEstimate: '',
        recurring: 'none',
        tags: [],
    });

    useEffect(() => {
        if (task) {
            setForm({
                title: task.title || '',
                description: task.description || '',
                category: task.category || 'Work',
                priority: task.priority || 'Medium',
                deadline: task.deadline ? toInputDatetime(task.deadline) : '',
                timeEstimate: task.timeEstimate || '',
                recurring: task.recurring || 'none',
                tags: task.tags || [],
            });
        }
    }, [task]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        onSave({
            ...form,
            deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
            timeEstimate: Number(form.timeEstimate) || 0,
        });
        onClose();
    };

    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal animate-scale-in">
                <div className="modal-header">
                    <h3>{isEdit ? 'Edit Task' : 'New Task'}</h3>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Title */}
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="What needs to be done?"
                                value={form.title}
                                onChange={(e) => update('title', e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="textarea"
                                placeholder="Add details..."
                                value={form.description}
                                onChange={(e) => update('description', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Priority & Category */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <div className="priority-selector">
                                    {PRIORITIES.map(p => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            className={`priority-btn ${form.priority === p.value ? 'active' : ''}`}
                                            style={{
                                                '--p-color': p.color,
                                                '--p-bg': p.bg,
                                            }}
                                            onClick={() => update('priority', p.value)}
                                        >
                                            {p.value}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <div className="category-selector">
                                    {CATEGORIES.map(c => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            className={`category-btn ${form.category === c.value ? 'active' : ''}`}
                                            onClick={() => update('category', c.value)}
                                            title={c.value}
                                        >
                                            <span>{c.icon}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Deadline */}
                        <div className="form-group">
                            <label className="form-label">Deadline</label>
                            <input
                                type="datetime-local"
                                className="input"
                                value={form.deadline}
                                onChange={(e) => update('deadline', e.target.value)}
                            />
                        </div>

                        {/* Time Estimate & Recurring */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Time Estimate (min)</label>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="30"
                                    min="0"
                                    value={form.timeEstimate}
                                    onChange={(e) => update('timeEstimate', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Recurring</label>
                                <select
                                    className="select"
                                    value={form.recurring}
                                    onChange={(e) => update('recurring', e.target.value)}
                                >
                                    {RECURRING_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={!form.title.trim()}>
                            {isEdit ? 'Save Changes' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskForm;
