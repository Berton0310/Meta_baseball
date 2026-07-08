import React, { useState, useMemo } from 'react';
import { useLanguage } from './context/LanguageContext';
import playersData from './data/players.json';
import traitsData from './data/traits.json';
import PlayerGrid from './components/PlayerGrid';
import PlayerRadar from './components/PlayerRadar';
import TeamGrid from './components/TeamGrid';
import TeamRadar from './components/TeamRadar';
import LineupBuilder from './components/LineupBuilder';
import TraitsDashboard from './components/TraitsDashboard';
import PlayerComparison from './components/PlayerComparison';
import DraftSimulator from './components/DraftSimulator';
import { calculateTeamStats } from './utils/teamStats';
import type { TeamStat } from './utils/teamStats';
import { Languages, Activity, Users, Shield, ListStart, Star, Target, ShoppingCart } from 'lucide-react';

function App() {
  const { t, toggleLanguage, language } = useLanguage();
  const [viewMode, setViewMode] = useState<'players' | 'teams' | 'lineup' | 'traits' | 'compare' | 'draft'>('players');
  
  const [selectedPlayer, setSelectedPlayer] = useState<any>(playersData[0]);
  
  const teamStatsData = useMemo(() => calculateTeamStats(playersData), []);
  const [selectedTeam, setSelectedTeam] = useState<TeamStat>(teamStatsData[0]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('');
  const [filterPos, setFilterPos] = useState<string>('');
  const [filterConf, setFilterConf] = useState<string>('');
  const [filterDiv, setFilterDiv] = useState<string>('');
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedPlayers = useMemo(() => {
    let result = [...playersData];

    // Filter
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterTeam) {
      result = result.filter(p => p.team === filterTeam);
    }
    if (filterPos) {
      result = result.filter(p => p.primaryPosition === filterPos || p.secondaryPositions.includes(filterPos));
    }
    if (filterConf) {
      result = result.filter(p => p.conference === filterConf);
    }
    if (filterDiv) {
      result = result.filter(p => p.division === filterDiv);
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const getVal = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc && acc[part], obj);
        let aVal = getVal(a, sortConfig.key);
        let bVal = getVal(b, sortConfig.key);

        // Custom sorting for rating
        if (sortConfig.key === 'rating') {
          const ratingWeights: Record<string, number> = {
            'S': 100,
            'A+': 95, 'A': 90, 'A-': 85,
            'B+': 80, 'B': 75, 'B-': 70,
            'C+': 65, 'C': 60, 'C-': 55,
            'D+': 50, 'D': 45, 'D-': 40
          };
          aVal = ratingWeights[aVal] || 0;
          bVal = ratingWeights[bVal] || 0;
        }

        // Custom sorting for salary
        if (sortConfig.key === 'salary') {
          const parseSal = (s: string | number) => {
            if (!s) return 0;
            if (typeof s === 'number') return s;
            const clean = String(s).replace(/[^0-9.]/g, '');
            return parseFloat(clean) || 0;
          };
          aVal = parseSal(aVal);
          bVal = parseSal(bVal);
        }

        if (aVal === bVal) return 0;
        
        // Handle nulls
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (sortConfig.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    return result;
  }, [searchTerm, filterTeam, filterPos, filterConf, filterDiv, sortConfig]);

  return (
    <div className="app-container">
      <header className="navbar glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h1><Activity size={28} color="var(--primary-accent)" /> {t('app.title')}</h1>
          
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '4px' }}>
            <button 
              onClick={() => setViewMode('players')}
              style={{ 
                padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
                background: viewMode === 'players' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'players' ? '#fff' : 'rgba(255,255,255,0.6)'
              }}
            >
              <Users size={16} /> {t('app.viewPlayers') || 'Players View'}
            </button>
            <button 
              onClick={() => setViewMode('teams')}
              style={{ 
                padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
                background: viewMode === 'teams' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'teams' ? '#fff' : 'rgba(255,255,255,0.6)'
              }}
            >
              <Shield size={16} /> {t('app.viewTeams') || 'Teams View'}
            </button>
            <button 
              onClick={() => setViewMode('lineup')}
              style={{ 
                padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
                background: viewMode === 'lineup' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'lineup' ? '#fff' : 'rgba(255,255,255,0.6)'
              }}
            >
              <ListStart size={16} /> {t('app.viewLineup') || 'Tactical Dashboard'}
            </button>
            <button 
              onClick={() => setViewMode('traits')}
              style={{ 
                padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
                background: viewMode === 'traits' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'traits' ? '#fff' : 'rgba(255,255,255,0.6)'
              }}
            >
              <Star size={16} /> {t('app.viewTraits') || 'Traits View'}
            </button>
            <button 
              onClick={() => setViewMode('compare')}
              style={{ 
                padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
                background: viewMode === 'compare' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'compare' ? '#fff' : 'rgba(255,255,255,0.6)'
              }}
            >
              <Activity size={16} /> {t('app.viewCompare') || 'Compare'}
            </button>
            <button 
              onClick={() => setViewMode('draft')}
              style={{ 
                padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
                background: viewMode === 'draft' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'draft' ? '#fff' : 'rgba(255,255,255,0.6)'
              }}
            >
              <ShoppingCart size={16} /> {t('draft.title') || 'Draft Simulator'}
            </button>
          </div>
        </div>

        <button className="btn-icon" onClick={toggleLanguage}>
          <Languages size={18} /> {language === 'zh-TW' ? 'English' : '中文'}
        </button>
      </header>

      <main className="dashboard-grid" style={{ gridTemplateColumns: (viewMode === 'lineup' || viewMode === 'traits' || viewMode === 'compare' || viewMode === 'draft') ? '1fr' : undefined }}>
        <section className="main-content">
          {viewMode === 'players' ? (
            <PlayerGrid 
              players={filteredAndSortedPlayers}
              selectedPlayer={selectedPlayer}
              onSelectPlayer={setSelectedPlayer}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterTeam={filterTeam}
              setFilterTeam={setFilterTeam}
              filterPos={filterPos}
              setFilterPos={setFilterPos}
              filterConf={filterConf}
              setFilterConf={setFilterConf}
              filterDiv={filterDiv}
              setFilterDiv={setFilterDiv}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          ) : viewMode === 'teams' ? (
            <TeamGrid
              teams={teamStatsData}
              selectedTeam={selectedTeam}
              onRowClick={setSelectedTeam}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterConf={filterConf}
              setFilterConf={setFilterConf}
              filterDiv={filterDiv}
              setFilterDiv={setFilterDiv}
            />
          ) : viewMode === 'traits' ? (
            <TraitsDashboard traits={traitsData} />
          ) : viewMode === 'compare' ? (
            <PlayerComparison players={playersData} />
          ) : viewMode === 'draft' ? (
            <DraftSimulator players={playersData} />
          ) : (
            <LineupBuilder />
          )}
        </section>

        {viewMode !== 'lineup' && viewMode !== 'traits' && viewMode !== 'compare' && viewMode !== 'draft' && (
          <aside className="sidebar">
            <div className="glass-panel radar-panel" style={{ overflowY: 'auto' }}>
              {viewMode === 'players' ? (
                <PlayerRadar player={selectedPlayer} />
              ) : viewMode === 'teams' ? (
                <TeamRadar team={selectedTeam} />
              ) : null}
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}

export default App;
