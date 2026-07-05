import React from 'react';
import { Radar } from 'react-chartjs-2';
import { useLanguage } from '../context/LanguageContext';
import traitsData from '../data/traits_info.json';
import playerImageMap from '../data/playerImageMap.json';


interface PlayerRadarProps {
  player: any;
}

const PlayerRadar: React.FC<PlayerRadarProps> = ({ player }) => {
  const { t } = useLanguage();

  if (!player) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Select a player to view stats</div>;
  }

  // Force usage to prevent esbuild from stripping it
  if (typeof traitsData === 'undefined') {
    console.error('traitsData is undefined!');
  }

  const isPitcher = player.isPitcher;

  const labels = ['POW', 'CON', 'SPD', 'FLD', 'ARM', 'VEL', 'JNK', 'ACC'];

  const dataValues = isPitcher
    ? [0, 0, 0, player.stats.fielding || 0, 0, player.stats.velocity || 0, player.stats.junk || 0, player.stats.accuracy || 0]
    : [player.stats.power || 0, player.stats.contact || 0, player.stats.speed || 0, player.stats.fielding || 0, player.stats.arm || 0, 0, 0, 0];

  const data = {
    labels,
    datasets: [
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
      },
    ],
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

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="player-details" style={{ textAlign: 'center' }}>
        {imagePath && (
          <img 
            src={imagePath} 
            alt={player.name} 
            style={{ width: '120px', height: '120px', objectFit: 'contain', margin: '0 auto 12px', display: 'block', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} 
          />
        )}
        <h2 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>{player.name}</h2>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', fontSize: '0.85rem' }}>{player.conference}</span>
          <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', fontSize: '0.85rem' }}>{player.division}</span>
          <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--primary-color)', color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>{player.team}</span>
          {player.teamStrength && (
            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 165, 0, 0.2)', color: 'orange', border: '1px solid rgba(255, 165, 0, 0.5)', fontSize: '0.85rem' }}>
              ⭐ {t(`teamStrength.${player.teamStrength}`) || player.teamStrength}
            </span>
          )}
        </div>
      </div>

      <div style={{ height: '300px', width: '100%' }}>
        <Radar data={data} options={options} />
      </div>
      

      <div className="player-details">
        <div className="stat-row">
          <span className="stat-label">{t('info.position')}</span>
          <span>{player.primaryPosition} {player.secondaryPositions?.length > 0 ? `/ ${player.secondaryPositions.join(', ')}` : ''}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">{t('info.age')} / {t('info.salary')}</span>
          <span>{player.age} / {player.salary}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">{t('info.bats')} / {t('info.throws')}</span>
          <span>{player.bats} / {player.throws}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">{t('info.chemistry')}</span>
          <span>{t(`chemistry.${player.chemistry}`) || player.chemistry}</span>
        </div>
        
        {isPitcher && player.pitching && (
          <>
            <div className="stat-row">
              <span className="stat-label">{t('info.armAngle')}</span>
              <span>{player.pitching.armAngle}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('info.pitches')}</span>
              <span>{player.pitching.pitches.join(', ')}</span>
            </div>
          </>
        )}

        {player.traits && player.traits.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <span className="stat-label" style={{ display: 'block', marginBottom: '12px' }}>{t('info.traits')}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {player.traits.map((trait: string, idx: number) => {
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

export default PlayerRadar;
