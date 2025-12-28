
import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Square, Info, Clock, Tag as TagIcon, X, Check, AlertCircle } from 'lucide-react';
import { AppData } from '../types';

interface TimerModuleProps {
  data: AppData;
  timerActive: boolean;
  setTimerActive: (active: boolean) => void;
  timeLeft: number;
  duration: number;
  changeDuration: (mins: number) => void;
  onStop: () => void;
  selectedTimerTags: string[];
  setSelectedTimerTags: React.Dispatch<React.SetStateAction<string[]>>;
}

const DURATION_OPTIONS = [25, 35, 45, 60, 100, 150];

export const TimerModule: React.FC<TimerModuleProps> = ({ 
  data, timerActive, setTimerActive, timeLeft, duration, changeDuration, onStop, selectedTimerTags, setSelectedTimerTags
}) => {
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const [confirmChange, setConfirmChange] = useState<number | null>(null);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setTimerActive(!timerActive);
    setConfirmStop(false); // 切换状态时重置停止确认
  };
  
  const totalSeconds = duration * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const radius = 135;
  const circumference = 2 * Math.PI * radius;

  const toggleTag = (tagId: string) => {
    setSelectedTimerTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleStopClick = () => {
    if (confirmStop) {
      onStop();
      setConfirmStop(false);
    } else {
      setConfirmStop(true);
      // 3秒后自动恢复，防止误触后一直处于确认状态
      setTimeout(() => setConfirmStop(false), 3000);
    }
  };

  const handleDurationClick = (mins: number) => {
    if (timerActive) {
      setConfirmChange(mins);
    } else {
      changeDuration(mins);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] h-full gap-8 py-10">
      {/* Duration Select Tabs */}
      <div className="bg-white p-1.5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-wrap justify-center gap-1 z-10 max-w-2xl relative">
        {DURATION_OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => handleDurationClick(opt)}
            className={`px-5 py-2.5 rounded-[1.4rem] text-[11px] font-black transition-all ${
              duration === opt ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {opt} min
          </button>
        ))}

        {/* Change Duration Confirmation Overlay */}
        {confirmChange && (
          <div className="absolute inset-0 bg-white/95 rounded-[2rem] flex items-center justify-center gap-4 px-4 z-20 animate-in fade-in duration-200">
            <span className="text-[10px] font-black text-slate-600 uppercase">确定重置并切换到 {confirmChange}min?</span>
            <button onClick={() => { changeDuration(confirmChange); setConfirmChange(null); }} className="bg-blue-600 text-white p-1.5 rounded-lg"><Check className="w-4 h-4" /></button>
            <button onClick={() => setConfirmChange(null)} className="bg-slate-100 text-slate-400 p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100 flex flex-col items-center w-full max-w-md relative overflow-visible transition-all">
        <div className="flex items-center gap-2 mb-8">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-black text-slate-800 tracking-widest uppercase">Deep Focus</h2>
        </div>
        
        <div className="relative w-64 h-64 flex items-center justify-center mb-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r={radius} className="stroke-slate-50 fill-none" strokeWidth="10" />
            <circle
              cx="150" cy="150" r={radius}
              className="stroke-blue-600 fill-none transition-all duration-300"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * progress) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`${duration >= 100 ? 'text-5xl' : 'text-6xl'} font-black text-slate-800 tracking-tighter tabular-nums`}>
              {formatTime(timeLeft)}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-[0.3em] mt-3 px-4 py-1.5 rounded-full transition-all ${timerActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
              {timerActive ? '正在计时' : '等待开始'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 z-10 mb-8">
          <button 
            onClick={() => { setTimerActive(false); onStop(); }} 
            className="p-4 bg-slate-50 text-slate-400 rounded-[1.5rem] hover:bg-slate-100 transition-all hover:scale-110 active:scale-95" 
            title="重置"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button 
            onClick={toggleTimer} 
            className="p-7 bg-blue-600 text-white rounded-[2rem] hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-blue-200"
          >
            {timerActive ? <Pause className="w-10 h-10 fill-white" /> : <Play className="w-10 h-10 fill-white ml-1" />}
          </button>

          <button 
            onClick={handleStopClick} 
            className={`p-4 rounded-[1.5rem] transition-all hover:scale-110 active:scale-95 relative overflow-hidden ${
              confirmStop ? 'bg-red-600 text-white shadow-lg' : 'bg-red-50 text-red-400'
            }`} 
            title={confirmStop ? "点击确认停止" : "提前停止"}
          >
            {confirmStop ? <Check className="w-5 h-5 stroke-[4px]" /> : <Square className="w-5 h-5 fill-red-400" />}
          </button>
        </div>

        <div className="w-full pt-6 border-t border-slate-50 relative">
          <button 
            onClick={() => setShowTagPicker(!showTagPicker)}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border-2 transition-all ${
              selectedTimerTags.length > 0 
                ? 'bg-blue-50 border-blue-100 text-blue-700' 
                : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <TagIcon className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider">
                {selectedTimerTags.length > 0 ? `已选 ${selectedTimerTags.length} 个标签` : '选择专注标签'}
              </span>
            </div>
            {selectedTimerTags.length > 0 && (
              <div className="flex -space-x-2">
                {selectedTimerTags.slice(0, 3).map(tid => {
                  const tag = data.tags.find(t => t.id === tid);
                  return tag && <div key={tid} className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: tag.color }} />;
                })}
              </div>
            )}
          </button>

          {showTagPicker && (
            <div className="absolute bottom-full left-0 right-0 mb-4 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-6 z-[50] animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">选择标签分类</span>
                <button onClick={() => setShowTagPicker(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-300" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {data.tags.map(tag => {
                  const isSelected = selectedTimerTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${
                        isSelected ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: tag.color }} />
                      <span className="truncate">{tag.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-blue-600" />}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setShowTagPicker(false)}
                className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-100"
              >
                确定
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 opacity-50">
         <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Info className="w-3 h-3 text-amber-500" /> 专注结束后进度将自动计入统计</p>
         <p className="text-slate-300 text-[9px] font-bold">小贴士：未选标签的专注将被归类为“未分类”</p>
      </div>
    </div>
  );
};
