'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LogOut, Bell, ChevronDown, Search, Loader2, ShieldAlert 
} from 'lucide-react';
import { DynamicIcon } from '@/components/common/DynamicIcon';

interface NavigationItem {
  id: number;
  key: string;
  label: string;
  path: string;
  icon_name: string;
  sort_order: number;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [authorized, setAuthorized] = useState(false);
  const [menuItems, setMenuItems] = useState<NavigationItem[]>([]);
  const [userProfile, setUserProfile] = useState({ 
    id: 0, 
    token: '', 
    firstName: 'User', 
    lastName: '', 
    email: '', 
    roleId: 0, 
    role_name: '' 
  });
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [isPathAuthorized, setIsPathAuthorized] = useState(true);

  useEffect(() => {
    // SECURITY FIX: We only check for 'user' in localStorage. 
    // The session token is now handled securely via HttpOnly Cookies.
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      setMenuItems([]);
      setUserProfile({ 
        id: 0, token: '', firstName: 'User', lastName: '', 
        email: '', roleId: 0, role_name: '' 
      });
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
        // We use userToken for identity obfuscation as requested
        const response = await fetch(`/api/auth/navigation?userToken=${parsedUser.token}`);
        const data = await response.json();
        
        if (data.success && data.data.menu) {
          const menu: NavigationItem[] = data.data.menu;
          setMenuItems(menu);
          
          if (pathname === '/dashboard') {
            setIsPathAuthorized(true);
            return;
          }

          const hasAccess = menu.some(item => 
            pathname === item.path || pathname.startsWith(`${item.path}/`)
          );

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
    // Manual cookie clearing as a fallback
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    // Hard refresh to clear React State
    window.location.href = '/';
  };

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col p-6 sticky top-0 h-screen z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-yellow-100">
            CRM
          </div>
          <span className="font-bold text-gray-900 tracking-tight">Main Panel</span>
        </div>

        <nav className="flex-1 space-y-2">
          {loadingMenu ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
            </div>
          ) : (
            menuItems.length > 0 ? (
              menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all cursor-pointer group ${
                    pathname === item.path 
                    ? 'text-yellow-600 bg-yellow-50' 
                    : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50'
                  }`}
                >
                  <DynamicIcon 
                    name={item.icon_name} 
                    className="w-5 h-5 transition-transform group-hover:scale-110" 
                  />
                  {item.label}
                </Link>
              ))
            ) : (
              <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest mt-4">
                No Access Granted
              </p>
            )
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-50">
          <div className="px-4 py-4 bg-gray-50 rounded-2xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
              CRM DASHBOARD
            </p>
            <p className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest text-center mt-1">
              @2025
            </p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm shadow-gray-50/50">
          <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-transparent focus-within:border-yellow-200 focus-within:bg-white transition-all w-96 max-w-full">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Quick search..." className="bg-transparent border-none outline-none text-sm w-full cursor-text" />
          </div>

          <div className="flex items-center gap-5">
            <button className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-yellow-500 transition-all cursor-pointer relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-1.5 pr-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {userProfile.firstName?.[0] || 'U'}{userProfile.lastName?.[0] || ''}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-gray-900 leading-none">{userProfile.firstName} {userProfile.lastName}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">
                    {userProfile.role_name || (userProfile.roleId === 1 ? 'Super Admin' : 'Staff')}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-60 bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-top-2">
                  <div className="p-5 border-b border-gray-50 bg-gray-50/50 text-sm">
                    <p className="font-bold text-gray-900">{userProfile.firstName} {userProfile.lastName}</p>
                    <p className="text-gray-500 truncate">{userProfile.email}</p>
                  </div>
                  <div className="p-2">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-2xl transition-all cursor-pointer">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          {loadingMenu ? (
             <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
             </div>
          ) : !isPathAuthorized ? (
            <div className="flex flex-col items-center justify-center h-[60vh] animate-in zoom-in-95 duration-500">
               <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
                  <ShieldAlert className="w-10 h-10 text-red-500" />
               </div>
               <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Access Denied</h2>
               <p className="text-sm text-gray-500 mt-2 text-center max-w-xs">
                 You don&apos;t have permission to access this page. Redirecting you to the dashboard...
               </p>
               <button 
                 onClick={() => router.push('/dashboard')}
                 className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all"
               >
                 Go Back Now
               </button>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}