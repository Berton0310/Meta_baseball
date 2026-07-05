import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Target, Search, ShieldAlert, HeartPulse } from 'lucide-react';
import { renderPositionBadge } from './PlayerGrid';

interface ScoutingTacticsProps {
  players: any[];
}

const SYNERGIES: Record<string, string[]> = {
  'First Pitch Slayer': ['Bad Ball Hitter'],
  'Bad Ball Hitter': ['First Pitch Slayer'],
  'Clutch': ['Rally Stopper'],
  'Rally Stopper': ['Clutch'],
  'K Collector': ['Elite 4F', 'Elite 2F', 'Elite SB', 'Elite CF'],
};

const ScoutingTactics: React.FC<ScoutingTacticsProps> = ({ players }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'synergy' | 'defense' | 'catcher'>('synergy');
  const [selectedTrait, setSelectedTrait] = useState<string>('First Pitch Slayer');

  // Find unique traits across all players for the dropdown, but only those that have mapped synergies
  const allTraits = useMemo(() => {
    const traitsSet = new Set<string>();
    players.forEach(p => {
      if (p.traits) {
        p.traits.forEach((t: string) => {
          if (SYNERGIES[t]) {
            traitsSet.add(t);
          }
        });
      }
    });
    return Array.from(traitsSet).sort();
  }, [players]);

  const synergizingTraits = SYNERGIES[selectedTrait] || [];

  const synergyPlayers = useMemo(() => {
    if (synergizingTraits.length === 0) return [];
    return players.filter(p => p.traits && p.traits.some((t: string) => synergizingTraits.includes(t)));
  }, [players, synergizingTraits]);

  const liabilitySluggers = useMemo(() => {
    return players.filter(p => {
      if (p.isPitcher) return false;
      const pow = p.stats.power || 0;
      const con = p.stats.contact || 0;
      const fld = p.stats.fielding || 0;
      const spd = p.stats.speed || 0;
      return (pow + con > 130) && (fld < 40) && (spd < 45);
    }).sort((a, b) => ((b.stats.power + b.stats.contact) - (a.stats.power + a.stats.contact)));
  }, [players]);

  const cheapShields = useMemo(() => {
    return players.filter(p => {
      if (p.isPitcher) return false;
      const fld = p.stats.fielding || 0;
      const spd = p.stats.speed || 0;
      // Rating C+ or lower implies rating length > 1 (e.g. 'C+') or rating starts with C/D
      const isCheap = p.rating?.startsWith('C') || p.rating?.startsWith('D');
      return isCheap && (fld + spd > 130);
    }).sort((a, b) => ((b.stats.fielding + b.stats.speed) - (a.stats.fielding + a.stats.speed)));
  }, [players]);

  const catcherWatchlist = useMemo(() => {
    return players.filter(p => {
      if (p.primaryPosition !== 'C' && !p.secondaryPositions?.includes('C')) return false;
      const hasDurable = p.traits?.includes('Durable');
      const fld = p.stats.fielding || 0;
      const arm = p.stats.arm || 0;
      return !hasDurable && (fld < 60 || arm < 70);
    }).sort((a, b) => ((a.stats.fielding + a.stats.arm) - (b.stats.fielding + b.stats.arm)));
  }, [players]);

  const renderPlayerCard = (p: any, type: 'synergy' | 'slugger' | 'shield' | 'catcher') => (
    <div key={p.name} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', borderLeft: `4px solid ${type === 'slugger' ? '#ef4444' : type === 'shield' ? '#3b82f6' : type === 'catcher' ? '#f59e0b' : 'var(--primary-accent)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {p.name} 
          {renderPositionBadge(p.primaryPosition)}
        </div>
        <div className={`rating-badge rating-${p.rating?.replace('+', 'plus').replace('-', 'minus') || 'none'}`}>{p.rating}</div>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>{p.team}</div>
      
      {type === 'slugger' && (
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
          <span style={{ color: '#fca5a5' }}>{t('stats.power') || 'POW'}: {p.stats.power}</span>
          <span style={{ color: '#fca5a5' }}>{t('stats.contact') || 'CON'}: {p.stats.contact}</span>
          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{t('stats.fielding') || 'FLD'}: {p.stats.fielding}</span>
          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{t('stats.speed') || 'SPD'}: {p.stats.speed}</span>
        </div>
      )}
      {type === 'shield' && (
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
          <span style={{ color: '#93c5fd', fontWeight: 'bold' }}>{t('stats.fielding') || 'FLD'}: {p.stats.fielding}</span>
          <span style={{ color: '#93c5fd', fontWeight: 'bold' }}>{t('stats.speed') || 'SPD'}: {p.stats.speed}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>{t('stats.power') || 'POW'}: {p.stats.power}</span>
        </div>
      )}
      {type === 'catcher' && (
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
          <span style={{ color: p.stats.fielding < 60 ? '#ef4444' : '#fff', fontWeight: p.stats.fielding < 60 ? 'bold' : 'normal' }}>{t('stats.fielding') || 'FLD'}: {p.stats.fielding}</span>
          <span style={{ color: p.stats.arm < 70 ? '#ef4444' : '#fff', fontWeight: p.stats.arm < 70 ? 'bold' : 'normal' }}>{t('stats.arm') || 'ARM'}: {p.stats.arm}</span>
          <span style={{ color: '#f59e0b' }}>{t('scouting.riskHigh')}</span>
        </div>
      )}
      {type === 'synergy' && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {p.traits?.map((tStr: string) => (
            <span key={tStr} style={{ background: synergizingTraits.includes(tStr) ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: '#fff' }}>
              {t(`traits.${tStr}`) || tStr}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary-accent)' }}>
          <Target size={24} /> {t('scouting.title')}
        </h2>
        
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('synergy')}
            style={{ background: activeTab === 'synergy' ? 'var(--primary-color)' : 'transparent', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
          ><Search size={16} /> {t('scouting.synergyFinder')}</button>
          <button 
            onClick={() => setActiveTab('defense')}
            style={{ background: activeTab === 'defense' ? 'var(--primary-color)' : 'transparent', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
          ><ShieldAlert size={16} /> {t('scouting.defensiveAnalyzer')}</button>
          <button 
            onClick={() => setActiveTab('catcher')}
            style={{ background: activeTab === 'catcher' ? 'var(--primary-color)' : 'transparent', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
          ><HeartPulse size={16} /> {t('scouting.catcherWatchlist')}</button>
        </div>
      </div>

      {activeTab === 'synergy' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{t('scouting.synergyDesc')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 'bold' }}>{t('scouting.selectTrait')}</label>
            <select className="filter-select" value={selectedTrait} onChange={e => setSelectedTrait(e.target.value)}>
              {allTraits.map(tr => <option key={tr} value={tr}>{t(`traits.${tr}`) || tr}</option>)}
            </select>
          </div>
          
          {synergizingTraits.length > 0 ? (
            <>
              <div style={{ marginBottom: '16px', color: 'var(--primary-accent)', fontWeight: 'bold' }}>
                {t('scouting.synergiesWith')} {synergizingTraits.map(tr => t(`traits.${tr}`) || tr).join(', ')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {synergyPlayers.map(p => renderPlayerCard(p, 'synergy'))}
                {synergyPlayers.length === 0 && <p style={{ color: 'var(--text-muted)' }}>{t('scouting.noMatchingPlayers')}</p>}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>{t('scouting.noSynergyMapped')}</p>
          )}
        </div>
      )}

      {activeTab === 'defense' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px', flex: 1, minWidth: '300px' }}>
            <h3 style={{ marginTop: 0, color: '#ef4444' }}>{t('scouting.liabilitySluggers')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>{t('scouting.liabilitySluggersDesc')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {liabilitySluggers.map(p => renderPlayerCard(p, 'slugger'))}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '24px', flex: 1, minWidth: '300px' }}>
            <h3 style={{ marginTop: 0, color: '#3b82f6' }}>{t('scouting.cheapShields')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>{t('scouting.cheapShieldsDesc')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cheapShields.map(p => renderPlayerCard(p, 'shield'))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'catcher' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0, color: '#f59e0b' }}>{t('scouting.catcherWatchlist')}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>{t('scouting.catcherWatchlistDesc')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {catcherWatchlist.map(p => renderPlayerCard(p, 'catcher'))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoutingTactics;
