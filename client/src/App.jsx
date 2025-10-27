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
import { SidebarProvider } from './contexts/SidebarContext';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const router = createBrowserRouter([
    // Routes without sidebar
    {
      path: "/",
      element: <Landing />
    },
    {
      path: "/login",
      element: <Login />
    },
    {
      path: "/signup",
      element: <Signup />
    },
    
    // Routes with sidebar - wrapped in MainLayout
    {
      path: "/",
      element: <MainLayout />,
      children: [
        {
          path: "dashboard",
          element: <Dashboard />
        },
        {
          path: "projects",
          element: <Projects />
        },
        {
          path: "wizard",
          element: <Wizard />
        },
        {
          path: "reports",
          element: <Reports />
        },
        {
          path: "canvas",
          element: <Canvas />
        },
        {
          path: "analytics",
          element: <Analytics/>
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