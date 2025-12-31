import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PetProfile, Owner, AppSettings } from '../types';
import { PRESET_COLORS } from '../constants';
import { saveSettings } from '../services/storage';
import { Plus, Trash2, Check, Cat, Dog } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);

    const [petName, setPetName] = useState('');
    const [petType, setPetType] = useState<'CAT' | 'DOG'>('CAT');
    const [petBirthday, setPetBirthday] = useState('');

    const [owners, setOwners] = useState<Owner[]>([
        { id: crypto.randomUUID(), name: '', color: PRESET_COLORS[0] }
    ]);

    const handleAddOwner = () => {
        setOwners([...owners, { id: crypto.randomUUID(), name: '', color: PRESET_COLORS[owners.length % PRESET_COLORS.length] }]);
    };

    const handleRemoveOwner = (id: string) => {
        setOwners(owners.filter(o => o.id !== id));
    };

    const handleUpdateOwner = (id: string, field: keyof Owner, value: string) => {
        setOwners(owners.map(o => o.id === id ? { ...o, [field]: value } : o));
    };

    const handleSave = async () => {
        if (!petName.trim()) return alert('請輸入寵物名字');
        if (!petBirthday) return alert('請輸入寵物生日');
        if (owners.some(o => !o.name.trim())) return alert('請輸入所有主人的名字');
        if (owners.length === 0) return alert('請至少新增一位主人');

        setLoading(true);
        try {
            const settings: AppSettings = {
                pet: { name: petName, type: petType, birthday: petBirthday },
                owners: owners,
                isConfigured: true
            };
            await saveSettings(settings);
            navigate('/');
            window.location.reload(); // Force reload to update app context/state if simple
        } catch (e) {
            console.error("Failed to save settings", e);
            alert('儲存失敗，請重試');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 transition-all">

                {/* Progress Indicator */}
                <div className="flex justify-center mb-8 gap-2">
                    <div className={`h-2 w-12 rounded-full transition-colors ${step === 1 ? 'bg-blue-600' : 'bg-blue-200'}`} />
                    <div className={`h-2 w-12 rounded-full transition-colors ${step === 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                </div>

                {step === 1 ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">關於您的毛小孩</h1>
                            <p className="text-gray-500">首先，讓我們認識一下您的寶貝。</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">寵物名字</label>
                            <input
                                type="text"
                                value={petName}
                                onChange={(e) => setPetName(e.target.value)}
                                placeholder="例如：小賀"
                                className="w-full text-lg p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setPetType('CAT')}
                                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${petType === 'CAT'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100'
                                    }`}
                            >
                                <Cat size={48} />
                                <span className="font-bold">貓咪</span>
                            </button>
                            <button
                                onClick={() => setPetType('DOG')}
                                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${petType === 'DOG'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100'
                                    }`}
                            >
                                <Dog size={48} />
                                <span className="font-bold">狗狗</span>
                            </button>
                        </div>

                        {/* Birthday */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">寵物生日</label>
                            <input
                                type="date"
                                value={petBirthday}
                                onChange={(e) => setPetBirthday(e.target.value)}
                                className="w-full text-lg p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all"
                            />
                        </div>

                        <button
                            onClick={() => {
                                if (!petName.trim()) return alert('請輸入名字');
                                if (!petBirthday) return alert('請輸入生日');
                                setStep(2);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-transform active:scale-95"
                        >
                            下一步
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">誰在照顧 {petName}？</h1>
                            <p className="text-gray-500">新增所有會一起記錄的主人。</p>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {owners.map((owner, index) => (
                                <div key={owner.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 group">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: owner.color }}>
                                            {owner.name.substring(0, 1) || '#'}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={`主人 ${index + 1} 名字`}
                                            value={owner.name}
                                            onChange={(e) => handleUpdateOwner(owner.id, 'name', e.target.value)}
                                            className="flex-1 bg-transparent font-medium outline-none placeholder-gray-400"
                                        />
                                        {owners.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveOwner(owner.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Color Palette */}
                                    <div className="flex flex-wrap gap-2">
                                        {PRESET_COLORS.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => handleUpdateOwner(owner.id, 'color', color)}
                                                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${owner.color === color ? 'ring-2 ring-offset-2 ring-gray-300 scale-110' : ''}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={handleAddOwner}
                                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-medium hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={20} />
                                新增一位主人
                            </button>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-colors"
                            >
                                上一步
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? '儲存中...' : (
                                    <>
                                        <Check size={20} />
                                        完成設定
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
