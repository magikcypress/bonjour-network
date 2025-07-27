import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Récupérer la préférence depuis localStorage
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
            return JSON.parse(saved);
        }
        // Détecter la préférence système par défaut
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        // Sauvegarder dans localStorage
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));

        // Appliquer les classes CSS
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            console.log('🌙 Mode sombre activé');
        } else {
            document.documentElement.classList.remove('dark');
            console.log('☀️ Mode clair activé');
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        console.log('🌙 Basculement du thème:', !isDarkMode);
        setIsDarkMode(!isDarkMode);
    };

    const value = {
        isDarkMode,
        toggleTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}; 