import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertTriangle, X, Lock, Plus, Users, Cat, Dog, PawPrint } from 'lucide-react';
import { clearAllLogs, getSettings, saveSettings } from '../services/storage';
import { Owner, AppSettings } from '../types';
import { PRESET_COLORS } from '../constants';
import { useSettingsContext } from '../App';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshSettings: refreshGlobalSettings } = useSettingsContext();
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // Owner management state
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isOwnersDirty, setIsOwnersDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pet management state
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState<'CAT' | 'DOG'>('CAT');
  const [petBirthday, setPetBirthday] = useState('');
  const [isPetDirty, setIsPetDirty] = useState(false);
  const [isPetSaving, setIsPetSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const s = await getSettings();
      setSettings(s);
      setOwners(s.owners);
      // Initialize pet data
      setPetName(s.pet.name);
      setPetType(s.pet.type);
      setPetBirthday(s.pet.birthday || '');
    };
    loadSettings();
  }, []);

  // Scroll to owners section if hash is #owners
  useEffect(() => {
    if (location.hash === '#owners') {
      const el = document.getElementById('owners-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.hash, settings]);

  const handleAddOwner = () => {
    const newOwner: Owner = {
      id: crypto.randomUUID(),
      name: '',
      color: PRESET_COLORS[owners.length % PRESET_COLORS.length]
    };
    setOwners([...owners, newOwner]);
    setIsOwnersDirty(true);
  };

  const handleRemoveOwner = (id: string) => {
    if (owners.length <= 1) {
      alert('至少需要保留一位主人');
      return;
    }
    setOwners(owners.filter(o => o.id !== id));
    setIsOwnersDirty(true);
  };

  const handleUpdateOwner = (id: string, field: keyof Owner, value: string) => {
    setOwners(owners.map(o => o.id === id ? { ...o, [field]: value } : o));
    setIsOwnersDirty(true);
  };

  const handleSaveOwners = async () => {
    if (owners.some(o => !o.name.trim())) {
      alert('請輸入所有主人的名字');
      return;
    }
    if (!settings) return;

    setIsSaving(true);
    try {
      const newSettings: AppSettings = {
        ...settings,
        owners: owners
      };
      await saveSettings(newSettings);
      setSettings(newSettings);
      setIsOwnersDirty(false);
      // Refresh global settings so other pages see the update
      await refreshGlobalSettings();
      alert('✅ 主人資料已儲存');
    } catch (e) {
      console.error('Failed to save owners', e);
      alert('儲存失敗，請重試');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePetNameChange = (name: string) => {
    setPetName(name);
    setIsPetDirty(true);
  };

  const handlePetTypeChange = (type: 'CAT' | 'DOG') => {
    setPetType(type);
    setIsPetDirty(true);
  };

  const handlePetBirthdayChange = (birthday: string) => {
    setPetBirthday(birthday);
    setIsPetDirty(true);
  };

  const handleSavePet = async () => {
    if (!petName.trim()) {
      alert('請輸入寵物名字');
      return;
    }
    if (!petBirthday) {
      alert('請輸入寵物生日');
      return;
    }
    if (!settings) return;

    setIsPetSaving(true);
    try {
      const newSettings: AppSettings = {
        ...settings,
        pet: { name: petName.trim(), type: petType, birthday: petBirthday }
      };
      await saveSettings(newSettings);
      setSettings(newSettings);
      setIsPetDirty(false);
      // Refresh global settings so other pages see the update
      await refreshGlobalSettings();
      alert('✅ 寵物資料已儲存');
    } catch (e) {
      console.error('Failed to save pet', e);
      alert('儲存失敗，請重試');
    } finally {
      setIsPetSaving(false);
    }
  };

  const handleClearAll = () => {
    setSelectedDate('');
    setShowBirthdayModal(true);
  };

  const handleBirthdaySubmit = () => {
    // Verify against the pet's actual birthday from settings
    const correctBirthday = settings?.pet?.birthday || '';
    if (selectedDate === correctBirthday) {
      setShowBirthdayModal(false);
      // Final confirmation
      const petNameDisplay = settings?.pet?.name || '寵物';
      if (window.confirm(`⚠️ 最終確認\n\n您即將刪除所有紀錄！\n此動作無法復原，所有${petNameDisplay}的照護紀錄都會消失。\n\n確定要繼續嗎？`)) {
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

      {/* Owner Management Section */}
      <section id="owners-section" className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          管理主人
        </h3>
        <p className="text-stone-500 mb-4 text-sm leading-relaxed">
          新增、編輯或刪除照護{settings?.pet?.name || '寵物'}的主人。
        </p>

        <div className="space-y-3 mb-4">
          {owners.map((owner, index) => (
            <div key={owner.id} className="bg-stone-50 p-4 rounded-xl border border-stone-100">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                  style={{ backgroundColor: owner.color }}
                >
                  {owner.name.substring(0, 1) || '#'}
                </div>
                <input
                  type="text"
                  placeholder={`主人 ${index + 1} 名字`}
                  value={owner.name}
                  onChange={(e) => handleUpdateOwner(owner.id, 'name', e.target.value)}
                  className="flex-1 bg-white px-3 py-2 rounded-lg font-medium outline-none placeholder-stone-400 border border-stone-200 focus:border-blue-400 transition-colors"
                />
                {owners.length > 1 && (
                  <button
                    onClick={() => handleRemoveOwner(owner.id)}
                    className="text-stone-300 hover:text-red-500 transition-colors p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Color Palette */}
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => handleUpdateOwner(owner.id, 'color', color)}
                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${owner.color === color ? 'ring-2 ring-offset-2 ring-stone-300 scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddOwner}
          className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 font-medium hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 mb-4"
        >
          <Plus className="w-5 h-5" />
          新增一位主人
        </button>

        {isOwnersDirty && (
          <button
            onClick={handleSaveOwners}
            disabled={isSaving}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {isSaving ? '儲存中...' : '儲存變更'}
          </button>
        )}
      </section>

      {/* Pet Management Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
          <PawPrint className="w-5 h-5 text-orange-500" />
          寵物資料
        </h3>
        <p className="text-stone-500 mb-4 text-sm leading-relaxed">
          修改寵物的名字和類型。
        </p>

        <div className="space-y-4">
          {/* Pet Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-600">寵物名字</label>
            <input
              type="text"
              value={petName}
              onChange={(e) => handlePetNameChange(e.target.value)}
              placeholder="例如：小賀"
              className="w-full bg-stone-50 px-4 py-3 rounded-xl font-medium outline-none placeholder-stone-400 border border-stone-200 focus:border-orange-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Pet Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-600">寵物類型</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePetTypeChange('CAT')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${petType === 'CAT'
                  ? 'border-orange-400 bg-orange-50 text-orange-700'
                  : 'border-stone-200 bg-stone-50 text-stone-400 hover:bg-stone-100'
                  }`}
              >
                <Cat className="w-6 h-6" />
                <span className="font-bold">貓咪</span>
              </button>
              <button
                type="button"
                onClick={() => handlePetTypeChange('DOG')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${petType === 'DOG'
                  ? 'border-orange-400 bg-orange-50 text-orange-700'
                  : 'border-stone-200 bg-stone-50 text-stone-400 hover:bg-stone-100'
                  }`}
              >
                <Dog className="w-6 h-6" />
                <span className="font-bold">狗狗</span>
              </button>
            </div>
          </div>

          {/* Pet Birthday */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-600">寵物生日</label>
            <input
              type="date"
              value={petBirthday}
              onChange={(e) => handlePetBirthdayChange(e.target.value)}
              className="w-full bg-stone-50 px-4 py-3 rounded-xl font-medium outline-none border border-stone-200 focus:border-orange-400 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {isPetDirty && (
          <button
            onClick={handleSavePet}
            disabled={isPetSaving}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 mt-4"
          >
            {isPetSaving ? '儲存中...' : '儲存變更'}
          </button>
        )}
      </section>

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-[280px] shadow-xl animate-fade-in overflow-hidden">
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
              請選擇{settings?.pet?.name || '寵物'}的生日：
            </p>

            <div className="flex justify-center mb-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-3 border border-stone-200 rounded-xl text-stone-700 text-center text-base focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
              />
            </div>

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