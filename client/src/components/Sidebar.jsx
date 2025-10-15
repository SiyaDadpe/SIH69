"use client"

import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Folder, Paintbrush, Wand2, FileBarChart, LogOut, ChevronsUpDown, User2, ChevronLeft, ChevronRight } from "lucide-react"
import users from "@/data/users.json"
import { useSidebar } from "@/contexts/SidebarContext"

const HEADER_HEIGHT = 10

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useSidebar()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  const currentUser = users?.[0]
  const initials = (currentUser?.name || "User")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const handleLogout = () => {
    navigate("/login")
  }

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "fixed top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border shadow-lg transition-all duration-300 hover:bg-white hover:shadow-xl",
          sidebarOpen ? "left-[220px]" : "left-4"
        )}
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-600" />
        )}
      </button>

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-30 border-r text-card-foreground transition-all duration-300 ease-out",
          sidebarOpen ? "w-[260px] translate-x-0" : "w-16 translate-x-0"
        )}
        aria-label="Sidebar navigation"
        style={{ paddingTop: HEADER_HEIGHT, backgroundColor: "#F7F7F4" }}
      >
        <nav className="flex h-full flex-col">
          <div className={cn(
            "px-3 transition-all duration-300",
            sidebarOpen ? "py-4" : "py-16"
          )}>
            {sidebarOpen && (
              <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Menu
              </div>
            )}
            <ul className="space-y-1">
              <li>
                <Link
                  to="/dashboard"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-foreground transition hover:bg-secondary/50 group",
                    isActive("/dashboard") && "bg-secondary/30",
                    !sidebarOpen && "justify-center"
                  )}
                  aria-current={isActive("/dashboard") ? "page" : undefined}
                  title={!sidebarOpen ? "Dashboard" : undefined}
                >
                  <LayoutDashboard className="size-4 text-secondary-foreground flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium">Dashboard</span>}
                </Link>
              </li>
              <li>
                <Link
                  to="/projects"
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-foreground transition hover:bg-muted",
                    isActive("/projects") && "bg-secondary/30",
                    !sidebarOpen && "justify-center"
                  )}
                  title={!sidebarOpen ? "Projects" : undefined}
                >
                  <Folder className="size-4 opacity-80 group-hover:opacity-100 flex-shrink-0" />
                  {sidebarOpen && <span>Projects</span>}
                </Link>
              </li>
              <li>
                <Link
                  to="/canvas"
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-foreground transition hover:bg-muted",
                    isActive("/canvas") && "bg-secondary/30",
                    !sidebarOpen && "justify-center"
                  )}
                  title={!sidebarOpen ? "Canvas" : undefined}
                >
                  <Paintbrush className="size-4 opacity-80 group-hover:opacity-100 flex-shrink-0" />
                  {sidebarOpen && <span>Canvas</span>}
                </Link>
              </li>
              <li>
                <Link
                  to="/wizard"
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-foreground transition hover:bg-muted",
                    isActive("/wizard") && "bg-secondary/30",
                    !sidebarOpen && "justify-center"
                  )}
                  title={!sidebarOpen ? "Wizard" : undefined}
                >
                  <Wand2 className="size-4 opacity-80 group-hover:opacity-100 flex-shrink-0" />
                  {sidebarOpen && <span>Wizard</span>}
                </Link>
              </li>
              <li>
                <Link
                  to="/reports"
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-foreground transition hover:bg-muted",
                    isActive("/reports") && "bg-secondary/30",
                    !sidebarOpen && "justify-center"
                  )}
                  title={!sidebarOpen ? "Reports" : undefined}
                >
                  <FileBarChart className="size-4 opacity-80 group-hover:opacity-100 flex-shrink-0" />
                  {sidebarOpen && <span>Reports</span>}
                </Link>
              </li>
            </ul>
          </div>

          <div className="mt-auto px-3 py-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md border bg-card px-3 py-2 text-left shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring",
                  !sidebarOpen && "justify-center"
                )}
                title={!sidebarOpen ? currentUser?.name || "User" : undefined}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary flex-shrink-0">
                  {initials || <User2 className="size-4" />}
                </div>
                {sidebarOpen && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{currentUser?.name || "User"}</p>
                      <p className="truncate text-xs text-muted-foreground">{currentUser?.email}</p>
                    </div>
                    <ChevronsUpDown className="size-4 text-muted-foreground" />
                  </>
                )}
              </button>

              {menuOpen && sidebarOpen && (
                <div className="absolute bottom-14 left-0 right-0 z-50 overflow-hidden rounded-md border bg-popover shadow-lg">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{currentUser?.name}</p>
                    <p className="text-xs text-muted-foreground">{currentUser?.organization}</p>
                  </div>
                  <div className="h-px bg-border" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </div>
              )}
              
              {/* Collapsed state logout button */}
              {!sidebarOpen && (
                <button
                  onClick={handleLogout}
                  className="mt-2 flex w-full items-center justify-center rounded-md px-3 py-2 text-foreground transition hover:bg-muted"
                  title="Logout"
                >
                  <LogOut className="size-4" />
                </button>
              )}
            </div>
          </div>
        </nav>
      </aside>
    </>
  )
}