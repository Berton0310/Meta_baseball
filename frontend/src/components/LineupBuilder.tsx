import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import playersData from '../data/players.json';
import { autoPickLineup, optimizeBattingOrder, ALL_TEAMS, FULL_ROSTER_POSITIONS } from '../utils/lineupOptimizer';
import type { OptimizationStrategy, Lineup, BattingStrategy } from '../utils/lineupOptimizer';
import { listRosters, getRosterPlayers, encodeTeamSource, decodeTeamSource, setActiveRosterId } from '../utils/myTeamStorage';
import { calculateTeamStats } from '../utils/teamStats';
import { CHEMISTRY_TYPES, CHEMISTRY_COLOR_VARS, normalizeChemistry, getChemistryLevel, nextThreshold } from '../utils/chemistryUtils';
import type { ChemistryType } from '../utils/chemistryUtils';
import {
  TRAIT_BATTING_FIT, NEGATIVE_HITTER_TRAITS, getTraitByName, hasTrait,
  getEffectiveTraitDesc, formatSlotRanges, canPlayPosition, positionWeightedScore
} from '../utils/traitFitUtils';
import type { Player } from '../types/player';
import { Settings2, RefreshCw, UserPlus, Search, Trash2, Shield, Swords, Users, Target, FlaskConical, AlertTriangle, Info, Pencil } from 'lucide-react';
import playerImageMap from '../data/playerImageMap.json';
import PlayerDetailModal from './PlayerDetailModal';

const LEAGUE_TEAMS = Array.from(new Set(playersData.map(p => p.team))).filter(Boolean).sort();
const DEFAULT_SOURCE_KEY = encodeTeamSource({ kind: 'static', team: ALL_TEAMS });
const LAST_SOURCE_KEY = 'smb4.lineup.lastSource';

/** 讀取上次的來源 key 並驗證是否仍有效；無效則回傳預設值。 */
function resolveInitialSourceKey(): string {
  try {
    const saved = localStorage.getItem(LAST_SOURCE_KEY);
    if (!saved) return DEFAULT_SOURCE_KEY;
    const source = decodeTeamSource(saved);
    if (source.kind === 'static') {
      // ALL_TEAMS 或仍存在的球隊皆有效
      if (source.team === ALL_TEAMS || LEAGUE_TEAMS.includes(source.team)) return saved;
    } else {
      // myteam：確認 rosterId 仍在 listRosters() 中
      const rosters = listRosters();
      if (rosters.some(r => r.id === source.rosterId)) return saved;
    }
  } catch {
    // localStorage 不可用：靜默回傳預設值
  }
  return DEFAULT_SOURCE_KEY;
}

const ROSTER_GROUPS = {
  starters: ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'],
  rotation: ['SP1', 'SP2', 'SP3', 'SP4', 'SP5'],
  bullpen: ['RP1', 'RP2', 'RP3', 'RP4', 'RP5', 'CP'],
  bench: ['BN1', 'BN2', 'BN3', 'BN4', 'BN5']
};

// Resolve the player pool for an encoded team source.
const playersForSource = (sourceKey: string): any[] => {
  const source = decodeTeamSource(sourceKey);
  if (source.kind === 'myteam') return getRosterPlayers(source);
  if (source.team === ALL_TEAMS) return playersData;
  return playersData.filter(p => p.team === source.team);
};

// --- Lineup persistence (per team source) ----------------------------------
// Stored under `smb4.lineup.{static:{team}|myteam:{rosterId}}` as player ids.
const lineupStorageKey = (sourceKey: string) => `smb4.lineup.${sourceKey}`;

interface SavedLineup {
  lineup: Record<string, string | null>;
  battingOrder: (string | null)[];
  battingStrategy?: BattingStrategy;
}

