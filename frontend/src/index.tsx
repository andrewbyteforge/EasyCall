// =============================================================================
// FILE: easycall/frontend/src/index.tsx
// =============================================================================
// Application entry point.
// Renders the React application with Material-UI theme provider.
// =============================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import theme from './theme';

// =============================================================================
// RENDER APPLICATION
// =============================================================================

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            {/* CssBaseline: Normalize CSS across browsers and apply dark theme */}
            <CssBaseline />
            <App />
        </ThemeProvider>
    </React.StrictMode>
);