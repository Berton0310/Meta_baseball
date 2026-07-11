import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { TrendingUp, Award, DollarSign, Activity, Zap, Shield, Target, ChevronLeft, ChevronRight, UserPlus, X, Search } from 'lucide-react';
import playerImageMap from '../data/playerImageMap.json';

interface PlayerComparisonProps {
  players: any[];
}

const PlayerComparison: React.FC<PlayerComparisonProps> = ({ players }) => {
  const { t } = useLanguage();
  
  // Selected players for comparison
  const [playerAId, setPlayerAId] = useState<string>('');
  const [playerBId, setPlayerBId] = useState<string>('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterPos, setFilterPos] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterType, setFilterType] = useState(''); // 'hitter' | 'pitcher' | ''

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Selecting mode: which slot are we filling?
  const [selectingSlot, setSelectingSlot] = useState<'A' | 'B' | null>(null);

  const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'IF', 'OF', 'SP', 'RP', 'CP'];
  const ratings = ['S', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-'];
  const uniqueTeams = useMemo(() => Array.from(new Set(players.map(p => p.team))).filter(Boolean).sort(), [players]);

  const filteredPlayers = useMemo(() => {
    const result = players.filter(p => {
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterTeam && p.team !== filterTeam) return false;
      if (filterPos && p.primaryPosition !== filterPos && !p.secondaryPositions?.includes(filterPos)) return false;
      if (filterRating && p.rating !== filterRating) return false;
      if (filterType === 'hitter' && p.isPitcher) return false;
      if (filterType === 'pitcher' && !p.isPitcher) return false;
      return true;
    });
    return result;
  }, [players, searchTerm, filterTeam, filterPos, filterRating, filterType]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTeam, filterPos, filterRating, filterType]);

  const totalPages = Math.ceil(filteredPlayers.length / pageSize);
  const paginatedPlayers = filteredPlayers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const playerA = useMemo(() => players.find(p => p.name === playerAId) || null, [players, playerAId]);
  const playerB = useMemo(() => players.find(p => p.name === playerBId) || null, [players, playerBId]);

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
    })).filter(stat => stat.A > 0 || stat.B > 0);
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

  const handleSelectPlayer = (playerName: string) => {
    if (selectingSlot === 'A') {
      setPlayerAId(playerName);
      setSelectingSlot(null);
    } else if (selectingSlot === 'B') {
      setPlayerBId(playerName);
      setSelectingSlot(null);
    } else {
      // Auto assign: if A is empty, fill A; if B is empty, fill B
      if (!playerAId) {
        setPlayerAId(playerName);
      } else if (!playerBId) {
        setPlayerBId(playerName);
      } else {
        // Both filled, replace A
        setPlayerAId(playerName);
      }
    }
  };

  const getPlayerImage = (player: any) => {
    const raw = (playerImageMap as any)[`${player.team}-${player.name}`];
    return raw ? `${import.meta.env.BASE_URL}${raw.replace(/^\//, '')}` : null;
  };

  const analysisA = playerA ? analyzePlayer(playerA) : null;
  const analysisB = playerB ? analyzePlayer(playerB) : null;

  const imagePathA = playerA ? getPlayerImage(playerA) : null;
  const imagePathB = playerB ? getPlayerImage(playerB) : null;

  // Render pagination numbers
  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterTeam('');
    setFilterPos('');
    setFilterRating('');
    setFilterType('');
    setCurrentPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Activity size={24} color="var(--primary-accent)" /> 
          {t('compare.title') || 'Player Comparison & Analysis'}
        </h2>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              type="text" 
              placeholder={t('app.search') || '搜尋球員...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', outline: 'none' }}
            />
          </div>
          <select 
            value={filterTeam} 
            onChange={(e) => setFilterTeam(e.target.value)} 
            className="filter-select"
          >
            <option value="">{t('compare.allTeams') || '所有隊伍'}</option>
            {uniqueTeams.map((tStr) => <option key={String(tStr)} value={String(tStr)}>{String(tStr)}</option>)}
          </select>
          <select 
            value={filterPos} 
            onChange={(e) => setFilterPos(e.target.value)} 
            className="filter-select"
          >
            <option value="">{t('compare.allPositions') || '所有位置'}</option>
            {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
          <select 
            value={filterRating} 
            onChange={(e) => setFilterRating(e.target.value)} 
            className="filter-select"
          >
            <option value="">{t('app.filterRating') || '所有評級'}</option>
            {ratings.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)} 
            className="filter-select"
          >
            <option value="">{t('app.all') || '全部'}</option>
            <option value="hitter">{t('app.fielders') || '野手'}</option>
            <option value="pitcher">{t('app.pitchers') || '投手'}</option>
          </select>
          {(searchTerm || filterTeam || filterPos || filterRating || filterType) && (
            <button 
              onClick={clearFilters}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
            >
              <X size={14} /> {t('compare.clearFilters') || '清除篩選'}
            </button>
          )}
        </div>

        {/* Selected Comparison Slots */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
          {/* Slot A */}
          <div 
            onClick={() => setSelectingSlot(selectingSlot === 'A' ? null : 'A')}
            style={{ 
              padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
              background: selectingSlot === 'A' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0,0,0,0.2)',
              border: selectingSlot === 'A' ? '2px solid var(--primary-accent)' : '2px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}
          >
            {playerA ? (
              <>
                {imagePathA && <img src={imagePathA} alt={playerA.name} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary-accent)' }}>{playerA.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{playerA.primaryPosition} · {playerA.team} · {playerA.rating}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setPlayerAId(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}>
                  <X size={16} />
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: selectingSlot === 'A' ? 'var(--primary-accent)' : 'rgba(255,255,255,0.4)', width: '100%', justifyContent: 'center', padding: '8px' }}>
                <UserPlus size={20} />
                <span>{selectingSlot === 'A' ? (t('compare.clickToSelect') || '點擊下方球員選取') : (t('compare.selectPlayerA') || '選擇球員 A')}</span>
              </div>
            )}
          </div>

          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>VS</div>

          {/* Slot B */}
          <div 
            onClick={() => setSelectingSlot(selectingSlot === 'B' ? null : 'B')}
            style={{ 
              padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
              background: selectingSlot === 'B' ? 'rgba(255, 107, 107, 0.15)' : 'rgba(0,0,0,0.2)',
              border: selectingSlot === 'B' ? '2px solid #ff6b6b' : '2px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}
          >
            {playerB ? (
              <>
                {imagePathB && <img src={imagePathB} alt={playerB.name} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#ff6b6b' }}>{playerB.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{playerB.primaryPosition} · {playerB.team} · {playerB.rating}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setPlayerBId(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}>
                  <X size={16} />
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: selectingSlot === 'B' ? '#ff6b6b' : 'rgba(255,255,255,0.4)', width: '100%', justifyContent: 'center', padding: '8px' }}>
                <UserPlus size={20} />
                <span>{selectingSlot === 'B' ? (t('compare.clickToSelect') || '點擊下方球員選取') : (t('compare.selectPlayerB') || '選擇球員 B')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Player List */}
        <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
              {t('compare.matchingPlayers') || '符合條件的球員'}: <strong style={{ color: 'white' }}>{filteredPlayers.length}</strong> {t('compare.people') || '人'}
            </span>
            {selectingSlot && (
              <span style={{ fontSize: '0.85rem', color: selectingSlot === 'A' ? 'var(--primary-accent)' : '#ff6b6b', animation: 'pulse 1.5s infinite' }}>
                ▶ {selectingSlot === 'A' ? (t('compare.selectingA') || '正在選取球員 A') : (t('compare.selectingB') || '正在選取球員 B')}
              </span>
            )}
          </div>

          {/* Player Rows */}
          {paginatedPlayers.map((p) => {
            const img = getPlayerImage(p);
            const isSelectedA = p.name === playerAId;
            const isSelectedB = p.name === playerBId;
            return (
              <div 
                key={p.name}
                onClick={() => handleSelectPlayer(p.name)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', transition: 'all 0.15s',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: isSelectedA ? 'rgba(56, 189, 248, 0.1)' : isSelectedB ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                  borderLeft: isSelectedA ? '3px solid var(--primary-accent)' : isSelectedB ? '3px solid #ff6b6b' : '3px solid transparent'
                }}
                onMouseEnter={(e) => { if (!isSelectedA && !isSelectedB) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { if (!isSelectedA && !isSelectedB) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                {img ? (
                  <img src={img} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>N/A</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{p.team} · {p.primaryPosition}{p.secondaryPositions?.length > 0 ? ` / ${p.secondaryPositions.join(', ')}` : ''}</div>
                </div>
                <span className={`rating-badge rating-${p.rating?.replace('+', 'plus').replace('-', 'minus') || 'none'}`} style={{ fontSize: '0.85rem' }}>{p.rating}</span>
                <div style={{ textAlign: 'right', minWidth: '60px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{t('info.age') || 'Age'}: {p.age}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{p.salary}</div>
                </div>
                {isSelectedA && <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-accent)', padding: '2px 8px', background: 'rgba(56, 189, 248, 0.2)', borderRadius: '4px' }}>A</span>}
                {isSelectedB && <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ff6b6b', padding: '2px 8px', background: 'rgba(255, 107, 107, 0.2)', borderRadius: '4px' }}>B</span>}
              </div>
            );
          })}

          {paginatedPlayers.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              {t('compare.noResults') || '沒有找到符合條件的球員'}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'white', border: 'none', cursor: currentPage === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              {renderPageNumbers().map((page, idx) => (
                typeof page === 'number' ? (
                  <button 
                    key={idx}
                    onClick={() => setCurrentPage(page)}
                    style={{ 
                      padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                      background: currentPage === page ? 'var(--primary-accent)' : 'rgba(255,255,255,0.05)',
                      color: currentPage === page ? 'white' : 'rgba(255,255,255,0.6)',
                      fontWeight: currentPage === page ? 'bold' : 'normal'
                    }}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={idx} style={{ color: 'rgba(255,255,255,0.3)', padding: '0 4px' }}>...</span>
                )
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : 'white', border: 'none', cursor: currentPage === totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Results - only show when both players selected */}
      {playerA && playerB && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* Radar Chart Panel */}
            <div className="glass-panel" style={{ padding: '24px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '16px', textAlign: 'center' }}>{t('compare.attrRadar') || '能力雷達圖'}</h3>
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
              <h3 style={{ marginBottom: '24px', textAlign: 'center' }}>{t('compare.coreStats') || '核心數據對比'}</h3>
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
              {analysisA && (
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
                  {analysisA.cpValue > (analysisB?.cpValue || 0) && analysisA.cpValue > 0 && <span className="stat-badge" style={{ background: 'rgba(241, 196, 15, 0.2)', color: '#f1c40f', border: '1px solid #f1c40f', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={12} /> {t('compare.tagHighCP') || 'High Value'}</span>}
                </div>
                <ul style={{ paddingLeft: '20px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                  {analysisA.isImmediate && <li>{t('compare.descImmediateA') || 'High immediate impact potential.'}</li>}
                  {analysisA.isFuture && <li>{t('compare.descFutureA') || 'High long-term development value.'}</li>}
                  {analysisA.isVeteran && <li>{t('compare.descVeteranA') || 'Veteran player, monitor for regression.'}</li>}
                  {analysisA.cpValue > (analysisB?.cpValue || 0) && <li>{t('compare.descBetterCP_A') || 'Better overall value for salary.'}</li>}
                  <li><strong>{t('info.chemistry')}:</strong> {t('chemistry.' + (playerA.chemistry || ''))}</li>
                  <li><strong>{t('info.traits')}:</strong> {playerA.traits.map((tr: string) => t('traits.' + tr)).join(', ') || t('compare.none')}</li>
                </ul>
              </div>
              )}

              {/* Player B Analysis */}
              {analysisB && (
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
                  {analysisB.cpValue > (analysisA?.cpValue || 0) && analysisB.cpValue > 0 && <span className="stat-badge" style={{ background: 'rgba(241, 196, 15, 0.2)', color: '#f1c40f', border: '1px solid #f1c40f', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={12} /> {t('compare.tagHighCP') || 'High Value'}</span>}
                </div>
                <ul style={{ paddingLeft: '20px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                  {analysisB.isImmediate && <li>{t('compare.descImmediateB') || 'High immediate impact potential.'}</li>}
                  {analysisB.isFuture && <li>{t('compare.descFutureB') || 'High long-term development value.'}</li>}
                  {analysisB.isVeteran && <li>{t('compare.descVeteranB') || 'Veteran player, monitor for regression.'}</li>}
                  {analysisB.cpValue > (analysisA?.cpValue || 0) && <li>{t('compare.descBetterCP_B') || 'Better overall value for salary.'}</li>}
                  <li><strong>{t('info.chemistry')}:</strong> {t('chemistry.' + (playerB.chemistry || ''))}</li>
                  <li><strong>{t('info.traits')}:</strong> {playerB.traits.map((tr: string) => t('traits.' + tr)).join(', ') || t('compare.none')}</li>
                </ul>
              </div>
              )}

            </div>
          </div>
        </>
      )}

      {/* Prompt when not both selected */}
      {(!playerA || !playerB) && (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          <Activity size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <div style={{ fontSize: '1.1rem' }}>{t('compare.selectBothPrompt') || '請從上方列表選擇兩位球員進行比較'}</div>
          <div style={{ fontSize: '0.85rem', marginTop: '8px' }}>{t('compare.selectBothHint') || '點擊「選擇球員 A」或「選擇球員 B」的框框，再點擊列表中的球員即可'}</div>
        </div>
      )}

    </div>
  );
};

export default PlayerComparison;
