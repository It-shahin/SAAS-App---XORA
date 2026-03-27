import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard.jsx'
import LandingPage from './pages/LandingPage'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ChangePassword from './pages/ChangePassword'
import NewProject from './pages/NewProject'
import ProjectDetail from './pages/ProjectDetail'
import EditProject from './pages/EditProject'
import ShareView from './pages/ShareView'
import Billing from './pages/Billing'
import Assets from './pages/Assets'
import NotFound from './pages/NotFound'
import Docs from './pages/Docs'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/share/:projectId" element={<ShareView />} />
    <Route path="/dashboard" element={
      <ProtectedRoute><Dashboard /></ProtectedRoute>
    } />
    <Route path="/change-password" element={
      <ProtectedRoute><ChangePassword /></ProtectedRoute>
    } />
    <Route path="/projects/new" element={
      <ProtectedRoute><NewProject /></ProtectedRoute>
    } />
    <Route path="/projects/:id" element={
      <ProtectedRoute><ProjectDetail /></ProtectedRoute>
    } />
    <Route path="/projects/:id/edit" element={
      <ProtectedRoute><EditProject /></ProtectedRoute>
    } />
    <Route path="/billing" element={
      <ProtectedRoute><Billing /></ProtectedRoute>
    } />
    <Route path="/assets" element={
      <ProtectedRoute><Assets /></ProtectedRoute>
    } />
    <Route path="/docs" element={<Docs />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
)

export default App
