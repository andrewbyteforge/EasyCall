// =============================================================================
// FILE: frontend/src/context/EasyModeContext.tsx
// =============================================================================
// Context for managing Easy Mode vs Advanced Mode in the workflow builder.
// Easy Mode provides helpful popups and guidance for new users.
// =============================================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface EasyModeContextType {
    isEasyMode: boolean;
    toggleMode: () => void;
    setEasyMode: (value: boolean) => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const EasyModeContext = createContext<EasyModeContextType | undefined>(undefined);

// =============================================================================
// STORAGE KEY
// =============================================================================

const STORAGE_KEY = 'easycall_easy_mode';

// =============================================================================
// PROVIDER
// =============================================================================

export const EasyModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize from localStorage, default to true (Easy Mode) for new users
    const [isEasyMode, setIsEasyMode] = useState<boolean>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        // Default to Easy Mode for new users
        return stored === null ? true : stored === 'true';
    });

    // Persist to localStorage when mode changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(isEasyMode));
    }, [isEasyMode]);

    const toggleMode = () => {
        setIsEasyMode((prev) => !prev);
    };

    const setEasyMode = (value: boolean) => {
        setIsEasyMode(value);
    };

    return (
        <EasyModeContext.Provider value={{ isEasyMode, toggleMode, setEasyMode }}>
            {children}
        </EasyModeContext.Provider>
    );
};

// =============================================================================
// HOOK
// =============================================================================

export const useEasyMode = (): EasyModeContextType => {
    const context = useContext(EasyModeContext);
    if (!context) {
        throw new Error('useEasyMode must be used within an EasyModeProvider');
    }
    return context;
};

export default EasyModeContext;
