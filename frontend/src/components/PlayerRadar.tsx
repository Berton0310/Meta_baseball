import React from 'react';
import { Radar } from 'react-chartjs-2';
import { useLanguage } from '../context/LanguageContext';
import { renderPositionBadge } from './PlayerGrid';
import traitsData from '../data/traits_info.json';
import playerImageMap from '../data/playerImageMap.json';


interface PlayerRadarProps {
  player: any;
  targetArchetype?: any;
  player2?: any;
}

const PlayerRadar: React.FC<PlayerRadarProps> = ({ player, targetArchetype, player2 }) => {
  const { t } = useLanguage();

  if (!player) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{t('radar.selectPlayer')}</div>;
  }

  // Force usage to prevent esbuild from stripping it
  if (typeof traitsData === 'undefined') {
    console.error('traitsData is undefined!');
  }

  const isPitcher = player.isPitcher;

  const labels = ['POW', 'CON', 'SPD', 'FLD', 'ARM', 'VEL', 'JNK', 'ACC'];

  const getValues = (p: any) => p.isPitcher
    ? [0, 0, 0, p.stats.fielding || 0, 0, p.stats.velocity || 0, p.stats.junk || 0, p.stats.accuracy || 0]
    : [p.stats.power || 0, p.stats.contact || 0, p.stats.speed || 0, p.stats.fielding || 0, p.stats.arm || 0, 0, 0, 0];

  const dataValues = getValues(player);

  const datasets = [
    {
      label: player.name,
      data: dataValues,
      backgroundColor: 'rgba(0, 91, 172, 0.3)',
      borderColor: 'rgba(0, 91, 172, 1)',
      pointBackgroundColor: 'rgba(0, 91, 172, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(0, 91, 172, 1)',
      borderWidth: 2,
    }
  ];

  if (player2) {
    datasets.push({
      label: player2.name,
      data: getValues(player2),
      backgroundColor: 'rgba(245, 158, 11, 0.3)',
      borderColor: 'rgba(245, 158, 11, 1)',
      pointBackgroundColor: 'rgba(245, 158, 11, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(245, 158, 11, 1)',
      borderWidth: 2,
    });
  }

  const data = {
    labels,
    datasets,
  };

  const options = {
    scales: {
      r: {
        min: 0,
        max: 100,
        angleLines: {
          color: 'rgba(255, 255, 255, 0.3)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.3)'
        },
        pointLabels: {
          color: '#f8fafc',
          font: {
            size: 13,
            weight: 'bold' as const
          }
        },
        ticks: {
          display: false,
          stepSize: 20
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    },
    maintainAspectRatio: false
  };

  const rawImagePath = (playerImageMap as any)[`${player.team}-${player.name}`];
  const imagePath = rawImagePath ? `${import.meta.env.BASE_URL}${rawImagePath.replace(/^\//, '')}` : null;

  const rawImagePath2 = player2 ? (playerImageMap as any)[`${player2.team}-${player2.name}`] : null;
  const imagePath2 = rawImagePath2 ? `${import.meta.env.BASE_URL}${rawImagePath2.replace(/^\//, '')}` : null;

  
  const renderDetails = (p: any, colorHex: string) => {
    if (!p) return null;
    const isP = p.isPitcher;
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', border: `1px solid ${colorHex}40`, padding: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
        {targetArchetype && (
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${colorHex}`, marginBottom: '0px' }}>
            <div style={{ fontWeight: 'bold', color: colorHex, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎯 {t('radar.archetypeMatch')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {isP ? (
                (() => {
                  const totalW = (targetArchetype.velo + targetArchetype.junk + targetArchetype.acc) || 1;
                  const vW = targetArchetype.velo / totalW;
                  const jW = targetArchetype.junk / totalW;
                  const aW = targetArchetype.acc / totalW;
                  const velVal = p.stats.velocity || 0;
                  const jnkVal = p.stats.junk || 0;
                  const accVal = p.stats.accuracy || 0;
                  const score = Math.round((velVal * vW) + (jnkVal * jW) + (accVal * aW));
                  return (
                    <>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span>🔥 {t('radar.velo')} ({t('radar.target')}: {Math.round(vW*100)}%)</span>
                          <span>{(velVal * vW).toFixed(1)} / {Math.round(vW*100)}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                          <div style={{ width: `${Math.min(100, (velVal*vW) / (vW*100) * 100)}%`, height: '100%', background: '#ef4444', borderRadius: '3px' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span>🌪️ {t('radar.junk')} ({t('radar.target')}: {Math.round(jW*100)}%)</span>
                          <span>{(jnkVal * jW).toFixed(1)} / {Math.round(jW*100)}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                          <div style={{ width: `${Math.min(100, (jnkVal*jW) / (jW*100) * 100)}%`, height: '100%', background: '#3b82f6', borderRadius: '3px' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span>🎯 {t('radar.acc')} ({t('radar.target')}: {Math.round(aW*100)}%)</span>
                          <span>{(accVal * aW).toFixed(1)} / {Math.round(aW*100)}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                          <div style={{ width: `${Math.min(100, (accVal*aW) / (aW*100) * 100)}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '4px', textAlign: 'right', fontWeight: 'bold', color: '#f59e0b' }}>
                        {p._baseScore !== undefined ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', textAlign: 'left' }}>
                            <div style={{ color: 'var(--primary-accent)' }}>🎯 {t('radar.baseScore')}: {p._baseScore}</div>
                            {p._ageBonusNotes?.map((note: string, i: number) => (
                              <div key={`age-${i}`} style={{ color: note.includes('+') ? '#10b981' : note.includes('-') ? '#ef4444' : '#9ca3af' }}>👶 {t('radar.ageBonus')}: {note}</div>
                            ))}
                            {p._bonusNotes?.map((note: string, i: number) => (
                              <div key={`trait-${i}`} style={{ color: '#f59e0b' }}>✨ {t('radar.traitBonus')}: {note}</div>
                            ))}
                            <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
                              📈 {t('radar.adjScore')}: {p._modifiedScore?.toFixed(1)}
                            </div>
                          </div>
                        ) : (
                          `${t('radar.matchScore')}: ${score} / 100`
                        )}
                      </div>
                    </>
                  );
                })()
              ) : (
                (() => {
                  const totalW = (targetArchetype.off + targetArchetype.def + targetArchetype.spd) || 1;
                  const oW = targetArchetype.off / totalW;
                  const dW = targetArchetype.def / totalW;
                  const sW = targetArchetype.spd / totalW;
                  const offVal = ((p.stats.power || 0) + (p.stats.contact || 0)) / 2;
                  const defVal = ((p.stats.fielding || 0) + (p.stats.arm || 0)) / 2;
                  const spdVal = p.stats.speed || 0;
                  const score = Math.round((offVal * oW) + (defVal * dW) + (spdVal * sW));
                  return (
                    <>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span>💪 {t('radar.off')} ({t('radar.target')}: {Math.round(oW*100)}%)</span>
                          <span>{(offVal * oW).toFixed(1)} / {Math.round(oW*100)}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                          <div style={{ width: `${Math.min(100, (offVal*oW) / (oW*100) * 100)}%`, height: '100%', background: '#ef4444', borderRadius: '3px' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span>🧤 {t('radar.def')} ({t('radar.target')}: {Math.round(dW*100)}%)</span>
                          <span>{(defVal * dW).toFixed(1)} / {Math.round(dW*100)}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                          <div style={{ width: `${Math.min(100, (defVal*dW) / (dW*100) * 100)}%`, height: '100%', background: '#3b82f6', borderRadius: '3px' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span>👟 {t('radar.spd')} ({t('radar.target')}: {Math.round(sW*100)}%)</span>
                          <span>{(spdVal * sW).toFixed(1)} / {Math.round(sW*100)}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                          <div style={{ width: `${Math.min(100, (spdVal*sW) / (sW*100) * 100)}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '4px', textAlign: 'right', fontWeight: 'bold', color: '#f59e0b' }}>
                        {p._baseScore !== undefined ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', textAlign: 'left' }}>
                            <div style={{ color: 'var(--primary-accent)' }}>🎯 {t('radar.baseScore')}: {p._baseScore}</div>
                            {p._ageBonusNotes?.map((note: string, i: number) => (
                              <div key={`age-${i}`} style={{ color: note.includes('+') ? '#10b981' : note.includes('-') ? '#ef4444' : '#9ca3af' }}>👶 {t('radar.ageBonus')}: {note}</div>
                            ))}
                            {p._bonusNotes?.map((note: string, i: number) => (
                              <div key={`trait-${i}`} style={{ color: '#f59e0b' }}>✨ {t('radar.traitBonus')}: {note}</div>
                            ))}
                            <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
                              📈 {t('radar.adjScore')}: {p._modifiedScore?.toFixed(1)}
                            </div>
                          </div>
                        ) : (
                          `${t('radar.matchScore')}: ${score} / 100`
                        )}
                      </div>
                    </>
                  );
                })()
              )}
            </div>
          </div>
        )}

        <div className="player-details" style={{ marginTop: 0 }}>
          <div className="stat-row" style={{ alignItems: 'center' }}>
            <span className="stat-label">{t('info.position')}</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {renderPositionBadge(p.primaryPosition)}
              {p.secondaryPositions?.length > 0 && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ opacity: 0.5 }}>/</span>
                  {p.secondaryPositions.map((sp: string) => <span key={sp}>{renderPositionBadge(sp)}</span>)}
                </div>
              )}
            </div>
          </div>
          <div className="stat-row">
            <span className="stat-label">{t('info.age')} / {t('info.salary')}</span>
            <span>{p.age} / {p.salary}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">{t('info.bats')} / {t('info.throws')}</span>
            <span>{p.bats} / {p.throws}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">{t('info.chemistry')}</span>
            <span>{t(`chemistry.${p.chemistry}`) || p.chemistry}</span>
          </div>
          
          {isP && p.pitching && (
            <>
              <div className="stat-row">
                <span className="stat-label">{t('info.armAngle')}</span>
                <span>{p.pitching.armAngle}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">{t('info.pitches')}</span>
                <span>{p.pitching.pitches.join(', ')}</span>
              </div>
            </>
          )}

          {p.traits && p.traits.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <span className="stat-label" style={{ display: 'block', marginBottom: '12px' }}>{t('info.traits')}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {p.traits.map((trait: string, idx: number) => {
                  const traitsMap = traitsData as Record<string, string>;
                  const traitDesc = traitsMap[trait] || 'No description available';
                  return (
                    <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--secondary-accent)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                        {t(`traits.${trait}`) || trait}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {traitDesc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {/* Player 1 Details */}
        <div className="player-details" style={{ textAlign: 'center', flex: 1 }}>
          {imagePath && (
            <img 
              src={imagePath} 
              alt={player.name} 
              style={{ width: '100px', height: '100px', objectFit: 'contain', margin: '0 auto 12px', display: 'block', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} 
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'rgba(0, 91, 172, 1)' }}>{player.name}</h2>
            {player.rating && (
              <span className={`rating-badge rating-${player.rating.replace('+', 'plus').replace('-', 'minus')}`} style={{ fontSize: '1rem', padding: '2px 8px' }}>
                {player.rating}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--primary-color)', color: 'white', fontWeight: 600, fontSize: '0.75rem' }}>{player.team}</span>
          </div>
        </div>

        {/* Player 2 Details */}
        {player2 && (
          <div className="player-details" style={{ textAlign: 'center', flex: 1 }}>
            {imagePath2 && (
              <img 
                src={imagePath2} 
                alt={player2.name} 
                style={{ width: '100px', height: '100px', objectFit: 'contain', margin: '0 auto 12px', display: 'block', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} 
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'rgba(245, 158, 11, 1)' }}>{player2.name}</h2>
              {player2.rating && (
                <span className={`rating-badge rating-${player2.rating.replace('+', 'plus').replace('-', 'minus')}`} style={{ fontSize: '1rem', padding: '2px 8px' }}>
                  {player2.rating}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--primary-color)', color: 'white', fontWeight: 600, fontSize: '0.75rem' }}>{player2.team}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ height: '300px', width: '100%' }}>
        <Radar data={data} options={options} />
      </div>

      {/* Two Column Layout for Details */}
      <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
        {renderDetails(player, 'rgba(0, 91, 172, 1)')}
        {player2 && renderDetails(player2, 'rgba(245, 158, 11, 1)')}
      </div>
    </div>
  );
};

export default PlayerRadar;
