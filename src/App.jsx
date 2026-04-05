import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Redirect legacy /BusinessPage?slug=xxx or ?id=xxx to /business/slug
function BusinessPageRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    if (slug) {
      navigate(`/business/${slug}`, { replace: true });
    } else if (id) {
      // Fetch slug from ID then redirect
      base44.entities.BusinessPage.get(id)
        .then(page => {
          const targetSlug = page?.url_slug || id;
          navigate(`/business/${targetSlug}`, { replace: true });
        })
        .catch(() => {
          navigate(`/business/${id}`, { replace: true });
        });
    } else {
      navigate('/Browse', { replace: true });
    }
    setLoading(false);
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }
  return null;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Get the BusinessPage component for the /business/:slug route
  const BusinessPageComponent = Pages['BusinessPage'];

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />

      {/* Clean business page route: /business/:slug */}
      {BusinessPageComponent && (
        <Route
          path="/business/:slug"
          element={
            <LayoutWrapper currentPageName="BusinessPage">
              <BusinessPageComponent />
            </LayoutWrapper>
          }
        />
      )}

      {/* Legacy redirect: /BusinessPage?slug=xxx → /business/slug */}
      <Route path="/BusinessPage" element={<BusinessPageRedirect />} />

      {Object.entries(Pages).map(([path, Page]) => {
        // Skip BusinessPage — handled by /business/:slug above
        if (path === 'BusinessPage') return null;
        return (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        );
      })}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
