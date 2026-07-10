import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

const StatGuide: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const guides = [
    { label: t('guide.powerLabel'), desc: t('guide.powerDesc') },
    { label: t('guide.contactLabel'), desc: t('guide.contactDesc') },
    { label: t('guide.speedLabel'), desc: t('guide.speedDesc') },
    { label: t('guide.fieldingLabel'), desc: t('guide.fieldingDesc') },
    { label: t('guide.armLabel'), desc: t('guide.armDesc') },
    { label: t('guide.velocityLabel'), desc: t('guide.velocityDesc') },
    { label: t('guide.junkLabel'), desc: t('guide.junkDesc') },
    { label: t('guide.accuracyLabel'), desc: t('guide.accuracyDesc') }
  ];

  return (
    <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} color="rgba(255,255,255,0.7)" />
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'rgba(255,255,255,0.9)' }}>
            {t('guide.statTitle')}
          </h3>
        </div>
        {isOpen ? <ChevronUp size={18} color="rgba(255,255,255,0.5)" /> : <ChevronDown size={18} color="rgba(255,255,255,0.5)" />}
      </div>
      
      {isOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginTop: '16px' }}>
          {guides.map(g => (
            <div key={g.label} style={{ fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{g.label}</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', marginLeft: '8px' }}>{g.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatGuide;
