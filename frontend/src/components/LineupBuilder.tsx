import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import playersData from '../data/players.json';
import { autoPickLineup, optimizeBattingOrder, ALL_TEAMS, FULL_ROSTER_POSITIONS } from '../utils/lineupOptimizer';
import type { OptimizationStrategy, Lineup, BattingStrategy } from '../utils/lineupOptimizer';
import { calculateTeamStats } from '../utils/teamStats';
import type { Player } from '../types/player';
import { Settings2, RefreshCw, UserPlus, Search, Trash2, Shield, Swords, Users, Target } from 'lucide-react';
import playerImageMap from '../data/playerImageMap.json';

const TEAM_NAMES = [ALL_TEAMS, ...Array.from(new Set(playersData.map(p => p.team))).filter(Boolean).sort()];

const ROSTER_GROUPS = {
  starters: ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'],
  rotation: ['SP1', 'SP2', 'SP3', 'SP4', 'SP5'],
  bullpen: ['RP1', 'RP2', 'RP3', 'RP4', 'RP5', 'CP'],
  bench: ['BN1', 'BN2', 'BN3', 'BN4', 'BN5']
};

const LineupBuilder: React.FC = () => {
  const { t } = useLanguage();
  const [selectedTeam, setSelectedTeam] = useState<string>(TEAM_NAMES[0]);
  const [strategy, setStrategy] = useState<OptimizationStrategy>('overall');
  
  const [lineup, setLineup] = useState<Lineup>(() => {
    const init: Lineup = {};
    FULL_ROSTER_POSITIONS.forEach(pos => init[pos] = null);
    return init;
  });
  
  const [battingOrder, setBattingOrder] = useState<(any | null)[]>(new Array(9).fill(null));
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectingPosition, setSelectingPosition] = useState<string | null>(null);
  const [selectingBattingSlot, setSelectingBattingSlot] = useState<number | null>(null);
  const [battingStrategy, setBattingStrategy] = useState<BattingStrategy>('sabermetrics');

  const [draggedPlayer, setDraggedPlayer] = useState<any | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);
  const [hoveredBattingSlot, setHoveredBattingSlot] = useState<number | null>(null);

  const teamPlayers = useMemo<Player[]>(() => {
    if (selectedTeam === ALL_TEAMS) return playersData;
    return playersData.filter(p => p.team === selectedTeam);
  }, [selectedTeam]);

  const handleAutoPick = () => {
    const newLineup = autoPickLineup(playersData, selectedTeam, strategy);
    setLineup(newLineup);
    
    // Auto-fill batting order
    const batters = ROSTER_GROUPS.starters.map(pos => newLineup[pos]).filter(Boolean);
    const orderNames = optimizeBattingOrder(batters, battingStrategy);
    const orderObjects = orderNames.map(name => batters.find(b => b.name === name) || null);
    // Pad to 9
    while (orderObjects.length < 9) orderObjects.push(null);
    setBattingOrder(orderObjects.slice(0, 9));
    setSelectingPosition(null);
    setSelectingBattingSlot(null);
  };

  const handleClearAll = () => {
    const emptyLineup: Lineup = {};
    FULL_ROSTER_POSITIONS.forEach(pos => emptyLineup[pos] = null);
    setLineup(emptyLineup);
    setBattingOrder(new Array(9).fill(null));
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam(e.target.value);
    handleClearAll();
  };

  const filteredRosterPlayers = useMemo(() => {
    return teamPlayers.filter(p => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filter logically if selecting a position
      if (selectingPosition) {
        if (selectingPosition.includes('SP')) {
          if (!p.isPitcher) return false;
        } else if (selectingPosition.includes('RP') || selectingPosition === 'CP') {
          if (!p.isPitcher) return false;
        } else if (selectingPosition === 'DH' || selectingPosition.includes('BN')) {
          // Both can be anyone, usually fielders
        } else {
          // Specific fielding pos
          const matches = p.primaryPosition === selectingPosition || (p.secondaryPositions && p.secondaryPositions.includes(selectingPosition));
          if (!matches) return false;
        }
      }

      // If selecting batting slot, recommend non-pitchers
      if (selectingBattingSlot !== null) {
        if (p.isPitcher) return false;
      }

      // Check if already in lineup
      const isAlreadyInLineup = Object.values(lineup).some(lineupPlayer => lineupPlayer?.name === p.name);
      if (isAlreadyInLineup && selectingPosition) return false;

      // Check if already in batting order
      if (selectingBattingSlot !== null) {
         if (battingOrder.some(b => b?.name === p.name)) return false;
      }

      return true;
    });
  }, [teamPlayers, searchQuery, selectingPosition, selectingBattingSlot, lineup, battingOrder]);

  const assignPlayerToPosition = (player: any, pos: string) => {
    // Remove from old position if they are in one
    const newLineup = { ...lineup };
    Object.keys(newLineup).forEach(k => {
      if (newLineup[k]?.name === player.name) newLineup[k] = null;
    });
    newLineup[pos] = player;
    setLineup(newLineup);
    setSelectingPosition(null);
  };

  const assignPlayerToBattingOrder = (player: any, slotIndex: number) => {
    const newOrder = [...battingOrder];
    // Remove from old slot if exists
    const oldIndex = newOrder.findIndex(p => p?.name === player.name);
    if (oldIndex !== -1) newOrder[oldIndex] = null;
    newOrder[slotIndex] = player;
    setBattingOrder(newOrder);
    setSelectingBattingSlot(null);
  };

  const removePlayer = (pos: string) => {
    setLineup({ ...lineup, [pos]: null });
  };

  const removeBatter = (slotIndex: number) => {
    const newOrder = [...battingOrder];
    newOrder[slotIndex] = null;
    setBattingOrder(newOrder);
  };

  const currentLineupTeamStat = useMemo(() => {
    const activePlayers = Object.values(lineup).filter(Boolean);
    if (activePlayers.length === 0) return null;
    return calculateTeamStats(activePlayers)[0];
  }, [lineup]);

  const renderSlot = (pos: string, isPitcherSlot: boolean) => {
    const player = lineup[pos];
    const isSelected = selectingPosition === pos;
    const isHovered = hoveredPosition === pos;

    const rawImagePath = player ? (playerImageMap as any)[`${player.team}-${player.name}`] : null;
    const imagePath = rawImagePath ? `${import.meta.env.BASE_URL}${rawImagePath.replace(/^\//, '')}` : null;

    return (
      <div 
        key={pos}
        onClick={() => { setSelectingPosition(pos); setSelectingBattingSlot(null); }}
        onDragOver={(e) => { e.preventDefault(); }}
        onDragEnter={() => setHoveredPosition(pos)}
        onDragLeave={() => setHoveredPosition(null)}
        onDrop={(e) => {
          e.preventDefault();
          setHoveredPosition(null);
          if (draggedPlayer) {
            assignPlayerToPosition(draggedPlayer, pos);
          }
        }}
        style={{
          background: isSelected ? 'var(--primary-accent)' : (isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.4)'),
          border: `1px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '8px',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          minHeight: '100px',
          transition: 'all 0.2s',
          boxShadow: isHovered ? '0 0 10px rgba(255,255,255,0.5)' : 'none'
        }}
      >
        <div style={{ position: 'absolute', top: '4px', left: '6px', fontSize: '10px', fontWeight: 'bold', color: 'var(--primary-accent)' }}>{pos}</div>
        
        {player ? (
          <>
            {imagePath ? (
              <img src={imagePath} alt={player.name} style={{ width: '40px', height: '40px', objectFit: 'contain', marginBottom: '4px' }} />
            ) : (
              <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={16} color="rgba(255,255,255,0.3)" />
              </div>
            )}
            <div style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {player.name}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{player.rating}</div>
            <button 
              onClick={(e) => { e.stopPropagation(); removePlayer(pos); }}
              style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '18px', height: '18px', color: 'white', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >×</button>
          </>
        ) : (
          <UserPlus size={24} style={{ color: 'rgba(255,255,255,0.1)', marginTop: '10px' }} />
        )}
      </div>
    );
  };

  const renderBattingSlot = (index: number) => {
    const player = battingOrder[index];
    const isSelected = selectingBattingSlot === index;
    const isHovered = hoveredBattingSlot === index;

    const rawImagePath = player ? (playerImageMap as any)[`${player.team}-${player.name}`] : null;
    const imagePath = rawImagePath ? `${import.meta.env.BASE_URL}${rawImagePath.replace(/^\//, '')}` : null;

    return (
      <div 
        key={index}
        onClick={() => { setSelectingBattingSlot(index); setSelectingPosition(null); }}
        onDragOver={(e) => { e.preventDefault(); }}
        onDragEnter={() => setHoveredBattingSlot(index)}
        onDragLeave={() => setHoveredBattingSlot(null)}
        onDrop={(e) => {
          e.preventDefault();
          setHoveredBattingSlot(null);
          if (draggedPlayer && !draggedPlayer.isPitcher) {
            assignPlayerToBattingOrder(draggedPlayer, index);
          }
        }}
        style={{
          background: isSelected ? 'var(--primary-accent)' : (isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.4)'),
          border: `1px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '8px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary-accent)', width: '20px' }}>{index + 1}.</div>
        {player ? (
          <>
            {imagePath ? (
              <img src={imagePath} alt={player.name} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={14} color="rgba(255,255,255,0.3)" />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{player.name}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{player.primaryPosition} | {player.rating}</div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); removeBatter(index); }}
              style={{ background: '#ef4444', border: 'none', borderRadius: '50%', width: '20px', height: '20px', color: 'white', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >×</button>
          </>
        ) : (
          <div style={{ flex: 1, color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>{t('lineup.emptySlot')}</div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Settings2 size={24} color="var(--primary-accent)" />
          {t('lineup.title')}
        </h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>{t('lineup.selectTeam')}:</span>
            <select 
              value={selectedTeam} 
              onChange={handleTeamChange}
              style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {TEAM_NAMES.map(tStr => <option key={tStr} value={tStr}>{tStr === ALL_TEAMS ? t('lineup.allTeams') : tStr}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>{t('lineup.strategy')}:</span>
            <select 
              value={strategy} 
              onChange={(e) => setStrategy(e.target.value as OptimizationStrategy)}
              style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <option value="overall">{t('lineup.strategyOverall')}</option>
              <option value="power">{t('lineup.strategyPower')}</option>
              <option value="contact">{t('lineup.strategyContact')}</option>
              <option value="speed">{t('lineup.strategySpeed')}</option>
              <option value="defense">{t('lineup.strategyDefense')}</option>
              <option value="team_signature">{t('lineup.strategyTeamSignature')}</option>
            </select>
          </div>
          <button 
            onClick={handleAutoPick}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '6px' }}
          >
            <RefreshCw size={16} /> {t('lineup.autoPick')}
          </button>
          <button 
            onClick={handleClearAll}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', cursor: 'pointer' }}
          >
            <Trash2 size={16} /> {t('lineup.clearAll')}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Panel: Roster Pool */}
        <div className="glass-panel" style={{ width: '350px', display: 'flex', flexDirection: 'column', padding: '16px', border: (selectingPosition || selectingBattingSlot !== null) ? '2px solid var(--primary-accent)' : '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--primary-accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} />
              {selectingPosition ? `${t('lineup.selectSlot')} ${selectingPosition}` : (selectingBattingSlot !== null ? `${t('lineup.selectBatSlot')} ${selectingBattingSlot + 1}` : t('lineup.roster'))}
            </div>
            {(selectingPosition || selectingBattingSlot !== null) && (
              <button onClick={() => { setSelectingPosition(null); setSelectingBattingSlot(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>✕</button>
            )}
          </h3>
          
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'rgba(255,255,255,0.5)' }} />
            <input 
              type="text" 
              placeholder={t('app.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)', color: '#fff', outline: 'none' }}
            />
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '8px' }}>
            {filteredRosterPlayers.map(p => {
              // Dim the player card if they are completely inappropriate for the selected slot, but let them choose anyway
              let isRecommended = true;
              if (selectingPosition) {
                 if (selectingPosition.includes('SP') && !p.isPitcher) isRecommended = false;
                 if ((selectingPosition.includes('RP') || selectingPosition === 'CP') && !p.isPitcher) isRecommended = false;
              }
              if (selectingBattingSlot !== null && p.isPitcher) isRecommended = false;

              const isAlreadyInLineup = Object.values(lineup).some(lineupPlayer => lineupPlayer?.name === p.name);
              const isAlreadyInBatting = battingOrder.some(b => b?.name === p.name);

              return (
                <div 
                  key={p.name}
                  draggable
                  onDragStart={() => setDraggedPlayer(p)}
                  onDragEnd={() => setDraggedPlayer(null)}
                  onClick={() => {
                    if (selectingPosition) assignPlayerToPosition(p, selectingPosition);
                    else if (selectingBattingSlot !== null) assignPlayerToBattingOrder(p, selectingBattingSlot);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: (selectingPosition || selectingBattingSlot !== null) ? 'pointer' : 'grab',
                    opacity: isRecommended ? 1 : 0.4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <div style={{ color: p.isPitcher ? '#38bdf8' : '#4ade80', fontWeight: 'bold', width: '24px' }}>{p.primaryPosition}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{p.name}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{p.team} | {p.rating}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    {isAlreadyInLineup && <span style={{ fontSize: '9px', background: 'var(--primary-accent)', padding: '2px 4px', borderRadius: '4px' }}>{t('lineup.badgeField')}</span>}
                    {isAlreadyInBatting && <span style={{ fontSize: '9px', background: '#eab308', padding: '2px 4px', borderRadius: '4px' }}>{t('lineup.badgeBat')}</span>}
                  </div>
                </div>
              );
            })}
            {filteredRosterPlayers.length === 0 && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', marginTop: '20px' }}>{t('lineup.noPlayersFound')}</div>
            )}
          </div>
        </div>

        {/* Right Panel: Dashboard Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '8px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
            {/* Batting Order Panel */}
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '16px', color: '#eab308' }}>
                <Swords size={20} />
                {t('lineup.battingOrder')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(renderBattingSlot)}
              </div>
            </div>

            {/* Starting Lineup Panel */}
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '16px', color: '#4ade80' }}>
                <Shield size={20} />
                {t('lineup.starters')}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {ROSTER_GROUPS.starters.map(pos => renderSlot(pos, false))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Rotation */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '16px', color: '#38bdf8' }}>
                <Target size={20} />
                {t('lineup.rotation')}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '12px' }}>
                {ROSTER_GROUPS.rotation.map(pos => renderSlot(pos, true))}
              </div>
            </div>

            {/* Bench */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '16px', color: '#a78bfa' }}>
                <Users size={20} />
                {t('lineup.bench')}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '12px' }}>
                {ROSTER_GROUPS.bench.map(pos => renderSlot(pos, false))}
              </div>
            </div>
          </div>

          {/* Bullpen */}
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '40px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '16px', color: '#f472b6' }}>
              <Target size={20} />
              {t('lineup.bullpen')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '12px' }}>
              {ROSTER_GROUPS.bullpen.map(pos => renderSlot(pos, true))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LineupBuilder;
