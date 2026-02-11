import { useState, useEffect } from 'react';
import storage from '../services/localStorage';
import './ThemeSwitcher.css';

const ThemeSwitcher = () => {
    const [theme, setTheme] = useState(() => storage.getTheme());
    const [customHue, setCustomHue] = useState(() => storage.getCustomColors().hue);
    const [customSat, setCustomSat] = useState(() => storage.getCustomColors().sat);
    const [showCustom, setShowCustom] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        storage.setTheme(theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.style.setProperty('--custom-hue', customHue);
        document.documentElement.style.setProperty('--custom-sat', `${customSat}%`);
        storage.setCustomColors(customHue, customSat);
    }, [customHue, customSat]);

    const themes = [
        { id: 'dark', label: '🌙', name: 'Dark' },
        { id: 'light', label: '☀️', name: 'Light' },
        { id: 'custom', label: '🎨', name: 'Custom' },
    ];

    return (
        <div className="theme-switcher">
            <div className="theme-label">Theme</div>
            <div className="theme-options">
                {themes.map(t => (
                    <button
                        key={t.id}
                        className={`theme-option ${theme === t.id ? 'active' : ''}`}
                        onClick={() => {
                            setTheme(t.id);
                            if (t.id === 'custom') setShowCustom(true);
                            else setShowCustom(false);
                        }}
                        title={t.name}
                    >
                        <span className="theme-option-icon">{t.label}</span>
                        <span className="theme-option-name">{t.name}</span>
                    </button>
                ))}
            </div>
            {theme === 'custom' && (
                <div className="custom-colors animate-fade-in">
                    <div className="color-control">
                        <label>Color</label>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={customHue}
                            onChange={e => setCustomHue(Number(e.target.value))}
                            className="hue-slider"
                            style={{
                                background: `linear-gradient(to right, 
                  hsl(0, ${customSat}%, 50%), hsl(60, ${customSat}%, 50%), 
                  hsl(120, ${customSat}%, 50%), hsl(180, ${customSat}%, 50%), 
                  hsl(240, ${customSat}%, 50%), hsl(300, ${customSat}%, 50%), 
                  hsl(360, ${customSat}%, 50%))`
                            }}
                        />
                    </div>
                    <div className="color-control">
                        <label>Saturation</label>
                        <input
                            type="range"
                            min="20"
                            max="100"
                            value={customSat}
                            onChange={e => setCustomSat(Number(e.target.value))}
                            className="sat-slider"
                        />
                    </div>
                    <div
                        className="color-preview"
                        style={{ background: `hsl(${customHue}, ${customSat}%, 55%)` }}
                    />
                </div>
            )}
        </div>
    );
};

export default ThemeSwitcher;
