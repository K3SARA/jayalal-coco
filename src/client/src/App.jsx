import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Coconut from './pages/Coconut';
import CocoHusk from './pages/CocoHusk';
import Batches from './pages/Batches';
import Customers from './pages/Customers';
import CustomerProfile from './pages/CustomerProfile';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import ReceiptSettings from './pages/ReceiptSettings';
import BusinessSettings from './pages/BusinessSettings';

// Protected Route Guard helper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('jayalal_coco_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Views */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="coconut" element={<Coconut />} />
          <Route path="husk" element={<CocoHusk />} />
          <Route path="batches" element={<Batches />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerProfile />} />
          <Route path="payments" element={<Payments />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings/receipt" element={<ReceiptSettings />} />
          <Route path="settings/business" element={<BusinessSettings />} />
        </Route>
        
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
