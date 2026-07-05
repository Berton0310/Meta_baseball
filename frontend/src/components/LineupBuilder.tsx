import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import playersData from '../data/players.json';
import { autoPickLineup, optimizeBattingOrder } from '../utils/lineupOptimizer';
import type { OptimizationStrategy, Lineup, BattingStrategy } from '../utils/lineupOptimizer';
import { calculateTeamStats } from '../utils/teamStats';
import TeamRadar from './TeamRadar';
import PlayerRadar from './PlayerRadar';
import { Settings2, RefreshCw, UserPlus } from 'lucide-react';

const TEAM_NAMES = Array.from(new Set(playersData.map(p => p.team))).filter(Boolean).sort();

const SHIFT_POSITIONS: Record<string, any> = {
  normal: {
    'C': { top: '85%', left: '50%' },
    '1B': { top: '55%', left: '75%' },
    '2B': { top: '40%', left: '65%' },
    '3B': { top: '55%', left: '25%' },
    'SS': { top: '40%', left: '35%' },
    'LF': { top: '20%', left: '15%' },
    'CF': { top: '10%', left: '50%' },
    'RF': { top: '20%', left: '85%' },
    'SP': { top: '60%', left: '50%' },
  },
  pull: {
    'C': { top: '85%', left: '50%' },
    '1B': { top: '55%', left: '78%' },
    '2B': { top: '45%', left: '70%' },
    '3B': { top: '45%', left: '45%' },
    'SS': { top: '40%', left: '55%' },
    'LF': { top: '25%', left: '30%' },
    'CF': { top: '15%', left: '65%' },
    'RF': { top: '15%', left: '90%' },
    'SP': { top: '60%', left: '50%' },
  },
  bunt: {
    'C': { top: '85%', left: '50%' },
    '1B': { top: '65%', left: '65%' },
    '2B': { top: '55%', left: '75%' },
    '3B': { top: '65%', left: '35%' },
    'SS': { top: '55%', left: '25%' },
    'LF': { top: '20%', left: '15%' },
    'CF': { top: '10%', left: '50%' },
    'RF': { top: '20%', left: '85%' },
    'SP': { top: '60%', left: '50%' },
  }
};

type ShiftMode = 'normal' | 'pull' | 'bunt';

const renderProgressBar = (label: string, value: number, color: string) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '75px' }}>
    <span style={{ fontSize: '9px', width: '20px', color: 'var(--text-muted)' }}>{label}</span>
    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: color }} />
    </div>
  </div>
);

