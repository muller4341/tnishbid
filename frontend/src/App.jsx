import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ItemDetails from './pages/ItemDetails';
import Discover from './pages/Discover';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  return (
    <div className="min-h-screen bg-[#0A0B0D] text-slate-100 flex flex-col antialiased selection:bg-amber-500 selection:text-black">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-4 pb-20 md:pb-12 max-w-7xl">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/item/:id" element={<ItemDetails />} />
          <Route 
            path="/admin" 
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <MobileNav />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

