"use client"

import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Folder, Paintbrush, Wand2, FileBarChart, LogOut, ChevronsUpDown, User2 } from "lucide-react"
import users from "@/data/users.json"

const HEADER_HEIGHT = 10

export default function Sidebar() {
  const [sidebarOpen] = useState(true)
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
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-0 z-30 w-[260px] border-r text-card-foreground transition-transform duration-200 ease-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
      aria-label="Sidebar navigation"
      style={{ paddingTop: HEADER_HEIGHT, backgroundColor: "#F7F7F4" }}
    >
      <nav className="flex h-full flex-col">
        <div className="px-3 py-4">
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Menu
          </div>
          <ul className="space-y-1">
            <li>
              <Link
                to="/dashboard"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-foreground transition hover:bg-secondary/50",
                  isActive("/dashboard") && "bg-secondary/30"
                )}
                aria-current={isActive("/dashboard") ? "page" : undefined}
              >
                <LayoutDashboard className="size-4 text-secondary-foreground" />
                <span className="font-medium">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                to="/projects"
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-foreground transition hover:bg-muted",
                  isActive("/projects") && "bg-secondary/30"
                )}
              >
                <Folder className="size-4 opacity-80 group-hover:opacity-100" />
                <span>Projects</span>
              </Link>
            </li>
            <li>
              <Link
                to="/canvas"
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-foreground transition hover:bg-muted",
                  isActive("/canvas") && "bg-secondary/30"
                )}
              >
                <Paintbrush className="size-4 opacity-80 group-hover:opacity-100" />
                <span>Canvas</span>
              </Link>
            </li>
            <li>
              <Link
                to="/wizard"
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-foreground transition hover:bg-muted",
                  isActive("/wizard") && "bg-secondary/30"
                )}
              >
                <Wand2 className="size-4 opacity-80 group-hover:opacity-100" />
                <span>Wizard</span>
              </Link>
            </li>
            <li>
              <Link
                to="/reports"
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-foreground transition hover:bg-muted",
                  isActive("/reports") && "bg-secondary/30"
                )}
              >
                <FileBarChart className="size-4 opacity-80 group-hover:opacity-100" />
                <span>Reports</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="mt-auto px-3 py-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex w-full items-center gap-3 rounded-md border bg-card px-3 py-2 text-left shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {initials || <User2 className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{currentUser?.name || "User"}</p>
                <p className="truncate text-xs text-muted-foreground">{currentUser?.email}</p>
              </div>
              <ChevronsUpDown className="size-4 text-muted-foreground" />
            </button>

            {menuOpen && (
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
          </div>
        </div>
      </nav>
    </aside>
  )
}