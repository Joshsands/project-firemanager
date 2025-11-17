import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/Auth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Closeouts from './pages/Closeouts';
import ChangeOrder from './pages/ChangeOrder';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<ProtectedRoute><Navbar /><Dashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Navbar /><Inventory /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute><Navbar /><Billing /></ProtectedRoute>} />
          <Route path="/closeouts" element={<ProtectedRoute><Navbar /><Closeouts /></ProtectedRoute>} />
          <Route path="/changeorder" element={<ProtectedRoute><Navbar /><ChangeOrder /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
