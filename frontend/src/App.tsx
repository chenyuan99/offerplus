import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Dashboard } from './pages/Dashboard';
import Login from './pages/auth/Login';
import CheckEmail from './pages/auth/CheckEmail';
import Callback from './pages/auth/Callback';
import { Profile } from './pages/Profile';
import { Companies } from './pages/Companies';
import { CompanyDetail } from './pages/CompanyDetail';
import { JobGPT } from './pages/JobGPT';
import { AddApplication } from './pages/AddApplication';
import EditApplication from './pages/EditApplication';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { H1B } from './pages/H1B';
import { Hardware } from './pages/Hardware';
import { Internship as InternshipPage } from './pages/Internship';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Landing } from './components/Landing';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { supabase, type User as SupabaseUser } from './lib/supabase';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public Route wrapper component - redirects to dashboard if logged in
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar 
        isMenuOpen={isMenuOpen} 
        setIsMenuOpen={setIsMenuOpen}
      />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={
              <PublicRoute>
                <Landing />
              </PublicRoute>
            } />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/auth/callback" element={
              <PublicRoute>
                <Callback />
              </PublicRoute>
            } />
            <Route path="/check-email" element={
              <PublicRoute>
                <CheckEmail />
              </PublicRoute>
            } />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/h1b" element={<H1B />} />
            <Route path="/hardware" element={<Hardware />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies"
              element={
                <ProtectedRoute>
                  <Companies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies/:id"
              element={
                <ProtectedRoute>
                  <CompanyDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobgpt"
              element={
                <ProtectedRoute>
                  <JobGPT />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-application"
              element={
                <ProtectedRoute>
                  <AddApplication />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute>
                  <EditApplication />
                </ProtectedRoute>
              }
            />
            <Route
              path="/internships"
              element={
                <ProtectedRoute>
                  <InternshipPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <HelmetProvider>
        {/* Auth state is now managed by Supabase directly */}
          <AppContent />
          <Analytics />
          <SpeedInsights />
        {/* End of auth wrapper */}
      </HelmetProvider>
    </Router>
  );
}

export default App;