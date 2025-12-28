
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Check, Clock, CalendarDays, Zap, Repeat, Layers, Tag as TagIcon, Quote, X, Target, StickyNote, AlertCircle, Info } from 'lucide-react';
import { AppData, Todo, TodoType, TodoPriority } from '../types';

interface TodoModuleProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

export const TodoModule: React.FC<TodoModuleProps> = ({ data, setData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newTodoText, setNewTodoText] = useState('');
  const [todoType, setTodoType] = useState<TodoType>('once');
  const [priority, setPriority] = useState<TodoPriority>('normal');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);

  const getDayStr = (d: Date) => d.toISOString().split('T')[0];
  const getMondayStr = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const handlePrevMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  const handleNextMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  const goToToday = () => setSelectedDate(new Date());

  const addTodo = () => {
    if (!newTodoText.trim()) return;
    
    const todoDate = new Date(selectedDate);
    const now = new Date();
    todoDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const newTodo: Todo = {
      id: Date.now().toString(),
      text: newTodoText,
      completed: false,
      completedDates: [],
      type: todoType,
      priority: priority,
      date: todoDate.toISOString(),
      tagIds: [...selectedTags]
    };
    setData(prev => ({ ...prev, todos: [...prev.todos, newTodo] }));
    setNewTodoText('');
    setPriority('normal');
    setSelectedTags([]);
    setShowTagPicker(false);
  };

  const isMatchingDate = (todo: Todo, targetDate: Date) => {
    const todoDate = new Date(todo.date);
    const todoDayStart = new Date(todoDate.getFullYear(), todoDate.getMonth(), todoDate.getDate()).getTime();
    const targetDayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    if (targetDayStart < todoDayStart) return false;
    if (todo.type === 'once') return todoDate.toDateString() === targetDate.toDateString();
    if (todo.type === 'daily') return true;
    if (todo.type === 'weekly') return true;
    return false;
  };

  const isTodoCompletedOnDate = (todo: Todo, date: Date) => {
    if (todo.type === 'once') return todo.completed;
    const dateStr = todo.type === 'weekly' ? getMondayStr(date) : getDayStr(date);
    return todo.completedDates?.includes(dateStr) || false;
  };

  const toggleTodoCompletion = (todoId: string, date: Date) => {
    setData(prev => ({
      ...prev,
      todos: prev.todos.map(t => {
        if (t.id !== todoId) return t;
        if (t.type === 'once') return { ...t, completed: !t.completed };
        const dateStr = t.type === 'weekly' ? getMondayStr(date) : getDayStr(date);
        const currentDates = t.completedDates || [];
        return {
          ...t,
          completedDates: currentDates.includes(dateStr) ? currentDates.filter(d => d !== dateStr) : [...currentDates, dateStr]
        };
      })
    }));
  };

  const priorityOrder = {
    'urgent': 3,
    'important': 2,
    'normal': 1
  };

  const sortedTodos = useMemo(() => {
    return data.todos
      .filter(todo => isMatchingDate(todo, selectedDate))
      .sort((a, b) => {
        const aDone = isTodoCompletedOnDate(a, selectedDate);
        const bDone = isTodoCompletedOnDate(b, selectedDate);
        if (aDone !== bDone) return aDone ? 1 : -1;
        
        const aPri = priorityOrder[a.priority] || 0;
        const bPri = priorityOrder[b.priority] || 0;
        if (aPri !== bPri) return bPri - aPri;
        
        return 0;
      });
  }, [data.todos, selectedDate]);

  const dailyTasks = useMemo(() => sortedTodos.filter(t => t.type === 'daily'), [sortedTodos]);
  const weeklyTasks = useMemo(() => sortedTodos.filter(t => t.type === 'weekly'), [sortedTodos]);
  const activeDailyCount = dailyTasks.length;
  const activeWeeklyCount = weeklyTasks.length;
  const isDailyAllDone = activeDailyCount > 0 && dailyTasks.every(t => isTodoCompletedOnDate(t, selectedDate));
  const isWeeklyAllDone = activeWeeklyCount > 0 && weeklyTasks.every(t => isTodoCompletedOnDate(t, selectedDate));

  const calendarDays = useMemo(() => {
    const days = [];
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const totalDays = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const offset = (firstDay.getDay() + 6) % 7; 
    for (let i = 0; i < offset; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    while (days.length < 42) days.push(null);
    return days;
  }, [selectedDate]);

  const currentAnnotation = data.annotations[getDayStr(selectedDate)];

  const getPriorityBadgeStyles = (p: TodoPriority) => {
    switch (p) {
      case 'urgent': return 'bg-red-600 text-white';
      case 'important': return 'bg-orange-500 text-white';
      case 'normal': return 'bg-blue-600 text-white';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  const getPriorityCardStyles = (p: TodoPriority, isDone: boolean) => {
    if (isDone) return 'bg-slate-50 border-transparent';
    switch (p) {
      case 'urgent': return 'bg-red-50 border-red-100 shadow-sm';
      case 'important': return 'bg-orange-50 border-orange-100 shadow-sm';
      case 'normal': return 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200';
      default: return 'bg-slate-50 border-transparent';
    }
  };

  // Helper to determine the dot color for a calendar day
  const getDayDotColorClass = (dayTasks: Todo[], allDone: boolean) => {
    if (allDone) return 'bg-emerald-400';
    
    const hasUrgent = dayTasks.some(t => t.priority === 'urgent');
    if (hasUrgent) return 'bg-red-500';
    
    const hasImportant = dayTasks.some(t => t.priority === 'important');
    if (hasImportant) return 'bg-orange-500';
    
    // All tasks are normal - calculate blue depth
    const normalCount = dayTasks.length;
    if (normalCount >= 4) return 'bg-blue-600';
    if (normalCount === 3) return 'bg-blue-500';
    if (normalCount === 2) return 'bg-blue-400';
    return 'bg-blue-300';
  };

  return (
    <div className="flex h-full max-w-7xl mx-auto gap-6 overflow-hidden">
      <div className="w-80 flex flex-col gap-6 shrink-0 h-full overflow-hidden">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col shrink-0 relative h-[360px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedDate.getFullYear()}年 {selectedDate.getMonth() + 1}月</h2>
            <div className="flex gap-1">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-300 font-black uppercase tracking-widest mb-4">
            <div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div><div>日</div>
          </div>
          <div className="grid grid-cols-7 gap-1.5 flex-1 content-start">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={i} className="aspect-square" />;
              const dateObj = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
              const isToday = dateObj.toDateString() === new Date().toDateString();
              const isSelected = dateObj.toDateString() === selectedDate.toDateString();
              const dStr = getDayStr(dateObj);
              const ann = data.annotations[dStr];
              
              const dayTasks = data.todos.filter(t => t.type === 'once' && isMatchingDate(t, dateObj));
              const hasTasks = dayTasks.length > 0;
              const allDayTasksDone = hasTasks && dayTasks.every(t => isTodoCompletedOnDate(t, dateObj));

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(dateObj)}
                  className={`relative aspect-square transition-all border-4 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-blue-600 text-white shadow-xl z-10 scale-110 border-blue-600' : 
                    isToday ? 'bg-blue-100 text-blue-600 border-blue-100' : 'text-slate-600 hover:bg-slate-50 border-transparent'
                  }`}
                  style={!isSelected && ann ? { backgroundColor: ann.color, color: 'white' } : {}}
                >
                  <span className="leading-none text-sm font-black z-10">{day}</span>
                  
                  {hasTasks && !isSelected && (
                    <div className="absolute top-[-1px] right-[-1px] z-20">
                      <div 
                        className={`w-2 h-2 rounded-full shadow-sm transition-all animate-in fade-in zoom-in duration-300 ${getDayDotColorClass(dayTasks, allDayTasksDone)}`}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <button 
            onClick={goToToday}
            className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-all z-20"
            title="回到今天"
          >
            <Target className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-4 shrink-0 h-[120px]">
          <div className="flex-1 bg-white rounded-[1.8rem] p-3 shadow-sm border border-slate-100 flex flex-col gap-1.5 overflow-hidden">
            <div className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] px-1">周期性任务</div>
            <div className="flex flex-col gap-1 flex-1">
              <div className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all flex-1 ${
                isDailyAllDone ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 
                activeDailyCount > 0 ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 
                'bg-slate-50 text-slate-400 opacity-60 border-transparent'
              }`}>
                <Repeat className="w-3 h-3 shrink-0" />
                <span className="text-[10px] font-black truncate">
                  {isDailyAllDone ? '每日已成' : activeDailyCount > 0 ? `${activeDailyCount}项每日` : '暂无每日'}
                </span>
                {isDailyAllDone && <Check className="w-3 h-3 ml-auto stroke-[4px]" />}
              </div>
              
              <div className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all flex-1 ${
                isWeeklyAllDone ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 
                activeWeeklyCount > 0 ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 
                'bg-slate-50 text-slate-400 opacity-60 border-transparent'
              }`}>
                <Layers className="w-3 h-3 shrink-0" />
                <span className="text-[10px] font-black truncate">
                  {isWeeklyAllDone ? '每周已成' : activeWeeklyCount > 0 ? `${activeWeeklyCount}项每周` : '暂无每周'}
                </span>
                {isWeeklyAllDone && <Check className="w-3 h-3 ml-auto stroke-[4px]" />}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[1.8rem] p-3 shadow-sm border border-slate-100 flex flex-col gap-1.5 overflow-hidden">
             <div className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] px-1">日期备注</div>
             <div className="flex-1 flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-50 text-slate-300 border border-transparent">
                {currentAnnotation ? (
                  <div 
                    className="w-full h-full rounded-lg flex flex-col items-center justify-center text-white px-2 overflow-hidden" 
                    style={{ backgroundColor: currentAnnotation.color }}
                  >
                    <StickyNote className="w-3 h-3 mb-1 shrink-0 opacity-60" />
                    <span className="text-[9px] font-black text-center line-clamp-2 leading-tight">{currentAnnotation.label}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-40">
                    <Clock className="w-3 h-3 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">无标注</span>
                  </div>
                )}
             </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
          <div className="flex items-center gap-2 text-slate-600 text-[11px] font-black uppercase tracking-[0.2em] px-1 shrink-0">
            <Quote className="w-3 h-3 text-blue-500" /> 专注格言
          </div>
          <textarea
            value={data.motto}
            onChange={e => setData(prev => ({ ...prev, motto: e.target.value }))}
            className="w-full bg-transparent border-none resize-none text-sm text-slate-700 leading-relaxed outline-none font-bold italic h-full py-1 custom-scrollbar"
            placeholder="写下激励你的话..."
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-hidden h-full">
        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-4 tracking-tight">
              <CalendarDays className="w-8 h-8 text-blue-600" />
              {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 待办计划
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {sortedTodos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-20">
                    <Clock className="w-16 h-16" />
                    <p className="text-lg font-black tracking-widest uppercase">今日暂无安排</p>
                </div>
            ) : sortedTodos.map(todo => {
              const isDone = isTodoCompletedOnDate(todo, selectedDate);
              return (
                <div key={todo.id} className={`flex items-center gap-6 p-6 rounded-[2.5rem] border transition-all ${getPriorityCardStyles(todo.priority, isDone)}`}>
                  <button onClick={() => toggleTodoCompletion(todo.id, selectedDate)} className={`w-9 h-9 rounded-xl border-4 flex items-center justify-center transition-all ${isDone ? 'bg-blue-600 border-blue-600 shadow-md' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                    {isDone && <Check className="w-5 h-5 text-white stroke-[4px]" />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-lg font-black leading-tight ${isDone ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{todo.text}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {todo.tagIds.map(tid => {
                        const tag = data.tags.find(t => t.id === tid);
                        return tag && (
                          <span key={tid} className="text-[9px] text-white px-2.5 py-1 rounded-lg font-black shadow-sm uppercase tracking-wider" style={{ backgroundColor: isDone ? '#cbd5e1' : tag.color }}>
                            {tag.name}
                          </span>
                        );
                      })}
                      {todo.type !== 'once' && (
                        <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider flex items-center gap-1.5 ${isDone ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-700'}`}>
                          {todo.type === 'daily' ? <><Repeat className="w-3 h-3" /> 每日</> : <><Layers className="w-3 h-3" /> 每周</>}
                        </span>
                      )}
                      <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider flex items-center gap-1.5 ${isDone ? 'bg-slate-100 text-slate-400' : getPriorityBadgeStyles(todo.priority)}`}>
                        {todo.priority === 'urgent' && <Zap className="w-3 h-3 fill-current" />}
                        {todo.priority === 'important' && <AlertCircle className="w-3 h-3 fill-current" />}
                        {todo.priority === 'normal' && <Info className="w-3 h-3 fill-current" />}
                        {todo.priority === 'urgent' ? '紧急' : todo.priority === 'important' ? '重要' : '普通'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col gap-6 shrink-0">
          <div className="flex gap-4">
            <input 
              value={newTodoText} 
              onChange={e => setNewTodoText(e.target.value)} 
              placeholder="记下新的目标或任务..." 
              className="flex-1 px-8 py-5 bg-slate-50 rounded-[1.5rem] outline-none font-bold text-lg focus:ring-4 ring-blue-50 transition-all border border-transparent focus:border-blue-100" 
            />
            <button 
              onClick={addTodo} 
              className="px-12 bg-blue-600 text-white rounded-[1.5rem] font-black hover:bg-blue-700 shadow-2xl shadow-blue-100 flex items-center gap-3 transition-all active:scale-95"
            >
              <Plus className="w-6 h-6" /> 添加
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-6">
              <div className="flex p-1 bg-slate-100 rounded-xl shrink-0">
                {(['once', 'daily', 'weekly'] as TodoType[]).map(type => (
                  <button 
                    key={type} 
                    onClick={() => setTodoType(type)} 
                    className={`px-5 py-2 text-[10px] rounded-lg font-black transition-all ${todoType === type ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {type === 'once' ? '单次' : type === 'daily' ? '每日' : '每周'}
                  </button>
                ))}
              </div>
              
              <div className="flex p-1 bg-slate-100 rounded-xl shrink-0">
                {(['normal', 'important', 'urgent'] as TodoPriority[]).map(p => (
                  <button 
                    key={p} 
                    onClick={() => setPriority(p)} 
                    className={`px-5 py-2 text-[10px] rounded-lg font-black transition-all flex items-center gap-2 ${priority === p ? 'bg-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    style={priority === p ? { color: p === 'urgent' ? '#ef4444' : p === 'important' ? '#f59e0b' : '#3b82f6' } : {}}
                  >
                    {p === 'urgent' && <Zap className="w-3 h-3 fill-current" />}
                    {p === 'important' && <AlertCircle className="w-3 h-3 fill-current" />}
                    {p === 'normal' && <Info className="w-3 h-3 fill-current" />}
                    {p === 'urgent' ? '紧急' : p === 'important' ? '重要' : '普通'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowTagPicker(!showTagPicker)}
                className={`flex items-center gap-3 px-6 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${selectedTags.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
              >
                <TagIcon className="w-4 h-4" />
                {selectedTags.length > 0 ? `已选 ${selectedTags.length} 个标签` : '分类标签'}
              </button>
              {showTagPicker && (
                <div className="absolute bottom-full right-0 mb-4 w-80 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-6 z-[50] animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">分类标签选择</h3>
                    <button onClick={() => setShowTagPicker(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-300 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                    {data.tags.map(tag => (
                      <button 
                        key={tag.id} 
                        onClick={() => setSelectedTags(p => p.includes(tag.id) ? p.filter(x => x !== tag.id) : [...p, tag.id])}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-[10px] font-bold transition-all border-2 ${
                          selectedTags.includes(tag.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: tag.color }} />
                        <span className="truncate">{tag.name}</span>
                        {selectedTags.includes(tag.id) && <Check className="w-3.5 h-3.5 ml-auto text-blue-600" />}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setShowTagPicker(false)}
                    className="w-full mt-5 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    确定已选标签
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
