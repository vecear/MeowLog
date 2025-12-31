import React, { useState } from 'react';
import { handleAuthClick } from '../services/googleAuth';
import { LogIn } from 'lucide-react';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await handleAuthClick();
            onLoginSuccess();
        } catch (err: any) {
            console.error("Login failed", err);
            setError("登入失敗，請重試。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LogIn size={32} />
                </div>

                <h1 className="text-2xl font-bold text-gray-900">歡迎來到 MeowLog</h1>
                <p className="text-gray-600">請登入您的 Google 帳號以存取和儲存紀錄資料。</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '登入中...' : '使用 Google 登入'}
                </button>

                <p className="text-xs text-gray-400 mt-4">
                    我們會將資料 "meowlog_data.json" 儲存在您的 Google Drive 中。
                </p>
            </div>
        </div>
    );
};
