import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Home from './pages/Home';
import Draws from './pages/Draws';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ItemDetails from './pages/ItemDetails';
import Discover from './pages/Discover';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import MyBids from './pages/MyBids';
import PaymentResult from './pages/PaymentResult';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  return (
    <div className="min-h-screen bg-[#0A0B0D] text-slate-100 flex flex-col antialiased selection:bg-amber-500 selection:text-black">
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow w-full container mx-auto px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-12 max-w-7xl min-w-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/draws" element={<Draws />} />
          <Route path="/discover" element={<Discover />} />
          <Route 
            path="/my-bids" 
            element={
              <PrivateRoute>
                <MyBids />
              </PrivateRoute>
            } 
          />
          <Route path="/mybid" element={<Navigate to="/my-bids" replace />} />
          <Route path="/mybids" element={<Navigate to="/my-bids" replace />} />
          <Route path="/my-bid" element={<Navigate to="/my-bids" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forget" element={<Navigate to="/forgot-password" replace />} />
          <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/item/:id" element={<ItemDetails />} />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
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
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;

