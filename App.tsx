
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  Calendar, 
  BookText, 
  Timer, 
  BarChart3, 
  Tags, 
  Download, 
  Upload
} from 'lucide-react';
import { TodoModule } from './components/TodoModule';
import { BlogModule } from './components/BlogModule';
import { TimerModule } from './components/TimerModule';
import { StatsModule } from './components/StatsModule';
import { TagsModule } from './components/TagsModule';
import { AppData, Module, PomodoroRecord } from './types';

const MOTTOS = [
  "种一棵树最好的时间是十年前，其次是现在。",
  "Stay hungry, stay foolish.",
  "每一个不曾起舞的日子，都是对生命的辜负。",
  "代码即诗歌。",
  "难走的路，从不拥挤。"
];

const INITIAL_DATA: AppData = {
  appName: "学习助手 Pro",
  motto: MOTTOS[Math.floor(Math.random() * MOTTOS.length)],
  todos: [],
  posts: [],
  tags: [
    { id: '1', name: 'STM32', color: '#3b82f6' },
    { id: '2', name: 'Linux', color: '#10b981' },
    { id: '3', name: 'C++', color: '#f59e0b' },
    { id: '4', name: 'Python', color: '#06b6d4' },
    { id: '5', name: 'RTOS', color: '#a855f7' }
  ],
  pomodoroRecords: [],
  images: {},
  annotations: {}
};

// 对其他模块也进行记忆化，优化整体性能
const MemoizedTodoModule = memo(TodoModule);
const MemoizedStatsModule = memo(StatsModule);
const MemoizedTagsModule = memo(TagsModule);

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<Module>('todo');
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('study_assistant_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  // Pomodoro State
  const [timerActive, setTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [selectedTimerTags, setSelectedTimerTags] = useState<string[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('study_assistant_data', JSON.stringify(data));
  }, [data]);

  // Optimized Timer Logic
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerActive]);

  // Handle auto-completion
  useEffect(() => {
    if (timeLeft === 0 && timerActive) {
      handleTimerComplete();
    }
  }, [timeLeft, timerActive]);

  const handleTimerComplete = useCallback(() => {
    setTimerActive(false);
    const newRecord: PomodoroRecord = {
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
      duration: timerDuration,
      tagIds: [...selectedTimerTags]
    };
    setData(prev => ({
      ...prev,
      pomodoroRecords: [...prev.pomodoroRecords, newRecord]
    }));
    
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    } catch(e) {}
    
    alert('专注结束！喝杯水休息一下吧。');
    setTimeLeft(timerDuration * 60);
  }, [selectedTimerTags, timerDuration]);

  // Improved Stop Logic: Record if > 1 minute
  const handleStopTimer = useCallback(() => {
    const elapsedSeconds = timerDuration * 60 - timeLeft;
    
    if (elapsedSeconds >= 60) {
      const actualMinutes = Math.floor(elapsedSeconds / 60);
      const newRecord: PomodoroRecord = {
        id: Date.now().toString(),
        startTime: new Date().toISOString(),
        duration: actualMinutes,
        tagIds: [...selectedTimerTags]
      };
      setData(prev => ({
        ...prev,
        pomodoroRecords: [...prev.pomodoroRecords, newRecord]
      }));
      alert(`已记录本次专注时长：${actualMinutes} 分钟。`);
    }

    setTimerActive(false);
    setTimeLeft(timerDuration * 60);
  }, [selectedTimerTags, timerDuration, timeLeft]);

  const changeTimerDuration = (mins: number) => {
    setTimerDuration(mins);
    setTimerActive(false);
    setTimeLeft(mins * 60);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        setData(imported);
        alert('导入成功！');
      } catch (err) { alert('非法文件格式。'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col p-5 h-full shrink-0">
        <div className="flex items-center gap-2 mb-8 px-2 group">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
            {data.appName[0]}
          </div>
          <input
            value={data.appName}
            onChange={e => setData(prev => ({ ...prev, appName: e.target.value }))}
            className="text-lg font-bold bg-transparent outline-none w-full border-b border-transparent focus:border-blue-200 transition-all"
          />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          <NavButton active={activeModule === 'todo'} onClick={() => setActiveModule('todo')} icon={<Calendar className="w-4 h-4" />} label="待办" />
          <NavButton active={activeModule === 'blog'} onClick={() => setActiveModule('blog')} icon={<BookText className="w-4 h-4" />} label="技术笔记" />
          <NavButton active={activeModule === 'timer'} onClick={() => setActiveModule('timer')} icon={<Timer className="w-4 h-4" />} label="番茄钟" badge={timerActive ? '进行中' : undefined} />
          <NavButton active={activeModule === 'stats'} onClick={() => setActiveModule('stats')} icon={<BarChart3 className="w-4 h-4" />} label="统计" />
          <NavButton active={activeModule === 'tags'} onClick={() => setActiveModule('tags')} icon={<Tags className="w-4 h-4" />} label="标签设置" />
        </nav>

        <div className="pt-4 mt-auto border-t border-slate-100 space-y-1 shrink-0">
          <button onClick={exportData} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-500 hover:text-blue-600 transition-colors">
            <Download className="w-3 h-3" /> 导出备份
          </button>
          <label className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-500 hover:text-blue-600 cursor-pointer transition-colors">
            <Upload className="w-3 h-3" /> 导入数据
            <input type="file" onChange={importData} className="hidden" accept=".json" />
          </label>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-hidden bg-slate-50 p-8">
        <div className="h-full">
          {activeModule === 'todo' && <MemoizedTodoModule data={data} setData={setData} />}
          {activeModule === 'blog' && <BlogModule data={data} setData={setData} />}
          {activeModule === 'timer' && (
            <div className="h-full overflow-y-auto no-scrollbar">
              <TimerModule 
                data={data} 
                timerActive={timerActive} 
                setTimerActive={setTimerActive} 
                timeLeft={timeLeft} 
                duration={timerDuration}
                changeDuration={changeTimerDuration}
                onStop={handleStopTimer}
                selectedTimerTags={selectedTimerTags}
                setSelectedTimerTags={setSelectedTimerTags}
              />
            </div>
          )}
          {activeModule === 'stats' && <div className="h-full overflow-y-auto custom-scrollbar pr-2"><MemoizedStatsModule data={data} /></div>}
          {activeModule === 'tags' && <div className="h-full overflow-y-auto custom-scrollbar pr-2"><MemoizedTagsModule data={data} setData={setData} /></div>}
        </div>
      </main>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
    <div className="flex items-center gap-2.5"> {icon} <span className="text-sm">{label}</span> </div>
    {badge && <span className="text-[8px] px-1.5 py-0.5 bg-blue-600 text-white rounded-full font-bold animate-pulse">{badge}</span>}
  </button>
);

export default App;
