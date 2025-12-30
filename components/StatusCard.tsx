import React from 'react';
import { Check, Utensils, Droplets, Trash2 } from 'lucide-react';
import { TaskProgress } from '../types';

interface StatusCardProps {
  type: 'food' | 'water' | 'litter';
  progress: TaskProgress;
}

export const StatusCard: React.FC<StatusCardProps> = ({ type, progress }) => {
  const config = {
    food: {
      label: '更換飼料',
      icon: Utensils,
      color: 'bg-yellow-100',
      activeColor: 'bg-yellow-400',
      textColor: 'text-yellow-700',
      checkColor: 'bg-yellow-500',
    },
    water: {
      label: '更換飲水',
      icon: Droplets,
      color: 'bg-[#921AFF]/10',
      activeColor: 'bg-[#921AFF]',
      textColor: 'text-[#921AFF]',
      checkColor: 'bg-[#921AFF]',
    },
    litter: {
      label: '清理貓砂',
      icon: Trash2,
      color: 'bg-emerald-100',
      activeColor: 'bg-emerald-400',
      textColor: 'text-emerald-700',
      checkColor: 'bg-emerald-500',
    },
  };

  const { label, icon: Icon, color, activeColor, textColor, checkColor } = config[type];
  const isDone = progress.isComplete;

  const PeriodBadge = ({ active, label }: { active: boolean, label: string }) => (
    <div className={`
        flex flex-col items-center gap-1 transition-all duration-300
        ${active ? 'opacity-100 scale-110' : 'opacity-40 grayscale'}
    `}>
      <div className={`
            w-2 h-2 rounded-full 
            ${active ? checkColor : 'bg-stone-300'}
        `} />
      <span className="text-[10px] font-bold text-stone-500">{label}</span>
    </div>
  );

  return (
    <div className={`
      relative flex flex-col items-center justify-center p-3 py-4 rounded-2xl transition-all duration-500
      ${isDone ? 'bg-white shadow-sm ring-2 ring-stone-200 opacity-90' : 'bg-white shadow-md'}
    `}>
      <div className={`
        w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-colors duration-300
        ${isDone ? activeColor : color}
      `}>
        {isDone ? (
          <Check className="w-8 h-8 text-white animate-bounce" />
        ) : (
          <Icon className={`w-7 h-7 ${textColor}`} />
        )}
      </div>

      <span className={`font-bold text-sm mb-3 ${isDone ? 'text-stone-400' : 'text-stone-700'}`}>
        {label}
      </span>

      {/* Progress Indicators */}
      <div className="flex items-center justify-center gap-3 w-full bg-stone-50 rounded-lg py-1.5 px-2">
        <PeriodBadge active={progress.morning} label="早上" />

        {progress.afternoon !== undefined && (
          <PeriodBadge active={progress.afternoon} label="下午" />
        )}

        <PeriodBadge active={progress.bedtime} label="睡前" />
      </div>
    </div>
  );
};