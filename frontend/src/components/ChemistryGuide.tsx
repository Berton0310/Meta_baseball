import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Beaker, ChevronDown, ChevronUp } from 'lucide-react';

const ChemistryGuide: React.FC = () => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const isZh = language === 'zh-TW';

  return (
    <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Beaker size={18} color="rgba(255,255,255,0.7)" />
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'rgba(255,255,255,0.9)' }}>
            {isZh ? '化學反應指南 (Chemistry Guide)' : 'Chemistry Guide'}
          </h3>
        </div>
        {isOpen ? <ChevronUp size={18} color="rgba(255,255,255,0.5)" /> : <ChevronDown size={18} color="rgba(255,255,255,0.5)" />}
      </div>
      
      {isOpen && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
            {isZh 
              ? '⚠️ 注意：化學反應本身「不會直接提升基礎數值」。它的作用是「強化特定屬性的專屬技能 (Traits)」！\n當隊伍中擁有相同化學反應的球員達到指定人數時，擁有該屬性技能的球員，其技能發動效果將會被大幅強化：' 
              : '⚠️ Note: Chemistry does not directly boost base stats. It boosts the power of specific Traits!\nWhen a team has enough players with the same chemistry, it activates and boosts corresponding traits:'}
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px' }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>Tier 1:</span> {isZh ? '3人 (小幅提升)' : '3 Players (Small Boost)'}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px' }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>Tier 2:</span> {isZh ? '5人 (中幅提升)' : '5 Players (Medium Boost)'}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px' }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>Tier 3:</span> {isZh ? '7人 (大幅提升)' : '7 Players (Large Boost)'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></span>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem' }}>Crafty {isZh ? '(狡猾)' : ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }}></span>
              <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.85rem' }}>Scholarly {isZh ? '(學術)' : ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></span>
              <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.85rem' }}>Competitive {isZh ? '(競爭)' : ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6' }}></span>
              <span style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '0.85rem' }}>Disciplined {isZh ? '(紀律)' : ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></span>
              <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.85rem' }}>Spirited {isZh ? '(精神)' : ''}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChemistryGuide;
