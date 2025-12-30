import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Utensils, Droplets, Trash2, User, AlertCircle, CheckCircle, HelpCircle, XCircle, Sparkles, Clock } from 'lucide-react';
import { saveLog, getLog, updateLog } from '../services/storage';
import { CareLog, StoolType, UrineStatus } from '../types';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';

export const AddLog: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    // Default to current date and time
    const now = new Date();
    const defaultDate = now.toISOString().split('T')[0];
    const defaultTime = now.toTimeString().slice(0, 5); // HH:MM

    const [date, setDate] = useState(defaultDate);
    const [time, setTime] = useState(defaultTime);
    const [author, setAuthor] = useState<'RURU' | 'CCL'>('RURU');
    const [actions, setActions] = useState({
        food: false,
        water: false,
        litter: false,
    });
    const [stoolType, setStoolType] = useState<StoolType>(null);
    const [urineStatus, setUrineStatus] = useState<UrineStatus>(null);
    const [isLitterClean, setIsLitterClean] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isEditMode && id) {
            const fetchLog = async () => {
                setIsLoading(true);
                const log = await getLog(id);
                if (log) {
                    const dateObj = new Date(log.timestamp);
                    setDate(dateObj.toISOString().split('T')[0]);
                    setTime(dateObj.toTimeString().slice(0, 5));
                    setAuthor(log.author);
                    setActions(log.actions);
                    if (log.actions.litter) {
                        setStoolType(log.stoolType || null);
                        setUrineStatus(log.urineStatus || null);
                        setIsLitterClean(log.isLitterClean || false);
                    }
                } else {
                    alert('找不到紀錄');
                    navigate('/');
                }
                setIsLoading(false);
            };
            fetchLog();
        }
    }, [isEditMode, id, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        const timestamp = new Date(`${date}T${time}`).getTime();

        // Validate that at least one action is selected
        if (!actions.food && !actions.water && !actions.litter) {
            alert("請至少選擇一個項目！");
            return;
        }

        setIsSubmitting(true);
        try {

            // Duplicate declaration removed
            const logData: CareLog = {
                id: isEditMode && id ? id : crypto.randomUUID(), // ID needed for type but ignored by save, used by update
                timestamp,
                actions,
                author,
                stoolType: actions.litter ? stoolType : null,
                urineStatus: actions.litter ? urineStatus : null,
                isLitterClean: actions.litter ? isLitterClean : false
            };

            if (isEditMode) {
                await updateLog(logData);
            } else {
                await saveLog(logData);
            }
            navigate('/');
        } catch (e) {
            console.error(e);
            alert("儲存失敗，請檢查網路連線");
            setIsSubmitting(false);
        }
    };

    const toggleAction = (key: keyof typeof actions) => {
        setActions(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            // Reset details if litter is deselected
            if (key === 'litter' && !newState.litter) {
                setStoolType(null);
                setUrineStatus(null);
                setIsLitterClean(false);
            }
            return newState;
        });
    };

    const handleCleanClick = () => {
        const newCleanState = !isLitterClean;
        setIsLitterClean(newCleanState);
        if (newCleanState) {
            setStoolType(null);
            setUrineStatus(null);
        }
    };

    const handleUrineClick = (status: UrineStatus) => {
        setUrineStatus(prev => {
            const newVal = prev === status ? null : status;
            if (newVal) setIsLitterClean(false);
            return newVal;
        });
    };

    const handleStoolClick = (type: StoolType) => {
        setStoolType(prev => {
            const newVal = prev === type ? null : type;
            if (newVal) setIsLitterClean(false);
            return newVal;
        });
    };

    const handleSetCurrentTime = () => {
        const now = new Date();
        setDate(now.toISOString().split('T')[0]);
        setTime(now.toTimeString().slice(0, 5));
    };

    const ActionButton = ({
        id,
        label,
        icon: Icon,
        active,
        activeColorClass,
        activeIconClass
    }: {
        id: keyof typeof actions,
        label: string,
        icon: React.ElementType,
        active: boolean,
        activeColorClass: string,
        activeIconClass: string
    }) => (
        <button
            type="button"
            onClick={() => toggleAction(id)}
            className={`
        w-full p-4 rounded-2xl flex items-center gap-4 border transition-all duration-200
        ${active
                    ? `${activeColorClass} shadow-md border-transparent transform scale-[1.01]`
                    : 'border-stone-100 bg-white text-stone-400 hover:bg-stone-50'}
      `}
        >
            <div className={`p-3 rounded-full ${active ? 'bg-white/50' : 'bg-stone-100'}`}>
                <Icon className={`w-6 h-6 ${active ? activeIconClass : 'text-stone-400'}`} />
            </div>
            <span className={`font-bold text-lg flex-1 text-left ${active ? 'text-stone-700' : ''}`}>{label}</span>
            <div className={`
        w-6 h-6 rounded-full border-2 flex items-center justify-center
        ${active ? 'border-stone-600 bg-stone-600' : 'border-stone-300'}
      `}>
                {active && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
        </button>
    );

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-stone-700" />
                </button>

                <h2 className="text-2xl font-bold text-stone-800">{isEditMode ? '編輯紀錄' : '新增紀錄'}</h2>
            </div>

            {
                isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-800"></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Author Selection */}
                        <section className="bg-white p-5 rounded-2xl shadow-sm space-y-3">
                            <div className="flex items-center gap-2 text-stone-500 mb-2">
                                <User className="w-4 h-4" />
                                <h3 className="text-sm font-bold uppercase tracking-wider">紀錄人</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {(['RURU', 'CCL'] as const).map((name) => (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => setAuthor(name)}
                                        className={`
                            py-3 px-4 rounded-xl font-bold transition-all duration-200
                            ${author === name
                                                ? 'bg-stone-700 text-white shadow-lg ring-2 ring-stone-200'
                                                : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}
                        `}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Date Time Selection */}
                        <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">時間</label>
                                <button
                                    type="button"
                                    onClick={handleSetCurrentTime}
                                    className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
                                >
                                    <Clock className="w-3 h-3" />
                                    現在時間
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-5 w-full px-2">
                                <div className="space-y-1 min-w-0">
                                    <label className="text-xs text-stone-400">日期</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full min-w-0 bg-stone-50 border border-stone-200 rounded-xl px-1 py-3 text-xs sm:text-sm text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-200 text-center tracking-tight"
                                        required
                                    />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <label className="text-xs text-stone-400">時間</label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full min-w-0 bg-stone-50 border border-stone-200 rounded-xl px-0 py-3 text-sm text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-200 text-center"
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Actions Selection */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider px-1">完成項目</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <ActionButton
                                    id="food"
                                    label="更換飼料"
                                    icon={Utensils}
                                    active={actions.food}
                                    activeColorClass="bg-yellow-50 border-yellow-200"
                                    activeIconClass="text-yellow-600"
                                />
                                <ActionButton
                                    id="water"
                                    label="更換飲水"
                                    icon={Droplets}
                                    active={actions.water}
                                    activeColorClass="bg-blue-50 border-blue-200"
                                    activeIconClass="text-blue-600"
                                />

                                {/* Litter Section with details */}
                                <div className={`rounded-2xl transition-all duration-300 ${actions.litter ? 'bg-emerald-50 p-2 border border-emerald-200' : ''}`}>
                                    <ActionButton
                                        id="litter"
                                        label="清理貓砂"
                                        icon={Trash2}
                                        active={actions.litter}
                                        activeColorClass="bg-emerald-100 border-emerald-200"
                                        activeIconClass="text-emerald-700"
                                    />

                                    {actions.litter && (
                                        <div className="mt-4 animate-fade-in space-y-4 px-1 pb-2">

                                            {/* Clean Option */}
                                            <button
                                                type="button"
                                                onClick={handleCleanClick}
                                                className={`w-full py-4 px-2 rounded-xl text-lg font-bold border flex items-center justify-center gap-2 transition-all ${isLitterClean
                                                    ? 'bg-emerald-500 text-white shadow-md border-transparent transform scale-[1.02]'
                                                    : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                                                    }`}
                                            >
                                                <Sparkles className={`w-5 h-5 ${isLitterClean ? 'text-white' : 'text-emerald-500'}`} />
                                                乾淨不用清
                                            </button>

                                            {!isLitterClean && (
                                                <div className="space-y-4 animate-fade-in">
                                                    {/* Urine Status Selection */}
                                                    <div className="border-t border-stone-100 pt-4">
                                                        <h4 className="text-xs font-bold text-stone-500 mb-2 pl-1">尿尿狀態</h4>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUrineClick('HAS_URINE')}
                                                                className={`py-3 px-2 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all ${urineStatus === 'HAS_URINE'
                                                                    ? 'bg-sky-100 border-sky-300 text-sky-700 shadow-sm ring-1 ring-sky-200'
                                                                    : 'bg-white border-stone-200 text-stone-400'
                                                                    }`}
                                                            >
                                                                <Droplets className="w-4 h-4" />
                                                                有尿
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUrineClick('NO_URINE')}
                                                                className={`py-3 px-2 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all ${urineStatus === 'NO_URINE'
                                                                    ? 'bg-stone-200 border-stone-300 text-stone-600 shadow-sm ring-1 ring-stone-200'
                                                                    : 'bg-white border-stone-200 text-stone-400'
                                                                    }`}
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                                沒尿
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Stool Type Selection */}
                                                    <div>
                                                        <h4 className="text-xs font-bold text-stone-500 mb-2 pl-1">便便狀態</h4>
                                                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStoolClick('FORMED')}
                                                                className={`py-2 px-1 rounded-lg text-sm font-bold border flex flex-col items-center gap-1 transition-all ${stoolType === 'FORMED'
                                                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700 shadow-sm'
                                                                    : 'bg-white border-stone-200 text-stone-400'
                                                                    }`}
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                成形
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStoolClick('UNFORMED')}
                                                                className={`py-2 px-1 rounded-lg text-sm font-bold border flex flex-col items-center gap-1 transition-all ${stoolType === 'UNFORMED'
                                                                    ? 'bg-orange-100 border-orange-300 text-orange-700 shadow-sm'
                                                                    : 'bg-white border-stone-200 text-stone-400'
                                                                    }`}
                                                            >
                                                                <HelpCircle className="w-4 h-4" />
                                                                不成形
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStoolClick('DIARRHEA')}
                                                                className={`py-2 px-1 rounded-lg text-sm font-bold border flex flex-col items-center gap-1 transition-all ${stoolType === 'DIARRHEA'
                                                                    ? 'bg-red-100 border-red-300 text-red-700 shadow-sm'
                                                                    : 'bg-white border-stone-200 text-stone-400'
                                                                    }`}
                                                            >
                                                                <AlertCircle className="w-4 h-4" />
                                                                腹瀉
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Submit Button */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-stone-100 max-w-md mx-auto z-50">
                            <button
                                type="submit"
                                className="w-full bg-stone-800 text-white flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg hover:bg-stone-700 active:scale-98 transition-all shadow-lg"
                            >
                                <Save className="w-5 h-5" />
                                <span>{isSubmitting ? '儲存中...' : '儲存紀錄'}</span>
                            </button>
                        </div>

                        {/* Spacer for fixed bottom button - Increased height for safety */}
                        <div className="h-32" />
                    </form>
                )
            }
        </div >
    );
};