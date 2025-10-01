import React, { useState } from 'react';

interface ActivationModalProps {
  onActivate: () => void;
  isExpired: boolean;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({ onActivate, isExpired }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === 'P@ssw0rd$') {
      setError('');
      onActivate();
    } else {
      setError("Aktivatsiya kodi noto'g'ri. Iltimos, qayta urinib ko'ring.");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Dasturni Aktivlashtirish</h2>
            {isExpired && (
              <p className="mt-3 text-sm text-yellow-800 bg-yellow-100 p-3 rounded-lg border border-yellow-200">
                Sizning avvalgi aktivatsiya muddatingiz tugadi. Dasturdan foydalanishni davom ettirish uchun, iltimos, qayta aktivlashtiring.
              </p>
            )}
            <p className="mt-3 text-sm text-gray-600">
              Dasturni to'liq ishga tushurish uchun aktivatsiya kodini kiritishingiz zarur.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="activation-code" className="sr-only">Aktivatsiya kodi</label>
              <input
                id="activation-code"
                name="activation-code"
                type="password"
                autoComplete="current-password"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-center"
                placeholder="Aktivatsiya kodini kiriting"
              />
            </div>
            
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Aktivlashtirish
              </button>
            </div>
          </form>

          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
            <p>Aktivatsiya kodini olish uchun, iltimos, biz bilan bog'laning:</p>
            <p className="font-semibold text-gray-700 mt-1">+998 (99) 366-75-50</p>
          </div>
        </div>
      </div>
    </div>
  );
};