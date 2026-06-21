import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DataSaverProvider } from '../lib/pwa/useDataSaverMode';

// Lazy-loaded route components — each becomes its own chunk
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Catalog = lazy(() => import('./pages/Catalog'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const LessonPlayer = lazy(() => import('./pages/LessonPlayer'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Credentials = lazy(() => import('./pages/Credentials'));
const PublicVerify = lazy(() => import('./pages/PublicVerify'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Pricing = lazy(() => import('./pages/Pricing'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <DataSaverProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth routes — no AppShell */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Public verification — no AppShell */}
          <Route path="/verify/:credentialId" element={<PublicVerify />} />

          {/* Authenticated routes — wrapped in AppShell layout */}
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<Catalog />} />
            <Route path="courses/:slug" element={<CourseDetail />} />
            <Route
              path="courses/:slug/lessons/:lessonId"
              element={<LessonPlayer />}
            />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="credentials" element={<Credentials />} />
            <Route path="pricing" element={<Pricing />} />
          </Route>
        </Routes>
      </Suspense>
    </DataSaverProvider>
  );
}
