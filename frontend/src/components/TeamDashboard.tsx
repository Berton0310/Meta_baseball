import React, { useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { calculateTeamStats } from '../utils/teamStats';
import { CHEMISTRY_TYPES, CHEMISTRY_COLOR_VARS, normalizeChemistry, getChemistryLevel, nextThreshold } from '../utils/chemistryUtils';
import type { ChemistryType } from '../utils/chemistryUtils';
import {
  listRosters, getRoster, getActiveRosterId, getRosterPlayers, sourceLabel,
  encodeTeamSource, decodeTeamSource
} from '../utils/myTeamStorage';
import RosterAnalytics from './RosterAnalytics';
import { FlaskConical } from 'lucide-react';

interface TeamDashboardProps {
  players: any[];
}

const TeamDashboard: React.FC<TeamDashboardProps> = ({ players }) => {
  const { t } = useLanguage();

  const teamStats = useMemo(() => calculateTeamStats(players), [players]);
  const teamNames = useMemo(() => teamStats.map(ts => ts.team).sort((a, b) => a.localeCompare(b)), [teamStats]);

  // Custom rosters saved in "My Teams" (re-read on each mount so edits show up)
  const myRosters = useMemo(() => listRosters(), []);

  // Team source: `myteam:{rosterId}` or `static:{team}`. Defaults to the active
  // custom roster if one is set, otherwise the first league team.
  const [sourceKey, setSourceKey] = useState<string>(() => {
    const activeId = getActiveRosterId();
    if (activeId && getRoster(activeId)) {
      return encodeTeamSource({ kind: 'myteam', rosterId: activeId });
    }
    return encodeTeamSource({ kind: 'static', team: teamNames[0] || '' });
  });

  const source = useMemo(() => decodeTeamSource(sourceKey), [sourceKey]);
  const isMyTeam = source.kind === 'myteam';
  const selectedTeam = sourceLabel(source);

  const roster = useMemo(() => {
    if (source.kind === 'myteam') return getRosterPlayers(source);
    return players.filter(p => p.team === source.team);
  }, [players, source]);

  // Aggregate stats for the current source. Overriding `team` before calling
  // calculateTeamStats collapses a mixed custom roster into a single group;
  // for static teams this is identical to the original per-team lookup.
  const teamStat = useMemo(() => {
    if (roster.length === 0) return undefined;
    return calculateTeamStats(roster.map(p => ({ ...p, team: selectedTeam })))[0];
  }, [roster, selectedTeam]);

  // --- Chemistry counts (normalized, all 5 types always present) ---
  const chemCounts = useMemo(() => {
    const counts: Record<ChemistryType, number> = {
      Competitive: 0, Spirited: 0, Disciplined: 0, Scholarly: 0, Crafty: 0
    };
    roster.forEach(p => {
      const chem = normalizeChemistry(p.chemistry);
      if (chem) counts[chem]++;
    });
    return counts;
  }, [roster]);

  const upgradeHint = (count: number): string => {
    const threshold = nextThreshold(count);
    if (threshold === null) return t('dashboard.maxLevel');
    const targetLevel = getChemistryLevel(threshold);
    return t('dashboard.upgradeHint')
      .replace('{n}', String(threshold - count))
      .replace('{lv}', String(targetLevel));
  };

  // Header card (title + source selector) is shared by the normal view and the
  // empty state, so an empty custom roster still lets the user switch sources.
  const headerCard = (
    <div className="glass-panel dashboard-card dashboard-header-card">
      <div className="dashboard-header-team">
        {!isMyTeam && (
          <img
            key={selectedTeam}
            src={`${import.meta.env.BASE_URL}logos/${selectedTeam}.png`}
            alt={selectedTeam}
            className="dashboard-team-logo"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{selectedTeam || t('myteam.title')}</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            {isMyTeam ? (
              <>{t('myteam.customRoster')} · {roster.length} {t('dashboard.playersUnit')}</>
            ) : teamStat && (
              <>
                {teamStat.conference} · {teamStat.division}
                {teamStat.teamStrength && <> · {t(`teamStrength.${teamStat.teamStrength}`) || teamStat.teamStrength}</>}
              </>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('dashboard.selectTeam')}</label>
        <select className="filter-select" value={sourceKey} onChange={e => setSourceKey(e.target.value)}>
          {myRosters.length > 0 && (
            <optgroup label={t('myteam.groupMyTeams')}>
              {myRosters.map(r => (
                <option key={r.id} value={encodeTeamSource({ kind: 'myteam', rosterId: r.id })}>{r.name}</option>
              ))}
            </optgroup>
          )}
          <optgroup label={t('myteam.groupLeagueTeams')}>
            {teamNames.map(name => (
              <option key={name} value={encodeTeamSource({ kind: 'static', team: name })}>{name}</option>
            ))}
          </optgroup>
        </select>
      </div>
    </div>
  );

  if (!teamStat) {
    return (
      <div className="team-dashboard">
        {headerCard}
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t('dashboard.noTeam')}
        </div>
      </div>
    );
  }

  return (
    <div className="team-dashboard">
      {headerCard}

      {/* 1. Chemistry counter (most important, on top) */}
      <div className="glass-panel dashboard-card">
        <h3 className="dashboard-card-title">
          <FlaskConical size={18} color="var(--primary-accent)" /> {t('dashboard.chemistryTitle')}
        </h3>
        <div className="dashboard-chem-grid">
          {CHEMISTRY_TYPES.map(chem => {
            const count = chemCounts[chem];
            const level = getChemistryLevel(count);
            const threshold = nextThreshold(count);
            const color = CHEMISTRY_COLOR_VARS[chem];
            // Progress toward the next threshold (3, then 7); full bar at max level
            const progress = threshold === null ? 100 : Math.min(100, (count / threshold) * 100);
            return (
              <div key={chem} className="chem-mini-card" style={{ borderColor: color }}>
                <div className="chem-mini-header">
                  <span className="chem-mini-name" style={{ color }}>{t(`chemistry.${chem}`) || chem}</span>
                  <span className="chem-level-badge" style={{ background: color }}>Lv{level}</span>
                </div>
                <div className="chem-mini-count" style={{ color }}>
                  {count}<span className="chem-mini-count-unit">{t('dashboard.playersUnit')}</span>
                </div>
                <div className="chem-progress-track">
                  <div className="chem-progress-fill" style={{ width: `${progress}%`, background: color }} />
                </div>
                <div className="chem-mini-hint">{upgradeHint(count)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Salary / depth / stars / radar / traits — shared analytics panels */}
      <RosterAnalytics players={roster} teamLabel={selectedTeam} />
    </div>
  );
};

export default TeamDashboard;
