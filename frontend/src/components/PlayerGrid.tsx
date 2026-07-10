import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search, Columns } from 'lucide-react';

const getStatColor = (val: number | string | undefined | null) => {
  if (val === undefined || val === null || val === '-') return 'transparent';
  const num = Number(val);
  if (isNaN(num)) return 'transparent';
  
  if (num >= 90) return 'rgba(239, 68, 68, 0.4)';
  if (num >= 80) return 'rgba(249, 115, 22, 0.4)';
  if (num >= 70) return 'rgba(234, 179, 8, 0.4)';
  if (num >= 45) return 'rgba(34, 197, 94, 0.3)';
  return 'transparent';
};

const renderStat = (val: number | string | undefined | null) => {
  const bg = getStatColor(val);
  if (bg === 'transparent') return val || '-';
  return (
    <span style={{ display: 'inline-block', background: bg, padding: '4px 8px', borderRadius: '4px', minWidth: '32px', textAlign: 'center', fontWeight: 600 }}>
      {val}
    </span>
  );
};

export const renderPositionBadge = (pos: string) => {
  if (!pos) return '-';
  
  let bg = 'rgba(255,255,255,0.1)';
  let color = '#fff';
  let border = 'rgba(255,255,255,0.2)';
  
  if (pos === 'C') { bg = 'rgba(245, 158, 11, 0.15)'; color = '#fcd34d'; border = '#f59e0b'; }
  else if (['1B', '2B', '3B', 'SS', 'IF'].includes(pos)) { bg = 'rgba(239, 68, 68, 0.15)'; color = '#fca5a5'; border = '#ef4444'; }
  else if (['LF', 'CF', 'RF', 'OF'].includes(pos)) { bg = 'rgba(59, 130, 246, 0.15)'; color = '#93c5fd'; border = '#3b82f6'; }
  else if (['SP', 'RP', 'CP'].includes(pos)) { bg = 'rgba(16, 185, 129, 0.15)'; color = '#a7f3d0'; border = '#10b981'; }
  
  return (
    <span style={{ 
      display: 'inline-block', 
      background: bg, 
      color: color,
      border: `1px solid ${border}`,
      padding: '2px 8px', 
      borderRadius: '6px', 
      fontSize: '0.85rem',
      fontWeight: 700,
      textAlign: 'center',
      minWidth: '40px'
    }}>
      {pos}
    </span>
  );
};

interface PlayerGridProps {
  players: any[];
  selectedPlayer: any;
  onSelectPlayer: (player: any) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterTeam: string;
  setFilterTeam: (team: string) => void;
  filterPos: string;
  setFilterPos: (pos: string) => void;
  filterConf: string;
  setFilterConf: (c: string) => void;
  filterDiv: string;
  setFilterDiv: (d: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}

const PlayerGrid: React.FC<PlayerGridProps> = ({
  players,
  selectedPlayer,
  onSelectPlayer,
  searchTerm,
  onSearchChange,
  filterTeam,
  setFilterTeam,
  filterPos,
  setFilterPos,
  filterConf,
  setFilterConf,
  filterDiv,
  setFilterDiv,
  sortConfig,
  onSort
}) => {
  const { t } = useLanguage();

  const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'IF', 'OF', 'SP', 'RP', 'CP'];

  const handleSort = (key: string) => {
    onSort(key);
  };

  const getSortIndicator = (key: string) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  const uniqueConfs = Array.from(new Set(players.map(p => p.conference))).filter(Boolean);
  const uniqueDivs = Array.from(new Set(players.filter(p => !filterConf || p.conference === filterConf).map(p => p.division))).filter(Boolean);
  const teams = Array.from(new Set(players.filter(p => (!filterConf || p.conference === filterConf) && (!filterDiv || p.division === filterDiv)).map(p => p.team))).filter(Boolean).sort();

