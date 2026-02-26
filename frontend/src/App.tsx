import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import RequestsList from './pages/RequestList';
import CreateRequest from './pages/CreateRequest';
import BudgetManager from './pages/BudgetManager';
import LogoutButton from './components/LogoutButton';
import TransactionHistory from './pages/TransactionHistory';

interface PrivateRouteProps {
  children: React.ReactNode;
}

// Layout pour les routes protégées avec bouton de déconnexion
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  return (
    <>
      {user && <LogoutButton />}
      {children}
    </>
  );
};

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, isLoading } = useAuth();

  console.log('=== PrivateRoute Debug ===');
  console.log('isLoading:', isLoading);
  console.log('user:', user);
  console.log('user role:', user?.role);
  console.log('current path:', window.location.pathname);
  console.log('========================');

  if (isLoading) {
    console.log('Encore en chargement...');
    return <div>Chargement...</div>;
  }

  if (!user) {
    console.log('Pas d\'utilisateur, redirection vers /login');
    return <Navigate to="/login" replace />;
  }

  console.log('Utilisateur connecté, accès autorisé à', window.location.pathname);

  return (
    <ProtectedLayout>
      {children}
    </ProtectedLayout>
  );
};

interface RoleRouteProps {
  children: React.ReactNode;
  roles: string[];
}

const RoleRoute = ({ children, roles }: RoleRouteProps) => {
  const { user, isLoading } = useAuth();

  console.log('=== RoleRoute Debug ===');
  console.log('isLoading:', isLoading);
  console.log('user:', user);
  console.log('user role:', user?.role);
  console.log('required roles:', roles);
  console.log('access granted:', user && roles.includes(user.role));
  console.log('current path:', window.location.pathname);
  console.log('======================');

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    console.log('Pas d\'utilisateur, redirection vers /login');
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    console.log(`Accès refusé: ${user.role} n'a pas accès à ${roles.join(', ')}`);
    return <Navigate to="/requests" replace />;
  }

  console.log('Accès autorisé');
  return (
    <ProtectedLayout>
      {children}
    </ProtectedLayout>
  );
};

function App() {
  console.log('App render - current path:', window.location.pathname);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/requests/new"
            element={
              <PrivateRoute>
                <CreateRequest />
              </PrivateRoute>
            }
          />

          <Route
            path="/requests"
            element={
              <PrivateRoute>
                <RequestsList />
              </PrivateRoute>
            }
          />

          <Route
            path="/budget"
            element={
              <RoleRoute roles={['ADMIN']}>
                <BudgetManager />
              </RoleRoute>
            }
          />

          <Route
            path="/transactions"
            element={
              <RoleRoute roles={['ADMIN']}>
                <TransactionHistory />
              </RoleRoute>
            }
          />
          <Route
            path="/requests/edit/:id"
            element={
              <PrivateRoute>
                <CreateRequest />
              </PrivateRoute>
            }
          />

          <Route path="/" element={<Navigate to="/requests" replace />} />
          <Route path="*" element={<Navigate to="/requests" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;