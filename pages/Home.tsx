import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CalendarDays, Sparkles, Droplets, XCircle, CheckCircle, HelpCircle, AlertCircle, Trash2, Edit, RefreshCw, Settings as SettingsIcon, Scale, ChevronUp, User, LogOut, UserPlus } from 'lucide-react';
import { StatusCard } from '../components/StatusCard';
import { getTodayStatus, getLogs, deleteLog } from '../services/storage';
import { CareLog } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useSettings, useAuth } from '../App';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const settings = useSettings();
  const [status, setStatus] = useState<any>({
    food: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    water: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    litter: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    grooming: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    medication: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    weight: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false }
  });
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { handleLogout, handleSwitchAccount } = useAuth();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value);
    setSelectedDate(new Date(year, selectedDate.getMonth(), 1));
    setIsExpanded(false);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = parseInt(e.target.value);
    setSelectedDate(new Date(selectedDate.getFullYear(), month, 1));
    setIsExpanded(false);
  };

  // Group logs by date for the selected month
  const getMonthlyLogs = () => {
    const monthlyData: { date: string; logs: CareLog[] }[] = [];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = daysInMonth; i >= 1; i--) {
      const dayStart = new Date(year, month, i).getTime();
      const dayEnd = dayStart + 86400000;
      const dateStr = new Date(year, month, i).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });

      const dayLogs = logs.filter(l => l.timestamp >= dayStart && l.timestamp < dayEnd);
      if (dayLogs.length > 0) {
        monthlyData.push({ date: dateStr, logs: dayLogs });
      }
    }
    return monthlyData;
  };

  const monthlyLogs = getMonthlyLogs();

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

  // --- Dynamic Score Calculations ---

  const calculatePoints = (log: CareLog) => {
    return (log.actions.litter ? (log.isLitterClean ? 1 : 4) : 0) +
      (log.actions.food ? 2 : 0) +
      (log.actions.water ? 2 : 0) +
      (log.actions.grooming ? 3 : 0) +
      (log.actions.medication ? 2 : 0) +
      (log.weight ? 2 : 0);
  };

  const getScoreData = () => {
    const today = new Date();
    const data = [];
    const weeklyTotals: { [key: string]: number } = {};

    // Initialize weekly totals
    settings.owners.forEach(o => weeklyTotals[o.id] = 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const dateStr = d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });

      // Daily scores for each owner
      const dailyScore: { [key: string]: any } = { date: dateStr };
      settings.owners.forEach(o => dailyScore[o.id] = 0);

      logs.forEach(log => {
        if (log.timestamp >= dayStart && log.timestamp < dayEnd) {
          if (weeklyTotals[log.author] !== undefined) {
            const points = calculatePoints(log);
            dailyScore[log.author] += points;
            weeklyTotals[log.author] += points;
          }
        }
      });
      data.push(dailyScore);
    }
    return { data, weeklyTotals };
  };

  const { data: chartData, weeklyTotals } = getScoreData();

  // Find winner(s)
  const maxScore = Math.max(...Object.values(weeklyTotals));
  const winners = settings.owners.filter(o => weeklyTotals[o.id] === maxScore);
  const isTie = winners.length > 1;
  const isZero = maxScore === 0;

  // All-time totals
  const getAllTimeTotals = () => {
    const totals: { [key: string]: number } = {};
    settings.owners.forEach(o => totals[o.id] = 0);
    logs.forEach(log => {
      if (totals[log.author] !== undefined) {
        totals[log.author] += calculatePoints(log);
      }
    });
    return totals;
  };
  const allTimeTotals = getAllTimeTotals();


  // Get weight data for chart
  const getWeightChartData = () => {
    return logs
      .filter(log => log.weight)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(log => ({
        date: new Date(log.timestamp).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
        weight: log.weight
      }));
  };
  const weightChartData = getWeightChartData();
  const hasWeightData = weightChartData.length > 0;

  // Generate random message
  const generateMessage = () => {
    const base = settings.pet.type === 'DOG' ? '汪' : '喵';
    const parts = [base, '~', '!'];
    const additionalLength = Math.floor(Math.random() * 19) + 1;
    let message = base;
    for (let i = 0; i < additionalLength; i++) {
      message += parts[Math.floor(Math.random() * parts.length)];
    }
    return message;
  };
  const petMessage = generateMessage();

  // Calculate days until next birthday
  const getDaysUntilBirthday = () => {
    const birthday = settings.pet.birthday;
    if (!birthday) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = birthday.split('-').map(Number);
    let nextBirthday = new Date(today.getFullYear(), month - 1, day);
    nextBirthday.setHours(0, 0, 0, 0);

    // If birthday has passed this year, calculate for next year
    if (nextBirthday < today) {
      nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  const daysUntilBirthday = getDaysUntilBirthday();

  const getDailyStats = (dayLogs: CareLog[]) => {
    const urineCount = dayLogs.filter(l => l.urineStatus === 'HAS_URINE').length;
    const formedCount = dayLogs.filter(l => l.stoolType === 'FORMED').length;
    const unformedCount = dayLogs.filter(l => l.stoolType === 'UNFORMED').length;
    const diarrheaCount = dayLogs.filter(l => l.stoolType === 'DIARRHEA').length;

    const stoolParts = [];
    if (formedCount > 0) stoolParts.push(`成形${formedCount}`);
    if (unformedCount > 0) stoolParts.push(`不成形${unformedCount}`);
    if (diarrheaCount > 0) stoolParts.push(`腹瀉${diarrheaCount}`);

    const stoolText = stoolParts.length > 0 ? stoolParts.join('，') : '0';
    return `(尿尿: ${urineCount}, 便便: ${stoolText})`;
  };

  const getOwner = (id: string) => settings.owners.find(o => o.id === id);

  return (
    <div className="space-y-8 animate-fade-in">

      <header className="bg-white p-4 shadow-sm z-10 sticky top-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-stone-800 tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-lg">
                {settings.pet.type === 'DOG' ? '🐶' : '🐱'}
              </span>
              {settings.pet.name}の生活日記
            </h1>
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-stone-400 hover:bg-stone-50 rounded-full transition-colors"
            >
              <SettingsIcon className="w-6 h-6" />
            </button>
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 text-stone-400 hover:bg-stone-50 rounded-full transition-colors"
              >
                <User className="w-6 h-6" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-stone-200 py-2 min-w-[160px] z-50 animate-fade-in">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleSwitchAccount();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-3 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    切換帳戶
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    登出
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-stone-400 mt-2">
          {new Date().toLocaleString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit' })}
        </div>
        {daysUntilBirthday !== null && (
          <div className="text-center text-xs mt-1">
            {daysUntilBirthday === 0 ? (
              <span className="text-orange-500 font-bold">🎂 今天是{settings.pet.name}的生日！🎉</span>
            ) : (
              <span className="text-stone-400">距離{settings.pet.name}生日還有 <span className="text-orange-500 font-medium">{daysUntilBirthday}</span> 天</span>
            )}
          </div>
        )}
        <div className="text-center text-xs text-stone-400 mt-1">
          {settings.pet.name}想說: {petMessage}
        </div>
      </header>

      {/* Weekly Scoreboard */}
      <section>
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 mb-4 border border-orange-100">
          <h3 className="text-center font-bold text-stone-700 mb-1">
            {isZero ? (
              <>本週{settings.pet.name}<span className="text-[#CE0000] text-xl">還沒有愛</span></>
            ) : isTie ? (
              <>本週{settings.pet.name}愛大家<span className="text-[#CE0000] text-xl">一樣多</span></>
            ) : (
              <>本週{settings.pet.name}更愛 <span className="text-xl" style={{ color: winners[0].color }}>{winners[0].name}</span></>
            )}
          </h3>
          <p className="text-center text-xs text-stone-400 mb-2">本週給{settings.pet.name}的愛</p>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 items-center text-sm font-medium mb-4">
            {settings.owners.map((owner, idx) => (
              <React.Fragment key={owner.id}>
                {idx > 0 && <div className="h-4 w-px bg-stone-300 hidden sm:block"></div>}
                <div
                  className={`text-center transition-transform ${weeklyTotals[owner.id] === maxScore && !isZero ? 'scale-110 font-bold' : ''}`}
                  style={{ color: owner.color }}
                >
                  {owner.name}: <span className="text-lg">{weeklyTotals[owner.id]}</span> 分
                </div>
              </React.Fragment>
            ))}
          </div>

          <p className="text-center text-xs text-stone-400 mb-1">最初から</p>
          <div className="text-center text-xs text-stone-400 mb-4 flex flex-wrap justify-center gap-2">
            {settings.owners.map((owner, idx) => (
              <span key={owner.id}>
                {idx > 0 && "，"}
                <span style={{ color: owner.color }} className="font-medium">{owner.name}</span>
                累積
                <span style={{ color: owner.color }} className="font-medium">{allTimeTotals[owner.id]}</span>
                分愛
              </span>
            ))}
          </div>

          <div className="h-[200px] w-full mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fed7aa" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#78716c' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#78716c' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px', color: '#78716c', marginBottom: '4px' }}
                />
                {settings.owners.map(owner => (
                  <Line
                    key={owner.id}
                    type="monotone"
                    dataKey={owner.id} // Matches the key in data objects
                    name={owner.name}
                    stroke={owner.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: owner.color, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[10px] text-stone-400 text-center mt-2 opacity-70">
            (梳毛 +3, 飼料/水/給藥/體重 +2, 貓砂:乾淨+1/髒+4)
          </div>
        </div>
      </section>

      {/* Today's Status Section */}
      <section>
        <div className="flex items-center mb-4 px-1">
          <h2 className="text-xl font-bold text-stone-800">今日任務</h2>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-2">
          <StatusCard type="food" progress={status.food} />
          <StatusCard type="water" progress={status.water} />
          <StatusCard type="litter" progress={status.litter} />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatusCard type="grooming" progress={status.grooming} />
          <StatusCard type="medication" progress={status.medication} />
          <StatusCard type="weight" progress={status.weight} />
        </div>
      </section>

      {/* Weight Change Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-1">
          <Scale className="w-5 h-5 text-[#EA7500]" />
          <h2 className="text-lg font-bold text-stone-700">體重變化</h2>
          <span className="text-xs text-stone-400">(過去14天)</span>
        </div>
        <div className="bg-gradient-to-r from-[#EA7500]/10 to-amber-50 rounded-2xl p-4 border border-[#EA7500]/20">
          {hasWeightData ? (
            <>
              <div className="h-[80px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightChartData.slice(-14)} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EA7500" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fill: '#78716c' }}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      axisLine={false}
                      tickLine={false}
                      domain={['dataMin - 0.3', 'dataMax + 0.3']}
                      tickFormatter={(value) => `${value.toFixed(1)}`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value.toFixed(1)} 公斤`, '體重']}
                      labelStyle={{ fontSize: '12px', color: '#78716c', marginBottom: '4px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#EA7500"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#EA7500', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {logs.some(log => log.weight) && (
                <div className="text-center text-xs text-stone-500 mt-2">
                  最新體重：<span className="font-bold text-[#EA7500]">{logs.filter(log => log.weight).sort((a, b) => b.timestamp - a.timestamp)[0]?.weight?.toFixed(1)}</span> 公斤
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-stone-400 text-sm">
              尚無體重紀錄
            </div>
          )}
        </div>
      </section>

      {/* Monthly Logs Section */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-stone-400" />
            <h2 className="text-lg font-bold text-stone-700">月份紀錄</h2>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-orange-500 transition-all ml-2"
              title="回到當月"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-stone-100">
            <select
              value={selectedDate.getFullYear()}
              onChange={handleYearChange}
              className="bg-transparent text-sm font-bold text-stone-600 py-1.5 px-2 outline-none cursor-pointer hover:bg-stone-50 rounded-md transition-colors appearance-none text-center"
              style={{ textAlignLast: 'center' }}
            >
              {Array.from({ length: 2045 - 2024 + 1 }, (_, i) => {
                const year = 2024 + i;
                return (
                  <option key={year} value={year}>
                    {year}年
                  </option>
                );
              })}
            </select>
            <div className="w-px h-4 bg-stone-200"></div>
            <select
              value={selectedDate.getMonth()}
              onChange={handleMonthChange}
              className="bg-transparent text-sm font-bold text-stone-600 py-1.5 px-2 outline-none cursor-pointer hover:bg-stone-50 rounded-md transition-colors appearance-none text-center"
              style={{ textAlignLast: 'center' }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {i + 1}月
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-6">
          {monthlyLogs.length === 0 ? (
            <div className="text-center py-10 text-stone-400 bg-white rounded-xl border border-stone-200 border-dashed">
              本月尚無紀錄
            </div>
          ) : (
            <>
              {(isExpanded ? monthlyLogs : monthlyLogs.slice(0, 3)).map((dayGroup) => (
                <div key={dayGroup.date} className="animate-fade-in-up">
                  <h3 className="text-sm font-bold text-stone-400 mb-2 pl-1 flex items-center gap-2">
                    <span>{dayGroup.date}</span>
                    <span className="text-xs text-stone-300 font-normal">
                      {getDailyStats(dayGroup.logs)}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {dayGroup.logs.map((log) => {
                      const owner = getOwner(log.author);
                      const ownerColor = owner?.color || '#9ca3af'; // gray-400 as default
                      // Light generic background if needed, or specific light color derivative if we had it. Use generic opacity.

                      return (
                        <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between relative overflow-hidden group">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-stone-300"></div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span
                                style={{
                                  backgroundColor: `${ownerColor}20`, // 20 hex alpha = ~12% opacity 
                                  color: ownerColor
                                }}
                                className="text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider"
                              >
                                {owner?.name || '未知'}
                              </span>
                              <span className="text-xs text-stone-400 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2 items-center flex-wrap justify-end">
                              {log.actions.food && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs font-medium">飼料</span>}
                              {log.actions.water && <span className="bg-[#921AFF]/10 text-[#921AFF] px-2 py-1 rounded-md text-xs font-medium">飲水</span>}
                              {log.actions.litter && (
                                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-xs font-medium border border-emerald-100">
                                  <span className="mr-1">貓砂</span>
                                  {renderLitterDetails(log)}
                                </div>
                              )}
                              {log.actions.grooming && <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-md text-xs font-medium">梳毛</span>}
                              {log.actions.medication && <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded-md text-xs font-medium">給藥</span>}
                              {log.weight && (
                                <span className="bg-[#EA7500]/10 text-[#EA7500] px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                                  <Scale className="w-3 h-3" />
                                  {log.weight.toFixed(1)} kg
                                </span>
                              )}
                            </div>
                            <div className="flex flex-row gap-1 whitespace-nowrap">
                              <button
                                onClick={(e) => handleEdit(log.id, e)}
                                className="p-1.5 text-stone-300 hover:text-stone-600 hover:bg-stone-50 rounded-full transition-colors"
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
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              {!isExpanded && monthlyLogs.length > 3 && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="w-full py-3 text-stone-500 font-bold text-sm bg-white rounded-xl border border-stone-200 shadow-sm hover:bg-stone-50 hover:text-stone-600 hover:border-stone-300 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>顯示當月所有紀錄 ({monthlyLogs.length} 天)</span>
                </button>
              )}
              {isExpanded && monthlyLogs.length > 3 && (
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-full py-3 text-stone-500 font-bold text-sm bg-white rounded-xl border border-stone-200 shadow-sm hover:bg-stone-50 hover:text-stone-600 hover:border-stone-300 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>顯示近三天</span>
                </button>
              )}
            </>
          )}
        </div>
      </section >

      {/* Floating Action Button */}
      < div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none" >
        <button
          onClick={() => navigate('/add')}
          className="pointer-events-auto bg-stone-800 text-white flex items-center gap-2 px-6 py-4 rounded-full shadow-xl hover:bg-stone-700 hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-orange-50"
        >
          <Plus className="w-6 h-6" />
          <span className="font-bold text-lg">紀錄一下</span>
        </button>
      </div >
    </div >
  );
};