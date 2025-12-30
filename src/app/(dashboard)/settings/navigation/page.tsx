'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Settings2, Layers, ChevronRight, Edit3, 
  Trash2, Loader2, GripVertical, Plus 
} from 'lucide-react';
import { DynamicIcon } from '@/components/common/DynamicIcon';

interface NavItem {
  id: number;
  label: string;
  key: string;
  path: string;
  icon_name: string;
  sort_order: number;
  parent_id: number | null;
  is_parent: number;
}

export default function NavigationManagement() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNavs = useCallback(async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`/api/auth/navigation?userToken=${user.token}`);
      const json = await res.json();
      if (json.success) setItems(json.data.menu);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNavs(); }, [fetchNavs]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this menu item?")) return;
    try {
      const res = await fetch(`/api/auth/navigation/${id}`, { 
        method: 'DELETE',
        headers: { 'x-user-role-token': localStorage.getItem('x-user-role-token') || '' }
      });
      const data = await res.json();
      if (data.success) fetchNavs();
      else alert(data.error);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-yellow-400 shadow-xl shadow-zinc-200">
            <Settings2 className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-zinc-900 uppercase tracking-tight">Navigation Engine</h1>
        </div>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] ml-1">Manage Sidebar structure and Hierarchy</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-yellow-400 animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {items.filter(i => !i.parent_id).map((parent) => (
            <div key={parent.id} className="group">
              {/* Parent Row */}
              <div className="bg-white border border-zinc-100 p-6 rounded-[2rem] flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-zinc-50 rounded-xl text-zinc-400 group-hover:text-yellow-500 transition-colors">
                    <DynamicIcon name={parent.icon_name} className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-zinc-900 uppercase tracking-widest">{parent.label}</p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase mt-1">{parent.path} • Order: {parent.sort_order}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button className="p-2.5 hover:bg-zinc-50 rounded-xl text-zinc-400 hover:text-zinc-900 transition-all"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(parent.id)} className="p-2.5 hover:bg-red-50 rounded-xl text-zinc-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Children Rows */}
              <div className="ml-12 mt-2 space-y-2 border-l-2 border-zinc-50 pl-6">
                {items.filter(child => child.parent_id === parent.id).map((child) => (
                  <div key={child.id} className="bg-zinc-50/50 border border-zinc-100/50 p-4 rounded-2xl flex items-center justify-between group/child hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex items-center gap-4">
                      <ChevronRight className="w-3 h-3 text-zinc-300" />
                      <div>
                        <p className="text-[11px] font-bold text-zinc-600 uppercase">{child.label}</p>
                        <p className="text-[8px] font-medium text-zinc-400">{child.path}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover/child:opacity-100 transition-all">
                      <button className="p-2 hover:text-zinc-900 text-zinc-300 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(child.id)} className="p-2 hover:text-red-500 text-zinc-300 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !loading && (
        <div className="py-20 bg-white border-2 border-dashed border-zinc-100 rounded-[3rem] text-center">
          <Layers className="w-12 h-12 text-zinc-100 mx-auto mb-4" />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">No custom navigation found</p>
        </div>
      )}
    </div>
  );
}