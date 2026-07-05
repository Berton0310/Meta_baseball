import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { TeamStat } from '../utils/teamStats';
import { Search, Columns } from 'lucide-react';

const getTeamStatColor = (val: number | string | undefined | null) => {
  if (val === undefined || val === null || val === '-') return 'transparent';
  const num = Number(val);
  if (isNaN(num)) return 'transparent';
  
  if (num >= 80) return 'rgba(239, 68, 68, 0.4)';
  if (num >= 70) return 'rgba(249, 115, 22, 0.4)';
  if (num >= 60) return 'rgba(234, 179, 8, 0.4)';
  if (num >= 50) return 'rgba(34, 197, 94, 0.3)';
  return 'transparent';
};

const renderStat = (val: number | string | undefined | null) => {
  const bg = getTeamStatColor(val);
  if (bg === 'transparent') return val || '-';
  return (
    <span style={{ display: 'inline-block', background: bg, padding: '4px 8px', borderRadius: '4px', minWidth: '32px', textAlign: 'center', fontWeight: 600 }}>
      {val}
    </span>
  );
};

interface TeamGridProps {
  teams: TeamStat[];
  selectedTeam: TeamStat | null;
  onRowClick: (team: TeamStat) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterConf: string;
  setFilterConf: (c: string) => void;
  filterDiv: string;
  setFilterDiv: (d: string) => void;
}

