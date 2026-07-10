import React, { useMemo, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import playersData from '../data/players.json';
import {
  listRosters, createRoster, updateRoster, deleteRoster, duplicateRoster,
  getActiveRosterId, setActiveRosterId, createFromTeam, exportRoster, importRoster,
} from '../utils/myTeamStorage';
import type { MyTeamRoster, Player } from '../utils/myTeamStorage';
import { CHEMISTRY_TYPES, CHEMISTRY_COLOR_VARS, normalizeChemistry, getChemistryLevel, nextThreshold } from '../utils/chemistryUtils';
import type { ChemistryType } from '../utils/chemistryUtils';
import { renderPositionBadge } from './PlayerGrid';
import {
  UserCog, Plus, Copy, Pencil, Trash2, Download, Upload, Check, Search,
  FlaskConical, Users, ClipboardList, X
} from 'lucide-react';

const ALL_PLAYERS = playersData as unknown as Player[];
const LEAGUE_TEAMS = Array.from(new Set(ALL_PLAYERS.map(p => p.team))).filter(Boolean).sort();
const POSITION_GROUPS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'SP', 'RP', 'CP'];
const STANDARD_ROSTER_SIZE = 22;

const parseSalary = (s: string | number | undefined | null): number => {
  if (!s) return 0;
  if (typeof s === 'number') return s;
  const clean = String(s).replace(/[^0-9.]/g, '');
  return parseFloat(clean) || 0;
};

type Message = { kind: 'success' | 'error'; text: string } | null;

