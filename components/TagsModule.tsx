
import React, { useState } from 'react';
import { Plus, Palette, Trash2, Edit2 } from 'lucide-react';
import { AppData, Tag } from '../types';

interface TagsModuleProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#06b6d4', 
  '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6366f1',
  '#f43f5e', '#71717a'
];

export const TagsModule: React.FC<TagsModuleProps> = ({ data, setData }) => {
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addOrUpdateTag = () => {
    if (!tagName.trim()) return;

    if (editingId) {
      setData(prev => ({
        ...prev,
        tags: prev.tags.map(t => t.id === editingId ? { ...t, name: tagName, color: tagColor } : t)
      }));
      setEditingId(null);
    } else {
      const newTag: Tag = {
        id: Date.now().toString(),
        name: tagName,
        color: tagColor
      };
      setData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
    }
    setTagName('');
  };

  const deleteTag = (id: string) => {
    if (confirm('确定要删除这个标签吗？所有关联项都将失去该标签。')) {
      setData(prev => ({
        ...prev,
        tags: prev.tags.filter(t => t.id !== id),
        todos: prev.todos.map(t => ({ ...t, tagIds: t.tagIds.filter(tid => tid !== id) })),
        posts: prev.posts.map(p => ({ ...p, tagIds: p.tagIds.filter(tid => tid !== id) })),
        pomodoroRecords: prev.pomodoroRecords.map(r => ({ ...r, tagIds: r.tagIds.filter(tid => tid !== id) }))
      }));
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setTagName(tag.name);
    setTagColor(tag.color);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-800">标签管理</h2>
            <Palette className="w-8 h-8 text-slate-100" />
        </div>
        <p className="text-slate-400 mb-10">自定义你的学习分类，让进度管理井井有条</p>

        <div className="bg-slate-50 p-8 rounded-3xl flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">标签名称</label>
            <input 
              type="text" 
              value={tagName}
              onChange={e => setTagName(e.target.value)}
              placeholder="例如: React, 嵌入式开发..." 
              className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:border-blue-500 transition-all text-lg"
            />
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">颜色选择</label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setTagColor(color)}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    tagColor === color ? 'scale-110 ring-4 ring-offset-2' : 'hover:scale-105'
                  }`}
                  // Removed ringColor as it is not a valid CSS property in React style objects
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <button 
            onClick={addOrUpdateTag}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
          >
            {editingId ? <><Edit2 className="w-6 h-6" /> 更新标签</> : <><Plus className="w-6 h-6" /> 添加新标签</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.tags.map(tag => (
          <div key={tag.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-100 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }}></div>
              <span className="text-lg font-bold text-slate-700">{tag.name}</span>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => startEdit(tag)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-500"><Edit2 className="w-5 h-5" /></button>
              <button onClick={() => deleteTag(tag.id)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
