import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CalendarDays, Sparkles, Droplets, XCircle, CheckCircle, HelpCircle, AlertCircle, Trash2, Edit, RefreshCw } from 'lucide-react';
import { StatusCard } from '../components/StatusCard';
import { getTodayStatus, getLogs, deleteLog } from '../services/storage';
import { CareLog } from '../types';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<any>({
    food: { morning: false, bedtime: false, isComplete: false },
    water: { morning: false, bedtime: false, isComplete: false },
    litter: { morning: false, afternoon: false, bedtime: false, isComplete: false }
  });
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    const todayStatus = await getTodayStatus();
    const allLogs = await getLogs();
    setStatus(todayStatus);
    setLogs(allLogs);
    setTimeout(() => setIsRefreshing(false), 500); // Visual delay
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent potentially triggering other click events if any
    if (window.confirm('確定要刪除這筆紀錄嗎？')) {
      try {
        await deleteLog(id);
        await fetchData(); // Refresh data
      } catch (error) {
        console.error(error);
        alert('刪除失敗');
      }
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/edit/${id}`);
  };

  // Group logs by date for the last 7 days
  const getWeeklyLogs = () => {
    const weeklyData: { date: string; logs: CareLog[] }[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;

      const dayLogs = logs.filter(l => l.timestamp >= dayStart && l.timestamp < dayEnd);
      if (dayLogs.length > 0) {
        weeklyData.push({ date: dateStr, logs: dayLogs });
      }
    }
    return weeklyData;
  };

  const weeklyLogs = getWeeklyLogs();

  const renderLitterDetails = (log: CareLog) => {
    if (log.isLitterClean) {
      return (
        <span className="bg-white text-emerald-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>乾淨</span>
        </span>
      );
    }

    return (
      <>
        {log.urineStatus === 'HAS_URINE' && (
          <span className="bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-sky-200 flex items-center gap-1">
            <Droplets className="w-3 h-3" />
            <span>有尿</span>
          </span>
        )}
        {log.urineStatus === 'NO_URINE' && (
          <span className="bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded text-[10px] font-bold border border-stone-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>沒尿</span>
          </span>
        )}
        {log.stoolType === 'FORMED' && (
          <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>成形</span>
          </span>
        )}
        {log.stoolType === 'UNFORMED' && (
          <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-orange-200 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>不成形</span>
          </span>
        )}
        {log.stoolType === 'DIARRHEA' && (
          <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>腹瀉</span>
          </span>
        )}
      </>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Today's Status Section */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-800">今日任務</h2>
            <button
              onClick={fetchData}
              className={`p-1.5 rounded-full hover:bg-stone-100 text-stone-400 transition-all ${isRefreshing ? 'animate-spin text-stone-600 bg-stone-100' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm text-stone-500 bg-white px-3 py-1 rounded-full shadow-sm">
            {new Date().toLocaleDateString('zh-TW', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatusCard type="food" progress={status.food} />
          <StatusCard type="water" progress={status.water} />
          <StatusCard type="litter" progress={status.litter} />
        </div>
      </section>

      {/* Weekly Logs Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-1">
          <CalendarDays className="w-5 h-5 text-stone-400" />
          <h2 className="text-lg font-bold text-stone-700">本週紀錄</h2>
        </div>
        <div className="space-y-6">
          {weeklyLogs.length === 0 ? (
            <div className="text-center py-10 text-stone-400 bg-white rounded-xl border border-stone-200 border-dashed">
              本週尚無紀錄
            </div>
          ) : (
            weeklyLogs.map((dayGroup) => (
              <div key={dayGroup.date} className="animate-fade-in-up">
                <h3 className="text-sm font-bold text-stone-400 mb-2 pl-1">{dayGroup.date}</h3>
                <div className="space-y-3">
                  {dayGroup.logs.map((log) => (
                    <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-stone-300"></div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`
                                text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider
                                ${log.author === 'RURU' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}
                            `}>
                            {log.author || '未知'}
                          </span>
                          <span className="text-xs text-stone-400 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap justify-end">
                        {log.actions.food && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs font-medium">飼料</span>}
                        {log.actions.water && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">飲水</span>}
                        {log.actions.litter && (
                          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-xs font-medium border border-emerald-100">
                            <span className="mr-1">貓砂</span>
                            {renderLitterDetails(log)}
                          </div>
                        )}
                        <button
                          onClick={(e) => handleEdit(log.id, e)}
                          className="ml-2 p-1.5 text-stone-300 hover:text-stone-600 hover:bg-stone-50 rounded-full transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(log.id, e)}
                          className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <button
          onClick={() => navigate('/add')}
          className="pointer-events-auto bg-stone-800 text-white flex items-center gap-2 px-6 py-4 rounded-full shadow-xl hover:bg-stone-700 hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-orange-50"
        >
          <Plus className="w-6 h-6" />
          <span className="font-bold text-lg">紀錄一下</span>
        </button>
      </div>
    </div>
  );
};