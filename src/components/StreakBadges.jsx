import './StreakBadges.css';

const StreakBadges = ({ badges, allBadges, newBadge, onDismiss }) => {
    return (
        <>
            {/* New badge popup */}
            {newBadge && (
                <div className="badge-popup-overlay" onClick={onDismiss}>
                    <div className="badge-popup animate-bounce-in" onClick={e => e.stopPropagation()}>
                        <div className="badge-popup-confetti">🎊</div>
                        <div className="badge-popup-icon">{newBadge.name.split(' ')[0]}</div>
                        <h3 className="badge-popup-title">Achievement Unlocked!</h3>
                        <p className="badge-popup-name">{newBadge.name}</p>
                        <p className="badge-popup-desc">{newBadge.description}</p>
                        <button className="btn btn-primary" onClick={onDismiss}>Awesome!</button>
                    </div>
                </div>
            )}

            {/* Badges grid */}
            <div className="badges-section">
                <h3>Achievements</h3>
                <div className="badges-grid">
                    {allBadges.map(badge => {
                        const earned = badges.find(b => b.id === badge.id);
                        return (
                            <div
                                key={badge.id}
                                className={`badge-item ${earned ? 'earned' : 'locked'}`}
                                title={earned ? `Earned: ${new Date(earned.earnedDate).toLocaleDateString()}` : badge.description}
                            >
                                <span className="badge-item-icon">{badge.name.split(' ')[0]}</span>
                                <span className="badge-item-name">{badge.name.split(' ').slice(1).join(' ')}</span>
                                <span className="badge-item-desc">{badge.description}</span>
                                {!earned && <div className="badge-lock">🔒</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default StreakBadges;
