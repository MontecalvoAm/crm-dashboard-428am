'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  LogOut, Bell, ChevronDown, Search, Loader2, ShieldAlert, ChevronRight 
} from 'lucide-react';
import { DynamicIcon } from '@/components/common/DynamicIcon';

interface NavigationItem {
  id: number;
  key: string;
  label: string;
  path: string;
  icon_name: string;
  sort_order: number;
  parent_id: number | null;
  is_parent: number;
  children?: NavigationItem[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // The specific token used to identify Super Admins
  const SUPER_ADMIN_TOKEN = 'role_dbf36ff3e3827639223983ee8ac47b42';

  const [authorized, setAuthorized] = useState(false);
  const [menuItems, setMenuItems] = useState<NavigationItem[]>([]);
  const [openMenus, setOpenMenus] = useState<Record<number, boolean>>({});
  
  // Updated state to include tokens
  const [userProfile, setUserProfile] = useState({ 
    token: '', 
    firstName: 'User', 
    lastName: '', 
    email: '', 
    roleToken: '', 
    companyToken: '',
    role_name: '' 
  });
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [isPathAuthorized, setIsPathAuthorized] = useState(true);

  // Determine admin status
  const isSuperAdmin = userProfile.roleToken === SUPER_ADMIN_TOKEN;

  const menuTree = useMemo(() => {
    const itemMap: Record<number, NavigationItem> = {};
    
    menuItems.forEach(item => {
      // LOGIC: If NOT super admin and item is 'companies', modify it dynamically
      let finalLabel = item.label;
      let finalPath = item.path;

      if (item.key === 'companies' && !isSuperAdmin) {
        finalLabel = 'Company'; // Singular
        finalPath = `/companies/${userProfile.companyToken}`; // Direct to their company
      }

      itemMap[Number(item.id)] = { 
        ...item, 
        label: finalLabel, 
        path: finalPath, 
        children: [] 
      };
    });

    const tree: NavigationItem[] = [];
    menuItems.forEach(item => {
      const currentItem = itemMap[Number(item.id)];
      const pId = item.parent_id ? Number(item.parent_id) : null;
      if (pId && itemMap[pId]) {
        itemMap[pId].children?.push(currentItem);
      } else {
        tree.push(currentItem);
      }
    });

    return tree.sort((a, b) => a.sort_order - b.sort_order);
  }, [menuItems, isSuperAdmin, userProfile.companyToken]);

  const toggleMenu = (id: number) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setAuthorized(false);
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUserProfile(parsedUser);
    setAuthorized(true);

    const loadNavigation = async () => {
      try {
        setLoadingMenu(true);
        const response = await fetch(`/api/auth/navigation?userToken=${parsedUser.token}`);
        const data = await response.json();
        
        if (data.success && data.data.menu) {
          const menu: NavigationItem[] = data.data.menu;
          setMenuItems(menu);

          // Security: If non-admin tries to access /companies (the list), block them
          if (pathname === '/companies' && parsedUser.roleToken !== SUPER_ADMIN_TOKEN) {
            setIsPathAuthorized(false);
            setTimeout(() => router.push(`/companies/${parsedUser.companyToken}`), 2000);
            return;
          }

          const activeItem = menu.find(item => pathname === item.path);
          if (activeItem?.parent_id) {
            setOpenMenus(prev => ({ ...prev, [Number(activeItem.parent_id)]: true }));
          }

          if (pathname === '/dashboard') {
            setIsPathAuthorized(true);
            return;
          }

          // Dynamic Path authorization check
          const hasAccess = menu.some(item => {
             // Admin has access to exact path or subpaths
             if (pathname === item.path || pathname.startsWith(`${item.path}/`)) return true;
             // Non-admin logic for /companies/[token]
             if (item.key === 'companies' && pathname.startsWith('/companies/')) return true;
             return false;
          });

          if (!hasAccess) {
            setIsPathAuthorized(false);
            setTimeout(() => router.push('/dashboard'), 3000);
          } else {
            setIsPathAuthorized(true);
          }
        }
      } catch (error) {
        console.error('Failed to load navigation:', error);
      } finally {
        setLoadingMenu(false);
      }
    };
    loadNavigation();
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.href = '/';
  };

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <aside className="w-72 bg-white border-r border-gray-100 hidden md:flex flex-col p-6 sticky top-0 h-screen z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-yellow-100">
            CRM
          </div>
          <span className="font-bold text-gray-900 tracking-tight text-lg">Main Panel</span>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
          {loadingMenu ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-yellow-400 animate-spin" /></div>
          ) : (
            menuTree.map((item) => (
              <div key={item.id} className="space-y-1">
                {item.is_parent ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-2xl transition-all group whitespace-nowrap ${
                        item.children?.some(c => pathname === c.path)
                          ? 'text-yellow-600 bg-yellow-50/50 shadow-sm' 
                          : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <DynamicIcon name={item.icon_name} className="w-5 h-5 transition-transform group-hover:scale-110" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${openMenus[item.id] ? 'rotate-90' : ''}`} />
                    </button>

                    {openMenus[item.id] && (
                      <div className="ml-10 mt-1 space-y-1 border-l-2 border-gray-50 animate-in slide-in-from-top-2 duration-300">
                        {item.children?.map((child) => (
                          <Link
                            key={child.id}
                            href={child.path}
                            className={`flex items-center px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                              pathname === child.path 
                                ? 'text-yellow-600 bg-yellow-50 shadow-sm border-l-2 border-yellow-400' 
                                : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-50'
                            }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all whitespace-nowrap group ${
                      pathname === item.path || (item.key === 'companies' && pathname.startsWith('/companies/'))
                      ? 'text-yellow-600 bg-yellow-50 shadow-md shadow-yellow-100/50 border-l-4 border-yellow-400' 
                      : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50/30'
                    }`}
                  >
                    <DynamicIcon name={item.icon_name} className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-50">
          <div className="px-4 py-4 bg-gray-50 rounded-2xl text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CRM DASHBOARD</p>
            <p className="text-[9px] font-bold text-yellow-500 uppercase mt-1">@2025</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm shadow-gray-50/50">
          <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-transparent focus-within:border-yellow-200 focus-within:bg-white transition-all w-96 max-w-full">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Quick search..." className="bg-transparent border-none outline-none text-sm w-full font-medium" />
          </div>
          
          <div className="flex items-center gap-5">
            <button className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-yellow-500 relative transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-1.5 pr-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group"
              >
                <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {userProfile.firstName?.[0]}{userProfile.lastName?.[0]}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-gray-900 leading-none">{userProfile.firstName} {userProfile.lastName}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase">{userProfile.role_name || 'Admin'}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-60 bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-top-2">
                  <div className="p-5 border-b border-gray-50 bg-gray-50/50 text-sm">
                    <p className="font-bold text-gray-900">{userProfile.firstName} {userProfile.lastName}</p>
                    <p className="text-xs text-gray-500 truncate mt-1">{userProfile.email}</p>
                  </div>
                  <div className="p-2">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          {loadingMenu ? (
             <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-10 h-10 text-yellow-400 animate-spin" /></div>
          ) : !isPathAuthorized ? (
            <div className="flex flex-col items-center justify-center h-[60vh] animate-in zoom-in-95">
               <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6"><ShieldAlert className="w-10 h-10 text-red-500" /></div>
               <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Access Denied</h2>
               <p className="text-sm text-gray-500 mt-2 text-center max-w-xs">You don&apos;t have permission to access the company directory. Redirecting...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}