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
  if (num >= 50) return 'rgba(34, 197, 94, 0.3)';
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

  const teams = Array.from(new Set(players.map(p => p.team))).filter(Boolean).sort();
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
  const uniqueDivs = Array.from(new Set(players.map(p => p.division))).filter(Boolean);

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
    { id: 'rating', label: 'Rating' },
    { id: 'pos', label: 'Pos' },
    { id: 'age', label: t('info.age') || 'Age' },
    { id: 'salary', label: t('info.salary') || 'Salary' },
    { id: 'power', label: t('stats.power') || 'Power' },
    { id: 'contact', label: t('stats.contact') || 'Contact' },
    { id: 'speed', label: t('stats.speed') || 'Speed' },
    { id: 'fielding', label: t('stats.fielding') || 'Fielding' },
    { id: 'arm', label: t('stats.arm') || 'Arm' },
    { id: 'velocity', label: t('stats.velocity') || 'Velocity' },
    { id: 'junk', label: t('stats.junk') || 'Junk' },
    { id: 'accuracy', label: t('stats.accuracy') || 'Accuracy' }
  ];
  const [visibleCols, setVisibleCols] = useState(allColumns.map(c => c.id));

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
            placeholder={t('search') || '搜尋球員...'} 
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
          <option value="">全部聯盟</option>
          {uniqueConfs.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select 
          value={filterDiv}
          onChange={(e) => setFilterDiv(e.target.value)}
          className="filter-select"
        >
          <option value="">全部分區</option>
          {uniqueDivs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select 
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="filter-select"
        >
          <option value="">全部球隊</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select 
          value={filterPos}
          onChange={(e) => setFilterPos(e.target.value)}
          className="filter-select"
        >
          <option value="">全部守備位置</option>
          {positions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <div style={{ position: 'relative', marginLeft: 'auto' }} ref={pickerRef}>
          <button 
            onClick={() => setShowColPicker(!showColPicker)}
            className="filter-select"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', background: showColPicker ? 'rgba(30, 41, 59, 1)' : 'var(--bg-dark)', padding: '10px 16px', minWidth: 'auto', backgroundImage: 'none' }}
          >
            <Columns size={16} /> 欄位顯示
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
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>Color Legend (Stats):</span>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: 'rgba(239, 68, 68, 0.6)', borderRadius: 2 }}></div> 90+ (Elite)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: 'rgba(249, 115, 22, 0.6)', borderRadius: 2 }}></div> 80-89 (Great)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: 'rgba(234, 179, 8, 0.6)', borderRadius: 2 }}></div> 70-79 (Good)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: 'rgba(34, 197, 94, 0.5)', borderRadius: 2 }}></div> 50-69 (Average)</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container" style={{ flex: '1' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '18%' }} onClick={() => onSort('name')}>{t('info.player') || '球員'} {getSortIndicator('name')}</th>
              {visibleCols.includes('rating') && <th style={{ width: '8%' }} onClick={() => onSort('rating')}>{t('info.rating') || '評級'} {getSortIndicator('rating')}</th>}
              {visibleCols.includes('pos') && <th style={{ width: '6%' }} onClick={() => onSort('primaryPosition')}>{t('info.pos') || '守備位置'} {getSortIndicator('primaryPosition')}</th>}
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
                {visibleCols.includes('pos') && <td>{player.primaryPosition}</td>}
                {visibleCols.includes('age') && <td>{player.age}</td>}
                {visibleCols.includes('salary') && <td>{player.salary}</td>}
                {visibleCols.includes('power') && <td title="Power: Indicates hitting distance and home run probability">{renderStat(player.stats.power)}</td>}
                {visibleCols.includes('contact') && <td title="Contact: Ability to consistently make solid contact">{renderStat(player.stats.contact)}</td>}
                {visibleCols.includes('speed') && <td title="Speed: Base running and fielding range">{renderStat(player.stats.speed)}</td>}
                {visibleCols.includes('fielding') && <td title="Fielding: Catching, diving and error prevention">{renderStat(player.stats.fielding)}</td>}
                {visibleCols.includes('arm') && <td title="Arm: Throwing speed and accuracy (Fielders)">{renderStat(player.stats.arm)}</td>}
                {visibleCols.includes('velocity') && <td title="Velocity: Pitching speed (Pitchers only)">{renderStat(player.stats.velocity)}</td>}
                {visibleCols.includes('junk') && <td title="Junk: Pitch movement and break (Pitchers only)">{renderStat(player.stats.junk)}</td>}
                {visibleCols.includes('accuracy') && <td title="Accuracy: Pitch control (Pitchers only)">{renderStat(player.stats.accuracy)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {players.length > 100 && (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Showing 100 of {players.length} results. Please use filters to narrow down.
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerGrid;
