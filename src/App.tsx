/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Dashboard from './components/Dashboard';
import AuthLogin from './components/AuthLogin';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <AuthLogin />;
  }
  
  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans selection:bg-cyan-500/30">
      <Dashboard />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

