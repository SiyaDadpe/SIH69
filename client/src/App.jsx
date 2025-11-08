import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import Wizard from './pages/Wizard';
import Reports from './pages/Reports';
import Projects from './pages/Projects';
import Canvas from './pages/Canvas';
import Analytics from './pages/Analytics';
import MainLayout from './layouts/MainLayout';
import RouteError from './components/RouteError';
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
    
    // Routes with sidebar - wrapped in MainLayout
    {
      path: "/",
      element: <MainLayout />,
      errorElement: <RouteError />,
      children: [
        {
          path: "dashboard",
          element: <Dashboard />,
          errorElement: <RouteError />
        },
        {
          path: "projects",
          element: <Projects />,
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
      <Toaster position="top-right" richColors closeButton />
    </SidebarProvider>
  );
}

export default App;