  const [showColPicker, setShowColPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowColPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allColumns = [
    { id: 'rating', label: t('info.rating') },
    { id: 'pos', label: t('info.position') },
    { id: 'age', label: t('info.age') },
    { id: 'salary', label: t('info.salary') },
    { id: 'power', label: t('stats.power') },
    { id: 'contact', label: t('stats.contact') },
    { id: 'speed', label: t('stats.speed') },
    { id: 'fielding', label: t('stats.fielding') },
    { id: 'arm', label: t('stats.arm') },
    { id: 'velocity', label: t('stats.velocity') },
    { id: 'junk', label: t('stats.junk') },
    { id: 'accuracy', label: t('stats.accuracy') }
  ];
  const [visibleCols, setVisibleCols] = useState<string[]>(allColumns.map(c => c.id));

  const toggleCol = (id: string) => {
    setVisibleCols(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Toolbar */}
      <div className="toolbar" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input 
            type="text" 
            placeholder={t('app.search')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }}
          />
        </div>

        <select 
          value={filterConf}
          onChange={(e) => setFilterConf(e.target.value)}
          className="filter-select"
        >
          <option value="">{t('grid.allConferences')}</option>
          {uniqueConfs.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select 
          value={filterDiv}
          onChange={(e) => setFilterDiv(e.target.value)}
          className="filter-select"
        >
          <option value="">{t('grid.allDivisions')}</option>
          {uniqueDivs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select 
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="filter-select"
        >
          <option value="">{t('grid.allTeams')}</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select 
          value={filterPos}
          onChange={(e) => setFilterPos(e.target.value)}
          className="filter-select"
        >
          <option value="">{t('grid.allPositions')}</option>
          {positions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <div style={{ position: 'relative', marginLeft: 'auto' }} ref={pickerRef}>
          <button 
            onClick={() => setShowColPicker(!showColPicker)}
            className="filter-select"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', background: showColPicker ? 'rgba(30, 41, 59, 1)' : 'var(--bg-dark)', padding: '10px 16px', minWidth: 'auto', backgroundImage: 'none' }}
          >
            <Columns size={16} /> {t('grid.columns')}
          </button>
          {showColPicker && (
            <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 100, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px', border: '1px solid rgba(255,255,255,0.1)' }}>
              {allColumns.map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#fff' }}>
                  <input 
                    type="checkbox" 
                    checked={visibleCols.includes(c.id)} 
                    onChange={() => toggleCol(c.id)} 
                  />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', padding: '10px 24px', background: 'rgba(0,0,0,0.1)', fontSize: '0.85rem', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', flexWrap: 'wrap' }}>
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{t('grid.colorLegend')}</span>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: 'rgba(239, 68, 68, 0.6)', borderRadius: 2 }}></div> 90+ ({t('grid.elite')})</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: 'rgba(249, 115, 22, 0.6)', borderRadius: 2 }}></div> 80-89 ({t('grid.great')})</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: 'rgba(234, 179, 8, 0.6)', borderRadius: 2 }}></div> 70-79 ({t('grid.good')})</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: 'rgba(34, 197, 94, 0.5)', borderRadius: 2 }}></div> 50-69 ({t('grid.average')})</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container" style={{ flex: '1' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '18%' }} onClick={() => onSort('name')}>{t('grid.player')} {getSortIndicator('name')}</th>
              {visibleCols.includes('rating') && <th style={{ width: '8%' }} onClick={() => onSort('rating')}>{t('info.rating')} {getSortIndicator('rating')}</th>}
              {visibleCols.includes('pos') && <th style={{ width: '6%' }} onClick={() => onSort('primaryPosition')}>{t('info.position')} {getSortIndicator('primaryPosition')}</th>}
              {visibleCols.includes('age') && <th style={{ width: '6%' }} onClick={() => onSort('age')}>{t('info.age')} {getSortIndicator('age')}</th>}
              {visibleCols.includes('salary') && <th style={{ width: '8%' }} onClick={() => onSort('salary')}>{t('info.salary')} {getSortIndicator('salary')}</th>}
              {visibleCols.includes('power') && <th style={{ width: '6%' }} onClick={() => onSort('stats.power')}>{t('stats.power')} {getSortIndicator('stats.power')}</th>}
              {visibleCols.includes('contact') && <th style={{ width: '6%' }} onClick={() => onSort('stats.contact')}>{t('stats.contact')} {getSortIndicator('stats.contact')}</th>}
              {visibleCols.includes('speed') && <th style={{ width: '6%' }} onClick={() => onSort('stats.speed')}>{t('stats.speed')} {getSortIndicator('stats.speed')}</th>}
              {visibleCols.includes('fielding') && <th style={{ width: '6%' }} onClick={() => onSort('stats.fielding')}>{t('stats.fielding')} {getSortIndicator('stats.fielding')}</th>}
              {visibleCols.includes('arm') && <th style={{ width: '6%' }} onClick={() => onSort('stats.arm')}>{t('stats.arm')} {getSortIndicator('stats.arm')}</th>}
              {visibleCols.includes('velocity') && <th style={{ width: '6%' }} onClick={() => onSort('stats.velocity')}>{t('stats.velocity')} {getSortIndicator('stats.velocity')}</th>}
              {visibleCols.includes('junk') && <th style={{ width: '6%' }} onClick={() => onSort('stats.junk')}>{t('stats.junk')} {getSortIndicator('stats.junk')}</th>}
              {visibleCols.includes('accuracy') && <th style={{ width: '6%' }} onClick={() => onSort('stats.accuracy')}>{t('stats.accuracy')} {getSortIndicator('stats.accuracy')}</th>}
            </tr>
          </thead>
          <tbody>
            {players.map((player: any) => (
              <tr 
                key={player.name} 
                onClick={() => onSelectPlayer(player)}
                className={selectedPlayer?.name === player.name ? 'selected-row' : ''}
              >
                <td>
                  <div style={{ fontWeight: 600 }}>{player.name}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{player.team}</div>
                </td>
                {visibleCols.includes('rating') && <td><span className={`rating-badge rating-${player.rating?.replace('+', 'plus').replace('-', 'minus') || 'none'}`}>{player.rating}</span></td>}
                {visibleCols.includes('pos') && <td>{renderPositionBadge(player.primaryPosition)}</td>}
                {visibleCols.includes('age') && <td>{player.age}</td>}
                {visibleCols.includes('salary') && <td>{player.salary}</td>}
                {visibleCols.includes('power') && <td title={t('grid.powerDesc')}>{renderStat(player.stats.power)}</td>}
                {visibleCols.includes('contact') && <td title={t('grid.contactDesc')}>{renderStat(player.stats.contact)}</td>}
                {visibleCols.includes('speed') && <td title={t('grid.speedDesc')}>{renderStat(player.stats.speed)}</td>}
                {visibleCols.includes('fielding') && <td title={t('grid.fieldingDesc')}>{renderStat(player.stats.fielding)}</td>}
                {visibleCols.includes('arm') && <td title={t('grid.armDesc')}>{renderStat(player.stats.arm)}</td>}
                {visibleCols.includes('velocity') && <td title={t('grid.velocityDesc')}>{renderStat(player.stats.velocity)}</td>}
                {visibleCols.includes('junk') && <td title={t('grid.junkDesc')}>{renderStat(player.stats.junk)}</td>}
                {visibleCols.includes('accuracy') && <td title={t('grid.accuracyDesc')}>{renderStat(player.stats.accuracy)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {players.length > 100 && (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('grid.showingLimit')} {players.length} {t('grid.showingHint')}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerGrid;
