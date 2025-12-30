'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  LogOut, Bell, ChevronDown, Search, Loader2, 
  ChevronRight, Plus, X, Layout, Link as LinkIcon, Hash, Layers, ListOrdered
} from 'lucide-react';
import { DynamicIcon } from '@/components/common/DynamicIcon';

// --- Interfaces ---
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

// --- Dynamic Add Navigation Modal ---
interface AddNavModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parents: NavigationItem[];
}

function AddNavModal({ isOpen, onClose, onSuccess, parents }: AddNavModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    key: '',
    path: '',
    icon_name: 'Layout',
    sort_order: 1,
    parent_id: '' as string | number,
    is_parent: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/auth/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parent_id: formData.parent_id === '' ? null : Number(formData.parent_id),
          sort_order: Number(formData.sort_order),
          is_parent: Number(formData.is_parent)
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
        setFormData({ label: '', key: '', path: '', icon_name: 'Layout', sort_order: 1, parent_id: '', is_parent: 0 });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl border border-zinc-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 pb-6 flex justify-between items-center border-b border-zinc-50 bg-zinc-50/30">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-white shadow-lg shadow-yellow-200">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Register Nav</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Add to Sidebar Hierarchy</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-100 rounded-2xl text-zinc-300 transition-all cursor-pointer"><X className="w-6 h-6" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Layout className="w-3 h-3 text-yellow-500"/> Label</label>
              <input required className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none focus:bg-white transition-all" placeholder="e.g. Settings" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_')})} />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Hash className="w-3 h-3 text-yellow-500"/> Key</label>
              <input required className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none bg-zinc-100/50" value={formData.key} readOnly />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1"><LinkIcon className="w-3 h-3 text-yellow-500"/> Path (Route)</label>
            <input required className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none focus:bg-white transition-all" placeholder="/dashboard/settings" value={formData.path} onChange={e => setFormData({...formData, path: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Layers className="w-3 h-3 text-yellow-500"/> Parent Menu</label>
              <select className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none appearance-none cursor-pointer" value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})}>
                <option value="">None (Top Level)</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1"><ListOrdered className="w-3 h-3 text-yellow-500"/> Sort Order</label>
              <input type="number" className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none focus:bg-white transition-all" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value) || 1})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1"><DynamicIcon name={formData.icon_name || 'Layout'} className="w-3 h-3 text-yellow-500"/> Icon Name</label>
              <input className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold text-zinc-800 outline-none focus:bg-white transition-all" placeholder="Lucide name e.g. Box" value={formData.icon_name} onChange={e => setFormData({...formData, icon_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">Behavior</label>
              <div className="flex items-center h-full">
                <label className="flex items-center gap-2 cursor-pointer group/check">
                  <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-yellow-400 focus:ring-yellow-400 transition-all" checked={formData.is_parent === 1} onChange={e => setFormData({...formData, is_parent: e.target.checked ? 1 : 0})} />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase group-hover/check:text-yellow-600 transition-colors">Dropdown Parent</span>
                </label>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-6 bg-zinc-900 hover:bg-black text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Confirm Navigation</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Main Layout ---
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const SUPER_ADMIN_TOKEN = 'role_dbf36ff3e3827639223983ee8ac47b42';

  const [authorized, setAuthorized] = useState(false);
  const [menuItems, setMenuItems] = useState<NavigationItem[]>([]);
  const [openMenus, setOpenMenus] = useState<Record<number, boolean>>({});
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);
  
  const [userProfile, setUserProfile] = useState({ 
    token: '', firstName: 'User', lastName: '', email: '', roleToken: '', companyToken: '', role_name: '' 
  });
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(true);

  const isSuperAdmin = userProfile.roleToken === SUPER_ADMIN_TOKEN;

  // --- FIXED TREE BUILDING LOGIC ---
  const menuTree = useMemo(() => {
    const itemMap: Record<number, NavigationItem> = {};
    
    // 1. Map all items
    menuItems.forEach(item => {
      let finalLabel = item.label;
      let finalPath = item.path;
      if (item.key === 'companies' && !isSuperAdmin) {
        finalLabel = 'Company';
        finalPath = `/companies/${userProfile.companyToken}`;
      }
      itemMap[Number(item.id)] = { ...item, label: finalLabel, path: finalPath, children: [] };
    });

    const tree: NavigationItem[] = [];
    
    // 2. Build Hierarchy
    menuItems.forEach(item => {
      const currentItem = itemMap[Number(item.id)];
      const pId = item.parent_id ? Number(item.parent_id) : null;
      
      if (pId && itemMap[pId]) {
        itemMap[pId].children?.push(currentItem);
      } else {
        tree.push(currentItem);
      }
    });

    // 3. Recursive Sort
    const sortTree = (nodes: NavigationItem[]) => {
      nodes.sort((a, b) => a.sort_order - b.sort_order);
      nodes.forEach(node => {
        if (node.children) sortTree(node.children);
      });
      return nodes;
    };

    return sortTree(tree);
  }, [menuItems, isSuperAdmin, userProfile.companyToken]);

  const loadNavigation = useCallback(async (token: string) => {
    try {
      setLoadingMenu(true);
      const response = await fetch(`/api/auth/navigation?userToken=${token}`);
      const data = await response.json();
      if (data.success && data.data.menu) {
        setMenuItems(data.data.menu);
        
        // Auto-open parent menus based on current path
        const activeItem = data.data.menu.find((item: NavigationItem) => pathname === item.path);
        if (activeItem?.parent_id) {
          setOpenMenus(prev => ({ ...prev, [Number(activeItem.parent_id)]: true }));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMenu(false);
    }
  }, [pathname]);

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
    loadNavigation(parsedUser.token);
  }, [router, loadNavigation]);

  const toggleMenu = (id: number) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <aside className="w-72 bg-white border-r border-gray-100 hidden md:flex flex-col p-6 sticky top-0 h-screen z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-yellow-100">CRM</div>
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
                    <button onClick={() => toggleMenu(item.id)} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-2xl transition-all group ${item.children?.some(c => pathname === c.path) ? 'text-yellow-600 bg-yellow-50/50 shadow-sm' : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50/30'}`}>
                      <div className="flex items-center gap-3">
                        <DynamicIcon name={item.icon_name} className="w-5 h-5 transition-transform group-hover:scale-110" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${openMenus[item.id] ? 'rotate-90' : ''}`} />
                    </button>
                    {openMenus[item.id] && (
                      <div className="ml-10 mt-1 space-y-1 border-l-2 border-gray-50">
                        {item.children?.map((child) => (
                          <Link key={child.id} href={child.path} className={`flex items-center px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${pathname === child.path ? 'text-yellow-600 bg-yellow-50 shadow-sm border-l-2 border-yellow-400' : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-50'}`}>
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href={item.path} className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all group ${pathname === item.path || (item.key === 'companies' && pathname.startsWith('/companies/')) ? 'text-yellow-600 bg-yellow-50 shadow-md shadow-yellow-100/50 border-l-4 border-yellow-400' : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50/30'}`}>
                    <DynamicIcon name={item.icon_name} className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))
          )}
        </nav>

        {/* Sidebar Footer with Persistent LARGER Add Button */}
        <div className="mt-auto pt-8 border-t border-gray-100 relative">
          {isSuperAdmin && (
            <button 
              onClick={() => setIsNavModalOpen(true)}
              className="absolute -top-6 right-2 w-12 h-12 bg-yellow-400 text-white rounded-2xl shadow-xl shadow-yellow-100 flex items-center justify-center transition-all hover:bg-zinc-900 active:scale-95 cursor-pointer z-20 hover:rotate-90"
              title="Add Navigation Item"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
          <div className="px-4 py-5 bg-zinc-50 rounded-[2.5rem] border border-zinc-100/50 text-center shadow-inner">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">CRM Dashboard</p>
            <p className="text-[9px] font-bold text-yellow-500 uppercase mt-1 tracking-widest">Version 2025.1</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm shadow-gray-50/20">
          <div className="flex items-center gap-4 bg-gray-50 px-5 py-2.5 rounded-2xl w-96 max-w-full focus-within:bg-white focus-within:border-yellow-200 focus-within:ring-4 focus-within:ring-yellow-400/5 transition-all">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Quick search..." className="bg-transparent border-none outline-none text-sm w-full font-medium" />
          </div>
          
          <div className="flex items-center gap-5">
            <button className="p-3 rounded-2xl text-gray-400 hover:bg-gray-50 relative transition-all"><Bell className="w-5 h-5" /><span className="absolute top-3 right-3 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span></button>
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 p-1.5 pr-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group">
                <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center text-yellow-400 font-bold text-sm">{userProfile.firstName?.[0]}{userProfile.lastName?.[0]}</div>
                <div className="hidden lg:block text-left"><p className="text-xs font-bold text-gray-900 leading-none">{userProfile.firstName}</p><p className="text-[10px] text-gray-400 font-medium mt-1 uppercase">{userProfile.role_name || 'Admin'}</p></div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-60 bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
                  <div className="p-5 border-b border-gray-50 bg-gray-50/50 text-sm"><p className="font-bold text-gray-900">{userProfile.firstName} {userProfile.lastName}</p><p className="text-xs text-gray-500 truncate mt-1">{userProfile.email}</p></div>
                  <div className="p-2"><button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-2xl transition-all"><LogOut className="w-4 h-4" /> Sign Out</button></div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

      {/* MODAL */}
      <AddNavModal 
        isOpen={isNavModalOpen} 
        onClose={() => setIsNavModalOpen(false)} 
        onSuccess={() => loadNavigation(userProfile.token)} 
        parents={menuItems.filter(item => item.is_parent === 1)}
      />
    </div>
  );
}