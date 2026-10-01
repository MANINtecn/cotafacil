import React from 'react';
import { useSystemSettings } from '../utils/systemSettings';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  theme?: 'dark' | 'light';
  customLogoOverride?: string | null;
}

export const CotaFacilLogo: React.FC<Props> = ({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'light',
  customLogoOverride,
}) => {
  const { customLogo: globalLogo } = useSystemSettings();
  const activeLogo = customLogoOverride !== undefined ? customLogoOverride : globalLogo;

  const iconDimensions = {
    sm: { w: 32, h: 32 },
    md: { w: 44, h: 44 },
    lg: { w: 54, h: 54 },
    xl: { w: 68, h: 68 },
  }[size];

  const textClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* 
        Custom Distinctive B2B Logo Mark:
        If an image logo is uploaded by SuperAdmin, render it crisply.
        Otherwise render the Geometric Hexagonal Shield with dynamic Interlocking Ribbons.
      */}
      <div
        style={{ width: iconDimensions.w, height: iconDimensions.h }}
        className="relative rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-1.5 flex items-center justify-center shadow-lg border-2 border-neutral-800 shrink-0 group overflow-hidden"
      >
        {activeLogo ? (
          <img
            src={activeLogo}
            alt="Logo Customizada"
            className="w-full h-full object-contain relative z-10 rounded-xl"
          />
        ) : (
          <>
            {/* Emerald ambient backlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/25 via-transparent to-emerald-400/20 pointer-events-none" />

            <svg
              viewBox="0 0 100 100"
              className="w-full h-full relative z-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="cfGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="cfWhiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#D1D5DB" />
                </linearGradient>
              </defs>

              {/* Hexagonal Outer Contour Frame with rounded corners */}
              <polygon
                points="50,10 88,30 88,70 50,90 12,70 12,30"
                stroke="url(#cfGreenGrad)"
                strokeWidth="5"
                strokeLinejoin="round"
                className="opacity-40"
              />

              {/* Left Ribbon / Quotation Loop (Bold Emerald) */}
              <path
                d="M 46 22 L 26 33 L 26 67 L 46 78 L 46 58 L 38 54 L 38 42 L 46 38 Z"
                fill="url(#cfGreenGrad)"
              />

              {/* Right Ribbon / Dynamic Fast Arrow (Crisp Contrast White) */}
              <path
                d="M 54 22 L 74 33 L 74 52 L 62 45 L 62 38 L 54 34 Z"
                fill="url(#whiteGrad)"
              />

              {/* Central Forward B2B Arrow / Lowest Price Vector */}
              <path
                d="M 46 50 L 74 65 L 60 74 L 54 62 L 46 50 Z"
                fill="#10B981"
              />

              {/* Golden Diamond Core - Best Price Accent */}
              <polygon
                points="50,42 58,50 50,58 42,50"
                fill="#FBBF24"
              />
            </svg>
          </>
        )}
      </div>

      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${textClasses} ${
                theme === 'dark' ? 'text-white' : 'text-neutral-950'
              }`}
            >
              Cota<span className="text-emerald-500">Fácil</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-neutral-950 font-black text-[10px] tracking-wider uppercase font-mono-num shadow-xs">
              B2B
            </span>
          </div>
          <span
            className={`text-[10px] font-extrabold tracking-wider uppercase mt-1 ${
              theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            Compras Estratégicas B2B
          </span>
        </div>
      )}
    </div>
  );
};
