import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search } from 'lucide-react';

interface Trait {
  id: number;
  nameEn: string;
  nameZh: string;
  chemistry: string;
  goodBad?: string;
  isHitter?: boolean;
  isPitcher?: boolean;
  level1?: string;
  level2?: string;
  level3?: string;
  level1Zh?: string;
  level2Zh?: string;
  level3Zh?: string;
}

interface TraitsDashboardProps {
  traits: Trait[];
}

const TraitsDashboard: React.FC<TraitsDashboardProps> = ({ traits }) => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChemistry, setFilterChemistry] = useState('');
  const [expandedTraitId, setExpandedTraitId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Trait; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: keyof Trait) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof Trait) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  const chemistries = Array.from(new Set(traits.map(t => t.chemistry))).filter(c => c !== 'None' && c !== '').sort();

  let processedTraits = [...traits];

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    processedTraits = processedTraits.filter(t => 
      t.nameEn.toLowerCase().includes(term) || 
      t.nameZh.toLowerCase().includes(term)
    );
  }

  if (filterChemistry) {
    processedTraits = processedTraits.filter(t => t.chemistry === filterChemistry);
  }

  if (sortConfig) {
    processedTraits.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }

  const getChemistryColor = (chem: string) => {
    switch (chem) {
      case 'Competitive': return 'rgba(239, 68, 68, 0.2)'; // Red
      case 'Spirited': return 'rgba(249, 115, 22, 0.2)'; // Orange
      case 'Disciplined': return 'rgba(59, 130, 246, 0.2)'; // Blue
      case 'Scholarly': return 'rgba(168, 85, 247, 0.2)'; // Purple
      case 'Crafty': return 'rgba(34, 197, 94, 0.2)'; // Green
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  };

  const getChemistryTextColor = (chem: string) => {
    switch (chem) {
      case 'Competitive': return '#fca5a5';
      case 'Spirited': return '#fdba74';
      case 'Disciplined': return '#93c5fd';
      case 'Scholarly': return '#d8b4fe';
      case 'Crafty': return '#86efac';
      default: return '#d1d5db';
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Toolbar */}
      <div className="toolbar" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder={t('app.searchTraits')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.2)', color: 'white', outline: 'none' }}
          />
        </div>

        <select 
          value={filterChemistry}
          onChange={(e) => setFilterChemistry(e.target.value)}
          className="filter-select"
        >
          <option value="">{t('grid.allChemistry')}</option>
          {chemistries.map(c => <option key={c} value={c}>{t(`chemistry.${c}`) || c}</option>)}
        </select>
      </div>

      {/* Table Container */}
      <div className="table-container" style={{ flex: '1', overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, background: 'var(--panel-bg)', zIndex: 10 }}>
            <tr>
              <th style={{ width: '10%' }} onClick={() => handleSort('id')}>ID {getSortIndicator('id')}</th>
              <th style={{ width: '35%' }} onClick={() => handleSort('nameEn')}>{t('info.traitNameEn')} {getSortIndicator('nameEn')}</th>
              <th style={{ width: '35%' }} onClick={() => handleSort('nameZh')}>{t('info.traitNameZh')} {getSortIndicator('nameZh')}</th>
              <th style={{ width: '20%' }} onClick={() => handleSort('chemistry')}>{t('info.chemistry')} {getSortIndicator('chemistry')}</th>
            </tr>
          </thead>
          <tbody>
            {processedTraits.map((trait) => (
              <React.Fragment key={trait.id}>
                <tr 
                  onClick={() => setExpandedTraitId(expandedTraitId === trait.id ? null : trait.id)}
                  style={{ cursor: 'pointer' }}
                  className={expandedTraitId === trait.id ? 'selected-row' : ''}
                >
                  <td style={{ opacity: 0.7 }}>{trait.id}</td>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {trait.goodBad === 'Good' ? <span style={{ color: '#4ade80', fontSize: '1.1rem', fontWeight: 'bold' }} title={t('grid.positiveTrait')}>+</span> :
                       trait.goodBad === 'Bad' ? <span style={{ color: '#f87171', fontSize: '1.1rem', fontWeight: 'bold' }} title={t('grid.negativeTrait')}>-</span> : null}
                      {trait.nameEn}
                    </div>
                  </td>
                  <td>{trait.nameZh}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      background: getChemistryColor(trait.chemistry), 
                      color: getChemistryTextColor(trait.chemistry),
                      border: `1px solid ${getChemistryTextColor(trait.chemistry)}40`,
                      fontSize: '0.85rem',
                      fontWeight: 500
                    }}>
                      {trait.chemistry === 'None' ? t('grid.none') : (t(`chemistry.${trait.chemistry}`) || trait.chemistry)}
                    </span>
                  </td>
                </tr>
                {expandedTraitId === trait.id && (
                  <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <td colSpan={4} style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '16px', opacity: 0.8, fontSize: '0.9rem' }}>
                          <span><strong>{t('info.appliesTo')}</strong> {trait.isHitter && trait.isPitcher ? t('info.hittersAndPitchers') : trait.isHitter ? t('info.hitters') : trait.isPitcher ? t('info.pitchers') : t('info.unknown')}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                          <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ color: 'var(--primary-accent)', fontWeight: 'bold', marginBottom: '8px' }}>{t('info.level1')}</div>
                            <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{(language === 'zh-TW' && trait.level1Zh) ? trait.level1Zh : (trait.level1 || t('grid.notAvailable'))}</div>
                          </div>
                          <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ color: 'var(--primary-accent)', fontWeight: 'bold', marginBottom: '8px' }}>{t('info.level2')}</div>
                            <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{(language === 'zh-TW' && trait.level2Zh) ? trait.level2Zh : (trait.level2 || t('grid.notAvailable'))}</div>
                          </div>
                          <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ color: 'var(--primary-accent)', fontWeight: 'bold', marginBottom: '8px' }}>{t('info.level3')}</div>
                            <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{(language === 'zh-TW' && trait.level3Zh) ? trait.level3Zh : (trait.level3 || t('grid.notAvailable'))}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {processedTraits.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                  {t('app.noTraitsFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TraitsDashboard;
