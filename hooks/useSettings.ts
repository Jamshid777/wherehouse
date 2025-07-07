

import { useState, useEffect } from 'react';

const SETTINGS_KEY = 'ombor_nazorati_settings';

interface AppSettings {
    defaultWarehouseId: string | null;
    appMode: 'pro' | 'lite';
}

const defaultSettings: AppSettings = {
    defaultWarehouseId: null,
    appMode: 'pro',
};

const loadSettings = (): AppSettings => {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            return { ...defaultSettings, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error("Failed to load settings from localStorage", error);
    }
    return defaultSettings;
};

const saveSettings = (settings: AppSettings) => {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Failed to save settings to localStorage", error);
    }
};


export const useSettings = () => {
    const [settings, setSettings] = useState<AppSettings>(loadSettings);

    const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };
            saveSettings(newSettings);
            return newSettings;
        });
    };
    
    const setDefaultWarehouseId = (id: string | null) => {
        updateSetting('defaultWarehouseId', id);
    };

    const setAppMode = (mode: 'pro' | 'lite') => {
        updateSetting('appMode', mode);
    };

    return {
        defaultWarehouseId: settings.defaultWarehouseId,
        setDefaultWarehouseId,
        appMode: settings.appMode,
        setAppMode,
    };
};