import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { TrendingUp, Award, DollarSign, Activity, Zap, Shield, Target } from 'lucide-react';
import playerImageMap from '../data/playerImageMap.json';

interface PlayerComparisonProps {
  players: any[];
}

const PlayerComparison: React.FC<PlayerComparisonProps> = ({ players }) => {
  const { t } = useLanguage();
  
  // Default to first two players
  const [playerAId, setPlayerAId] = useState<string>(players[0]?.name || '');
  const [playerBId, setPlayerBId] = useState<string>(players[1]?.name || '');

  const playerA = useMemo(() => players.find(p => p.name === playerAId) || players[0], [players, playerAId]);
  const playerB = useMemo(() => players.find(p => p.name === playerBId) || players[1], [players, playerBId]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterPos, setFilterPos] = useState('');

  const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'IF', 'OF', 'SP', 'RP', 'CP'];
  const uniqueTeams = useMemo(() => Array.from(new Set(players.map(p => p.team))).filter(Boolean).sort(), [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterTeam && p.team !== filterTeam) return false;
      if (filterPos && p.primaryPosition !== filterPos && !p.secondaryPositions?.includes(filterPos)) return false;
      return true;
    });
  }, [players, searchTerm, filterTeam, filterPos]);

  const ratingValues: Record<string, number> = {
    'S': 100, 'A+': 95, 'A': 90, 'A-': 85,
    'B+': 80, 'B': 75, 'B-': 70,
    'C+': 65, 'C': 60, 'C-': 55,
    'D+': 50, 'D': 45, 'D-': 40
  };

  const getRatingVal = (rating: string) => ratingValues[rating] || 50;

  const parseSalary = (sal: any) => {
    if (!sal) return 0;
    if (typeof sal === 'number') return sal;
    return parseFloat(String(sal).replace(/[^0-9.]/g, '')) || 0;
  };

  const radarData = useMemo(() => {
    if (!playerA || !playerB) return [];
    
    const statsList = [
      { key: 'power', label: t('stats.power') || 'Power' },
      { key: 'contact', label: t('stats.contact') || 'Contact' },
      { key: 'speed', label: t('stats.speed') || 'Speed' },
      { key: 'fielding', label: t('stats.fielding') || 'Fielding' },
      { key: 'arm', label: t('stats.arm') || 'Arm' },
      { key: 'velocity', label: t('stats.velocity') || 'Velocity' },
      { key: 'junk', label: t('stats.junk') || 'Junk' },
      { key: 'accuracy', label: t('stats.accuracy') || 'Accuracy' }
    ];

    return statsList.map(stat => ({
      subject: stat.label,
      A: playerA.stats[stat.key] || 0,
      B: playerB.stats[stat.key] || 0,
      fullMark: 100
    })).filter(stat => stat.A > 0 || stat.B > 0); // Only show stats relevant to at least one player
  }, [playerA, playerB, t]);

  const analyzePlayer = (player: any) => {
    const age = player.age || 25;
    const ratingVal = getRatingVal(player.rating);
    const salary = parseSalary(player.salary);
    const isImmediate = ratingVal >= 80;
    const isFuture = age <= 24;
    const isVeteran = age >= 32;
    const cpValue = salary > 0 ? ratingVal / salary : 0;

    return { isImmediate, isFuture, isVeteran, cpValue };
  };

  const analysisA = analyzePlayer(playerA);
  const analysisB = analyzePlayer(playerB);

  const rawImagePathA = playerA ? (playerImageMap as any)[`${playerA.team}-${playerA.name}`] : null;
  const imagePathA = rawImagePathA ? `${import.meta.env.BASE_URL}${rawImagePathA.replace(/^\//, '')}` : null;

  const rawImagePathB = playerB ? (playerImageMap as any)[`${playerB.team}-${playerB.name}`] : null;
  const imagePathB = rawImagePathB ? `${import.meta.env.BASE_URL}${rawImagePathB.replace(/^\//, '')}` : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px' }}>
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Activity size={24} color="var(--primary-accent)" /> 
          {t('compare.title') || 'Player Comparison & Analysis'}
        </h2>

        {/* Filters Toolbar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <input 
            type="text" 
            placeholder={t('app.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', flex: 1, minWidth: '200px' }}
          />
          <select 
            value={filterPos} 
            onChange={(e) => setFilterPos(e.target.value)} 
            style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <option value="">{t('compare.allPositions')}</option>
            {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
          <select 
            value={filterTeam} 
            onChange={(e) => setFilterTeam(e.target.value)} 
            style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <option value="">{t('compare.allTeams')}</option>
            {uniqueTeams.map((tStr) => <option key={String(tStr)} value={String(tStr)}>{String(tStr)}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'center' }}>
          {/* Player A Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 'bold', color: 'var(--primary-accent)' }}>{t('compare.selectPlayerA') || 'Select Player A'}</label>
            <select 
              value={playerAId} 
              onChange={e => setPlayerAId(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {!filteredPlayers.find(p => p.name === playerAId) && playerA && (
                <option value={playerA.name}>{playerA.name} ({playerA.primaryPosition} - {playerA.team})</option>
              )}
              {filteredPlayers.map(p => (
                <option key={p.name} value={p.name}>{p.name} ({p.primaryPosition} - {p.team})</option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)' }}>
            {t('compare.vs') || 'VS'}
          </div>

          {/* Player B Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 'bold', color: '#ff6b6b' }}>{t('compare.selectPlayerB') || 'Select Player B'}</label>
            <select 
              value={playerBId} 
              onChange={e => setPlayerBId(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {!filteredPlayers.find(p => p.name === playerBId) && playerB && (
                <option value={playerB.name}>{playerB.name} ({playerB.primaryPosition} - {playerB.team})</option>
              )}
              {filteredPlayers.map(p => (
                <option key={p.name} value={p.name}>{p.name} ({p.primaryPosition} - {p.team})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Radar Chart Panel */}
        <div className="glass-panel" style={{ padding: '24px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '16px', textAlign: 'center' }}>{t('compare.attrRadar')}</h3>
          <div style={{ flex: 1, minHeight: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={playerA.name} dataKey="A" stroke="var(--primary-accent)" fill="var(--primary-accent)" fillOpacity={0.5} />
                <Radar name={playerB.name} dataKey="B" stroke="#ff6b6b" fill="#ff6b6b" fillOpacity={0.5} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Comparison Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '24px', textAlign: 'center' }}>{t('compare.coreStats')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Basic Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ color: 'var(--primary-accent)', fontWeight: 'bold', fontSize: '1.2em' }}>{playerA.rating}</div>
              <div style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.6)' }}>{t('info.rating')}</div>
              <div style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: '1.2em' }}>{playerB.rating}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center', alignItems: 'center', padding: '8px' }}>
              <div style={{ color: 'var(--primary-accent)' }}>{playerA.age}</div>
              <div style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.6)' }}>{t('info.age')}</div>
              <div style={{ color: '#ff6b6b' }}>{playerB.age}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ color: 'var(--primary-accent)' }}>{playerA.salary}</div>
              <div style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.6)' }}>{t('info.salary')}</div>
              <div style={{ color: '#ff6b6b' }}>{playerB.salary}</div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />

            {/* Detailed Stats */}
            {radarData.map(stat => (
              <div key={stat.subject} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '12px', alignItems: 'center' }}>
                <div style={{ textAlign: 'right', fontWeight: stat.A > stat.B ? 'bold' : 'normal', color: stat.A > stat.B ? 'var(--primary-accent)' : '#fff' }}>{stat.A}</div>
                <div style={{ textAlign: 'center', fontSize: '0.85em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{stat.subject}</div>
                <div style={{ textAlign: 'left', fontWeight: stat.B > stat.A ? 'bold' : 'normal', color: stat.B > stat.A ? '#ff6b6b' : '#fff' }}>{stat.B}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Analysis Report */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: '#ffd93d' }}>
          <Target size={20} /> {t('compare.analysisReport') || 'AI Scouting Report'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Player A Analysis */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid var(--primary-accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              {imagePathA && (
                <img 
                  src={imagePathA} 
                  alt={playerA.name} 
                  style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} 
                />
              )}
              <h4 style={{ margin: 0, color: 'var(--primary-accent)', fontSize: '1.2em' }}>{playerA.name}</h4>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {analysisA.isImmediate && <span className="stat-badge" style={{ background: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', border: '1px solid #2ecc71', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={12} /> {t('compare.tagImmediate') || 'Ready Now'}</span>}
              {analysisA.isFuture && <span className="stat-badge" style={{ background: 'rgba(155, 89, 182, 0.2)', color: '#9b59b6', border: '1px solid #9b59b6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={12} /> {t('compare.tagFuture') || 'Future Star'}</span>}
              {analysisA.isVeteran && <span className="stat-badge" style={{ background: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={12} /> {t('compare.tagVeteran') || 'Veteran'}</span>}
              {analysisA.cpValue > analysisB.cpValue && analysisA.cpValue > 0 && <span className="stat-badge" style={{ background: 'rgba(241, 196, 15, 0.2)', color: '#f1c40f', border: '1px solid #f1c40f', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={12} /> {t('compare.tagHighCP') || 'High Value'}</span>}
            </div>
            <ul style={{ paddingLeft: '20px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
              {analysisA.isImmediate && <li>{t('compare.descImmediateA') || 'High immediate impact potential.'}</li>}
              {analysisA.isFuture && <li>{t('compare.descFutureA') || 'High long-term development value.'}</li>}
              {analysisA.isVeteran && <li>{t('compare.descVeteranA') || 'Veteran player, monitor for regression.'}</li>}
              {analysisA.cpValue > analysisB.cpValue && <li>{t('compare.descBetterCP_A') || 'Better overall value for salary.'}</li>}
              <li><strong>{t('info.chemistry')}:</strong> {t('chemistry.' + (playerA.chemistry || ''))}</li>
              <li><strong>{t('info.traits')}:</strong> {playerA.traits.map((tr: string) => t('traits.' + tr)).join(', ') || t('compare.none')}</li>
            </ul>
          </div>

          {/* Player B Analysis */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ff6b6b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              {imagePathB && (
                <img 
                  src={imagePathB} 
                  alt={playerB.name} 
                  style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} 
                />
              )}
              <h4 style={{ margin: 0, color: '#ff6b6b', fontSize: '1.2em' }}>{playerB.name}</h4>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {analysisB.isImmediate && <span className="stat-badge" style={{ background: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', border: '1px solid #2ecc71', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={12} /> {t('compare.tagImmediate') || 'Ready Now'}</span>}
              {analysisB.isFuture && <span className="stat-badge" style={{ background: 'rgba(155, 89, 182, 0.2)', color: '#9b59b6', border: '1px solid #9b59b6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={12} /> {t('compare.tagFuture') || 'Future Star'}</span>}
              {analysisB.isVeteran && <span className="stat-badge" style={{ background: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={12} /> {t('compare.tagVeteran') || 'Veteran'}</span>}
              {analysisB.cpValue > analysisA.cpValue && analysisB.cpValue > 0 && <span className="stat-badge" style={{ background: 'rgba(241, 196, 15, 0.2)', color: '#f1c40f', border: '1px solid #f1c40f', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={12} /> {t('compare.tagHighCP') || 'High Value'}</span>}
            </div>
            <ul style={{ paddingLeft: '20px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
              {analysisB.isImmediate && <li>{t('compare.descImmediateB') || 'High immediate impact potential.'}</li>}
              {analysisB.isFuture && <li>{t('compare.descFutureB') || 'High long-term development value.'}</li>}
              {analysisB.isVeteran && <li>{t('compare.descVeteranB') || 'Veteran player, monitor for regression.'}</li>}
              {analysisB.cpValue > analysisA.cpValue && <li>{t('compare.descBetterCP_B') || 'Better overall value for salary.'}</li>}
              <li><strong>{t('info.chemistry')}:</strong> {t('chemistry.' + (playerB.chemistry || ''))}</li>
              <li><strong>{t('info.traits')}:</strong> {playerB.traits.map((tr: string) => t('traits.' + tr)).join(', ') || t('compare.none')}</li>
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
};

export default PlayerComparison;
