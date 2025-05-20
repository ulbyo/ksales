
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, BarChart, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Dashboard", path: "/dashboard", requiresAuth: true },
  ];

  return (
    <nav className="border-b border-gray-800 backdrop-blur-md bg-black bg-opacity-80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          K-Pop Album Pulse
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            {navItems.map(
              (item) =>
                (!item.requiresAuth || user) && (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "text-xs hover:text-white px-3 py-1 rounded-md transition-colors",
                      isActive(item.path)
                        ? "bg-white/10 text-white"
                        : "text-gray-400"
                    )}
                  >
                    {item.name}
                  </Link>
                )
            )}
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs border-gray-800">
                  <User className="h-3 w-3 mr-1" />
                  Account
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-xs">
                <DropdownMenuItem className="text-xs">
                  <Link to="/dashboard" className="flex items-center w-full">
                    <BarChart className="h-3 w-3 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => signOut()}>
                  <div className="flex items-center w-full">
                    <LogOut className="h-3 w-3 mr-2" />
                    Sign Out
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="text-xs border-gray-800">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