// Restore a saved lineup, resolving ids against the source's current player
// pool. Ids that no longer exist in the pool fall back to an empty slot.
const loadSavedLineup = (sourceKey: string) => {
  const emptyLineup: Lineup = {};
  FULL_ROSTER_POSITIONS.forEach(pos => emptyLineup[pos] = null);
  const result = {
    lineup: emptyLineup,
    battingOrder: new Array(9).fill(null) as (any | null)[],
    battingStrategy: null as BattingStrategy | null,
  };
  try {
    const raw = localStorage.getItem(lineupStorageKey(sourceKey));
    if (!raw) return result;
    const saved = JSON.parse(raw) as SavedLineup;
    const byId = new Map(playersForSource(sourceKey).map(p => [p.id, p]));
    if (saved.lineup && typeof saved.lineup === 'object') {
      FULL_ROSTER_POSITIONS.forEach(pos => {
        const id = saved.lineup[pos];
        result.lineup[pos] = (id && byId.get(id)) || null;
      });
    }
    if (Array.isArray(saved.battingOrder)) {
      result.battingOrder = new Array(9).fill(null).map((_, i) => {
        const id = saved.battingOrder[i];
        return (id && byId.get(id)) || null;
      });
    }
    if (saved.battingStrategy === 'traditional' || saved.battingStrategy === 'sabermetrics') {
      result.battingStrategy = saved.battingStrategy;
    }
  } catch {
    // Corrupted storage: start from an empty lineup.
  }
  return result;
};

interface LineupBuilderProps {
  onNavigate?: (mode: 'myteam') => void;
}

