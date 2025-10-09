import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

function MainLayout() {
  const SIDEBAR_WIDTH = 260; // Based on the w-[260px] class in Sidebar.jsx
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main 
        className="flex-1 transition-all duration-200 ease-out p-4"
        style={{ marginLeft: SIDEBAR_WIDTH }}
      >
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout