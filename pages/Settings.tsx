import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertTriangle, X, Lock } from 'lucide-react';
import { clearAllLogs } from '../services/storage';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const handleClearAll = () => {
    setSelectedDate('');
    setShowBirthdayModal(true);
  };

  const handleBirthdaySubmit = () => {
    // Correct answer: 2025-06-08
    if (selectedDate === '2025-06-08') {
      setShowBirthdayModal(false);
      // Final confirmation
      if (window.confirm('⚠️ 最終確認\n\n您即將刪除所有紀錄！\n此動作無法復原，所有小賀的照護紀錄都會消失。\n\n確定要繼續嗎？')) {
        clearAllLogs();
        alert('✅ 所有紀錄已清除');
        navigate('/');
      }
    } else {
      alert('❌ 答案不正確！\n\n無法清除資料。');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-stone-700" />
        </button>
        <h2 className="text-2xl font-bold text-stone-800">設定</h2>
      </div>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          危ない！
        </h3>
        <p className="text-stone-500 mb-6 text-sm leading-relaxed">
          這裡的操作將會永久影響您的資料，請謹慎使用。清除資料後無法復原。
        </p>

        <button
          onClick={handleClearAll}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold hover:bg-red-100 active:bg-red-200 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          清除所有紀錄
        </button>
      </section>

      <div className="text-center text-xs text-stone-300 mt-8">
        小賀Log v1.0.0
      </div>

      {/* Birthday Verification Modal */}
      {showBirthdayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-bold text-stone-800">安全驗證</h3>
              </div>
              <button
                onClick={() => setShowBirthdayModal(false)}
                className="p-1 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <p className="text-stone-600 mb-4 text-sm">
              請選擇小賀的生日：
            </p>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 border border-stone-200 rounded-xl text-stone-700 text-center text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowBirthdayModal(false)}
                className="flex-1 p-3 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleBirthdaySubmit}
                disabled={!selectedDate}
                className="flex-1 p-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};