const TeamGrid: React.FC<TeamGridProps> = ({ 
  teams, 
  onRowClick, 
  selectedTeam,
  searchTerm,
  onSearchChange,
  filterConf,
  setFilterConf,
  filterDiv,
  setFilterDiv
}) => {
  const { t } = useLanguage();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: string) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  let processedTeams = [...teams];
  
  if (searchTerm) {
    processedTeams = processedTeams.filter(t => t.team.toLowerCase().includes(searchTerm.toLowerCase()));
  }
  if (filterConf) {
    processedTeams = processedTeams.filter(t => t.conference === filterConf);
  }
  if (filterDiv) {
    processedTeams = processedTeams.filter(t => t.division === filterDiv);
  }

  if (sortConfig) {
    processedTeams.sort((a, b) => {
      const getVal = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc && acc[part], obj);
      let aVal = getVal(a, sortConfig.key);
      let bVal = getVal(b, sortConfig.key);
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }

  const uniqueConfs = Array.from(new Set(teams.map(t => t.conference))).filter(Boolean);
  const uniqueDivs = Array.from(new Set(teams.map(t => t.division))).filter(Boolean);

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
    { id: 'teamStrength', label: t('info.teamStrength') || 'Strength' },
    { id: 'totalSalary', label: t('app.totalSalary') || 'Total Salary' },
    { id: 'avgSalary', label: t('app.avgSalary') || 'Avg Salary' },
    { id: 'avgAge', label: t('info.age') || 'Avg Age' },
    { id: 'power', label: t('stats.power') || '力量' },
    { id: 'contact', label: t('stats.contact') || '擊球' },
    { id: 'speed', label: t('stats.speed') || '跑速' },
    { id: 'fielding', label: t('stats.fielding') || '守備' },
    { id: 'arm', label: t('stats.arm') || '傳球' },
    { id: 'velocity', label: t('stats.velocity') || '球速' },
    { id: 'junk', label: t('stats.junk') || '變化' },
    { id: 'accuracy', label: t('stats.accuracy') || '控球' }
  ];
  const [visibleCols, setVisibleCols] = useState(allColumns.map(c => c.id));

  const toggleCol = (id: string) => {
    setVisibleCols(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Toolbar */}
      <div className="toolbar" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          <input 
            type="text" 
            placeholder={t('search') || 'Search...'} 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.2)', color: 'white', outline: 'none' }}
          />
        </div>

        <select 
          value={filterConf}
          onChange={(e) => setFilterConf(e.target.value)}
          className="filter-select"
        >
          <option value="">{t('info.conference') || 'Conference'} (All)</option>
          {uniqueConfs.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select 
          value={filterDiv}
          onChange={(e) => setFilterDiv(e.target.value)}
          className="filter-select"
        >
          <option value="">{t('info.division') || 'Division'} (All)</option>
          {uniqueDivs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <div style={{ position: 'relative', marginLeft: 'auto' }} ref={pickerRef}>
          <button 
            onClick={() => setShowColPicker(!showColPicker)}
            className="filter-select"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: showColPicker ? 'rgba(255,255,255,0.2)' : '' }}
          >
            <Columns size={16} /> Columns
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
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>Color Legend (Avg Stats):</span>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: 'rgba(239, 68, 68, 0.6)', borderRadius: 2 }}></div> 80+ (Elite)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: 'rgba(249, 115, 22, 0.6)', borderRadius: 2 }}></div> 70-79 (Great)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: 'rgba(234, 179, 8, 0.6)', borderRadius: 2 }}></div> 60-69 (Good)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: 'rgba(34, 197, 94, 0.5)', borderRadius: 2 }}></div> 50-59 (Average)</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container" style={{ flex: '1', overflowY: 'auto' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, background: 'var(--panel-bg)' }}>
            <tr>
              <th style={{ width: '18%' }} onClick={() => handleSort('team')}>{t('info.team') || '隊伍'} {getSortIndicator('team')}</th>
              {visibleCols.includes('teamStrength') && <th style={{ width: '18%' }} onClick={() => handleSort('teamStrength')}>{t('info.teamStrength') || 'Strength'} {getSortIndicator('teamStrength')}</th>}
              {visibleCols.includes('totalSalary') && <th style={{ width: '10%' }} onClick={() => handleSort('totalSalary')}>{t('app.totalSalary') || 'Total Salary'} {getSortIndicator('totalSalary')}</th>}
              {visibleCols.includes('avgSalary') && <th style={{ width: '8%' }} onClick={() => handleSort('avgSalary')}>{t('app.avgSalary') || 'Avg Salary'} {getSortIndicator('avgSalary')}</th>}
              {visibleCols.includes('avgAge') && <th style={{ width: '6%' }} onClick={() => handleSort('avgAge')}>{t('info.age') || 'Avg Age'} {getSortIndicator('avgAge')}</th>}
              {visibleCols.includes('power') && <th style={{ width: '5%' }} onClick={() => handleSort('avgStats.power')}>{t('stats.power') || '力量'} {getSortIndicator('avgStats.power')}</th>}
              {visibleCols.includes('contact') && <th style={{ width: '5%' }} onClick={() => handleSort('avgStats.contact')}>{t('stats.contact') || '擊球'} {getSortIndicator('avgStats.contact')}</th>}
              {visibleCols.includes('speed') && <th style={{ width: '5%' }} onClick={() => handleSort('avgStats.speed')}>{t('stats.speed') || '跑速'} {getSortIndicator('avgStats.speed')}</th>}
              {visibleCols.includes('fielding') && <th style={{ width: '5%' }} onClick={() => handleSort('avgStats.fielding')}>{t('stats.fielding') || '守備'} {getSortIndicator('avgStats.fielding')}</th>}
              {visibleCols.includes('arm') && <th style={{ width: '5%' }} onClick={() => handleSort('avgStats.arm')}>{t('stats.arm') || '傳球'} {getSortIndicator('avgStats.arm')}</th>}
              {visibleCols.includes('velocity') && <th style={{ width: '5%' }} onClick={() => handleSort('avgStats.velocity')}>{t('stats.velocity') || '球速'} {getSortIndicator('avgStats.velocity')}</th>}
              {visibleCols.includes('junk') && <th style={{ width: '5%' }} onClick={() => handleSort('avgStats.junk')}>{t('stats.junk') || '變化'} {getSortIndicator('avgStats.junk')}</th>}
              {visibleCols.includes('accuracy') && <th style={{ width: '5%' }} onClick={() => handleSort('avgStats.accuracy')}>{t('stats.accuracy') || '控球'} {getSortIndicator('avgStats.accuracy')}</th>}
            </tr>
          </thead>
          <tbody>
            {processedTeams.map((teamData) => (
              <tr 
                key={teamData.team} 
                onClick={() => onRowClick(teamData)}
                className={selectedTeam?.team === teamData.team ? 'selected-row' : ''}
              >
                <td>
                  <div style={{ fontWeight: 600 }}>{teamData.team}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{teamData.division} / {teamData.conference}</div>
                </td>
                {visibleCols.includes('teamStrength') && <td>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 165, 0, 0.2)', color: 'orange', border: '1px solid rgba(255, 165, 0, 0.5)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {t(`teamStrength.${teamData.teamStrength}`) || teamData.teamStrength}
                  </span>
                </td>}
                {visibleCols.includes('totalSalary') && <td style={{ color: 'var(--primary-color)' }}>${teamData.totalSalary.toFixed(1)}M</td>}
                {visibleCols.includes('avgSalary') && <td>${teamData.avgSalary.toFixed(1)}M</td>}
                {visibleCols.includes('avgAge') && <td>{teamData.avgAge}</td>}
                {visibleCols.includes('power') && <td title="Average Power">{renderStat(teamData.avgStats.power)}</td>}
                {visibleCols.includes('contact') && <td title="Average Contact">{renderStat(teamData.avgStats.contact)}</td>}
                {visibleCols.includes('speed') && <td title="Average Speed">{renderStat(teamData.avgStats.speed)}</td>}
                {visibleCols.includes('fielding') && <td title="Average Fielding">{renderStat(teamData.avgStats.fielding)}</td>}
                {visibleCols.includes('arm') && <td title="Average Arm">{renderStat(teamData.avgStats.arm)}</td>}
                {visibleCols.includes('velocity') && <td title="Average Velocity">{renderStat(teamData.avgStats.velocity)}</td>}
                {visibleCols.includes('junk') && <td title="Average Junk">{renderStat(teamData.avgStats.junk)}</td>}
                {visibleCols.includes('accuracy') && <td title="Average Accuracy">{renderStat(teamData.avgStats.accuracy)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeamGrid;
