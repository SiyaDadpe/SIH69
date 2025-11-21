import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useSidebar } from '../contexts/SidebarContext'
import { cn } from '@/lib/utils'

function MainLayout() {
  const { sidebarOpen } = useSidebar()

  return (
    <div className="fixed inset-0">
      <Sidebar />
      <Header />
      <main 
        className={cn(
          "absolute right-0 bottom-0 overflow-auto bg-[#FFFFFF] transition-all duration-300 ease-out",
          sidebarOpen ? "left-[260px] top-16" : "left-16 top-16"
        )}
      >
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout