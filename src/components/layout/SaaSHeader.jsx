import { useState, useEffect } from "react";
import {
  Bell,
  Settings,
  User,
  ChevronDown,
  Shield,
  BarChart3,
  MessageSquare,
  History,
  LogOut,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";

const navigationItems = [
  { icon: BarChart3, label: "Dashboard", path: "/" },
  { icon: Shield, label: "Controls", path: "/home" },
  { icon: MessageSquare, label: "ChatBot", path: "/chatbot" },
  { icon: History, label: "History", path: "/history" },
];

export function SaaSHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("User");
  const [userInitials, setUserInitials] = useState("U");
  const [userRole, setUserRole] = useState("Compliance User");

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.name) {
          const fullName = decodedToken.name;
          setUserName(fullName);
          const nameParts = fullName.split(" ");
          const initials =
            nameParts.length > 1
              ? `${nameParts[0][0]}${nameParts[1][0]}`
              : fullName.substring(0, 2);
          setUserInitials(initials.toUpperCase());
          if (decodedToken.role) {
            setUserRole(decodedToken.role);
          }
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
    window.location.replace("https://miporis.com/login");
  };

  return (
    <header className="border-b border-border bg-gradient-to-r from-card to-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex h-20 items-center justify-between">

        {/* Left: Logo + Navigation */}
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img src="/miporisicon.webp" alt="miporis logo" className="h-12 w-12" />
            <span className="text-xl font-bold text-foreground">Miporis</span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Notifications + Settings + User Profile */}
        <div className="flex items-center space-x-4">
          {/* <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
              3
            </Badge>
          </Button> */}

          <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-medium">{userName}</div>
                  <div className="text-xs text-muted-foreground">{userRole}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
