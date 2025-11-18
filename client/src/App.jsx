import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import Wizard from './pages/Wizard';
import Reports from './pages/Reports';

import Canvas from './pages/Canvas';
import Analytics from './pages/Analytics';
import MainLayout from './layouts/MainLayout';
import RouteError from './components/RouteError';
import ProtectedRoute from './components/ProtectedRoute';
import { SidebarProvider } from './contexts/SidebarContext';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const router = createBrowserRouter([
    // Routes without sidebar
    {
      path: "/",
      element: <Landing />,
      errorElement: <RouteError />
    },
    {
      path: "/login",
      element: <Login />,
      errorElement: <RouteError />
    },
    {
      path: "/signup",
      element: <Signup />,
      errorElement: <RouteError />
    },
    
    // Routes with sidebar - wrapped in MainLayout (Protected)
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <MainLayout />
         </ProtectedRoute>
      ),
      errorElement: <RouteError />,
      children: [
        {
          path: "dashboard",
          element: <Dashboard />,
          errorElement: <RouteError />
        },
        
        {
          path: "wizard",
          element: <Wizard />,
          errorElement: <RouteError />
        },
        {
          path: "reports",
          element: <Reports />,
          errorElement: <RouteError />
        },
        {
          path: "canvas",
          element: <Canvas />,
          errorElement: <RouteError />
        },
        {
          path: "analytics",
          element: <Analytics />,
          errorElement: <RouteError />
        }
      ]
    }
  ])

  return (
    <SidebarProvider>
      <RouterProvider router={router} />
      <Toaster 
        position="top-right" 
        closeButton
        toastOptions={{
          style: {
            background: '#FFFFFF',
            border: '1px solid #BA7967',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(186, 121, 103, 0.15)',
          },
          className: 'font-sans',
          success: {
            style: {
              background: '#FFFFFF',
              border: '2px solid #BA7967',
              color: '#1F2937',
            },
            iconTheme: {
              primary: '#BA7967',
              secondary: '#FFFFFF',
            },
          },
          error: {
            style: {
              background: '#FEF2F2',
              border: '2px solid #EF4444',
              color: '#991B1B',
            },
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
          loading: {
            style: {
              background: '#FFFFFF',
              border: '2px solid #BA7967',
              color: '#1F2937',
            },
            iconTheme: {
              primary: '#BA7967',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </SidebarProvider>
  );
}

export default App;