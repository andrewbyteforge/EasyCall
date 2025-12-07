// =============================================================================
// FILE: frontend/src/App.tsx
// =============================================================================

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import MainLayout from './components/layout/MainLayout';

const App: React.FC = () => {
    return <MainLayout />;  // ✅ Clean - providers already in index.tsx
};

export default App;