const LineupBuilder: React.FC = () => {
  const { t } = useLanguage();
  const [selectedTeam, setSelectedTeam] = useState<string>(TEAM_NAMES[0]);
  const [strategy, setStrategy] = useState<OptimizationStrategy>('overall');
  const [lineup, setLineup] = useState<Lineup>(() => {
    return { C: null, '1B': null, '2B': null, '3B': null, SS: null, LF: null, CF: null, RF: null, DH: null, SP: null };
  });
  const [battingOrder, setBattingOrder] = useState<string[]>([]); // Array of player names
  
  const [selectingPosition, setSelectingPosition] = useState<string | null>(null);
  const [battingStrategy, setBattingStrategy] = useState<BattingStrategy>('sabermetrics');
  const [viewingPlayer, setViewingPlayer] = useState<any | null>(null);
  const [shiftMode, setShiftMode] = useState<ShiftMode>('normal');
  const [draggedPlayer, setDraggedPlayer] = useState<any | null>(null);
  const [hoveredPlayer, setHoveredPlayer] = useState<any | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);

  const teamPlayers = useMemo(() => playersData.filter(p => p.team === selectedTeam), [selectedTeam]);

  const handleAutoPick = () => {
    const newLineup = autoPickLineup(playersData, selectedTeam, strategy);
    setLineup(newLineup);
    
    // Auto-fill batting order using baseball logic
    const batters = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH']
      .map(pos => newLineup[pos])
      .filter(Boolean);
    
    setBattingOrder(optimizeBattingOrder(batters, battingStrategy));
    setSelectingPosition(null);
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam(e.target.value);
    setLineup({ C: null, '1B': null, '2B': null, '3B': null, SS: null, LF: null, CF: null, RF: null, DH: null, SP: null });
    setBattingOrder([]);
    setSelectingPosition(null);
  };

  const currentLineupTeamStat = useMemo(() => {
    const activePlayers = Object.values(lineup).filter(Boolean);
    if (activePlayers.length === 0) return null;
    return calculateTeamStats(activePlayers)[0];
  }, [lineup]);

  const availablePlayers = useMemo(() => {
    if (!selectingPosition) return [];
    const usedNames = new Set(Object.values(lineup).filter(Boolean).map(p => p.name));
    
    // For SP, only show pitchers. For others, show fielders.
    const isPitcherPos = selectingPosition === 'SP';
    
    return teamPlayers.filter(p => {
      if (usedNames.has(p.name)) return false;
      if (isPitcherPos) return p.isPitcher;
      return !p.isPitcher;
    }).sort((a, b) => {
      // Sort by whether they actually play this position
      const aPlays = a.primaryPosition === selectingPosition || a.secondaryPositions.includes(selectingPosition);
      const bPlays = b.primaryPosition === selectingPosition || b.secondaryPositions.includes(selectingPosition);
      if (aPlays && !bPlays) return -1;
      if (!aPlays && bPlays) return 1;
      return (b.stats.power + b.stats.contact) - (a.stats.power + a.stats.contact);
    });
  }, [selectingPosition, teamPlayers, lineup]);

  const assignPlayerToPosition = (player: any, pos: string) => {
    const newLineup = { ...lineup, [pos]: player };
    setLineup(newLineup);
    
    if (!player.isPitcher || pos === 'DH') {
      if (!battingOrder.includes(player.name)) {
        setBattingOrder((prev: string[]) => [...prev, player.name as string]);
      }
    }
    setSelectingPosition(null);
  };

  const removePlayer = (pos: string) => {
    const player = lineup[pos];
    if (player) {
      setBattingOrder((prev: string[]) => prev.filter(name => name !== player.name));
    }
    setLineup({ ...lineup, [pos]: null });
  };

  const moveBatter = (index: number, direction: number) => {
    if (index + direction < 0 || index + direction >= battingOrder.length) return;
    const newOrder = [...battingOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + direction];
    newOrder[index + direction] = temp;
    setBattingOrder(newOrder);
  };

  const handleAutoSortBattingOrder = () => {
    const currentBatters = battingOrder.map(name => teamPlayers.find(p => p.name === name)).filter(Boolean);
    if (currentBatters.length > 0) {
      setBattingOrder(optimizeBattingOrder(currentBatters, battingStrategy));
    }
  };

  return (
    <div className="lineup-builder">
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
            Select Team
          </label>
          <select value={selectedTeam} onChange={handleTeamChange} className="filter-select" style={{ width: '100%' }}>
            {TEAM_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
            Optimization Strategy
          </label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value as OptimizationStrategy)} className="filter-select" style={{ width: '100%' }}>
            <option value="overall">Highest Overall (綜合最佳)</option>
            <option value="power">Maximize Power (極致力量)</option>
            <option value="contact">Maximize Contact (機關槍安打)</option>
            <option value="speed">Maximize Speed (極速狂奔)</option>
            <option value="defense">Maximize Defense (鐵壁防守)</option>
          </select>
        </div>

        <button 
          onClick={handleAutoPick}
          style={{
            background: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            marginTop: '22px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}
        >
          <Settings2 size={18} />
          Auto-Pick Lineup
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '14px' }}>Shift Simulation:</span>
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '8px' }}>
          <button onClick={() => setShiftMode('normal')} style={{ background: shiftMode === 'normal' ? 'var(--primary-accent)' : 'transparent', color: shiftMode === 'normal' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold' }}>Normal</button>
          <button onClick={() => setShiftMode('pull')} style={{ background: shiftMode === 'pull' ? 'var(--primary-accent)' : 'transparent', color: shiftMode === 'pull' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold' }}>Extreme Pull</button>
          <button onClick={() => setShiftMode('bunt')} style={{ background: shiftMode === 'bunt' ? 'var(--primary-accent)' : 'transparent', color: shiftMode === 'bunt' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold' }}>Bunt Defense</button>
        </div>
      </div>


      {/* Top Row: Field + Roster */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '24px' }}>
        
        {/* Field View */}
        <div className="glass-panel" style={{ flex: '2.5', minWidth: '400px', position: 'relative', height: '700px', backgroundImage: `url(${import.meta.env.BASE_URL}field_bg.png)`, backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden' }}>
          
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}>
            <defs>
              <radialGradient id="heatmap-elite" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heatmap-great" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heatmap-good" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#eab308" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heatmap-average" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </radialGradient>
            </defs>
            
            {Object.entries(SHIFT_POSITIONS[shiftMode]).map(([pos, coords]: [string, any]) => {
               if (pos === 'SP' || pos === 'C' || pos === 'DH') return null;
               const player = lineup[pos];
               let radius = 50;
               let gradient = "url(#heatmap-average)";
               
               if (player) {
                   const score = ((player.stats.fielding || 50) + (player.stats.speed || 50)) / 2;
                   radius = 40 + (score * 0.9); // 90 score -> 121 radius
                   if (score >= 90) gradient = "url(#heatmap-elite)";
                   else if (score >= 80) gradient = "url(#heatmap-great)";
                   else if (score >= 70) gradient = "url(#heatmap-good)";
               }
               
               return (
                 <circle 
                   key={`heatmap-${pos}`} 
                   cx={coords.left} 
                   cy={coords.top} 
                   r={radius} 
                   fill={gradient} 
                   style={{ transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
                 />
               )
            })}
          </svg>

          {Object.entries(SHIFT_POSITIONS[shiftMode]).map(([pos, coords]: [string, any]) => {
            const player = lineup[pos];
            const isSelected = selectingPosition === pos;
            
            const isHovered = hoveredPosition === pos;
            let isSuggested = false;
            const activePlayer = draggedPlayer || hoveredPlayer;
            if (activePlayer && pos !== 'DH') {
              if (activePlayer.isPitcher && pos === 'SP') isSuggested = true;
              else if (!activePlayer.isPitcher && pos !== 'SP') {
                isSuggested = activePlayer.primaryPosition === pos || activePlayer.secondaryPositions.includes(pos);
              }
            }

            return (
              <div 
                key={pos}
                style={{
                  position: 'absolute',
                  top: coords.top,
                  left: coords.left,
                  transform: 'translate(-50%, -50%)',
                  transition: 'top 0.6s cubic-bezier(0.4, 0, 0.2, 1), left 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: isHovered || isSuggested ? 20 : 10
                }}
              >
                <div 
                  onClick={() => setSelectingPosition(pos)}
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
                    background: isSelected || isHovered ? 'var(--primary-accent)' : (player ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.5)'),
                    border: `2px ${!player ? 'dashed' : 'solid'} ${isSuggested ? '#facc15' : (player ? 'var(--primary-accent)' : 'rgba(255,255,255,0.3)')}`,
                    borderRadius: '50%',
                    width: isHovered || isSuggested ? '68px' : '60px',
                    height: isHovered || isSuggested ? '68px' : '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    boxShadow: isSuggested ? '0 0 15px rgba(250, 204, 21, 0.6)' : '0 4px 12px rgba(0,0,0,0.8)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: player ? '#fff' : 'var(--text-muted)' }}>{pos}</div>
                  {player ? (
                     <div style={{ fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '90%', textAlign: 'center', color: 'var(--primary-accent)' }}>
                       {player.name.split(' ')[1] || player.name}
                     </div>
                  ) : (
                    <UserPlus size={16} style={{ marginTop: '4px', color: 'rgba(255,255,255,0.4)' }} />
                  )}
                  {player && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); removePlayer(pos); }}
                      style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '20px', height: '20px', color: 'white', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >×</button>
                  )}
                </div>

                {/* Data Overlay Badge */}
                {player && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    fontFamily: 'monospace'
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '8px' }}>{pos === 'SP' ? 'VEL' : 'FLD'}</span>
                    <span style={{ color: pos === 'SP' ? '#38bdf8' : '#4ade80' }}>
                      {pos === 'SP' ? player.stats.velocity : player.stats.fielding}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* DH Spot */}
          <div 
            onClick={() => setSelectingPosition('DH')}
            onDragOver={(e) => { e.preventDefault(); }}
            onDragEnter={() => setHoveredPosition('DH')}
            onDragLeave={() => setHoveredPosition(null)}
            onDrop={(e) => {
              e.preventDefault();
              setHoveredPosition(null);
              if (draggedPlayer) assignPlayerToPosition(draggedPlayer, 'DH');
            }}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: selectingPosition === 'DH' || hoveredPosition === 'DH' ? 'var(--primary-accent)' : (lineup.DH ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)'),
              border: `2px ${!lineup.DH ? 'dashed' : 'solid'} ${(hoveredPlayer || draggedPlayer) && !((hoveredPlayer || draggedPlayer).isPitcher) ? '#facc15' : (lineup.DH ? 'var(--primary-color)' : 'rgba(255,255,255,0.5)')}`,
              borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#fff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px',
              boxShadow: (hoveredPlayer || draggedPlayer) && !((hoveredPlayer || draggedPlayer).isPitcher) ? '0 0 15px rgba(250, 204, 21, 0.6)' : 'none',
              transform: hoveredPosition === 'DH' ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary-accent)' }}>DH</div>
            {lineup.DH ? (
               <div style={{ fontSize: '11px', textAlign: 'center' }}>{lineup.DH.name}</div>
            ) : <UserPlus size={16} />}
            {lineup.DH && (
              <button 
                onClick={(e) => { e.stopPropagation(); removePlayer('DH'); }}
                style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '20px', height: '20px', color: 'white', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >×</button>
            )}
          </div>
        </div>

        {/* Team Roster (Always Visible) */}
        <div className="glass-panel" style={{ padding: '16px', flex: '1.5', height: '700px', display: 'flex', flexDirection: 'column', border: selectingPosition ? '2px solid var(--primary-accent)' : '1px solid rgba(255,255,255,0.1)', minWidth: '400px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--primary-accent)', display: 'flex', justifyContent: 'space-between' }}>
              {selectingPosition ? `Select ${selectingPosition}` : 'Team Roster'}
              {selectingPosition && (
                <button onClick={() => setSelectingPosition(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>✕</button>
              )}
            </h3>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', alignContent: 'start', paddingRight: '8px' }}>
              {teamPlayers.map(p => {
                let isOptimal = false;
                let isFaded = false;
                
                const activePos = selectingPosition || hoveredPosition;
                
                if (activePos) {
                   if (activePos === 'SP') {
                       isOptimal = p.isPitcher;
                   } else if (activePos === 'DH') {
                       isOptimal = !p.isPitcher;
                   } else {
                       isOptimal = p.primaryPosition === activePos || p.secondaryPositions.includes(activePos as string);
                   }
                   isFaded = !isOptimal; // fade out non-optimal
                }

                // Ensure player hasn't already been picked if we're in selecting mode
                const isAlreadyInLineup = Object.values(lineup).some(lineupPlayer => lineupPlayer?.name === p.name);
                if (selectingPosition && isAlreadyInLineup) {
                  return null; // Don't show players already in lineup when selecting
                }

                return (
                  <div 
                    key={p.name} 
                    draggable={true}
                    onDragStart={(e) => {
                      setDraggedPlayer(p);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDraggedPlayer(null)}
                    onMouseEnter={() => setHoveredPlayer(p)}
                    onMouseLeave={() => setHoveredPlayer(null)}
                    onClick={() => {
                      if (selectingPosition) {
                        assignPlayerToPosition(p, selectingPosition);
                      } else {
                        setViewingPlayer(p);
                      }
                    }}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      padding: '8px',
                      borderRadius: '6px',
                      cursor: 'grab',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeft: isOptimal ? '4px solid var(--primary-accent)' : '4px solid transparent',
                      opacity: isFaded ? 0.4 : 1,
                      transition: 'all 0.2s',
                      position: 'relative',
                      transform: draggedPlayer?.name === p.name ? 'scale(0.95)' : 'scale(1)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '16px' }}>
                        <div style={{ fontWeight: 'bold' }}>{p.name} <span style={{ fontSize: '10px', padding: '2px 4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', color: 'var(--text-muted)' }}>{p.primaryPosition}</span></div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary-accent)', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{p.rating}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                         {renderProgressBar(p.isPitcher ? 'VEL' : 'POW', (p.isPitcher ? p.stats.velocity : p.stats.power) ?? 0, '#ef4444')}
                         {renderProgressBar(p.isPitcher ? 'JNK' : 'CON', (p.isPitcher ? p.stats.junk : p.stats.contact) ?? 0, '#f97316')}
                         {renderProgressBar(p.isPitcher ? 'ACC' : 'SPD', (p.isPitcher ? p.stats.accuracy : p.stats.speed) ?? 0, '#3b82f6')}
                         {renderProgressBar('FLD', p.stats.fielding, '#4ade80')}
                      </div>
                    </div>
                    {/* If not selecting, show a small indicator that they are in the lineup */}
                    {!selectingPosition && isAlreadyInLineup && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }} title="In Lineup"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
      </div>

      {/* Bottom Layout: Batting Order + Lineup Stats */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Batting Order */}
        <div className="glass-panel" style={{ padding: '16px', flex: '1.5', minWidth: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Batting Order</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select 
                    value={battingStrategy} 
                    onChange={(e) => setBattingStrategy(e.target.value as BattingStrategy)}
                    className="filter-select"
                    style={{ padding: '4px 8px', fontSize: '12px', minWidth: '120px' }}
                  >
                    <option value="sabermetrics">Sabermetrics (Modern)</option>
                    <option value="traditional">Traditional</option>
                  </select>
                  <button 
                    onClick={handleAutoSortBattingOrder}
                    disabled={battingOrder.length === 0}
                    style={{ 
                      background: 'rgba(56, 189, 248, 0.2)', 
                      border: '1px solid rgba(56, 189, 248, 0.5)', 
                      color: '#38bdf8', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      cursor: battingOrder.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RefreshCw size={12} /> Auto-Sort
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {battingOrder.map((name, index) => {
                  const p = teamPlayers.find(p => p.name === name);
                  return (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary-accent)', width: '20px' }}>{index + 1}.</div>
                      <div style={{ flex: 1 }}>{p?.name || name}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{p?.primaryPosition}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button 
                          onClick={() => moveBatter(index, -1)} 
                          disabled={index === 0}
                          style={{ background: 'none', border: 'none', color: index === 0 ? 'rgba(255,255,255,0.1)' : '#fff', cursor: index === 0 ? 'default' : 'pointer', padding: '0 4px', fontSize: '10px' }}
                        >▲</button>
                        <button 
                          onClick={() => moveBatter(index, 1)} 
                          disabled={index === battingOrder.length - 1}
                          style={{ background: 'none', border: 'none', color: index === battingOrder.length - 1 ? 'rgba(255,255,255,0.1)' : '#fff', cursor: index === battingOrder.length - 1 ? 'default' : 'pointer', padding: '0 4px', fontSize: '10px' }}
                        >▼</button>
                      </div>
                    </div>
                  );
                })}
                {battingOrder.length < 9 && (
                  <div style={{ padding: '6px 12px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                    Select {9 - battingOrder.length} more hitters...
                  </div>
                )}
              </div>
            </div>

        {/* Team Radar */}
        <div className="glass-panel" style={{ padding: '16px', flex: '2', minWidth: '400px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--primary-color)' }}>Lineup Stats</h3>
              {currentLineupTeamStat ? (
                <div style={{ height: '350px' }}>
                  <TeamRadar team={currentLineupTeamStat} />
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '100px' }}>Select players to view stats.</p>
              )}
            </div>
        </div>
      {/* Player Details Modal */}
      {viewingPlayer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setViewingPlayer(null)}>
          <div className="glass-panel" style={{ padding: '24px', width: '500px', maxWidth: '90%', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setViewingPlayer(null)}
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', zIndex: 10 }}
            >×</button>
            <PlayerRadar player={viewingPlayer} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LineupBuilder;