const LineupBuilder: React.FC<LineupBuilderProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  // Lazy initializer：首次 render 就讀取上次的來源（省去多餘的重渲染）
  const [sourceKey, setSourceKey] = useState<string>(resolveInitialSourceKey);
  const [strategy, setStrategy] = useState<OptimizationStrategy>('overall');

  // Custom rosters saved in "My Teams" (re-read on each mount)
  const myRosters = useMemo(() => listRosters(), []);

  // Restore the saved lineup for the initial source on mount.
  const initialSaved = useMemo(() => loadSavedLineup(resolveInitialSourceKey()), []);
  const [lineup, setLineup] = useState<Lineup>(initialSaved.lineup);
  const [battingOrder, setBattingOrder] = useState<(any | null)[]>(initialSaved.battingOrder);
  const [battingStrategy, setBattingStrategy] = useState<BattingStrategy>(initialSaved.battingStrategy || 'sabermetrics');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectingPosition, setSelectingPosition] = useState<string | null>(null);
  const [selectingBattingSlot, setSelectingBattingSlot] = useState<number | null>(null);

  const [draggedPlayer, setDraggedPlayer] = useState<any | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);
  const [hoveredBattingSlot, setHoveredBattingSlot] = useState<number | null>(null);

  // Player detail modal: null = closed. Opened only via the per-card info button,
  // never via the card onClick (which keeps its existing selecting-mode assign behavior).
  const [selectedDetailPlayer, setSelectedDetailPlayer] = useState<any | null>(null);

  const teamPlayers = useMemo(() => playersForSource(sourceKey), [sourceKey]);

  // Auto-save the current lineup whenever it changes. A fully empty lineup
  // removes the entry instead (so "Clear All" also clears the storage).
  useEffect(() => {
    const isEmpty = Object.values(lineup).every(p => !p) && battingOrder.every(p => !p);
    try {
      if (isEmpty) {
        localStorage.removeItem(lineupStorageKey(sourceKey));
      } else {
        const payload: SavedLineup = {
          lineup: Object.fromEntries(FULL_ROSTER_POSITIONS.map(pos => [pos, lineup[pos]?.id ?? null])),
          battingOrder: battingOrder.map(p => p?.id ?? null),
          battingStrategy,
        };
        localStorage.setItem(lineupStorageKey(sourceKey), JSON.stringify(payload));
      }
    } catch {
      // Storage unavailable / quota exceeded: skip persistence.
    }
  }, [lineup, battingOrder, battingStrategy, sourceKey]);

  const handleAutoPick = () => {
    // Pass the resolved pool with the ALL_TEAMS sentinel so custom rosters
    // (whose players keep their original team names) are not filtered away.
    const newLineup = autoPickLineup(teamPlayers, ALL_TEAMS, strategy);
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
    try {
      localStorage.removeItem(lineupStorageKey(sourceKey));
    } catch {
      // Storage unavailable: ignore.
    }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    const saved = loadSavedLineup(key);
    setSourceKey(key);
    setLineup(saved.lineup);
    setBattingOrder(saved.battingOrder);
    if (saved.battingStrategy) setBattingStrategy(saved.battingStrategy);
    setSelectingPosition(null);
    setSelectingBattingSlot(null);
    // 儲存本次選擇，重新整理後可自動還原
    try {
      localStorage.setItem(LAST_SOURCE_KEY, key);
    } catch {
      // Storage 不可用：略過
    }
  };

  // Hand back to My Teams to edit the current roster. Only meaningful when the
  // active source is a saved My Team; sets it active so MyTeamManager opens on it.
  const handleEditRoster = () => {
    const source = decodeTeamSource(sourceKey);
    if (source.kind !== 'myteam') return;
    try {
      setActiveRosterId(source.rosterId);
    } catch {
      // Storage unavailable: navigation still works.
    }
    onNavigate?.('myteam');
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

  // Unique players currently slotted anywhere in the roster
  // (batting 9 + SP1-5 + RP1-5 + CP + BN1-5, deduplicated by name).
  const activeLineupPlayers = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    Object.values(lineup).forEach(p => {
      if (p && !seen.has(p.name)) {
        seen.add(p.name);
        list.push(p);
      }
    });
    return list;
  }, [lineup]);

  // Live chemistry counts for the current lineup (updates on every drop/remove).
  const chemCounts = useMemo(() => {
    const counts: Record<ChemistryType, number> = {
      Competitive: 0, Spirited: 0, Disciplined: 0, Scholarly: 0, Crafty: 0
    };
    activeLineupPlayers.forEach(p => {
      const chem = normalizeChemistry(p.chemistry);
      if (chem) counts[chem]++;
    });
    return counts;
  }, [activeLineupPlayers]);

  // Is the current source a "real" roster (a specific team or a saved My Team),
  // as opposed to the All-Teams sandbox? SMB4 chemistry is computed over the
  // *whole roster*, so for real rosters the effective trait levels come from the
  // full player pool — not just who happens to be slotted into the lineup.
  const isRealRoster = useMemo(() => {
    const source = decodeTeamSource(sourceKey);
    return source.kind === 'myteam' || (source.kind === 'static' && source.team !== ALL_TEAMS);
  }, [sourceKey]);

  // Chemistry counts across the entire roster pool (myteam = the 22-man roster,
  // static team = the whole team). This is the SMB4-accurate basis for trait levels.
  const rosterChemCounts = useMemo(() => {
    const counts: Record<ChemistryType, number> = {
      Competitive: 0, Spirited: 0, Disciplined: 0, Scholarly: 0, Crafty: 0
    };
    teamPlayers.forEach(p => {
      const chem = normalizeChemistry(p.chemistry);
      if (chem) counts[chem]++;
    });
    return counts;
  }, [teamPlayers]);

  // The counts that decide *effective trait levels*. Real rosters use the whole
  // roster; the All-Teams sandbox falls back to the slotted-lineup counts.
  const effectiveChemCounts = isRealRoster ? rosterChemCounts : chemCounts;

  const chemUpgradeHint = (count: number): string => {
    const threshold = nextThreshold(count);
    if (threshold === null) return t('dashboard.maxLevel');
    return t('dashboard.upgradeHint')
      .replace('{n}', String(threshold - count))
      .replace('{lv}', String(getChemistryLevel(threshold)));
  };

  // Trait badges for a batting-order slot (1-based slot number).
  // Title text uses the trait description at the level currently in effect.
  const getBattingBadges = (player: any, slotNumber: number) => {
    const badges: { kind: 'good' | 'warn' | 'bad'; label: string; title: string }[] = [];
    (player.traits || []).forEach((traitName: string) => {
      const trait = getTraitByName(traitName);
      if (!trait) return;
      const displayName = language === 'zh-TW' ? (trait.nameZh || trait.nameEn) : trait.nameEn;
      const { level, desc } = getEffectiveTraitDesc(trait, effectiveChemCounts, language);
      const descPart = desc ? ` | Lv${level}: ${desc}` : '';
      if (NEGATIVE_HITTER_TRAITS.has(trait.nameEn)) {
        badges.push({ kind: 'bad', label: displayName, title: `${t('lineup.negativeTraitWarn')}${descPart}` });
        return;
      }
      const fit = TRAIT_BATTING_FIT[trait.nameEn];
      if (!fit) return;
      if (fit.bench) {
        badges.push({ kind: 'warn', label: displayName, title: `${t('lineup.suggestBench')}${descPart}` });
      } else if (fit.slots.includes(slotNumber)) {
        badges.push({ kind: 'good', label: `✓ ${displayName}`, title: `${t('lineup.slotFitGood')}${descPart}` });
      } else {
        const suggest = t('lineup.suggestSlots').replace('{slots}', formatSlotRanges(fit.slots));
        badges.push({ kind: 'warn', label: displayName, title: `${suggest}${descPart}` });
      }
    });
    return badges;
  };

  const renderSlot = (pos: string, isPitcherSlot: boolean) => {
    const player = lineup[pos];
    const isSelected = selectingPosition === pos;
    const isHovered = hoveredPosition === pos;

    const rawImagePath = player ? (playerImageMap as any)[`${player.team}-${player.name}`] : null;
    const imagePath = rawImagePath ? `${import.meta.env.BASE_URL}${rawImagePath.replace(/^\//, '')}` : null;

    // Position fit + weighted score (bench slots have no fixed position)
    const isBench = pos.startsWith('BN');
    const fit = player && !isBench ? canPlayPosition(player, pos) : null;
    const weightedScore = player && !isBench && !isPitcherSlot ? positionWeightedScore(player, pos) : null;
    const isUtility = player ? hasTrait(player, 'Utility') : false;
    const pinchPerfectTrait = isBench && player && hasTrait(player, 'Pinch Perfect')
      ? getTraitByName('Pinch Perfect')
      : null;

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

        {/* Position fit marker: primary = nothing, secondary = neutral tag, mismatch = warning */}
        {player && fit === 'secondary' && (
          <span className="pos-fit-tag" style={{ position: 'absolute', top: '4px', right: '8px' }} title={t('lineup.posSecondary')}>
            {t('lineup.posSecondaryShort')}
          </span>
        )}
        {player && fit === 'none' && (
          <span
            className="pos-fit-warning"
            style={{ position: 'absolute', top: '4px', right: '8px' }}
            title={isUtility ? t('lineup.posMismatchUtility') : t('lineup.posMismatch').replace('{pos}', pos)}
          >
            <AlertTriangle size={14} color={isUtility ? 'var(--warning-color)' : 'var(--danger-color)'} />
          </span>
        )}

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
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
              {player.rating}
              {weightedScore !== null && (
                <span className="slot-weighted-score" title={t('lineup.weightedScore')}>
                  {' '}| {t('lineup.weightedScoreShort')} {weightedScore}
                </span>
              )}
            </div>
            {pinchPerfectTrait && (
              <span
                className="trait-fit-badge trait-fit-good"
                title={`${t('lineup.benchFitGood')} | Lv${getEffectiveTraitDesc(pinchPerfectTrait, effectiveChemCounts, language).level}: ${getEffectiveTraitDesc(pinchPerfectTrait, effectiveChemCounts, language).desc}`}
              >
                ✓ {language === 'zh-TW' ? pinchPerfectTrait.nameZh : pinchPerfectTrait.nameEn}
              </span>
            )}
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{player.name}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{player.primaryPosition} | {player.rating}</div>
              {(() => {
                const badges = getBattingBadges(player, index + 1);
                if (badges.length === 0) return null;
                return (
                  <div className="trait-badge-row">
                    {badges.map((b, i) => (
                      <span key={i} className={`trait-fit-badge trait-fit-${b.kind}`} title={b.title}>
                        {b.label}
                      </span>
                    ))}
                  </div>
                );
              })()}
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
            <span style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>{t('lineup.selectTeam') || 'Base Team'}:</span>
            <select
              value={sourceKey}
              onChange={handleTeamChange}
              style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <option value={DEFAULT_SOURCE_KEY}>{t('lineup.allTeams')}</option>
              {myRosters.length > 0 && (
                <optgroup label={t('lineup.groupMyTeams')}>
                  {myRosters.map(r => (
                    <option key={r.id} value={encodeTeamSource({ kind: 'myteam', rosterId: r.id })}>{r.name}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label={t('lineup.groupLeagueTeams')}>
                {LEAGUE_TEAMS.map(team => (
                  <option key={team} value={encodeTeamSource({ kind: 'static', team })}>{team}</option>
                ))}
              </optgroup>
            </select>
            {decodeTeamSource(sourceKey).kind === 'myteam' && (
              <button
                type="button"
                onClick={handleEditRoster}
                className="lineup-edit-roster-btn"
                title={t('lineup.editRoster')}
              >
                <Pencil size={13} /> {t('lineup.editRoster')}
              </button>
            )}
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
              {selectingPosition
                ? t('lineup.selectFor').replace('{pos}', selectingPosition)
                : (selectingBattingSlot !== null
                  ? t('lineup.selectBat').replace('{n}', String(selectingBattingSlot + 1))
                  : (t('lineup.roster') || 'Player Pool'))}
            </div>
            {(selectingPosition || selectingBattingSlot !== null) && (
              <button onClick={() => { setSelectingPosition(null); setSelectingBattingSlot(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>✕</button>
            )}
          </h3>
          
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'rgba(255,255,255,0.5)' }} />
            <input 
              type="text" 
              placeholder={t('lineup.searchPlayer')}
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
                    {isAlreadyInLineup && <span style={{ fontSize: '9px', background: 'var(--primary-accent)', padding: '2px 4px', borderRadius: '4px' }}>{t('lineup.tagField')}</span>}
                    {isAlreadyInBatting && <span style={{ fontSize: '9px', background: '#eab308', padding: '2px 4px', borderRadius: '4px' }}>{t('lineup.tagBat')}</span>}
                  </div>
                  {/* Info button: opens the detail modal without touching the card's
                      drag or selecting-mode assign behavior. stopPropagation on click
                      avoids the card onClick; draggable=false + stopPropagation on
                      dragStart avoids starting a card drag from the button. */}
                  <button
                    className="player-info-btn"
                    draggable={false}
                    onClick={(e) => { e.stopPropagation(); setSelectedDetailPlayer(p); }}
                    onDragStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    title={t('lineup.viewDetail')}
                    aria-label={t('lineup.viewDetail')}
                  >
                    <Info size={16} />
                  </button>
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

          {/* Chemistry bar. For a real roster the effective levels are driven by
              the *whole roster* (rosterChemCounts), so we show those and label the
              panel as "in effect"; the slotted-lineup count is shown as a quiet
              secondary note. The All-Teams sandbox keeps the slotted-lineup view. */}
          <div className="glass-panel lineup-chem-panel">
            <h3 className="lineup-chem-title">
              <FlaskConical size={16} color="var(--primary-accent)" />
              {isRealRoster ? t('lineup.chemistryBarRoster') : t('lineup.chemistryBar')}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                {isRealRoster
                  ? t('lineup.chemistryBarRosterNote').replace('{n}', String(teamPlayers.length))
                  : t('lineup.chemistryBarNote').replace('{n}', String(activeLineupPlayers.length))}
              </span>
              {isRealRoster && (
                <span className="lineup-chem-fielded-note">
                  {t('lineup.chemistryFieldedNote').replace('{n}', String(activeLineupPlayers.length))}
                </span>
              )}
            </h3>
            <div className="lineup-chem-bar">
              {CHEMISTRY_TYPES.map(chem => {
                const count = isRealRoster ? rosterChemCounts[chem] : chemCounts[chem];
                const level = getChemistryLevel(count);
                const color = CHEMISTRY_COLOR_VARS[chem];
                return (
                  <div key={chem} className="lineup-chem-item" style={{ borderColor: color }}>
                    <div className="lineup-chem-item-top">
                      <span className="chem-dot" style={{ background: color }} />
                      <span className="lineup-chem-name" style={{ color }}>{t(`chemistry.${chem}`) || chem}</span>
                      <span className="chem-level-badge" style={{ background: color }}>Lv{level}</span>
                    </div>
                    <div className="lineup-chem-item-bottom">
                      <span className="lineup-chem-count" style={{ color }}>
                        {count}<span className="chem-mini-count-unit">{t('dashboard.playersUnit')}</span>
                      </span>
                      <span className="lineup-chem-hint">{chemUpgradeHint(count)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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

      {/* Player detail modal (shared component). Backdrop click, ✕, and Esc all close it. */}
      <PlayerDetailModal player={selectedDetailPlayer} onClose={() => setSelectedDetailPlayer(null)} />
    </div>
  );
};

export default LineupBuilder;
