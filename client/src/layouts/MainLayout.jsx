import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

function MainLayout() {
  return (
    <div className="fixed inset-0">
      <Sidebar />
      <main className="absolute inset-y-0 left-[260px] right-0 overflow-auto p-6 bg-[#efefe8]">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout