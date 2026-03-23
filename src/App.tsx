import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Loader } from './components/Loader';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Apply = lazy(() => import('./pages/Apply'));
const Track = lazy(() => import('./pages/Track'));
const Verify = lazy(() => import('./pages/Verify'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TemplateBuilder = lazy(() => import('./pages/TemplateBuilder'));
const ManageUsers = lazy(() => import('./pages/ManageUsers'));
const MasterData = lazy(() => import('./pages/MasterData'));
const HodDashboard = lazy(() => import('./pages/HodDashboard'));
const ReviewApplication = lazy(() => import('./pages/ReviewApplication'));

function AppContent() {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30 selection:text-emerald-400">
      <Navbar />
      <div className="flex">
        {user && profile && (profile.role === 'ADMIN' || profile.role === 'HOD') && <Sidebar />}
        <main className={`flex-1 transition-all duration-300 ${user && profile && (profile.role === 'ADMIN' || profile.role === 'HOD') ? 'ml-64 pt-16' : ''}`}>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader message="Loading page..." /></div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/apply" replace />} />
              <Route path="/apply" element={<Apply />} />
              <Route path="/track" element={<Track />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/verify/:trackingId" element={<Verify />} />
              <Route path="/login" element={<Login />} />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/templates" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <TemplateBuilder />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ManageUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/master-data" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <MasterData />
                </ProtectedRoute>
              } />

              {/* HOD Routes */}
              <Route path="/hod" element={
                <ProtectedRoute allowedRoles={['HOD']}>
                  <HodDashboard />
                </ProtectedRoute>
              } />
              <Route path="/hod/pending" element={
                <ProtectedRoute allowedRoles={['HOD']}>
                  <HodDashboard />
                </ProtectedRoute>
              } />
              <Route path="/hod/review/:trackingId" element={
                <ProtectedRoute allowedRoles={['HOD']}>
                  <ReviewApplication />
                </ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
