"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { LayoutDashboard, Folder, Paintbrush, Wand2, FileBarChart } from "lucide-react"

const HEADER_HEIGHT = 10

export default function Sidebar() {
  const [sidebarOpen] = useState(true)
  const [isLoading] = useState(false)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-0 z-30 w-[260px] border-r bg-card text-card-foreground transition-transform duration-200 ease-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
      aria-label="Sidebar navigation"
      style={{ paddingTop: HEADER_HEIGHT }}
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
          <Card className="border-dashed">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Storage</CardTitle>
              <CardDescription className="text-xs">Used 62% of 40GB</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-2 w-full" />
                  <div className="flex items-center justify-between text-xs">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </>
              ) : (
                <>
                  <Progress value={62} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>24.8 GB</span>
                    <span>40 GB</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </nav>
    </aside>
  )
}