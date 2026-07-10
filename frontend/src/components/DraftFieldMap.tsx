import React from 'react';
import { UserPlus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Player } from '../types/player';

interface DraftFieldMapProps {
  draftedRosterSlots: (Player | null)[];
  blueprintSlots: { id: string; weight: number }[];
  onPositionClick: (pos: string) => void;
  activeFilter?: string;
}

const FIELD_POSITIONS: Record<string, { top: string, left: string }> = {
  'C': { top: '85%', left: '50%' },
  '1B': { top: '55%', left: '75%' },
  '2B': { top: '40%', left: '65%' },
  '3B': { top: '55%', left: '25%' },
  'SS': { top: '40%', left: '35%' },
  'LF': { top: '20%', left: '15%' },
  'CF': { top: '10%', left: '50%' },
  'RF': { top: '20%', left: '85%' },
  'SP': { top: '65%', left: '50%' },
};

const EXTRA_POSITIONS = ['RP', 'CP', 'DH', 'Utility_IF', 'Utility_OF', 'Super_Utility', 'Backup_C'];

const DraftFieldMap: React.FC<DraftFieldMapProps> = ({ draftedRosterSlots, blueprintSlots, onPositionClick, activeFilter }) => {
  const { t } = useLanguage();
  const draftedPlayers = draftedRosterSlots.filter(p => p !== null);
  // Aggregate players by position
  const getPlayersForPos = (pos: string) => {
    return draftedPlayers.filter(p => 
      p && (p.primaryPosition === pos || (p.secondaryPositions && p.secondaryPositions.includes(pos)))
    );
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '600px', width: '100%' }}>
      {/* The Field */}
      <div className="glass-panel" style={{ flex: '1.5', position: 'relative', backgroundImage: `url(${import.meta.env.BASE_URL}field_bg.png)`, backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
        
        {Object.entries(FIELD_POSITIONS).map(([pos, coords]) => {
          const playersAtPos = getPlayersForPos(pos);
          const hasPrimary = playersAtPos.some(p => p.primaryPosition === pos);
          const isSelected = activeFilter === pos;
          
          return (
            <div 
              key={pos}
              onClick={() => onPositionClick(pos)}
              style={{
                position: 'absolute',
                top: coords.top,
                left: coords.left,
                transform: 'translate(-50%, -50%)',
                background: isSelected ? 'var(--primary-accent)' : (hasPrimary ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.5)'),
                border: `2px ${!hasPrimary ? 'dashed' : 'solid'} ${isSelected ? '#facc15' : (hasPrimary ? 'var(--primary-accent)' : 'rgba(255,255,255,0.3)')}`,
                borderRadius: '8px',
                width: '75px',
                minHeight: '75px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '4px',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 0 15px rgba(250, 204, 21, 0.6)' : '0 4px 12px rgba(0,0,0,0.8)',
                transition: 'all 0.2s',
                zIndex: isSelected ? 20 : 10
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: hasPrimary ? '#fff' : 'var(--text-muted)' }}>{pos}</div>
              
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', marginTop: '4px' }}>
                {playersAtPos.map(p => {
                  const isPrimary = p.primaryPosition === pos;
                  return (
                    <div key={p.name} style={{ 
                      fontSize: '10px', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      textAlign: 'center',
                      background: isPrimary ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      color: isPrimary ? '#93c5fd' : 'rgba(255,255,255,0.6)',
                      padding: '2px',
                      borderRadius: '2px'
                    }}>
                      {p.name.split(' ')[1] || p.name} {!isPrimary && t('draft.secondaryTag')}
                    </div>
                  );
                })}
              </div>

              {playersAtPos.length === 0 && (
                <UserPlus size={16} style={{ marginTop: 'auto', marginBottom: '8px', color: 'rgba(255,255,255,0.2)' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Bullpen & Bench */}
      <div className="glass-panel" style={{ flex: '0.8', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', overflowY: 'auto' }}>
        <h3 style={{ margin: 0, color: 'var(--primary-accent)' }}>{t('draft.bullpenBench')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {EXTRA_POSITIONS.map(pos => {
            const slotIndices = blueprintSlots.reduce((acc, slot, idx) => {
               if (slot.id === pos) acc.push(idx);
               return acc;
            }, [] as number[]);
            const playersInTheseSlots = slotIndices.map(idx => draftedRosterSlots[idx]).filter(p => p !== null);
            const totalSlots = slotIndices.length;
            const isSelected = activeFilter === pos;
            return (
              <div 
                key={pos}
                onClick={() => onPositionClick(pos)}
                style={{
                  padding: '12px',
                  background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isSelected ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: isSelected ? '#3b82f6' : '#fff' }}>{pos} ({playersInTheseSlots.length}/{totalSlots})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {playersInTheseSlots.map(p => {
                    const isPrimary = p.primaryPosition === pos;
                    return (
                      <span key={p.name} style={{ 
                        fontSize: '11px', 
                        padding: '2px 6px', 
                        background: isPrimary ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.1)',
                        color: isPrimary ? '#93c5fd' : 'rgba(255,255,255,0.6)',
                        borderRadius: '4px'
                      }}>
                        {p.name.split(' ')[1] || p.name} {!isPrimary && t('draft.secondaryTag')}
                      </span>
                    )
                  })}
                  {playersInTheseSlots.length === 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('lineup.emptySlot')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DraftFieldMap;
