import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

const StatGuide: React.FC = () => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  const isZh = language === 'zh-TW';
  
  const guides = [
    { label: isZh ? '力量 (POW)' : 'Power (POW)', desc: isZh ? '擊球的飛行距離與全壘打能力。' : 'Hit distance and HR probability.' },
    { label: isZh ? '技巧 (CON)' : 'Contact (CON)', desc: isZh ? '擊球框大小，影響揮空的機率與擊球準確度。' : 'Reticle size, affects strikeout rate and hit accuracy.' },
    { label: isZh ? '跑速 (SPD)' : 'Speed (SPD)', desc: isZh ? '跑壘與在外野追球的移動速度。' : 'Base running and fielding movement speed.' },
    { label: isZh ? '守備 (FLD)' : 'Fielding (FLD)', desc: isZh ? '撲接、跳接的成功率，以及避免漏球失誤的能力。' : 'Dive/jump success rate, and ability to avoid errors.' },
    { label: isZh ? '臂力 (ARM)' : 'Arm (ARM)', desc: isZh ? '傳球的速度與準確度，對於外野長傳或阻殺非常重要。' : 'Throwing velocity and accuracy, crucial for outfield assists.' },
    { label: isZh ? '球速 (VEL)' : 'Velocity (VEL)', desc: isZh ? '投出的速球與變化球的絕對速度。' : 'Pitch velocity for fastballs and breaking balls.' },
    { label: isZh ? '變化 (JNK)' : 'Junk (JNK)', desc: isZh ? '變化球(曲球、滑球等)的位移軌跡與變化幅度。' : 'Movement and break of breaking pitches.' },
    { label: isZh ? '控球 (ACC)' : 'Accuracy (ACC)', desc: isZh ? '投球落點的準確度，越容易投在瞄準的位置。' : 'Pitch location accuracy, easier to hit corners.' }
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
            {isZh ? '屬性指南 (Stat Guide)' : 'Stat Guide'}
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
