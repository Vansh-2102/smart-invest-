import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/layout/Layout';

import Login              from '../pages/auth/Login';
import Register           from '../pages/auth/Register';
import Dashboard          from '../pages/Dashboard';
import UserProfile        from '../pages/UserProfile';
import FinancialProfileForm from '../pages/FinancialProfileForm';
import RiskAssessment     from '../pages/RiskAssessment';
import Recommendations    from '../pages/Recommendations';
import BankingModule      from '../pages/BankingModule';
import MutualFunds        from '../pages/MutualFunds';
import Stocks             from '../pages/Stocks';
import Gold               from '../pages/Gold';
import Crypto             from '../pages/Crypto';
import MarketDashboard    from '../pages/MarketDashboard';
import AIChatbot          from '../pages/AIChatbot';
import NewsSentiment      from '../pages/NewsSentiment';
import Settings           from '../pages/Settings';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index                        element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"            element={<Dashboard />} />
            <Route path="/profile"              element={<UserProfile />} />
            <Route path="/financial-profile"    element={<FinancialProfileForm />} />
            <Route path="/risk-assessment"      element={<RiskAssessment />} />
            <Route path="/recommendations"      element={<Recommendations />} />
            <Route path="/banking"              element={<BankingModule />} />
            <Route path="/mutual-funds"         element={<MutualFunds />} />
            <Route path="/stocks"               element={<Stocks />} />
            <Route path="/gold"                 element={<Gold />} />
            <Route path="/crypto"               element={<Crypto />} />
            <Route path="/market"               element={<MarketDashboard />} />
            <Route path="/chatbot"              element={<AIChatbot />} />
            <Route path="/news"                 element={<NewsSentiment />} />
            <Route path="/settings"             element={<Settings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
