import React, { useState, useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Bell,
  User,
  LogOut,
  Settings,
  Home,
  Users,
  FileText,
  Database,
  Cog,
  Lock,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Building2,
  Shield,
  CreditCard,
  Globe,
  UserCog,
  Wrench,
  BarChart3,
  MoreVertical,
  ClipboardList,
  KanbanSquare,
  ListCheck,
  Bug,
  Timer,
} from "lucide-react";
import { authServices } from "@/api/services";
import { Badge } from "../ui/badge";
import { Link, useLocation } from "react-router-dom";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ThemeToggle } from "@/components/theme-toggle";
import logo from "@/assests/logo/android-chrome-512x512.png";


interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

interface NavigationItem {
  icon: any;
  label: string;
  path?: string;
  module?: string;
  children?: NavigationItem[];
}

// Cookie utilities with user-specific keys
const getUserSpecificKey = (baseKey: string, userEmail: string | undefined) => {
  if (!userEmail) return baseKey;
  const hash = userEmail.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `${baseKey}_${Math.abs(hash)}`;
};

const setCookie = (name: string, value: string, days: number = 30) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
}) => {
  const { user, logout, completeUser, updateUserPermissions } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileOptionsOpen, setIsMobileOptionsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [clickedMenu, setClickedMenu] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [currentModule, setCurrentModule] = useState<string | null>(null);

  const sidebarCookieKey = getUserSpecificKey("sidebar-collapsed", user?.email);
  const expandedMenusCookieKey = getUserSpecificKey("expanded-menus", user?.email);


  useEffect(() => {
    if (user?.email) {
      if (!isMobileMenuOpen) {
        const savedCollapsedState = getCookie(sidebarCookieKey);
        if (savedCollapsedState !== null) {
          setIsSidebarCollapsed(savedCollapsedState === "true");
        }
      }

      const savedExpandedMenus = getCookie(expandedMenusCookieKey);
      if (savedExpandedMenus) {
        try {
          const expandedArray = JSON.parse(savedExpandedMenus);
          setExpandedMenus(new Set(expandedArray));
        } catch (error) {
          console.error("Error parsing expanded menus cookie:", error);
        }
      }
    }
  }, [user?.email, sidebarCookieKey, expandedMenusCookieKey, isMobileMenuOpen]);

  const handleSidebarToggle = (state?: boolean, isMobile: boolean = false) => {
    const newCollapsedState = isMobile ? false : state;
    setIsSidebarCollapsed(newCollapsedState);
    setCookie(sidebarCookieKey, newCollapsedState.toString());

    if (!isMobile && newCollapsedState) {
      setExpandedMenus(new Set());
      setCookie(expandedMenusCookieKey, "[]");
      setClickedMenu(null);
    }
  };

  const toggleMenuExpansion = (menuKey: string) => {
    if (isSidebarCollapsed) return;

    const newExpandedMenus = new Set(expandedMenus);
    if (newExpandedMenus.has(menuKey)) {
      newExpandedMenus.delete(menuKey);
    } else {
      newExpandedMenus.add(menuKey);
    }
    setExpandedMenus(newExpandedMenus);
    setCookie(expandedMenusCookieKey, JSON.stringify(Array.from(newExpandedMenus)));
  };

  const { data: userModule } = useQuery({
    queryKey: ["user-module"],
    queryFn: async () => {
      const response = await authServices.getCurrentUserModule();
      return response.data;
    },
  });


  useEffect(() => {
    if (user?.subscription_modal_force && user?.role === "company_super_admin") {
      setShowSubscriptionModal(true);
    }
  }, [user]);

  const getNavigationItems = (): NavigationItem[] => {
    if (user?.role === "master_admin") {
      return [
        { icon: Home, label: "Dashboard", path: "/master/dashboard" },
        { icon: Building2, label: "Companies", path: "/master/companies" },
        { icon: Shield, label: "Permission", path: "/master/permissions" },
        { icon: CreditCard, label: "Plans", path: "/master/plans" },
        { icon: Globe, label: "Master Dropdown", path: "/master/dropdowns" },
        { icon: Cog, label: "Custom Module", path: "/master/custom-modules" },
        { icon: Wrench, label: "Website Maintenance", path: "/master/maintenance" },
        { icon: FileText, label: "Global Logs", path: "/master/global-logs" },
        { icon: Settings, label: "Settings", path: "/master/settings" },
      ];
    }

    if (user?.role === "company_super_admin") {
      return [
        { icon: Home, label: "Dashboard", path: "/company/dashboard", module: "project_dashboard" },
        { icon: Users, label: "Users", path: "/company/users", module: "project_user" },
        { icon: Shield, label: "Permission", path: "/company/permissions", module: "project_permission" },
        { icon: Database, label: "Dropdown Master", path: "/company/dropdown-master", module: "dropdown_master" },
        {
          icon: ClipboardList,
          label: "Project Management",
          module: "project_management",
          children: [
            { icon: KanbanSquare, label: "Projects", path: "/company/project_list" },
            { icon: ListCheck, label: "Tasks", path: "/company/task_list" },
            { icon: Bug, label: "Bugs", path: "/company/bug_list" },
            { icon: Timer, label: "TimeLogs", path: "/company/timelog_list" },
          ],
        },
        { icon: UserCog, label: "Settings", path: "/company/settings", module: "company_settings" },
      ];
    }

    return [
      { icon: BarChart3, label: "Dashboard", path: "/company/dashboard", module: "project_dashboard" },
      {
        icon: ClipboardList,
        label: "Project Management",
        module: "project_management",
        children: [
          { icon: KanbanSquare, label: "Projects", path: "/company/project_list" },
          { icon: ListCheck, label: "Tasks", path: "/company/task_list" },
          { icon: Bug, label: "Bugs", path: "/company/bug_list" },
          { icon: Timer, label: "TimeLogs", path: "/company/timelog_list" },
        ],
      },
    ];
  };


  const getFilteredNavigationItems = (): NavigationItem[] => {
    const allNavigationItems = getNavigationItems();

    if (user?.role === "master_admin") {
      return allNavigationItems;
    }

    if (!userModule?.data?.module || !Array.isArray(userModule.data.module)) {
      return allNavigationItems?.filter((item) => !item.module);
    }

    return allNavigationItems.filter((item) => {
      if (!item.module) return true;
      return userModule.data.module.includes(item.module);
    });
  };

  const navigationItems = getFilteredNavigationItems();

  const hasNoModuleAccess =
    (user?.role === "company_admin" || user?.role === "company_super_admin") &&
    (!userModule?.data?.module ||
      !Array.isArray(userModule.data.module) ||
      userModule.data.module.length === 0);

  const isMenuActive = (item: NavigationItem): boolean => {
    if (item.path && location.pathname === item.path) return true;
    if (item.children) {
      return item.children.some((child) => child.path === location.pathname);
    }
    return false;
  };

  useEffect(() => {
    if (!isSidebarCollapsed) {
      const newExpandedMenus = new Set(expandedMenus);
      let hasChanges = false;

      navigationItems.forEach((item, index) => {
        if (item.children) {
          const menuKey = `menu-${index}`;
          const isChildActive = item.children.some((child) => child.path === location.pathname);

          if (isChildActive && !expandedMenus.has(menuKey)) {
            newExpandedMenus.add(menuKey);
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        setExpandedMenus(newExpandedMenus);
        setCookie(expandedMenusCookieKey, JSON.stringify(Array.from(newExpandedMenus)));
      }
    }
  }, [location.pathname, isSidebarCollapsed, expandedMenusCookieKey]);


  useEffect(() => {
    const shouldFetchPermissions =
      user?.role === "company_admin" ||
      (user?.role === "company_super_admin" && !completeUser?.is_primary_admin);

    if (!shouldFetchPermissions) return;

    let detectedModule: string | null = null;
    for (const item of navigationItems) {
      if (item.module) {
        if (item.path === location.pathname) {
          detectedModule = item.module;
          break;
        }
        if (item.children) {
          const childMatch = item.children.find((child) => child.path === location.pathname);
          if (childMatch) {
            detectedModule = item.module;
            break;
          }
        }
      }
    }

    if (detectedModule && detectedModule !== currentModule) {
      setCurrentModule(detectedModule);

      authServices
        .getCurrentUserPermissions(detectedModule)
        .then((response) => {
          const { permissions, hasFullAccess } = response.data.data;
          updateUserPermissions(permissions || [], hasFullAccess || false);
        })
        .catch((error) => {
          console.error("Error fetching permissions:", error);
        });
    }
  }, [location.pathname, user?.role, completeUser?.is_primary_admin, navigationItems, currentModule]);

  const NoAccessContent = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center p-8 max-w-md glass-card rounded-2xl">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Lock className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-4 gradient-text">Access Restricted</h2>
        <p className="text-muted-foreground mb-4">
          You don't have access to any modules. Please contact your administrator to get the necessary permissions.
        </p>
        <p className="text-sm text-muted-foreground">
          Administrator can assign module permissions from the User Management section.
        </p>
      </div>
    </div>
  );


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const popoverContent = document.querySelector("[data-radix-popover-content]");
      const popoverTrigger = document.querySelector("[data-radix-popover-trigger]");

      if (
        popoverContent &&
        !popoverContent.contains(event.target as Node) &&
        popoverTrigger &&
        !popoverTrigger.contains(event.target as Node)
      ) {
        setClickedMenu(null);
      }
    };

    if (clickedMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [clickedMenu]);

  const handleMenuClick = (menuKey: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setClickedMenu(clickedMenu === menuKey ? null : menuKey);
  };

  const renderCollapsedMenuItem = (item: NavigationItem, index: number) => {
    const Icon = item.icon;
    const isActive = isMenuActive(item);
    const menuKey = `menu-${index}`;
    const isOpen = clickedMenu === menuKey;

    if (item.children && item.children.length > 0) {
      return (
        <div key={menuKey}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div>
                <Popover open={isOpen} onOpenChange={(open) => { if (!open) setClickedMenu(null); }}>
                  <PopoverTrigger asChild>
                    <button
                      className={`flex items-center justify-center p-3 rounded-xl transition-all duration-300 cursor-pointer w-full group ${
                        isActive
                          ? "bg-gradient-to-r from-primary to-accent text-white shadow-glow"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-soft"
                      }`}
                      onClick={(e) => handleMenuClick(menuKey, e)}
                      type="button"
                    >
                      <Icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" className="w-52 p-2" sideOffset={8} align="start">
                    <div className="space-y-1">
                      <div className="font-semibold text-sm px-3 py-2 border-b border-border/50 mb-2 text-foreground">
                        {item.label}
                      </div>
                      {item.children.map((child, childIndex) => {
                        const ChildIcon = child.icon;
                        const isChildActive = location.pathname === child.path;
                        return (
                          <Link
                            key={childIndex}
                            to={child.path || "#"}
                            className={`flex items-center p-2.5 rounded-lg transition-all duration-200 text-sm ${
                              isChildActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                            onClick={() => { setIsMobileMenuOpen(false); setClickedMenu(null); }}
                          >
                            <ChildIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right"><p>{item.label}</p></TooltipContent>
          </Tooltip>
        </div>
      );
    }


    return (
      <Tooltip key={index} delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            to={item.path || "#"}
            className={`flex items-center justify-center p-3 rounded-xl transition-all duration-300 group ${
              isActive
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-glow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-soft"
            }`}
            onClick={() => { setIsMobileMenuOpen(false); setClickedMenu(null); }}
          >
            <Icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right"><p>{item.label}</p></TooltipContent>
      </Tooltip>
    );
  };

  const renderNavigationItem = (item: NavigationItem, index: number) => {
    if (isSidebarCollapsed) return renderCollapsedMenuItem(item, index);

    const Icon = item.icon;
    const isActive = isMenuActive(item);
    const menuKey = `menu-${index}`;
    const isExpanded = expandedMenus.has(menuKey);

    if (item.children && item.children.length > 0) {
      return (
        <Collapsible key={menuKey} open={isExpanded} onOpenChange={() => toggleMenuExpansion(menuKey)}>
          <CollapsibleTrigger
            className={`w-full flex items-center rounded-xl transition-all duration-300 p-3 space-x-3 justify-between group ${
              isActive
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-glow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-soft"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="font-medium">{item.label}</span>
            </div>
            <div className="ml-auto">
              {isExpanded ? <ChevronDown className="h-4 w-4 transition-transform duration-300" /> : <ChevronRight className="h-4 w-4 transition-transform duration-300" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="ml-6 mt-2 space-y-1 border-l-2 border-border/50 pl-4">
              {item.children.map((child, childIndex) => {
                const ChildIcon = child.icon;
                const isChildActive = location.pathname === child.path;
                return (
                  <Link
                    key={childIndex}
                    to={child.path || "#"}
                    className={`flex items-center p-2.5 rounded-lg transition-all duration-200 text-sm group ${
                      isChildActive
                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ChildIcon className="h-4 w-4 mr-3 transition-transform duration-200 group-hover:scale-110" />
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }


    return (
      <Link
        key={index}
        to={item.path || "#"}
        className={`flex items-center rounded-xl transition-all duration-300 p-3 space-x-3 group ${
          isActive
            ? "bg-gradient-to-r from-primary to-accent text-white shadow-glow"
            : "text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-soft"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  const Sidebar = ({ className = "" }) => (
    <div
      className={`flex flex-col h-full glass-card border-r border-border/30 transition-all duration-300 ease-out ${className} ${
        isSidebarCollapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Logo Section */}
      <div className="p-4 flex items-center justify-between border-b border-border/30">
        <div className={`flex items-center transition-all duration-300 ${isSidebarCollapsed ? "justify-center w-full" : "space-x-3"}`}>
          {!isSidebarCollapsed && (
            <>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                <img src={logo} className="h-6 w-6" alt="Logo" />
              </div>
              <span className="text-lg font-bold gradient-text">Project Hub</span>
            </>
          )}
          {isSidebarCollapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                  <img src={logo} className="h-6 w-6" alt="Logo" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right"><p>Project Hub</p></TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto py-4 custom-scrollbar">
        {navigationItems.length > 0 ? (
          <TooltipProvider>
            {navigationItems.map((item, index) => renderNavigationItem(item, index))}
          </TooltipProvider>
        ) : (
          <div className={`text-center p-4 text-muted-foreground transition-all duration-300 ${isSidebarCollapsed ? "px-2" : ""}`}>
            <Lock className="h-6 w-6 mx-auto mb-2 opacity-50" />
            {!isSidebarCollapsed && <p className="text-sm">No modules accessible</p>}
          </div>
        )}
      </nav>


      {/* User Section */}
      <div className="p-3 border-t border-border/30">
        <div className={`flex items-center transition-all duration-300 ${isSidebarCollapsed ? "justify-center" : "space-x-3 mb-3"}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 ring-2 ring-primary/20">
            <User className="h-5 w-5 text-primary" />
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden transition-all duration-300 flex-1">
              <p className="font-medium text-sm truncate text-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">{user?.role?.replace("_", " ")}</p>
            </div>
          )}
        </div>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              onClick={logout}
              variant="ghost"
              className={`w-full transition-all duration-300 hover:bg-destructive/10 hover:text-destructive ${
                isSidebarCollapsed ? "p-2 justify-center" : "justify-start"
              }`}
            >
              <LogOut className="h-4 w-4" />
              {!isSidebarCollapsed && <span className="ml-2">Logout</span>}
            </Button>
          </TooltipTrigger>
          {isSidebarCollapsed && <TooltipContent side="right"><p>Logout</p></TooltipContent>}
        </Tooltip>
      </div>
    </div>
  );

  const MobileOptionsContent = () => (
    <div className="flex flex-col h-full p-6 space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold gradient-text">Account Details</h3>
        <div className="flex items-center space-x-3 p-4 glass-card rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-medium truncate">{user?.email}</p>
            <p className="text-sm text-muted-foreground capitalize truncate">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>
        {completeUser?.company_id?._id && (
          <div className="p-4 glass-card rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Company ID</p>
            <p className="font-medium">{completeUser.company_id._id}</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between p-4 glass-card rounded-xl">
        <span className="font-medium">Theme</span>
        <ThemeToggle />
      </div>
      <Link to="/docs" onClick={() => setIsMobileOptionsOpen(false)}>
        <Button variant="outline" className="w-full justify-start" size="lg">
          <FileText className="h-5 w-5 mr-3" />
          Documentation
        </Button>
      </Link>
      <div className="mt-auto pt-4 border-t border-border/30">
        <Button
          onClick={() => { logout(); setIsMobileOptionsOpen(false); }}
          variant="destructive"
          className="w-full justify-start"
          size="lg"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );


  return (
    <div className="h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={(open) => { setIsMobileMenuOpen(open); handleSidebarToggle(false, true); }}>
        <SheetContent side="left" className="w-64 p-0 glass-card">
          <Sidebar className="w-full border-r-0" />
        </SheetContent>
      </Sheet>

      {/* Mobile Options Sheet */}
      <Sheet open={isMobileOptionsOpen} onOpenChange={setIsMobileOptionsOpen}>
        <SheetContent side="right" className="w-80 p-0 glass-card">
          <MobileOptionsContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="glass-card border-b border-border/30 px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={(open) => { setIsMobileMenuOpen(open); handleSidebarToggle(false, true); }}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>

            {/* Desktop Sidebar Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-glow"
              onClick={() => handleSidebarToggle(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>

            <h1 className="text-lg md:text-2xl font-bold truncate">
              {hasNoModuleAccess ? "Access Restricted" : title}
            </h1>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            </Button>
            {completeUser?.company_id?._id && (
              <Badge variant="outline" className="ml-2">
                Company Name : {completeUser.company_id.company_name}
              </Badge>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOptionsOpen(true)}>
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-1 md:p-3">
          {hasNoModuleAccess ? <NoAccessContent /> : children}
        </main>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={user?.subscription_modal_force ? undefined : () => setShowSubscriptionModal(false)}
        canClose={!user?.subscription_modal_force}
        mode="new"
        onSuccess={() => setShowSubscriptionModal(false)}
        fullScreen={user?.subscription_modal_force}
      />
    </div>
  );
};

export default DashboardLayout;
