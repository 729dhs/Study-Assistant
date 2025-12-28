
import React, { useState, useMemo, useEffect, memo } from 'react';
import { 
  LayoutGrid, Grid3X3, Plus, Search, Edit2, Trash2, X, 
  Image as ImageIcon, Calendar, BookOpen, Clock, Settings2, 
  Tag as TagIcon, ChevronLeft, ChevronRight, Check, GitBranch,
  Target, Info, Flame
} from 'lucide-react';
import { AppData, BlogPost } from '../types';
import { marked } from 'marked';

declare var Prism: any;

interface BlogModuleProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

type ViewMode = 'grid' | 'fishbone' | 'heatmap';

const CalendarPicker = ({ currentDate, onSelect }: { currentDate: Date, onSelect: (d: Date) => void }) => {
  const [viewDate, setViewDate] = useState(new Date(currentDate));
  const days = useMemo(() => {
    const total = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const offset = (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() + 6) % 7;
    const arr = [];
    for (let i = 0; i < offset; i++) arr.push(null);
    for (let i = 1; i <= total; i++) arr.push(i);
    return arr;
  }, [viewDate]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center px-1">
        <span className="font-black text-[10px] text-slate-800 uppercase tracking-widest">{viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月</span>
        <div className="flex gap-1">
          <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronLeft className="w-3 h-3" /></button>
          <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronRight className="w-3 h-3" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['一', '二', '三', '四', '五', '六', '日'].map(d => <div key={d} className="text-[9px] text-center font-black text-slate-300">{d}</div>)}
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
          const isSelected = d.toDateString() === currentDate.toDateString();
          return (
            <button 
              key={i} 
              onClick={() => onSelect(d)}
              className={`aspect-square text-[10px] font-bold rounded flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const BlogModule = memo(({ data, setData }: BlogModuleProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [viewingPost, setViewingPost] = useState<BlogPost | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // 编辑器辅助状态
  const [showEditorCalendar, setShowEditorCalendar] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [heatmapFilter, setHeatmapFilter] = useState<{start: Date, end: Date} | null>(null);

  useEffect(() => {
    if (viewingPost) {
      const timer = setTimeout(() => {
        if (typeof Prism !== 'undefined') { Prism.highlightAll(); }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [viewingPost]);

  const filteredPosts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let posts = data.posts;
    if (heatmapFilter) {
      posts = posts.filter(p => {
        const d = new Date(p.date);
        return d >= heatmapFilter.start && d <= heatmapFilter.end;
      });
    }
    return posts.filter(p => {
      const matchesText = p.title.toLowerCase().includes(term) || p.content.toLowerCase().includes(term);
      const matchesTags = p.tagIds.some(tid => {
        const tag = data.tags.find(t => t.id === tid);
        return tag && tag.name.toLowerCase().includes(term);
      });
      return matchesText || matchesTags;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.posts, data.tags, searchTerm, heatmapFilter]);

  const savePost = () => {
    if (!editingPost?.title || !editingPost?.content) return;
    const post: BlogPost = { 
      id: editingPost.id || Date.now().toString(), 
      title: editingPost.title, 
      content: editingPost.content, 
      date: editingPost.date || new Date().toISOString(), 
      tagIds: editingPost.tagIds || [], 
      wordCount: editingPost.content.length 
    };
    setData(prev => ({ 
      ...prev, 
      posts: editingPost.id ? prev.posts.map(p => p.id === editingPost.id ? post : p) : [...prev.posts, post] 
    }));
    setEditingPost(null);
    setShowTagPicker(false);
    setShowEditorCalendar(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const imgId = `img_${Date.now()}`;
      setData(prev => ({ ...prev, images: { ...prev.images, [imgId]: base64 } }));
      if (editingPost) setEditingPost({ ...editingPost, content: (editingPost.content || '') + `\n![image](${imgId})` });
    };
    reader.readAsDataURL(file);
  };

  const toggleTagSelection = (tagId: string) => {
    if (!editingPost) return;
    const currentTags = editingPost.tagIds || [];
    const newTags = currentTags.includes(tagId) 
      ? currentTags.filter(id => id !== tagId) 
      : [...currentTags, tagId];
    setEditingPost({ ...editingPost, tagIds: newTags });
  };

  const renderedContent = useMemo(() => {
    if (!viewingPost) return { __html: '' };
    let finalContent = viewingPost.content;
    Object.entries(data.images).forEach(([id, base64]) => {
      finalContent = finalContent.split(`(${id})`).join(`(${base64})`);
    });
    return { __html: marked.parse(finalContent) };
  }, [viewingPost, data.images]);

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto gap-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">技术笔记</h2>
          <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
            <button onClick={() => { setViewMode('grid'); setHeatmapFilter(null); }} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => { setViewMode('fishbone'); setHeatmapFilter(null); }} className={`p-2 rounded-lg transition-all ${viewMode === 'fishbone' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><GitBranch className="w-4 h-4 rotate-90" /></button>
            <button onClick={() => setViewMode('heatmap')} className={`p-2 rounded-lg transition-all ${viewMode === 'heatmap' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><Grid3X3 className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="搜索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 w-48 text-xs font-bold shadow-sm" />
          </div>
          <button onClick={() => setEditingPost({ title: '', content: '', tagIds: [], date: new Date().toISOString() })} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-black text-xs shadow-xl shadow-blue-100 flex items-center gap-2 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> 新建笔记
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'grid' && (
          <div className="h-full overflow-y-auto custom-scrollbar pr-2">
            <GridView posts={filteredPosts} tags={data.tags} onEdit={setEditingPost} onView={setViewingPost} onDelete={(id: string) => setData(prev => ({ ...prev, posts: prev.posts.filter(p => p.id !== id) }))} />
          </div>
        )}
        {viewMode === 'fishbone' && <FishboneView posts={data.posts} onView={setViewingPost} />}
        {viewMode === 'heatmap' && (
          <CompactHeatmapLayout 
            data={data} 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onFilterChange={setHeatmapFilter}
            onViewPost={setViewingPost}
            setData={setData}
            activeFilter={heatmapFilter}
          />
        )}
      </div>

      {editingPost && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-8 z-[100]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
             <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
                <input value={editingPost.title} onChange={e => setEditingPost({ ...editingPost, title: e.target.value })} className="text-xl font-black outline-none bg-transparent w-full text-slate-800 placeholder:text-slate-300" placeholder="笔记标题..." />
                <button onClick={() => setEditingPost(null)} className="p-3 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"><X className="w-5 h-5" /></button>
             </div>
             <div className="flex-1 flex overflow-hidden">
                <textarea className="flex-1 p-10 outline-none resize-none font-mono text-base leading-relaxed text-slate-700 bg-white custom-scrollbar" value={editingPost.content} onChange={e => setEditingPost({ ...editingPost, content: e.target.value })} placeholder="输入内容... (Markdown 支持)" />
             </div>
             
             {/* 底部工具栏：日期、标签、图片、发布 */}
             <div className="p-6 border-t bg-slate-50 flex justify-between items-center shrink-0 relative">
                <div className="flex items-center gap-2">
                  {/* 日期选择 */}
                  <div className="relative">
                    <button onClick={() => setShowEditorCalendar(!showEditorCalendar)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-700 shadow-sm hover:border-blue-300 transition-all">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      {new Date(editingPost.date!).toLocaleDateString()}
                    </button>
                    {showEditorCalendar && (
                      <div className="absolute bottom-full left-0 mb-3 bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 z-[110] w-64">
                          <CalendarPicker currentDate={new Date(editingPost.date!)} onSelect={(d) => { setEditingPost({ ...editingPost, date: d.toISOString() }); setShowEditorCalendar(false); }} />
                      </div>
                    )}
                  </div>
                  
                  {/* 标签选择 */}
                  <div className="relative">
                    <button onClick={() => setShowTagPicker(!showTagPicker)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all border ${editingPost.tagIds?.length ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                      <TagIcon className="w-4 h-4" />
                      {editingPost.tagIds?.length ? `已选 ${editingPost.tagIds.length}` : '标签'}
                    </button>
                    {showTagPicker && (
                      <div className="absolute bottom-full left-0 mb-3 w-64 bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 z-[110] animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">分类标签</span><button onClick={() => setShowTagPicker(false)}><X className="w-3 h-3 text-slate-300" /></button></div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                          {data.tags.map(tag => (
                            <button key={tag.id} onClick={() => toggleTagSelection(tag.id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${editingPost.tagIds?.includes(tag.id) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}>
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                              <span className="truncate">{tag.name}</span>
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setShowTagPicker(false)} className="w-full mt-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black shadow-lg">确定</button>
                      </div>
                    )}
                  </div>

                  {/* 图片上传 */}
                  <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-700 shadow-sm hover:border-blue-300 transition-all cursor-pointer">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>图片</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setEditingPost(null)} className="px-6 py-2 text-slate-400 font-black text-xs">取消</button>
                  <button onClick={savePost} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg hover:bg-blue-700 active:scale-95 transition-all text-sm">完成</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {viewingPost && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-8 z-[100]" onClick={() => setViewingPost(null)}>
          <div className="bg-white rounded-[3.5rem] w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100" onClick={e => e.stopPropagation()}>
             <div className="p-10 border-b flex justify-between items-start shrink-0 bg-blue-50/20">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 leading-tight mb-3">{viewingPost.title}</h3>
                  <div className="flex items-center gap-6 text-xs text-slate-400 font-bold uppercase">
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600" /> {new Date(viewingPost.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <button onClick={() => setViewingPost(null)} className="p-3 hover:bg-white rounded-xl transition-all"><X className="w-6 h-6 text-slate-300" /></button>
             </div>
             <div className="flex-1 p-12 overflow-auto custom-scrollbar">
                <div className="markdown-content" dangerouslySetInnerHTML={renderedContent} />
             </div>
          </div>
        </div>
      )}
    </div>
  );
});

const CompactHeatmapLayout = ({ data, selectedDate, setSelectedDate, onFilterChange, onViewPost, setData, activeFilter }: any) => {
  const [calendarViewDate, setCalendarViewDate] = useState(new Date(selectedDate));
  const currentDayStr = selectedDate.toISOString().split('T')[0];
  const annotation = data.annotations[currentDayStr];
  const [tempLabel, setTempLabel] = useState(annotation?.label || '');
  const [tempColor, setTempColor] = useState(annotation?.color || '#3b82f6');

  useEffect(() => {
    setTempLabel(annotation?.label || '');
    setTempColor(annotation?.color || '#3b82f6');
  }, [selectedDate, annotation]);

  const saveAnnotation = () => {
    setData((prev: any) => ({
      ...prev,
      annotations: { ...prev.annotations, [currentDayStr]: { date: currentDayStr, label: tempLabel, color: tempColor } }
    }));
  };

  const calendarDays = useMemo(() => {
    const total = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 0).getDate();
    const offset = (new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1).getDay() + 6) % 7;
    const days = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let i = 1; i <= total; i++) days.push(i);
    return days;
  }, [calendarViewDate]);

  return (
    <div className="grid grid-cols-12 grid-rows-12 h-full gap-6 overflow-hidden">
      <div className="col-span-4 row-span-7 bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col overflow-hidden relative">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-black text-slate-800 tracking-tight">{calendarViewDate.getFullYear()}年 {calendarViewDate.getMonth() + 1}月</h4>
          <div className="flex gap-1">
            <button onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1))} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1))} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-[10px] font-black text-slate-300 text-center uppercase mb-3 tracking-widest">
          {['一','二','三','四','五','六','日'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5 flex-1 content-start">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={i} />;
            const dateObj = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day);
            const dStr = dateObj.toISOString().split('T')[0];
            const ann = data.annotations[dStr];
            const isSelected = dateObj.toDateString() === selectedDate.toDateString();
            const isToday = dateObj.toDateString() === new Date().toDateString();
            return (
              <button
                key={i}
                onClick={() => { setSelectedDate(dateObj); onFilterChange(null); }}
                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black relative transition-all border-2 ${
                  isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-110' : 
                  isToday ? 'bg-blue-50 text-blue-600 border-blue-50' : 'text-slate-600 hover:bg-slate-50 border-transparent'
                }`}
                style={!isSelected && ann ? { backgroundColor: ann.color, color: 'white' } : {}}
              >
                {day}
              </button>
            );
          })}
        </div>
        <button onClick={() => { const n = new Date(); setSelectedDate(n); setCalendarViewDate(n); }} className="absolute bottom-4 right-4 p-1.5 bg-blue-600 text-white rounded-full shadow-lg"><Target className="w-3 h-3" /></button>
      </div>

      {/* 热力图核心卡片 */}
      <div className="col-span-8 row-span-7 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <HeatmapCardInterior data={data} onFilterChange={onFilterChange} activeFilter={activeFilter} />
      </div>

      <div className="col-span-4 row-span-5 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4 overflow-hidden">
        <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2"><Settings2 className="w-3 h-3 text-blue-500" /> 标注日期</h4>
        <input value={tempLabel} onChange={e => setTempLabel(e.target.value)} placeholder="标注说明..." className="px-4 py-3 bg-slate-50 rounded-xl outline-none text-[11px] font-bold focus:bg-white border border-transparent focus:border-blue-100 transition-all" />
        <div className="grid grid-cols-6 gap-2">
          {['#f87171', '#4ade80', '#fbbf24', '#a78bfa', '#2dd4bf', '#3b82f6'].map(c => (
            <button key={c} onClick={() => setTempColor(c)} className={`aspect-square rounded-lg border-2 ${tempColor === c ? 'border-blue-500 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
          ))}
        </div>
        <button onClick={saveAnnotation} className="w-full mt-auto py-3 bg-blue-600 text-white rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all">保存标注</button>
      </div>

      <div className="col-span-8 row-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest flex items-center gap-2 mb-4"><BookOpen className="w-3 h-3 text-blue-500" /> 相关笔记</h4>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
           <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.posts
                .filter(p => {
                  if (activeFilter) {
                    const d = new Date(p.date);
                    return d >= activeFilter.start && d <= activeFilter.end;
                  }
                  return new Date(p.date).toDateString() === selectedDate.toDateString();
                })
                .map((post: any) => (
                  <button key={post.id} onClick={() => onViewPost(post)} className="p-4 bg-slate-50 rounded-2xl hover:bg-white border border-transparent hover:border-blue-100 transition-all text-left shadow-sm group">
                    <p className="text-[11px] font-black text-slate-700 truncate mb-1">{post.title}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{post.wordCount} 字</p>
                  </button>
                ))
              }
           </div>
        </div>
      </div>
    </div>
  );
};

const HeatmapCardInterior = ({ data, onFilterChange, activeFilter }: any) => {
  const [mode, setMode] = useState<'year' | 'month' | 'week'>('year');

  const calculateWeight = (start: Date, end: Date) => {
    const periodPosts = data.posts.filter((p: any) => {
      const d = new Date(p.date);
      return d >= start && d <= end;
    });
    const words = periodPosts.reduce((acc: number, curr: any) => acc + curr.wordCount, 0);
    return (periodPosts.length * 1000) + words;
  };

  const getHeatColor = (weight: number) => {
    if (weight === 0) return 'bg-slate-100 hover:bg-slate-200 border-transparent'; 
    if (weight < 500) return 'bg-blue-200 border-blue-300'; 
    if (weight < 2000) return 'bg-blue-300 border-blue-400';
    if (weight < 5000) return 'bg-blue-500 border-blue-600';
    return 'bg-blue-600 border-blue-700';
  };

  const stats = useMemo(() => {
    const now = new Date();
    if (mode === 'year') {
      const weeks = [];
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      // 53 周数据，覆盖全年
      for (let i = 0; i < 53; i++) {
        const start = new Date(startOfYear);
        start.setDate(startOfYear.getDate() + i * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        weeks.push({ start, end, weight: calculateWeight(start, end), label: `Week ${i+1}` });
      }
      return weeks;
    } else if (mode === 'month') {
      const months = [];
      for (let i = 0; i < 12; i++) {
        const start = new Date(now.getFullYear(), i, 1);
        const end = new Date(now.getFullYear(), i + 1, 0);
        months.push({ start, end, weight: calculateWeight(start, end), label: `${i+1}月` });
      }
      return months;
    } else {
      const days = [];
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      for (let i = 0; i < 7; i++) {
        const start = new Date(monday);
        start.setDate(monday.getDate() + i);
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setHours(23,59,59,999);
        days.push({ start, end, weight: calculateWeight(start, end), label: `周${['一','二','三','四','五','六','日'][i]}` });
      }
      return days;
    }
  }, [mode, data.posts]);

  // Optimized grid columns to ensure blocks fit vertically within the fixed container
  // Year: 12 cols -> ~5 rows (53/12 = 4.4). Aspect ratio is friendly to landscape containers.
  // Month: 6 cols -> 2 rows. 
  // Week: 7 cols -> 1 row.
  const gridCols = mode === 'year' ? 'grid-cols-12' : mode === 'month' ? 'grid-cols-6' : 'grid-cols-7';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h4 className="text-base font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          产出热力墙
        </h4>
        <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
           {(['year', 'month', 'week'] as const).map(m => (
             <button key={m} onClick={() => { setMode(m); onFilterChange(null); }} className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all ${mode === m ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600 border border-transparent'}`}>
                {m === 'year' ? '年度' : m === 'month' ? '月度' : '周'}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[1.5rem] p-4 flex flex-col justify-center items-center overflow-hidden border border-slate-100 shadow-inner">
         <div className={`grid gap-2 transition-all duration-300 w-full ${gridCols}`}>
            {stats.map((s, i) => {
              const isActive = activeFilter && activeFilter.start.getTime() === s.start.getTime();
              return (
                <button
                  key={i}
                  onClick={() => onFilterChange(isActive ? null : { start: s.start, end: s.end })}
                  className={`aspect-square rounded-md transition-all border-2 ${isActive ? 'border-blue-400 scale-110 shadow-md z-10' : 'border-transparent'} ${getHeatColor(s.weight)}`}
                  title={`${s.label}: ${s.weight}`}
                />
              );
            })}
         </div>
         <div className="mt-4 flex items-center justify-end gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest w-full">
            <span>Low</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-200" />
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-200" />
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-400" />
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
            <span>High</span>
         </div>
      </div>
    </div>
  );
};

const GridView = ({ posts, tags, onEdit, onView, onDelete }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {posts.map((post: any) => (
      <div key={post.id} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4 group hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer h-72 relative overflow-hidden" onClick={() => onView(post)}>
        <div className="flex justify-between items-start gap-3 relative z-10">
          <div className="flex-1">
            <h3 className="font-black text-slate-800 text-xl line-clamp-2 leading-tight mb-2">{post.title}</h3>
            <div className="flex flex-wrap gap-1 mb-2">
               {post.tagIds.map(tid => {
                 const tag = tags.find(t => t.id === tid);
                 return tag && (
                   <span key={tid} className="px-2 py-0.5 rounded-full text-[8px] text-white font-black uppercase tracking-tighter" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                 );
               })}
            </div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onEdit(post); }} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl bg-white shadow-sm border border-slate-100"><Edit2 className="w-4 h-4" /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(post.id); }} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl bg-white shadow-sm border border-slate-100"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <p className="text-sm text-slate-400 line-clamp-3 italic">{post.content.replace(/[#*`\n!\[\]\(\)]/g, ' ')}</p>
        <div className="flex items-center justify-between text-[10px] text-slate-300 font-black border-t pt-5 border-slate-50 uppercase tracking-widest mt-auto">
          <span className="flex items-center gap-2.5"><Calendar className="w-4 h-4 text-blue-600" /> {new Date(post.date).toLocaleDateString()}</span>
        </div>
      </div>
    ))}
    {posts.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 italic">尚未开启任何笔记...</div>}
  </div>
);

const FishboneView = ({ posts, onView }: any) => {
  const days = Array.from({ length: 5 }).map((_, i) => { 
    const d = new Date(); 
    d.setDate(d.getDate() - i); 
    return d; 
  }).reverse();
  const weekdaysCn = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return (
    <div className="h-full w-full bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm flex items-center justify-center overflow-hidden">
      <div className="relative h-full w-full flex flex-col items-center justify-center max-w-5xl">
        <div className="absolute left-10 right-10 h-1.5 bg-indigo-700 rounded-full z-0 opacity-80" />
        <div className="flex justify-between w-full px-16 relative z-10 items-center h-full">
          {days.map((date, i) => {
            const dailyPosts = posts.filter((p:any) => new Date(p.date).toDateString() === date.toDateString());
            const isUp = i % 2 === 0;
            return (
              <div key={i} className="flex flex-col items-center relative group" style={{ width: '20%' }}>
                <div className={`w-10 h-10 ${dailyPosts.length > 0 ? 'bg-indigo-700 ring-8 ring-indigo-50 shadow-xl' : 'bg-white border-4 border-indigo-200'} rounded-full flex items-center justify-center transition-all z-20`}>
                  {dailyPosts.length > 0 && <Check className="w-5 h-5 text-white stroke-[4]" />}
                </div>
                <div className={`absolute ${isUp ? 'bottom-12' : 'top-12'} flex flex-col items-center`}>
                    <span className="text-[10px] font-black text-slate-300 uppercase mb-1">{weekdaysCn[date.getDay()]}</span>
                    <span className="text-base font-black text-indigo-950 tracking-tighter">{date.getMonth() + 1}/{date.getDate()}</span>
                </div>
                <div className={`absolute left-1/2 -translate-x-1/2 flex items-center ${isUp ? 'top-[-180px] flex-col' : 'bottom-[-180px] flex-col-reverse'}`}>
                    <div className="w-1.5 bg-indigo-100 h-24 rounded-full" />
                    <div className="flex flex-col gap-2 absolute left-4 w-48 py-2">
                         {dailyPosts.length > 0 ? dailyPosts.slice(0, 3).map((p:any) => (
                             <div key={p.id} className="flex items-center group/item">
                                 <div className="w-4 h-0.5 bg-indigo-100 shrink-0 group-hover/item:bg-indigo-600 transition-colors" />
                                 <button onClick={() => onView(p)} className="ml-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent rounded-2xl text-[10px] font-black shadow-md truncate w-full text-center transition-all active:scale-95">{p.title}</button>
                             </div>
                         )) : <div className="text-[10px] font-black text-slate-200 uppercase tracking-widest pl-6 pt-10">Empty</div>}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
