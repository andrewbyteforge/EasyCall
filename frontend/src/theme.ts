// =============================================================================
// FILE: frontend/src/theme.ts
// =============================================================================
// Material-UI theme configuration inspired by Unreal Engine's Blueprint system.
// Dark theme with blues, teals, and purples for a professional workflow editor.
// =============================================================================

import { createTheme, ThemeOptions } from '@mui/material/styles';

// =============================================================================
// COLOR PALETTE - Unreal Engine Inspired
// =============================================================================

const colors = {
    // Background colors
    background: {
        default: '#1e1e1e',
        paper: '#252526',
        elevated: '#2d2d30',
        canvas: '#1a1a1a',
    },

    // Primary blues (for inputs and general UI)
    primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
        contrastText: '#ffffff',
    },

    // Secondary teal/green (for query nodes)
    secondary: {
        main: '#00897b',         // Teal
        light: '#4db6ac',
        dark: '#00695c',
        contrastText: '#ffffff',
    },

    // Node category colors
    nodeColors: {
        configuration: '#4a148c', // Deep purple
        input: '#1976d2',         // Blue
        query: '#00897b',         // Teal
        output: '#f57c00',        // Orange
    },

    // Status colors
    status: {
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3',
    },

    // Text colors
    text: {
        primary: '#e0e0e0',
        secondary: '#b0b0b0',
        disabled: '#707070',
    },

    // Border and divider
    divider: '#3e3e42',
    border: '#3e3e42',
};

// =============================================================================
// THEME OPTIONS
// =============================================================================

const themeOptions: ThemeOptions = {
    palette: {
        mode: 'dark',
        primary: {
            main: colors.primary.main,
            light: colors.primary.light,
            dark: colors.primary.dark,
            contrastText: colors.primary.contrastText,
        },
        secondary: {
            main: colors.secondary.main,
            light: colors.secondary.light,
            dark: colors.secondary.dark,
            contrastText: colors.secondary.contrastText,
        },
        background: {
            default: colors.background.default,
            paper: colors.background.paper,
        },
        text: {
            primary: colors.text.primary,
            secondary: colors.text.secondary,
            disabled: colors.text.disabled,
        },
        divider: colors.divider,
        success: {
            main: colors.status.success,
        },
        warning: {
            main: colors.status.warning,
        },
        error: {
            main: colors.status.error,
        },
        info: {
            main: colors.status.info,
        },
    },

    // =============================================================================
    // TYPOGRAPHY
    // =============================================================================

    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
        h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
            color: colors.text.primary,
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600,
            color: colors.text.primary,
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 500,
            color: colors.text.primary,
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 500,
            color: colors.text.primary,
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
            color: colors.text.primary,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 500,
            color: colors.text.primary,
        },
        body1: {
            fontSize: '0.875rem',
            color: colors.text.primary,
        },
        body2: {
            fontSize: '0.75rem',
            color: colors.text.secondary,
        },
        button: {
            textTransform: 'none', // Don't uppercase buttons
            fontWeight: 500,
        },
    },

    // =============================================================================
    // COMPONENT OVERRIDES
    // =============================================================================

    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarColor: '#6b6b6b #2b2b2b',
                    '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                        width: '12px',
                        height: '12px',
                    },
                    '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                        borderRadius: '8px',
                        backgroundColor: '#6b6b6b',
                        border: '2px solid #2b2b2b',
                    },
                    '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
                        backgroundColor: '#2b2b2b',
                    },
                },
            },
        },

        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '4px',
                    padding: '6px 16px',
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
            },
        },

        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '4px',
                    border: `1px solid ${colors.border}`,
                    backgroundImage: 'none',
                },
            },
        },

        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: '4px',
                    backgroundImage: 'none',
                },
                elevation1: {
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                },
                elevation2: {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                },
                elevation3: {
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                },
            },
        },

        MuiAppBar: {
            styleOverrides: {
                root: {
                    borderBottom: `1px solid ${colors.divider}`,
                    boxShadow: 'none',
                },
            },
        },

        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: colors.background.paper,
                    borderRight: `1px solid ${colors.divider}`,
                },
            },
        },

        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: colors.border,
                        },
                        '&:hover fieldset': {
                            borderColor: colors.primary.light,
                        },
                    },
                },
            },
        },

        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: colors.background.elevated,
                    border: `1px solid ${colors.border}`,
                    color: colors.text.primary,
                    fontSize: '0.75rem',
                    padding: '8px 12px',
                },
                arrow: {
                    color: colors.background.elevated,
                    '&::before': {
                        border: `1px solid ${colors.border}`,
                    },
                },
            },
        },

        MuiDialog: {
            styleOverrides: {
                paper: {
                    border: `1px solid ${colors.divider}`,
                },
            },
        },
    },
};

// =============================================================================
// CREATE THEME
// =============================================================================

const theme = createTheme(themeOptions);

// =============================================================================
// EXPORTS
// =============================================================================

export default theme;

// Export colors for use in components (e.g., React Flow nodes)
export { colors };