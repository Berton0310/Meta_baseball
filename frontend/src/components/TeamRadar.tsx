import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import type { TeamStat } from '../utils/teamStats';
import playersData from '../data/players.json';


interface TeamRadarProps {
  team: TeamStat | null;
}

const TeamRadar: React.FC<TeamRadarProps> = ({ team }) => {
  const { t } = useLanguage();

  if (!team) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{t('grid.selectTeamPrompt')}</div>;
  }

  const labels = [
    t('stats.power'),
    t('stats.contact'),
    t('stats.speed'),
    t('stats.fielding'),
    t('stats.arm'),
    t('stats.velocity'),
    t('stats.junk'),
    t('stats.accuracy')
  ];

  const values = [
    team.avgStats.power,
    team.avgStats.contact,
    team.avgStats.speed,
    team.avgStats.fielding,
    team.avgStats.arm,
    team.avgStats.velocity,
    team.avgStats.junk,
    team.avgStats.accuracy
  ];

  // Calculate true league average
  const leagueAvg = React.useMemo(() => {
    let pPow = 0, pCon = 0, pSpd = 0, pFld = 0, pArm = 0;
    let pVel = 0, pJnk = 0, pAcc = 0;
    let fCount = 0, pCount = 0;
    
    playersData.forEach((p: any) => {
      if (p.isPitcher) {
        pVel += p.stats.velocity || 0;
        pJnk += p.stats.junk || 0;
        pAcc += p.stats.accuracy || 0;
        pCount++;
      } else {
        pPow += p.stats.power || 0;
        pCon += p.stats.contact || 0;
        pSpd += p.stats.speed || 0;
        pFld += p.stats.fielding || 0;
        pArm += p.stats.arm || 0;
        fCount++;
      }
    });

    return [
      fCount ? Math.round(pPow / fCount) : 0,
      fCount ? Math.round(pCon / fCount) : 0,
      fCount ? Math.round(pSpd / fCount) : 0,
      fCount ? Math.round(pFld / fCount) : 0,
      fCount ? Math.round(pArm / fCount) : 0,
      pCount ? Math.round(pVel / pCount) : 0,
      pCount ? Math.round(pJnk / pCount) : 0,
      pCount ? Math.round(pAcc / pCount) : 0
    ];
  }, []);

  const radarData = labels.map((label, i) => ({
    subject: label,
    team: values[i],
    league: leagueAvg[i]
  }));

  const getChemColor = (chem: string) => {
    switch(chem) {
      case 'Crafty': return '#10b981'; 
      case 'Scholarly': return '#3b82f6'; 
      case 'Competitive': return '#ef4444'; 
      case 'Disciplined': return '#8b5cf6'; 
      case 'Spirited': return '#f59e0b'; 
      default: return '#6b7280'; 
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Team Header */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <img 
          src={`${import.meta.env.BASE_URL}logos/${team.team}.png`} 
          alt={team.team} 
          style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '8px' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <h2 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: 'white' }}>{team.team}</h2>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', fontSize: '0.85rem' }}>{team.conference}</span>
          <span style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', fontSize: '0.85rem' }}>{team.division}</span>
          {team.teamStrength && (
            <span style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(255, 165, 0, 0.2)', color: 'orange', border: '1px solid rgba(255, 165, 0, 0.5)', fontSize: '0.85rem' }}>
              ⭐ {t(`teamStrength.${team.teamStrength}`) || team.teamStrength}
            </span>
          )}
        </div>
      </div>

      {/* Radar Chart Container */}
      <div style={{ position: 'relative', width: '100%', minHeight: '300px', flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '100%', height: '300px', maxWidth: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#f8fafc', fontSize: 11, fontWeight: 'bold' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name={team.team} dataKey="team" stroke="rgba(56, 189, 248, 1)" fill="rgba(56, 189, 248, 1)" fillOpacity={0.4} strokeWidth={2} dot={{ r: 3, fill: 'rgba(56, 189, 248, 1)', stroke: '#fff', strokeWidth: 1 }} />
              <Radar name="League Avg" dataKey="league" stroke="rgba(160, 174, 192, 0.6)" fill="rgba(160, 174, 192, 1)" fillOpacity={0.2} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: 'rgba(160, 174, 192, 1)', stroke: '#fff', strokeWidth: 1 }} />
              <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chemistry Bonuses */}
      <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)' }}>
          {t('app.chemistryBonuses')}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Object.entries(team.chemistryCounts).sort((a,b) => b[1] - a[1]).map(([chem, count]) => {
            const tier = count >= 7 ? `${t('grid.tier')} 3` : count >= 5 ? `${t('grid.tier')} 2` : count >= 3 ? `${t('grid.tier')} 1` : t('grid.noTier');
            const isActive = count >= 3;
            
            return (
              <div key={chem} style={{ 
                padding: '6px 12px', 
                borderRadius: '6px', 
                background: isActive ? `${getChemColor(chem)}20` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isActive ? getChemColor(chem) : 'rgba(255,255,255,0.1)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isActive ? 1 : 0.5
              }}>
                <span style={{ fontWeight: 600, color: isActive ? getChemColor(chem) : '#fff' }}>{t(`chemistry.${chem}`)}</span>
                <span style={{ background: isActive ? getChemColor(chem) : 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem', color: isActive ? '#000' : '#fff' }}>
                  {count}
                </span>
                <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>{tier}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default TeamRadar;
