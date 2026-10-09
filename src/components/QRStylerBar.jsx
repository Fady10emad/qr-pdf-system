import React from 'react';
import { Palette, ShieldCheck, Image, Sliders, Check } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Dark Slate', fg: '#0f172a', bg: '#ffffff' },
  { name: 'Electric Indigo', fg: '#4f46e5', bg: '#ffffff' },
  { name: 'Emerald', fg: '#059669', bg: '#ffffff' },
  { name: 'Royal Navy', fg: '#1e3a8a', bg: '#ffffff' },
  { name: 'Crimson', fg: '#be123c', bg: '#ffffff' },
  { name: 'Pure Black', fg: '#000000', bg: '#ffffff' },
];

export const QRStylerBar = ({ styleConfig, onChangeStyle, t }) => {
  const st = t.styler;

  return (
    <div className="styler-bar-container">
      <div className="styler-bar-header">
        <div className="styler-title-group">
          <Sliders size={18} className="styler-icon" />
          <h3 className="styler-heading">{st.heading}</h3>
        </div>
        <span className="styler-badge">{st.badge}</span>
      </div>

      <div className="styler-controls-row">
        {/* Preset Color Themes */}
        <div className="control-group">
          <label className="control-label">
            <Palette size={14} /> {st.colorStyle}
          </label>
          <div className="color-swatches">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className={`color-swatch-btn ${styleConfig.fgColor === preset.fg ? 'active' : ''}`}
                style={{ backgroundColor: preset.fg }}
                title={`${preset.name} (${preset.fg})`}
                onClick={() =>
                  onChangeStyle({
                    ...styleConfig,
                    fgColor: preset.fg,
                    bgColor: preset.bg,
                  })
                }
              >
                {styleConfig.fgColor === preset.fg && <Check size={12} color="#ffffff" />}
              </button>
            ))}

            {/* Custom Color Input */}
            <label className="custom-color-picker-label" title={st.customColor}>
              <input
                type="color"
                value={styleConfig.fgColor}
                onChange={(e) =>
                  onChangeStyle({
                    ...styleConfig,
                    fgColor: e.target.value,
                  })
                }
                className="custom-color-input"
              />
              <span className="custom-color-text">{st.customColor}</span>
            </label>
          </div>
        </div>

        {/* Error Correction Level */}
        <div className="control-group">
          <label className="control-label">
            <ShieldCheck size={14} /> {st.durability}
          </label>
          <div className="pill-selector">
            <button
              type="button"
              className={`pill-btn ${styleConfig.level === 'M' ? 'active' : ''}`}
              onClick={() => onChangeStyle({ ...styleConfig, level: 'M' })}
              title="Level M"
            >
              {st.medium}
            </button>
            <button
              type="button"
              className={`pill-btn ${styleConfig.level === 'H' ? 'active' : ''}`}
              onClick={() => onChangeStyle({ ...styleConfig, level: 'H' })}
              title="Level H"
            >
              {st.high}
            </button>
          </div>
        </div>

        {/* Center PDF Logo */}
        <div className="control-group">
          <label className="control-label">
            <Image size={14} /> {st.centerLogo}
          </label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={styleConfig.showCenterLogo}
              onChange={(e) =>
                onChangeStyle({
                  ...styleConfig,
                  showCenterLogo: e.target.checked,
                })
              }
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label-text">
              {styleConfig.showCenterLogo ? st.logoVisible : st.noLogo}
            </span>
          </label>
        </div>

        {/* Export Resolution */}
        <div className="control-group">
          <label className="control-label">{st.downloadQuality}</label>
          <select
            className="select-input"
            value={styleConfig.exportSize}
            onChange={(e) =>
              onChangeStyle({
                ...styleConfig,
                exportSize: Number(e.target.value),
              })
            }
          >
            <option value={512}>{st.qualityStandard}</option>
            <option value={1024}>{st.qualityPrint}</option>
            <option value={2048}>{st.qualityMaster}</option>
          </select>
        </div>
      </div>
    </div>
  );
};
