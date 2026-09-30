import { useState, useEffect } from 'react';

export interface MercadoPagoSettings {
  publicKey: string;
  accessToken: string;
  clientId: string;
  clientSecret: string;
  environment: 'production' | 'sandbox';
  webhookUrl: string;
  defaultMonthlyFee: number;
  pixKeyFallback: string;
  isConfigured: boolean;
  lastTestedAt?: string;
}

const STORAGE_KEY_LOGO = 'cotafacil_custom_logo';
const STORAGE_KEY_MP = 'cotafacil_mercadopago_config';
const EVENT_SETTINGS_UPDATED = 'cotafacil_settings_updated';

const DEFAULT_MP_SETTINGS: MercadoPagoSettings = {
  publicKey: 'TEST-e81a3d90-3cb8-40f9-90bc-981fcae1293a',
  accessToken: 'TEST-7281920391823901-093014-9b2fca891048bcae91827401-10293847',
  clientId: '7281920391823901',
  clientSecret: 'sk_test_cotafacil_mercadopago_sec_99182',
  environment: 'sandbox',
  webhookUrl: 'https://api.cotafacil.com.br/webhooks/mercadopago/notifications',
  defaultMonthlyFee: 390.0,
  pixKeyFallback: 'financeiro@cotafacil.com.br',
  isConfigured: true,
};

export function getStoredCustomLogo(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_LOGO) || null;
  } catch {
    return null;
  }
}

export function saveCustomLogo(logoDataUrl: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOGO, logoDataUrl);
    window.dispatchEvent(new Event(EVENT_SETTINGS_UPDATED));
  } catch (err) {
    console.error('Failed to save custom logo', err);
  }
}

export function removeCustomLogo(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_LOGO);
    window.dispatchEvent(new Event(EVENT_SETTINGS_UPDATED));
  } catch (err) {
    console.error('Failed to remove custom logo', err);
  }
}

export function getStoredMercadoPagoSettings(): MercadoPagoSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MP);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_MP_SETTINGS, ...parsed };
    }
  } catch {
    // fallback
  }
  return DEFAULT_MP_SETTINGS;
}

export function saveMercadoPagoSettings(settings: Partial<MercadoPagoSettings>): MercadoPagoSettings {
  const current = getStoredMercadoPagoSettings();
  const updated: MercadoPagoSettings = {
    ...current,
    ...settings,
    isConfigured: Boolean(settings.publicKey || current.publicKey),
  };
  try {
    localStorage.setItem(STORAGE_KEY_MP, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT_SETTINGS_UPDATED));
  } catch (err) {
    console.error('Failed to save Mercado Pago settings', err);
  }
  return updated;
}

export function useSystemSettings() {
  const [logo, setLogo] = useState<string | null>(() => getStoredCustomLogo());
  const [mpSettings, setMpSettings] = useState<MercadoPagoSettings>(() => getStoredMercadoPagoSettings());

  useEffect(() => {
    const handleUpdate = () => {
      setLogo(getStoredCustomLogo());
      setMpSettings(getStoredMercadoPagoSettings());
    };

    window.addEventListener(EVENT_SETTINGS_UPDATED, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_SETTINGS_UPDATED, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    customLogo: logo,
    mercadoPago: mpSettings,
    setCustomLogo: saveCustomLogo,
    removeCustomLogo: removeCustomLogo,
    updateMercadoPago: saveMercadoPagoSettings,
  };
}