const MyTeamManager: React.FC = () => {
  const { t } = useLanguage();

  const [rosters, setRosters] = useState<MyTeamRoster[]>(() => listRosters());
  const [activeId, setActiveId] = useState<string | null>(() => getActiveRosterId());
  const [message, setMessage] = useState<Message>(null);

  // Creation controls
  const [newName, setNewName] = useState('');
  const [copyTeam, setCopyTeam] = useState('');

  // Inline rename
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Player pool filters
  const [searchQuery, setSearchQuery] = useState('');
  const [poolTeam, setPoolTeam] = useState('');
  const [poolPos, setPoolPos] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => setRosters(listRosters());

  const activeRoster = useMemo(
    () => rosters.find(r => r.id === activeId) || null,
    [rosters, activeId]
  );

  const playerById = useMemo(() => new Map(ALL_PLAYERS.map(p => [p.id, p])), []);

  const rosterPlayers = useMemo(() => {
    if (!activeRoster) return [];
    return activeRoster.playerIds
      .map(id => playerById.get(id))
      .filter((p): p is Player => p !== undefined);
  }, [activeRoster, playerById]);

  const rosterIdSet = useMemo(
    () => new Set(activeRoster?.playerIds || []),
    [activeRoster]
  );

  const totalSalary = useMemo(
    () => rosterPlayers.reduce((sum, p) => sum + parseSalary(p.salary), 0),
    [rosterPlayers]
  );

  // Chemistry counts for the active roster (updates on every add/remove)
  const chemCounts = useMemo(() => {
    const counts: Record<ChemistryType, number> = {
      Competitive: 0, Spirited: 0, Disciplined: 0, Scholarly: 0, Crafty: 0
    };
    rosterPlayers.forEach(p => {
      const chem = normalizeChemistry(p.chemistry);
      if (chem) counts[chem]++;
    });
    return counts;
  }, [rosterPlayers]);

  const chemUpgradeHint = (count: number): string => {
    const threshold = nextThreshold(count);
    if (threshold === null) return t('dashboard.maxLevel');
    return t('dashboard.upgradeHint')
      .replace('{n}', String(threshold - count))
      .replace('{lv}', String(getChemistryLevel(threshold)));
  };

  const groupedRoster = useMemo(() => {
    const groups: { pos: string; players: Player[] }[] = [];
    POSITION_GROUPS.forEach(pos => {
      const players = rosterPlayers.filter(p => p.primaryPosition === pos);
      if (players.length > 0) groups.push({ pos, players });
    });
    // Anything with an unexpected primary position still shows up at the bottom
    const known = new Set(POSITION_GROUPS);
    const others = rosterPlayers.filter(p => !known.has(p.primaryPosition));
    if (others.length > 0) groups.push({ pos: t('myteam.groupOther'), players: others });
    return groups;
  }, [rosterPlayers, t]);

  const filteredPool = useMemo(() => {
    return ALL_PLAYERS.filter(p => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (poolTeam && p.team !== poolTeam) return false;
      if (poolPos && p.primaryPosition !== poolPos && !(p.secondaryPositions || []).includes(poolPos)) return false;
      return true;
    });
  }, [searchQuery, poolTeam, poolPos]);

  // --- Actions -------------------------------------------------------------

  const selectRoster = (id: string) => {
    setActiveRosterId(id);
    setActiveId(id);
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) {
      setMessage({ kind: 'error', text: t('myteam.msgNameRequired') });
      return;
    }
    const roster = createRoster(name);
    setNewName('');
    refresh();
    selectRoster(roster.id);
    setMessage({ kind: 'success', text: t('myteam.msgCreated').replace('{name}', roster.name) });
  };

  const handleCopyFromTeam = () => {
    if (!copyTeam) {
      setMessage({ kind: 'error', text: t('myteam.msgTeamRequired') });
      return;
    }
    const roster = createFromTeam(copyTeam, copyTeam);
    refresh();
    selectRoster(roster.id);
    setMessage({ kind: 'success', text: t('myteam.msgCreated').replace('{name}', roster.name) });
  };

  const startRename = (roster: MyTeamRoster) => {
    setRenamingId(roster.id);
    setRenameValue(roster.name);
  };

  const commitRename = (id: string) => {
    const name = renameValue.trim();
    if (name) updateRoster(id, { name });
    setRenamingId(null);
    refresh();
  };

  const handleDuplicate = (roster: MyTeamRoster) => {
    const copy = duplicateRoster(roster.id, `${roster.name}${t('myteam.copySuffix')}`);
    refresh();
    if (copy) {
      setMessage({ kind: 'success', text: t('myteam.msgCreated').replace('{name}', copy.name) });
    }
  };

  const handleDelete = (roster: MyTeamRoster) => {
    if (!window.confirm(t('myteam.confirmDelete').replace('{name}', roster.name))) return;
    deleteRoster(roster.id);
    if (activeId === roster.id) setActiveId(getActiveRosterId());
    refresh();
    setMessage({ kind: 'success', text: t('myteam.msgDeleted').replace('{name}', roster.name) });
  };

  const handleExport = (roster: MyTeamRoster) => {
    const json = exportRoster(roster.id);
    if (!json) {
      setMessage({ kind: 'error', text: t('myteam.msgExportFailed') });
      return;
    }
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${roster.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importRoster(String(reader.result));
      if (result.ok) {
        refresh();
        selectRoster(result.roster.id);
        setMessage({ kind: 'success', text: t('myteam.msgImported').replace('{name}', result.roster.name) });
      } else {
        setMessage({ kind: 'error', text: t('myteam.msgImportFailed').replace('{error}', result.error) });
      }
    };
    reader.onerror = () => {
      setMessage({ kind: 'error', text: t('myteam.msgImportFailed').replace('{error}', file.name) });
    };
    reader.readAsText(file);
  };

  const togglePlayer = (player: Player) => {
    if (!activeRoster) return;
    const next = rosterIdSet.has(player.id)
      ? activeRoster.playerIds.filter(id => id !== player.id)
      : [...activeRoster.playerIds, player.id];
    updateRoster(activeRoster.id, { playerIds: next });
    refresh();
  };

  const removePlayer = (player: Player) => {
    if (!activeRoster) return;
    updateRoster(activeRoster.id, { playerIds: activeRoster.playerIds.filter(id => id !== player.id) });
    refresh();
  };

  const chemDot = (p: Player) => {
    const chem = normalizeChemistry(p.chemistry);
    return (
      <span
        className="chem-dot"
        style={{ background: chem ? CHEMISTRY_COLOR_VARS[chem] : 'rgba(255,255,255,0.15)' }}
        title={chem ? (t(`chemistry.${chem}`) || chem) : ''}
      />
    );
  };

  const ratingBadge = (p: Player) => p.rating ? (
    <span className={`rating-badge rating-${String(p.rating).replace('+', 'plus').replace('-', 'minus')}`} style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
      {p.rating}
    </span>
  ) : null;

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  };

  const sizeOk = rosterPlayers.length === STANDARD_ROSTER_SIZE;

  return (
    <div className="myteam-page">
      {/* ===== Roster list & actions ===== */}
      <div className="glass-panel dashboard-card">
        <h3 className="dashboard-card-title">
          <UserCog size={18} color="var(--primary-accent)" /> {t('myteam.rostersTitle')}
        </h3>

        <div className="myteam-actions">
          <div className="myteam-action-group">
            <input
              className="input-field myteam-name-input"
              type="text"
              value={newName}
              placeholder={t('myteam.newRosterPlaceholder')}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            />
            <button className="btn-icon" onClick={handleCreate}>
              <Plus size={16} /> {t('myteam.create')}
            </button>
          </div>
          <div className="myteam-action-group">
            <select className="filter-select" value={copyTeam} onChange={e => setCopyTeam(e.target.value)}>
              <option value="">{t('myteam.selectTeamPlaceholder')}</option>
              {LEAGUE_TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
            </select>
            <button className="btn-icon" onClick={handleCopyFromTeam}>
              <Copy size={16} /> {t('myteam.copyFromTeam')}
            </button>
          </div>
          <div className="myteam-action-group">
            <button className="btn-icon" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> {t('myteam.import')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
          </div>
        </div>

        {message && (
          <div className={`myteam-message myteam-message-${message.kind}`}>
            {message.text}
            <button className="myteam-message-close" onClick={() => setMessage(null)} aria-label="close">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="myteam-roster-list">
          {rosters.map(roster => {
            const isActive = roster.id === activeId;
            return (
              <div
                key={roster.id}
                className={`myteam-roster-card${isActive ? ' myteam-roster-card-active' : ''}`}
                onClick={() => selectRoster(roster.id)}
              >
                {renamingId === roster.id ? (
                  <div className="myteam-action-group" onClick={e => e.stopPropagation()}>
                    <input
                      className="input-field myteam-rename-input"
                      type="text"
                      value={renameValue}
                      autoFocus
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename(roster.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                    />
                    <button className="myteam-icon-btn" onClick={() => commitRename(roster.id)}>
                      <Check size={13} /> {t('myteam.save')}
                    </button>
                    <button className="myteam-icon-btn" onClick={() => setRenamingId(null)}>
                      <X size={13} /> {t('myteam.cancel')}
                    </button>
                  </div>
                ) : (
                  <div className="myteam-roster-name">
                    <ClipboardList size={16} color="var(--primary-accent)" />
                    <span>{roster.name}</span>
                    {isActive && <span className="myteam-active-badge">{t('myteam.activeBadge')}</span>}
                  </div>
                )}
                <div className="myteam-roster-meta">
                  {t('myteam.playersCount').replace('{n}', String(roster.playerIds.length))}
                  {' · '}
                  {t('myteam.updatedAt').replace('{date}', formatDate(roster.updatedAt))}
                </div>
                <div className="myteam-roster-actions" onClick={e => e.stopPropagation()}>
                  <button className="myteam-icon-btn" onClick={() => startRename(roster)}>
                    <Pencil size={13} /> {t('myteam.rename')}
                  </button>
                  <button className="myteam-icon-btn" onClick={() => handleDuplicate(roster)}>
                    <Copy size={13} /> {t('myteam.duplicate')}
                  </button>
                  <button className="myteam-icon-btn" onClick={() => handleExport(roster)}>
                    <Download size={13} /> {t('myteam.export')}
                  </button>
                  <button className="myteam-icon-btn myteam-icon-btn-danger" onClick={() => handleDelete(roster)}>
                    <Trash2 size={13} /> {t('myteam.delete')}
                  </button>
                </div>
              </div>
            );
          })}
          {rosters.length === 0 && (
            <div className="myteam-empty-hint">{t('myteam.noRosters')}</div>
          )}
        </div>
      </div>

      {activeRoster ? (
        <>
          {/* ===== Roster chemistry bar (reuses lineup chem styles) ===== */}
          <div className="glass-panel lineup-chem-panel">
            <h3 className="lineup-chem-title">
              <FlaskConical size={16} color="var(--primary-accent)" />
              {t('myteam.chemTitle')}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                {activeRoster.name}
              </span>
            </h3>
            <div className="lineup-chem-bar">
              {CHEMISTRY_TYPES.map(chem => {
                const count = chemCounts[chem];
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

          {/* ===== Editor: current roster (left) + player pool (right) ===== */}
          <div className="myteam-editor">
            {/* Current roster */}
            <div className="glass-panel dashboard-card">
              <h3 className="dashboard-card-title">
                <ClipboardList size={18} color="var(--primary-accent)" /> {t('myteam.currentRoster')}
              </h3>
              <div className="myteam-summary">
                <span title={t('myteam.standardSizeNote')}>
                  {t('myteam.rosterCount')}{' '}
                  <strong style={{ color: sizeOk ? 'var(--success-color)' : 'var(--warning-color)' }}>
                    {rosterPlayers.length} / {STANDARD_ROSTER_SIZE}
                  </strong>
                </span>
                <span>
                  {t('myteam.totalSalary')}{' '}
                  <strong style={{ color: 'var(--text-main)' }}>${totalSalary.toFixed(1)}M</strong>
                </span>
              </div>
              <div className="myteam-current-list">
                {groupedRoster.map(group => (
                  <div key={group.pos}>
                    <div className="myteam-group-header">
                      <span>{group.pos}</span>
                      <span className="myteam-group-count">{group.players.length}</span>
                    </div>
                    {group.players.map(p => (
                      <div key={p.id} className="myteam-player-row">
                        {chemDot(p)}
                        <span className="myteam-player-name">{p.name}</span>
                        {renderPositionBadge(p.primaryPosition)}
                        {ratingBadge(p)}
                        <span className="myteam-salary">{p.salary}</span>
                        <button
                          className="myteam-remove-btn"
                          onClick={() => removePlayer(p)}
                          title={t('myteam.remove')}
                        >×</button>
                      </div>
                    ))}
                  </div>
                ))}
                {rosterPlayers.length === 0 && (
                  <div className="myteam-empty-hint">{t('myteam.emptyRoster')}</div>
                )}
              </div>
            </div>

            {/* Player pool */}
            <div className="glass-panel dashboard-card">
              <h3 className="dashboard-card-title">
                <Users size={18} color="var(--primary-accent)" /> {t('myteam.playerPool')}
              </h3>
              <div className="myteam-pool-filters">
                <div className="myteam-pool-search">
                  <Search size={15} className="myteam-pool-search-icon" />
                  <input
                    className="input-field"
                    type="text"
                    value={searchQuery}
                    placeholder={t('myteam.searchPlayer')}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '34px', width: '100%' }}
                  />
                </div>
                <select className="filter-select" value={poolTeam} onChange={e => setPoolTeam(e.target.value)}>
                  <option value="">{t('myteam.allTeams')}</option>
                  {LEAGUE_TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
                </select>
                <select className="filter-select" value={poolPos} onChange={e => setPoolPos(e.target.value)}>
                  <option value="">{t('myteam.allPositions')}</option>
                  {POSITION_GROUPS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>
              <div className="myteam-pool-list">
                {filteredPool.map(p => {
                  const inRoster = rosterIdSet.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`myteam-player-row myteam-pool-row${inRoster ? ' myteam-pool-row-in' : ''}`}
                      onClick={() => togglePlayer(p)}
                      title={inRoster ? t('myteam.remove') : t('myteam.add')}
                    >
                      {chemDot(p)}
                      <span className="myteam-player-name">
                        {p.name}
                        <span className="myteam-pool-team"> · {p.team}</span>
                      </span>
                      {renderPositionBadge(p.primaryPosition)}
                      {ratingBadge(p)}
                      {inRoster ? (
                        <span className="myteam-in-tag"><Check size={12} /> {t('myteam.inRoster')}</span>
                      ) : (
                        <Plus size={14} color="var(--text-muted)" />
                      )}
                    </div>
                  );
                })}
                {filteredPool.length === 0 && (
                  <div className="myteam-empty-hint">{t('lineup.noPlayersFound')}</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-panel myteam-select-hint">
          {t('myteam.selectRosterHint')}
        </div>
      )}
    </div>
  );
};

export default MyTeamManager;
