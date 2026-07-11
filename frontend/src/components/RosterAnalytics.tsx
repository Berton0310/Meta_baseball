import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { calculateTeamStats } from '../utils/teamStats';
import { CHEMISTRY_TYPES, CHEMISTRY_COLOR_VARS, normalizeChemistry, getChemistryLevel } from '../utils/chemistryUtils';
import type { ChemistryType } from '../utils/chemistryUtils';
import traitsData from '../data/traits.json';
import playerImageMap from '../data/playerImageMap.json';
import { renderPositionBadge } from './PlayerGrid';
import { Wallet, Star, Layers, Radar as RadarIcon, Sparkles } from 'lucide-react';

interface RosterAnalyticsProps {
  players: any[];
  teamLabel: string;
}

const RATING_WEIGHTS: Record<string, number> = {
  'S': 100, 'A+': 95, 'A': 90, 'A-': 85,
  'B+': 80, 'B': 75, 'B-': 70,
  'C+': 65, 'C': 60, 'C-': 55,
  'D+': 50, 'D': 45, 'D-': 40
};

const DEPTH_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'SP', 'RP', 'CP'];
const IF_POSITIONS = ['1B', '2B', '3B', 'SS'];
const OF_POSITIONS = ['LF', 'CF', 'RF'];

const RosterAnalytics: React.FC<RosterAnalyticsProps> = ({ players, teamLabel }) => {
  const { t, language } = useLanguage();

  // Aggregate stats for this roster. Overriding `team` before calling
  // calculateTeamStats collapses a mixed custom roster into a single group;
  // for static teams this is identical to the original per-team lookup.
  const teamStat = useMemo(() => {
    if (players.length === 0) return undefined;
    return calculateTeamStats(players.map(p => ({ ...p, team: teamLabel })))[0];
  }, [players, teamLabel]);

  // --- Chemistry counts (normalized, all 5 types always present) ---
  const chemCounts = useMemo(() => {
    const counts: Record<ChemistryType, number> = {
      Competitive: 0, Spirited: 0, Disciplined: 0, Scholarly: 0, Crafty: 0
    };
    players.forEach(p => {
      const chem = normalizeChemistry(p.chemistry);
      if (chem) counts[chem]++;
    });
    return counts;
  }, [players]);

  // --- Roster overview ---
  const rosterOverview = useMemo(() => {
    const pitchers = players.filter(p => p.isPitcher).length;
    return { pitchers, fielders: players.length - pitchers };
  }, [players]);

  // --- Traits grouped by chemistry ---
  const traitGroups = useMemo(() => {
    const traitMap = new Map<string, { trait: any; players: string[] }>();
    players.forEach(p => {
      (p.traits || []).forEach((traitName: string) => {
        const existing = traitMap.get(traitName);
        if (existing) {
          existing.players.push(p.name);
        } else {
          const trait = (traitsData as any[]).find(td => td.nameEn === traitName || td.nameZh === traitName);
          if (trait) traitMap.set(traitName, { trait, players: [p.name] });
        }
      });
    });

    const groups: Record<ChemistryType, { trait: any; players: string[] }[]> = {
      Competitive: [], Spirited: [], Disciplined: [], Scholarly: [], Crafty: []
    };
    traitMap.forEach(entry => {
      const chem = normalizeChemistry(entry.trait.chemistry);
      if (chem) {
        groups[chem].push(entry);
      }
    });
    // Negative traits first so they stand out, then alphabetical
    (Object.keys(groups) as ChemistryType[]).forEach(chem => {
      groups[chem].sort((a, b) => {
        if (a.trait.goodBad !== b.trait.goodBad) return a.trait.goodBad === 'Bad' ? -1 : 1;
        return String(a.trait.nameEn).localeCompare(String(b.trait.nameEn));
      });
    });
    return groups;
  }, [players]);

  // --- Position depth (primary + secondary, expanding IF/OF) ---
  const positionDepth = useMemo(() => {
    const depth: Record<string, number> = {};
    DEPTH_POSITIONS.forEach(pos => { depth[pos] = 0; });
    players.forEach(p => {
      const covered = new Set<string>();
      if (p.primaryPosition) covered.add(p.primaryPosition);
      (p.secondaryPositions || []).forEach((sp: string) => {
        if (sp === 'IF') IF_POSITIONS.forEach(pos => covered.add(pos));
        else if (sp === 'OF') OF_POSITIONS.forEach(pos => covered.add(pos));
        else covered.add(sp);
      });
      covered.forEach(pos => {
        if (pos in depth) depth[pos]++;
      });
    });
    return depth;
  }, [players]);

  // --- Star players (top 5 by rating) ---
  const starPlayers = useMemo(() => {
    return [...players]
      .sort((a, b) => (RATING_WEIGHTS[b.rating] || 0) - (RATING_WEIGHTS[a.rating] || 0))
      .slice(0, 5);
  }, [players]);

  // --- Radar data (team average attributes) ---
  const radarData = useMemo(() => {
    if (!teamStat) return [];
    return [
      { subject: t('stats.power') || 'POW', value: teamStat.avgStats.power },
      { subject: t('stats.contact') || 'CON', value: teamStat.avgStats.contact },
      { subject: t('stats.speed') || 'SPD', value: teamStat.avgStats.speed },
      { subject: t('stats.fielding') || 'FLD', value: teamStat.avgStats.fielding },
      { subject: t('stats.arm') || 'ARM', value: teamStat.avgStats.arm },
      { subject: t('stats.velocity') || 'VEL', value: teamStat.avgStats.velocity },
      { subject: t('stats.junk') || 'JNK', value: teamStat.avgStats.junk },
      { subject: t('stats.accuracy') || 'ACC', value: teamStat.avgStats.accuracy },
    ];
  }, [teamStat, t]);

  const getPlayerImage = (p: any): string | null => {
    const rawPath = (playerImageMap as any)[`${p.team}-${p.name}`];
    return rawPath ? `${import.meta.env.BASE_URL}${rawPath.replace(/^\//, '')}` : null;
  };

  if (!teamStat) return null;

  return (
    <>
      <div className="dashboard-cards">
        {/* Salary & roster overview */}
        <div className="glass-panel dashboard-card">
          <h3 className="dashboard-card-title">
            <Wallet size={18} color="var(--primary-accent)" /> {t('dashboard.rosterTitle')}
          </h3>
          <div className="dashboard-stat-grid">
            <div className="dashboard-stat-item">
              <span className="dashboard-stat-value">${teamStat.totalSalary.toFixed(1)}M</span>
              <span className="dashboard-stat-label">{t('dashboard.totalSalary')}</span>
            </div>
            <div className="dashboard-stat-item">
              <span className="dashboard-stat-value">${teamStat.avgSalary.toFixed(1)}M</span>
              <span className="dashboard-stat-label">{t('dashboard.avgSalary')}</span>
            </div>
            <div className="dashboard-stat-item">
              <span className="dashboard-stat-value">{teamStat.avgAge}</span>
              <span className="dashboard-stat-label">{t('dashboard.avgAge')}</span>
            </div>
            <div className="dashboard-stat-item">
              <span className="dashboard-stat-value">{players.length}</span>
              <span className="dashboard-stat-label">{t('dashboard.playerCount')}</span>
            </div>
            <div className="dashboard-stat-item">
              <span className="dashboard-stat-value">{rosterOverview.pitchers}</span>
              <span className="dashboard-stat-label">{t('dashboard.pitchers')}</span>
            </div>
            <div className="dashboard-stat-item">
              <span className="dashboard-stat-value">{rosterOverview.fielders}</span>
              <span className="dashboard-stat-label">{t('dashboard.fielders')}</span>
            </div>
          </div>
        </div>

        {/* Position depth */}
        <div className="glass-panel dashboard-card">
          <h3 className="dashboard-card-title">
            <Layers size={18} color="var(--primary-accent)" /> {t('dashboard.depthTitle')}
          </h3>
          <div className="depth-grid">
            {DEPTH_POSITIONS.map(pos => {
              const count = positionDepth[pos];
              const isThin = count < 2;
              return (
                <div key={pos} className={`depth-item${isThin ? ' depth-item-thin' : ''}`}>
                  <span className="depth-pos">{pos}</span>
                  <span className="depth-count">{count}</span>
                  {isThin && <span className="depth-warning">{t('dashboard.depthShallow')}</span>}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {t('dashboard.depthNote')}
          </div>
        </div>

        {/* Star players */}
        <div className="glass-panel dashboard-card">
          <h3 className="dashboard-card-title">
            <Star size={18} color="var(--primary-accent)" /> {t('dashboard.starsTitle')}
          </h3>
          <div className="star-players-list">
            {starPlayers.map(p => {
              const imagePath = getPlayerImage(p);
              return (
                <div key={`${p.team}-${p.name}`} className="star-player-row">
                  {imagePath ? (
                    <img src={imagePath} alt={p.name} className="star-player-img" />
                  ) : (
                    <div className="star-player-img star-player-img-placeholder">
                      <Sparkles size={20} color="var(--text-muted)" />
                    </div>
                  )}
                  <div className="star-player-info">
                    <span className="star-player-name">{p.name}</span>
                    <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                      {renderPositionBadge(p.primaryPosition)}
                    </span>
                  </div>
                  {p.rating && (
                    <span className={`rating-badge rating-${String(p.rating).replace('+', 'plus').replace('-', 'minus')}`}>
                      {p.rating}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Team average attributes radar */}
        <div className="glass-panel dashboard-card">
          <h3 className="dashboard-card-title">
            <RadarIcon size={18} color="var(--primary-accent)" /> {t('dashboard.radarTitle')}
          </h3>
          <div className="dashboard-radar-container">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={teamLabel} dataKey="value" stroke="var(--primary-accent)" fill="var(--primary-accent)" fillOpacity={0.45} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Traits overview (grouped by chemistry, showing effective level) */}
      <div className="glass-panel dashboard-card">
        <h3 className="dashboard-card-title">
          <Sparkles size={18} color="var(--primary-accent)" /> {t('dashboard.traitsTitle')}
        </h3>
        <div className="dashboard-traits-groups">
          {CHEMISTRY_TYPES.map(chem => {
            const entries = traitGroups[chem];
            if (entries.length === 0) return null;
            const count = chemCounts[chem];
            const level = getChemistryLevel(count);
            const color = CHEMISTRY_COLOR_VARS[chem];
            return (
              <div key={chem} className="dashboard-trait-group">
                <div className="dashboard-trait-group-header">
                  <span className="chem-dot" style={{ background: color }} />
                  <span style={{ color, fontWeight: 700 }}>{t(`chemistry.${chem}`) || chem}</span>
                  <span className="chem-level-badge" style={{ background: color }}>Lv{level}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {count} {t('dashboard.playersUnit')}
                  </span>
                </div>
                <div className="dashboard-trait-list">
                  {entries.map(({ trait, players: owners }) => {
                    const isBad = trait.goodBad === 'Bad';
                    const desc = language === 'zh-TW'
                      ? (trait[`level${level}Zh`] || trait[`level${level}`] || '')
                      : (trait[`level${level}`] || '');
                    return (
                      <div key={trait.id} className={`dashboard-trait-item${isBad ? ' dashboard-trait-bad' : ''}`}>
                        <div className="dashboard-trait-item-header">
                          <span className={isBad ? 'trait-sign-bad' : 'trait-sign-good'}>{isBad ? '−' : '+'}</span>
                          <span style={{ fontWeight: 600 }}>
                            {language === 'zh-TW' ? trait.nameZh : trait.nameEn}
                          </span>
                          <span className="dashboard-trait-level" style={{ borderColor: color, color }}>
                            Lv{level}
                          </span>
                          {isBad && <span className="dashboard-trait-bad-tag">{t('dashboard.negativeTrait')}</span>}
                        </div>
                        {desc && <div className="dashboard-trait-desc">{desc}</div>}
                        <div className="dashboard-trait-owners">{owners.join(', ')}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {(Object.values(traitGroups) as any[][]).every(g => g.length === 0) && (
            <div style={{ color: 'var(--text-muted)', padding: '12px' }}>{t('dashboard.noTraits')}</div>
          )}
        </div>
      </div>
    </>
  );
};

export default RosterAnalytics;
