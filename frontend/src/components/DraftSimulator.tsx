import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingCart, UserPlus, UserMinus, CheckCircle, Settings, Play, ArrowLeft, AlertTriangle, Scale, Target, Shield, Crosshair, DollarSign, Zap, Lightbulb, Activity } from 'lucide-react';
import { renderPositionBadge } from './PlayerGrid';

interface DraftSimulatorProps {
  players: any[];
}

const parseSalary = (s: string) => {
  if (!s) return 0;
  const clean = String(s).replace(/[^0-9.]/g, '');
  return parseFloat(clean) * 1000000 || 0;
};

const formatMoney = (val: number) => {
  return `$${(val / 1000000).toFixed(1)}M`;
};

const MAX_BUDGET = 175000000;

const WIZARD_PLANS = {
  planA: [
    { id: 'SP', weight: 10 }, { id: 'SP', weight: 10 }, { id: 'SP', weight: 10 }, { id: 'SP', weight: 8 },
    { id: 'CP', weight: 6 }, { id: 'RP', weight: 4 }, { id: 'RP', weight: 4 }, { id: 'RP', weight: 4 }, { id: 'RP', weight: 4 }, { id: 'CP', weight: 5 },
    { id: 'C', weight: 7 }, { id: '1B', weight: 8 }, { id: '2B', weight: 6 }, { id: '3B', weight: 6 }, { id: 'SS', weight: 9 },
    { id: 'LF', weight: 7 }, { id: 'CF', weight: 9 }, { id: 'RF', weight: 7 }, { id: 'DH', weight: 6 },
    { id: 'Utility_IF', weight: 3 }, { id: 'Utility_OF', weight: 3 }, { id: 'Backup_C', weight: 2 }
  ],
  planB: [
    { id: 'SP', weight: 10 }, { id: 'SP', weight: 10 }, { id: 'SP', weight: 10 }, { id: 'SP', weight: 8 },
    { id: 'CP', weight: 6 }, { id: 'RP', weight: 4 }, { id: 'RP', weight: 4 }, { id: 'RP', weight: 4 }, { id: 'RP', weight: 4 }, { id: 'RP', weight: 4 }, { id: 'CP', weight: 5 },
    { id: 'C', weight: 7 }, { id: '1B', weight: 8 }, { id: '2B', weight: 6 }, { id: '3B', weight: 6 }, { id: 'SS', weight: 9 },
    { id: 'LF', weight: 7 }, { id: 'CF', weight: 9 }, { id: 'RF', weight: 7 }, { id: 'DH', weight: 6 },
    { id: 'Super_Utility', weight: 4 }, { id: 'Backup_C', weight: 2 }
  ],
  planC: [
    { id: 'SP', weight: 10 }, { id: 'SP', weight: 10 }, { id: 'SP', weight: 10 }, { id: 'SP', weight: 8 },
    { id: 'CP', weight: 6 }, { id: 'RP', weight: 4 }, { id: 'RP', weight: 4 }, { id: 'RP', weight: 4 }, { id: 'RP', weight: 4 }, { id: 'RP', weight: 4 }, { id: 'RP', weight: 4 }, { id: 'CP', weight: 5 },
    { id: 'C', weight: 9 }, { id: '1B', weight: 9 }, { id: '2B', weight: 9 }, { id: '3B', weight: 9 }, { id: 'SS', weight: 12 },
    { id: 'LF', weight: 9 }, { id: 'CF', weight: 12 }, { id: 'RF', weight: 9 }, { id: 'DH', weight: 9 },
    { id: 'Backup_C', weight: 4 }
  ],
  planD: [
    { id: 'SP', weight: 14 }, { id: 'SP', weight: 14 }, { id: 'SP', weight: 12 }, { id: 'SP', weight: 10 },
    { id: 'CP', weight: 6 }, { id: 'RP', weight: 5 }, { id: 'RP', weight: 5 }, { id: 'RP', weight: 4 }, { id: 'RP', weight: 4 },
    { id: 'C', weight: 7 }, { id: '1B', weight: 8 }, { id: '2B', weight: 6 }, { id: '3B', weight: 6 }, { id: 'SS', weight: 9 },
    { id: 'LF', weight: 7 }, { id: 'CF', weight: 9 }, { id: 'RF', weight: 7 }, { id: 'DH', weight: 6 },
    { id: 'Super_Utility', weight: 5 }, { id: 'Utility_IF', weight: 4 }, { id: 'Utility_OF', weight: 4 }, { id: 'Backup_C', weight: 2 }
  ]
};

const DEFAULT_ARCHETYPES: Record<string, any> = {
  'C': { off: 20, def: 80, spd: 0 },
  '1B': { off: 85, def: 15, spd: 0 },
  '2B': { off: 40, def: 40, spd: 20 },
  '3B': { off: 60, def: 40, spd: 0 },
  'SS': { off: 30, def: 50, spd: 20 },
  'LF': { off: 70, def: 20, spd: 10 },
  'CF': { off: 30, def: 40, spd: 30 },
  'RF': { off: 60, def: 30, spd: 10 },
  'DH': { off: 100, def: 0, spd: 0 },
  'Utility_IF': { off: 30, def: 50, spd: 20 },
  'Utility_OF': { off: 40, def: 30, spd: 30 },
  'Super_Utility': { off: 40, def: 40, spd: 20 },
  'Backup_C': { off: 10, def: 90, spd: 0 },
  'SP': { velo: 40, junk: 30, acc: 30 },
  'RP': { velo: 50, junk: 30, acc: 20 },
  'CP': { velo: 60, junk: 40, acc: 0 }
};
const ROSTER_LIMITS: Record<string, { min: number, defaultWeight: number }> = {
  'SP': { min: 4, defaultWeight: 10 },
  'RP': { min: 0, defaultWeight: 4 },
  'CP': { min: 1, defaultWeight: 5 },
  'C': { min: 1, defaultWeight: 7 },
  '1B': { min: 1, defaultWeight: 8 },
  '2B': { min: 1, defaultWeight: 6 },
  '3B': { min: 1, defaultWeight: 6 },
  'SS': { min: 1, defaultWeight: 9 },
  'LF': { min: 1, defaultWeight: 7 },
  'CF': { min: 1, defaultWeight: 9 },
  'RF': { min: 1, defaultWeight: 7 },
  'DH': { min: 0, defaultWeight: 6 },
  'Utility_IF': { min: 0, defaultWeight: 3 },
  'Utility_OF': { min: 0, defaultWeight: 3 },
  'Super_Utility': { min: 0, defaultWeight: 4 },
  'Backup_C': { min: 1, defaultWeight: 2 }
};

const PITCHER_POS = ['SP', 'RP', 'CP'];
const BATTER_POS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'Utility_IF', 'Utility_OF', 'Super_Utility', 'Backup_C'];
const DraftSimulator: React.FC<DraftSimulatorProps> = ({ players }) => {
  const { t } = useLanguage();
  const [draftedPlayers, setDraftedPlayers] = useState<any[]>([]);
  const [rosterPlan, setRosterPlan] = useState<'planA' | 'planB' | 'planC' | 'planD'>('planA');
  const [customArchetypes, setCustomArchetypes] = useState<Record<number, any>>({});
  const [archetypeFilter, setArchetypeFilter] = useState<'all' | 'pitchers' | 'hitters'>('all');
  const [budgetFilter, setBudgetFilter] = useState<'all' | 'pitchers' | 'hitters'>('all');
  const [pitcherBudgetCap, setPitcherBudgetCap] = useState<number>(0);
  
  const [setupStep, setSetupStep] = useState<1|2|3>(1);
  
  const [targetPayroll, setTargetPayroll] = useState<number>(145000000);
  const [wizardPhase, setWizardPhase] = useState<'setup' | 'drafting'>('setup');
  
  const [customRosterCounts, setCustomRosterCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const sequence = WIZARD_PLANS[rosterPlan];
    const counts: Record<string, number> = {};
    sequence.forEach(s => {
      counts[s.id] = (counts[s.id] || 0) + 1;
    });
    setCustomRosterCounts(counts);
  }, [rosterPlan]);

  const wizardSequence = useMemo(() => {
    const order = [...PITCHER_POS, ...BATTER_POS];
    const seq: { id: string, weight: number }[] = [];
    for (const pos of order) {
      const count = customRosterCounts[pos] || 0;
      for (let i = 0; i < count; i++) {
        seq.push({ id: pos, weight: ROSTER_LIMITS[pos]?.defaultWeight || 5 });
      }
    }
    return seq;
  }, [customRosterCounts]);
  const [customBudgets, setCustomBudgets] = useState<number[]>([]);

  const recommendedPayroll = useMemo(() => {
    let base = 140000000;
    
    if (rosterPlan === 'planC') base -= 5000000;
    if (rosterPlan === 'planD') base += 10000000;
    return base;
  }, [rosterPlan]);

  useEffect(() => {
    if (wizardPhase === 'setup' && wizardSequence.length > 0) {
      initializeBudgets();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardSequence, targetPayroll]);

  useEffect(() => {
    setCustomArchetypes(prev => {
      const next = { ...prev };
      wizardSequence.forEach((step, idx) => {
        if (!next[idx]) {
          const isPitcher = ['SP', 'RP', 'CP'].includes(step.id);
          next[idx] = isPitcher ? { velo: 34, junk: 33, acc: 33 } : { off: 34, def: 33, spd: 33 };
        }
      });
      return next;
    });
  }, [wizardSequence]);

  const handleArchetypeChange = (idx: number, type: 'pitcher' | 'hitter', key: string, newValue: number) => {
    setCustomArchetypes(prev => {
      const current = prev[idx] || (type === 'pitcher' ? { velo: 34, junk: 33, acc: 33 } : { off: 34, def: 33, spd: 33 });
      let val = Math.max(0, Math.min(100, newValue));
      const delta = val - current[key];
      if (delta === 0) return prev;

      const keys = type === 'pitcher' ? ['velo', 'junk', 'acc'] : ['off', 'def', 'spd'];
      const others = keys.filter(k => k !== key);
      const sumOthers = current[others[0]] + current[others[1]];

      let o1 = 0, o2 = 0;
      if (sumOthers === 0) {
        o1 = -delta / 2;
        o2 = -delta / 2;
      } else {
        o1 = current[others[0]] - delta * (current[others[0]] / sumOthers);
        o2 = current[others[1]] - delta * (current[others[1]] / sumOthers);
      }

      o1 = Math.round(o1);
      o2 = 100 - val - o1;

      if (o1 < 0) {
        o1 = 0;
        o2 = 100 - val;
      } else if (o2 < 0) {
        o2 = 0;
        o1 = 100 - val;
      }

      return {
        ...prev,
        [idx]: {
          ...current,
          [key]: val,
          [others[0]]: o1,
          [others[1]]: o2
        }
      };
    });
  };

  const initializeBudgets = () => {
    let totalWeight = 0;
    const posCounts: Record<string, number> = {};

    const weights = wizardSequence.map(step => {
      const pos = step.id;
      posCounts[pos] = (posCounts[pos] || 0) + 1;
      const depthIndex = posCounts[pos];

      let w = step.weight;
      
      if (['SP'].includes(pos)) {
        if (depthIndex === 1) w = 15;
        else if (depthIndex === 2) w = 10;
        else if (depthIndex === 3) w = 6;
        else w = 3;
      } else if (['RP', 'CP'].includes(pos)) {
        if (depthIndex === 1) w = 6;
        else if (depthIndex === 2) w = 4;
        else w = 2;
      } else if (['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'].includes(pos)) {
        w = depthIndex === 1 ? w : 3;
      } else {
        w = 2;
      }

      totalWeight += w;
      return w;
    });
    
    const budgets = weights.map(w => Math.round((w / totalWeight) * targetPayroll));
    const sum = budgets.reduce((a, b) => a + b, 0);
    const diff = targetPayroll - sum;
    if (diff !== 0 && budgets.length > 0) {
      budgets[0] += diff;
    }
    setCustomBudgets(budgets);
    
    // Set initial pitcher budget cap based on distribution
    let pSum = 0;
    budgets.forEach((amt, i) => {
      if (PITCHER_POS.includes(wizardSequence[i]?.id)) pSum += amt;
    });
    setPitcherBudgetCap(pSum);
  };

  const handleMacroBudgetChange = (newPitcherCap: number) => {
    setPitcherBudgetCap(newPitcherCap);
    const newHitterCap = targetPayroll - newPitcherCap;
    
    setCustomBudgets(prev => {
      const next = [...prev];
      let pSum = 0;
      let hSum = 0;
      for (let i = 0; i < next.length; i++) {
        if (PITCHER_POS.includes(wizardSequence[i]?.id)) pSum += next[i];
        else hSum += next[i];
      }
      pSum = pSum || 1;
      hSum = hSum || 1;

      let adjustedPSum = 0;
      let adjustedHSum = 0;
      let lastPIdx = -1;
      let lastHIdx = -1;

      for (let i = 0; i < next.length; i++) {
        const isPitcher = PITCHER_POS.includes(wizardSequence[i]?.id);
        if (isPitcher) {
          next[i] = Math.max(500000, Math.round(prev[i] * (newPitcherCap / pSum)));
          adjustedPSum += next[i];
          lastPIdx = i;
        } else {
          next[i] = Math.max(500000, Math.round(prev[i] * (newHitterCap / hSum)));
          adjustedHSum += next[i];
          lastHIdx = i;
        }
      }

      if (lastPIdx !== -1) {
        next[lastPIdx] += (newPitcherCap - adjustedPSum);
        next[lastPIdx] = Math.max(500000, next[lastPIdx]);
      }
      if (lastHIdx !== -1) {
        next[lastHIdx] += (newHitterCap - adjustedHSum);
        next[lastHIdx] = Math.max(500000, next[lastHIdx]);
      }

      return next;
    });
  };

  const handleBudgetChange = (idx: number, newValue: number) => {
    setCustomBudgets(prev => {
      const isPitcherPool = PITCHER_POS.includes(wizardSequence[idx]?.id);
      const poolCap = isPitcherPool ? pitcherBudgetCap : (targetPayroll - pitcherBudgetCap);
      
      let val = Math.max(500000, Math.min(poolCap, newValue));
      const delta = val - prev[idx];
      if (delta === 0) return prev;

      const next = [...prev];
      let remainingDelta = -delta;
      
      let others = prev.map((v, i) => ({ i, v, isP: PITCHER_POS.includes(wizardSequence[i]?.id) }))
                       .filter(item => item.i !== idx && item.isP === isPitcherPool);
                       
      const totalAvailableToSubtract = others.reduce((sum, item) => sum + Math.max(0, item.v - 500000), 0);
      
      if (remainingDelta < 0 && Math.abs(remainingDelta) > totalAvailableToSubtract) {
        val = prev[idx] + totalAvailableToSubtract;
        remainingDelta = -totalAvailableToSubtract;
      }

      next[idx] = val;
      let sumOthers = others.reduce((sum, item) => sum + item.v, 0);
      
      if (sumOthers > 0) {
        for (let j = 0; j < others.length; j++) {
          const item = others[j];
          let change = remainingDelta * (item.v / sumOthers);
          next[item.i] += change;
        }
      }

      let adjustedSum = 0;
      let maxIdx = -1;
      let maxVal = -1;
      
      // We only adjust rounding errors for the active pool
      for (let i = 0; i < next.length; i++) {
        const isP = PITCHER_POS.includes(wizardSequence[i]?.id);
        if (isP === isPitcherPool) {
          if (i !== idx) {
            next[i] = Math.max(500000, Math.round(next[i]));
          }
          adjustedSum += next[i];
          if (i !== idx && next[i] > maxVal) {
            maxVal = next[i];
            maxIdx = i;
          }
        }
      }
      
      const roundingDiff = poolCap - adjustedSum;
      if (roundingDiff !== 0 && maxIdx !== -1) {
        next[maxIdx] += roundingDiff;
        next[maxIdx] = Math.max(500000, next[maxIdx]);
      }
      
      // Final sanity check sum
      const finalSum = next.filter((_, i) => PITCHER_POS.includes(wizardSequence[i]?.id) === isPitcherPool).reduce((a,b)=>a+b,0);
      if (finalSum !== poolCap && maxIdx !== -1) {
         next[maxIdx] += (poolCap - finalSum);
      }

      return next;
    });
  };

  const totalAllocated = customBudgets.reduce((a, b) => a + b, 0);
  
  const currentSpent = useMemo(() => {
    return draftedPlayers.reduce((sum, p) => sum + parseSalary(p.salary), 0);
  }, [draftedPlayers]);
  
  const remainingBudget = MAX_BUDGET - currentSpent;
  
  const availablePlayers = useMemo(() => {
    const draftedNames = new Set(draftedPlayers.map(p => p.name));
    return players.filter(p => !draftedNames.has(p.name));
  }, [players, draftedPlayers]);

  const handleDraft = (player: any) => {
    if (draftedPlayers.length >= 22) {
      alert(t('draft.rosterFull'));
      return;
    }
    const cost = parseSalary(player.salary);
    if (currentSpent + cost > MAX_BUDGET) {
      alert(t('draft.budgetExceeded'));
      return;
    }
    setDraftedPlayers([...draftedPlayers, player]);
  };

  const handleRelease = (player: any) => {
    setDraftedPlayers(draftedPlayers.filter(p => p.name !== player.name));
  };

  const currentStepIndex = draftedPlayers.length;
  const currentStep = wizardSequence[currentStepIndex];
  
  const currentSuggestedBudget = useMemo(() => {
    if (!currentStep || customBudgets.length === 0) return 0;
    const slotBudget = customBudgets[currentStepIndex] || 0;
    let expectedSpent = 0;
    for (let i = 0; i < currentStepIndex; i++) {
      expectedSpent += customBudgets[i] || 0;
    }
    const rollover = expectedSpent - currentSpent;
    return slotBudget + rollover;
  }, [currentStepIndex, currentStep, customBudgets, currentSpent]);

  const wizardCandidates = useMemo(() => {
    if (!currentStep) return [];
    
    const isValidForStep = (p: any, stepId: string) => {
      const pPos = p.primaryPosition;
      const sec = p.secondaryPositions || [];
      const allPos = [pPos, ...sec];
      
      if (stepId === 'SP') return pPos === 'SP' || pPos === 'SP/RP';
      if (stepId === 'RP') return pPos === 'RP' || pPos === 'SP/RP';
      if (stepId === 'CP') return pPos === 'CP' || pPos === 'RP';
      if (stepId === 'C' || stepId === 'Backup_C') return allPos.includes('C');
      if (stepId === 'Utility_IF') return allPos.includes('SS') || allPos.includes('2B') || allPos.includes('3B');
      if (stepId === 'Utility_OF') return allPos.includes('LF') || allPos.includes('CF') || allPos.includes('RF');
      if (stepId === 'Super_Utility') return sec.length >= 2;
      if (stepId === 'DH') return !p.isPitcher;
      return allPos.includes(stepId);
    };

    return availablePlayers.filter(p => {
      if (!isValidForStep(p, currentStep.id)) return false;
      const cost = parseSalary(p.salary);
      if (cost > remainingBudget) return false;
      return true;
    }).map(p => {
      const cost = parseSalary(p.salary) || 1000000;
      let baseScore = 0;
      
      if (p.isPitcher) {
        const w = customArchetypes[currentStepIndex] || { velo: 33, junk: 33, acc: 34 };
        const totalW = (w.velo + w.junk + w.acc) || 1;
        const vW = w.velo / totalW;
        const jW = w.junk / totalW;
        const aW = w.acc / totalW;
        baseScore = (p.stats.velocity * vW) + (p.stats.junk * jW) + (p.stats.accuracy * aW);
      } else {
        const w = customArchetypes[currentStepIndex] || { off: 33, def: 33, spd: 34 };
        const totalW = (w.off + w.def + w.spd) || 1;
        const oW = w.off / totalW;
        const dW = w.def / totalW;
        const sW = w.spd / totalW;
        
        const offScore = ((p.stats.power || 0) + (p.stats.contact || 0)) / 2;
        const defScore = ((p.stats.fielding || 0) + (p.stats.arm || 0)) / 2;
        const spdScore = p.stats.speed || 0;
        
        baseScore = (offScore * oW) + (defScore * dW) + (spdScore * sW);
      }
      
      let modifiedScore = baseScore;
      const traits = p.traits || [];
      let bonusNotes = [];
      let ageBonusNotes = [];
      
      let ageMod = 1.0;
      if (p.age) {
        if (p.age <= 22) {
          ageMod = 1.30;
          ageBonusNotes.push(`+30% ${t('draft.ageRookie')}`);
        } else if (p.age >= 23 && p.age <= 28) {
          ageMod = 1.10;
          ageBonusNotes.push(`+10% ${t('draft.agePrime')}`);
        } else if (p.age >= 34) {
          const isLateBench = currentStepIndex >= 18;
          if (isLateBench && cost <= 3000000) {
            ageBonusNotes.push(`No Penalty (Cheap Vet)`);
          } else {
            ageMod = 0.80;
            ageBonusNotes.push(`-20% ${t('draft.ageAging')}`);
          }
        }
      }
      modifiedScore *= ageMod;

      // Secondary Position (Utility) Bonus
      if (!p.isPitcher && p.secondaryPositions && p.secondaryPositions.length > 0) {
        modifiedScore *= 1.10;
        bonusNotes.push('+10% Utility');
      }

      if (rosterPlan === 'planC' && !p.isPitcher) {
        if (traits.includes('Durable')) {
          modifiedScore *= 1.20;
          bonusNotes.push('+20% Durable');
        }
        if (traits.includes('Injury Prone')) {
          modifiedScore *= 0.70;
          bonusNotes.push('-30% Injury Prone');
        }
      }
      
      if (rosterPlan === 'planD') {
        if (currentStep.id === 'SP' && traits.includes('Workhorse')) {
          modifiedScore *= 1.20;
          bonusNotes.push('+20% Workhorse');
        }
        if (!p.isPitcher && traits.some((tr: string) => tr.includes('Two Way'))) {
          modifiedScore *= 1.30;
          bonusNotes.push('+30% Two Way');
        }
      }

      // Expected Standards (期望標準) & Surplus Value Logic
      const safeTargetBudget = Math.max(currentSuggestedBudget, 1000000);
      const K_Factor = 30000000 / safeTargetBudget;
      const savingsInMillions = (currentSuggestedBudget - cost) / 1000000;
      
      // Luxury Tax Penalty: If a player exceeds the slot's budget, the penalty is 3x harsher.
      const savingsBonus = savingsInMillions >= 0 
        ? savingsInMillions * K_Factor 
        : savingsInMillions * K_Factor * 3;
      
      const cpVal = modifiedScore + savingsBonus;

      return { 
        ...p, 
        _cpValue: cpVal, 
        _bonusNotes: bonusNotes,
        _ageBonusNotes: ageBonusNotes,
        _baseScore: Math.round(baseScore),
        _modifiedScore: modifiedScore,
        _savingsBonus: savingsBonus,
        _kFactor: K_Factor
      };
    }).sort((a, b) => b._cpValue - a._cpValue);
  }, [availablePlayers, currentStep, remainingBudget, rosterPlan, currentStepIndex, t, customArchetypes, customBudgets]);

  const SelectionCard = ({ active, onClick, icon, title }: { active: boolean, onClick: () => void, icon: React.ReactNode, title: string }) => (
    <div 
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: active ? 'var(--primary-color)' : 'rgba(0,0,0,0.3)',
        border: `2px solid ${active ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        color: active ? '#fff' : 'var(--text-muted)'
      }}
    >
      {icon}
      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>{title}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Bar */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ShoppingCart size={32} color="var(--primary-accent)" />
          <div>
            <h2 style={{ margin: 0 }}>{t('draft.title')}</h2>
            <div style={{ color: 'var(--text-muted)' }}>{draftedPlayers.length} / 22 Players</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '32px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>球團總預算</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatMoney(MAX_BUDGET)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {wizardPhase === 'setup' ? t('draft.targetPayroll') : '目前團隊薪資'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {formatMoney(wizardPhase === 'setup' ? targetPayroll : currentSpent)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('draft.pdoReserve')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {formatMoney(MAX_BUDGET - (wizardPhase === 'setup' ? targetPayroll : currentSpent))}
            </div>
          </div>
        </div>
      </div>

      {(rosterPlan === 'planC' || rosterPlan === 'planD') && (
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', color: '#fca5a5', fontWeight: 'bold' }}>
          <AlertTriangle size={24} color="#ef4444" />
          {rosterPlan === 'planC' ? t('draft.warningPlanC') : t('draft.warningPlanD')}
        </div>
      )}

      {wizardPhase === 'drafting' && (
        <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            onClick={() => setWizardPhase('setup')} 
            style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} /> {t('draft.returnKeepRoster')}
          </button>
          
          <button 
            onClick={() => { setDraftedPlayers([]); setWizardPhase('setup'); }} 
            style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.2)', border: 'none', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            <Settings size={16} /> {t('draft.returnClearRoster')}
          </button>
          <div style={{ flex: 1 }} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Left Panel */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {wizardPhase === 'setup' ? (
            // WIZARD LOBBY SETUP
            <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-accent)', fontSize: '1.5rem' }}>
                  <Settings size={28} /> {t('draft.setupPhase')} - Step {setupStep} of 3
                </h3>
              </div>

              {setupStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '400px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ margin: '0 0 16px 0' }}>1. 建立名單配置 (Roster Blueprint)</h4>
                    <select className="filter-select" style={{ padding: '12px 16px', fontSize: '1.1rem', width: '100%', marginBottom: '16px' }} value={rosterPlan} onChange={e => {
                      setRosterPlan(e.target.value as any);
                      if(draftedPlayers.length > 0 && window.confirm('Changing blueprint will clear your roster. Proceed?')) {
                        setDraftedPlayers([]);
                      }
                    }}>
                      <option value="planA">{t('draft.planA')} - 10 Pitchers / 12 Batters</option>
                      <option value="planB">{t('draft.planB')} - 11 Pitchers / 11 Batters</option>
                      <option value="planC">{t('draft.planC')} - 12 Pitchers / 10 Batters</option>
                      <option value="planD">{t('draft.planD')} - 9 Pitchers / 13 Batters</option>
                    </select>
                    
                    {/* Custom Counters */}
                    {Object.keys(customRosterCounts).length > 0 && (() => {
                      const targetP = rosterPlan === 'planA' ? 10 : rosterPlan === 'planB' ? 11 : rosterPlan === 'planC' ? 12 : 9;
                      const targetB = 22 - targetP;
                      const currentP = PITCHER_POS.reduce((sum, pos) => sum + (customRosterCounts[pos] || 0), 0);
                      const currentB = BATTER_POS.reduce((sum, pos) => sum + (customRosterCounts[pos] || 0), 0);
                      
                      const handleCountChange = (pos: string, delta: number) => {
                        setCustomRosterCounts(prev => {
                          const current = prev[pos] || 0;
                          const next = current + delta;
                          const min = ROSTER_LIMITS[pos]?.min || 0;
                          if (next < min) return prev;
                          return { ...prev, [pos]: next };
                        });
                      };

                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                          {/* Pitchers Column */}
                          <div>
                            <h5 style={{ margin: '0 0 12px 0', color: currentP === targetP ? '#10b981' : '#ef4444' }}>
                              Pitchers ({currentP} / {targetP})
                            </h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {PITCHER_POS.map(pos => (
                                <div key={pos} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '4px' }}>
                                  <span>{t(`draft.pos_${pos}`)}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button onClick={() => handleCountChange(pos, -1)} disabled={(customRosterCounts[pos] || 0) <= (ROSTER_LIMITS[pos]?.min || 0)} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#ef4444', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                    <span style={{ width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{customRosterCounts[pos] || 0}</span>
                                    <button onClick={() => handleCountChange(pos, 1)} style={{ background: 'rgba(16,185,129,0.2)', border: 'none', color: '#10b981', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Batters Column */}
                          <div>
                            <h5 style={{ margin: '0 0 12px 0', color: currentB === targetB ? '#10b981' : '#ef4444' }}>
                              Batters ({currentB} / {targetB})
                            </h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '8px' }}>
                              {BATTER_POS.map(pos => (
                                <div key={pos} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '4px' }}>
                                  <span>{t(`draft.pos_${pos}`)}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button onClick={() => handleCountChange(pos, -1)} disabled={(customRosterCounts[pos] || 0) <= (ROSTER_LIMITS[pos]?.min || 0)} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#ef4444', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                    <span style={{ width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{customRosterCounts[pos] || 0}</span>
                                    <button onClick={() => handleCountChange(pos, 1)} style={{ background: 'rgba(16,185,129,0.2)', border: 'none', color: '#10b981', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {(() => {
                      const targetP = rosterPlan === 'planA' ? 10 : rosterPlan === 'planB' ? 11 : rosterPlan === 'planC' ? 12 : 9;
                      const targetB = 22 - targetP;
                      const currentP = PITCHER_POS.reduce((sum, pos) => sum + (customRosterCounts[pos] || 0), 0);
                      const currentB = BATTER_POS.reduce((sum, pos) => sum + (customRosterCounts[pos] || 0), 0);
                      const isValid = currentP === targetP && currentB === targetB;
                      
                      return (
                        <button 
                          onClick={() => setSetupStep(2)} 
                          className="btn-primary" 
                          disabled={!isValid}
                          style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', opacity: isValid ? 1 : 0.5 }}
                        >
                          {isValid ? '下一步：自訂戰術版' : '請確認名單總數'} <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              )}

              {setupStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '400px' }}>
                  {/* Custom Positional Archetypes Editor */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', flex: 1, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        2. {t('draft.posArchetypes')}
                      </h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setArchetypeFilter('all')} style={{ padding: '6px 12px', fontSize: '0.8rem', background: archetypeFilter === 'all' ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>全部</button>
                        <button onClick={() => setArchetypeFilter('pitchers')} style={{ padding: '6px 12px', fontSize: '0.8rem', background: archetypeFilter === 'pitchers' ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>投手</button>
                        <button onClick={() => setArchetypeFilter('hitters')} style={{ padding: '6px 12px', fontSize: '0.8rem', background: archetypeFilter === 'hitters' ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>野手</button>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {wizardSequence.map((step, idx) => {
                        const isPitcher = ['SP', 'RP', 'CP'].includes(step.id);
                        if (archetypeFilter === 'pitchers' && !isPitcher) return null;
                        if (archetypeFilter === 'hitters' && isPitcher) return null;
                        
                        const w = customArchetypes[idx] || (isPitcher ? { velo: 34, junk: 33, acc: 33 } : { off: 34, def: 33, spd: 33 });
                        
                        return (
                          <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px', fontSize: '1rem' }}>{idx + 1}. {t(`draft.pos_${step.id}`)}</div>
                            {isPitcher ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* Velo Slider */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <label style={{ width: '40px', fontSize: '0.75rem', color: '#9ca3af' }}>{t('draft.archVelo')}</label>
                                  <input type="range" min="0" max="100" value={w.velo} onChange={e => handleArchetypeChange(idx, 'pitcher', 'velo', Number(e.target.value))} style={{ flex: 1, cursor: 'pointer', accentColor: '#ef4444' }} />
                                  <span style={{ width: '24px', textAlign: 'right', color: '#ef4444', fontWeight: 'bold' }}>{w.velo}</span>
                                </div>
                                {/* Junk Slider */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <label style={{ width: '40px', fontSize: '0.75rem', color: '#9ca3af' }}>{t('draft.archJunk')}</label>
                                  <input type="range" min="0" max="100" value={w.junk} onChange={e => handleArchetypeChange(idx, 'pitcher', 'junk', Number(e.target.value))} style={{ flex: 1, cursor: 'pointer', accentColor: '#f59e0b' }} />
                                  <span style={{ width: '24px', textAlign: 'right', color: '#f59e0b', fontWeight: 'bold' }}>{w.junk}</span>
                                </div>
                                {/* Acc Slider */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <label style={{ width: '40px', fontSize: '0.75rem', color: '#9ca3af' }}>{t('draft.archAcc')}</label>
                                  <input type="range" min="0" max="100" value={w.acc} onChange={e => handleArchetypeChange(idx, 'pitcher', 'acc', Number(e.target.value))} style={{ flex: 1, cursor: 'pointer', accentColor: '#10b981' }} />
                                  <span style={{ width: '24px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>{w.acc}</span>
                                </div>
                                {/* Progress Bar */}
                                <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                                  <div style={{ width: `${(w.velo / ((w.velo + w.junk + w.acc) || 1)) * 100}%`, background: '#ef4444' }} title="Velo %" />
                                  <div style={{ width: `${(w.junk / ((w.velo + w.junk + w.acc) || 1)) * 100}%`, background: '#f59e0b' }} title="Junk %" />
                                  <div style={{ width: `${(w.acc / ((w.velo + w.junk + w.acc) || 1)) * 100}%`, background: '#10b981' }} title="Acc %" />
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* Off Slider */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <label style={{ width: '40px', fontSize: '0.75rem', color: '#9ca3af' }}>{t('draft.archOff')}</label>
                                  <input type="range" min="0" max="100" value={w.off} onChange={e => handleArchetypeChange(idx, 'hitter', 'off', Number(e.target.value))} style={{ flex: 1, cursor: 'pointer', accentColor: '#ef4444' }} />
                                  <span style={{ width: '24px', textAlign: 'right', color: '#ef4444', fontWeight: 'bold' }}>{w.off}</span>
                                </div>
                                {/* Def Slider */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <label style={{ width: '40px', fontSize: '0.75rem', color: '#9ca3af' }}>{t('draft.archDef')}</label>
                                  <input type="range" min="0" max="100" value={w.def} onChange={e => handleArchetypeChange(idx, 'hitter', 'def', Number(e.target.value))} style={{ flex: 1, cursor: 'pointer', accentColor: '#3b82f6' }} />
                                  <span style={{ width: '24px', textAlign: 'right', color: '#3b82f6', fontWeight: 'bold' }}>{w.def}</span>
                                </div>
                                {/* Spd Slider */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <label style={{ width: '40px', fontSize: '0.75rem', color: '#9ca3af' }}>{t('draft.archSpd')}</label>
                                  <input type="range" min="0" max="100" value={w.spd} onChange={e => handleArchetypeChange(idx, 'hitter', 'spd', Number(e.target.value))} style={{ flex: 1, cursor: 'pointer', accentColor: '#10b981' }} />
                                  <span style={{ width: '24px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>{w.spd}</span>
                                </div>
                                {/* Progress Bar */}
                                <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                                  <div style={{ width: `${(w.off / ((w.off + w.def + w.spd) || 1)) * 100}%`, background: '#ef4444' }} title="Offense %" />
                                  <div style={{ width: `${(w.def / ((w.off + w.def + w.spd) || 1)) * 100}%`, background: '#3b82f6' }} title="Defense %" />
                                  <div style={{ width: `${(w.spd / ((w.off + w.def + w.spd) || 1)) * 100}%`, background: '#10b981' }} title="Speed %" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button onClick={() => setSetupStep(1)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <ArrowLeft size={16} /> 上一步
                    </button>
                    <button onClick={() => setSetupStep(3)} className="btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      下一步：預算分配 <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                  </div>
                </div>
              )}

              {setupStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '400px' }}>
                  
                  {/* Target Payroll Slider */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={20} /> 3. {t('draft.targetPayroll')} ({formatMoney(targetPayroll)})
                      </h4>
                      {/* Recommended Budget Button */}
                      {targetPayroll !== recommendedPayroll && (
                        <button 
                          onClick={() => setTargetPayroll(recommendedPayroll)}
                          style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Lightbulb size={14} /> Recommended: {formatMoney(recommendedPayroll)}
                        </button>
                      )}
                    </div>
                    <input 
                      type="range" 
                      min="100000000" 
                      max="175000000" 
                      step="1000000" 
                      value={targetPayroll} 
                      onChange={(e) => setTargetPayroll(parseInt(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer', marginBottom: '12px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span>$100.0M</span>
                      <span>$175.0M</span>
                    </div>
                    <div style={{ marginTop: '16px', background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #f59e0b', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                      <strong>{t('draft.pdoReserve')} ({formatMoney(MAX_BUDGET - targetPayroll)}):</strong> {t('draft.pdoReserveDesc')}
                    </div>
                  </div>

                  {/* GM Philosophy Section / Macro Budget Slider */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {(() => {
                      const hitterTotal = targetPayroll - pitcherBudgetCap;
                      const sortedBudgets = [...customBudgets].sort((a, b) => b - a);
                      const top5Total = sortedBudgets.slice(0, 5).reduce((a, b) => a + b, 0);
                      const top5Pct = (top5Total / targetPayroll) * 100;
                      
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>大戰略：投打部門總資金池</span>
                              <span style={{ color: '#10b981', fontWeight: 'bold' }}>總和 {formatMoney(targetPayroll)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '8px' }}>
                              <span style={{ color: '#3b82f6' }}>P: {formatMoney(pitcherBudgetCap)} ({(pitcherBudgetCap/targetPayroll*100).toFixed(0)}%)</span>
                              <span style={{ color: '#ef4444' }}>B: {formatMoney(hitterTotal)} ({(hitterTotal/targetPayroll*100).toFixed(0)}%)</span>
                            </div>
                            <input 
                              type="range" 
                              min="10000000" 
                              max={targetPayroll - 10000000} 
                              step="500000"
                              value={pitcherBudgetCap}
                              onChange={(e) => handleMacroBudgetChange(Number(e.target.value))}
                              style={{ width: '100%', cursor: 'pointer', accentColor: '#3b82f6' }}
                              title="拖拉調整投打部門總池大小"
                            />
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '8px', textAlign: 'center' }}>拖拉滑桿可以一次性調整所有投打薪資水位</div>
                          </div>
                          
                          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Top 5 球員薪資佔比 (Stars & Scrubs)</div>
                            <div style={{ fontWeight: 'bold', color: top5Pct > 55 ? '#f59e0b' : '#10b981' }}>
                              {formatMoney(top5Total)} ({top5Pct.toFixed(1)}%)
                            </div>
                            <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginTop: '8px', background: 'rgba(255,255,255,0.1)' }}>
                              <div style={{ width: `${top5Pct}%`, background: top5Pct > 55 ? '#f59e0b' : '#10b981' }} />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Budget Allocation Editor */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setBudgetFilter('all')} 
                        style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', background: budgetFilter === 'all' ? '#10b981' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                      >全部顯示</button>
                      <button 
                        onClick={() => setBudgetFilter('pitchers')} 
                        style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', background: budgetFilter === 'pitchers' ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                      >專注投手</button>
                      <button 
                        onClick={() => setBudgetFilter('hitters')} 
                        style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', background: budgetFilter === 'hitters' ? '#ef4444' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                      >專注野手</button>
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: totalAllocated > targetPayroll ? '#ef4444' : '#10b981' }}>
                      {formatMoney(totalAllocated)} / {formatMoney(targetPayroll)}
                    </span>
                  </div>

                  <div style={{ overflowY: 'auto', maxHeight: '400px', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '8px' }}>
                    {wizardSequence && wizardSequence.map((step, idx) => {
                      const isPitcher = PITCHER_POS.includes(step.id);
                      if (budgetFilter === 'pitchers' && !isPitcher) return null;
                      if (budgetFilter === 'hitters' && isPitcher) return null;

                      const isPPool = isPitcher;
                      const poolCap = isPPool ? pitcherBudgetCap : (targetPayroll - pitcherBudgetCap);
                      
                      return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', borderLeft: `4px solid ${isPitcher ? '#3b82f6' : '#ef4444'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: isPitcher ? '#3b82f6' : '#ef4444' }}>{idx + 1}. {t(`draft.pos_${step.id}`)}</span>
                          <span style={{ fontWeight: 'bold', color: '#10b981' }}>{formatMoney(customBudgets[idx] || 0)}</span>
                        </div>
                        <input 
                          type="range" 
                          min="500000" 
                          max={poolCap} 
                          step="100000"
                          value={customBudgets[idx] || 0} 
                          onChange={(e) => handleBudgetChange(idx, Number(e.target.value))}
                          style={{ width: '100%', cursor: 'pointer', accentColor: isPitcher ? '#3b82f6' : '#ef4444' }}
                        />
                      </div>
                    )})}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                    <button onClick={() => setSetupStep(2)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <ArrowLeft size={16} /> 上一步
                    </button>
                    <button 
                      disabled={totalAllocated > targetPayroll}
                      onClick={() => setWizardPhase('drafting')} 
                      className="btn-primary" 
                      style={{ padding: '12px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', fontSize: '1.2rem', opacity: totalAllocated > targetPayroll ? 0.5 : 1 }}
                    >
                      <Play size={24} /> {totalAllocated > targetPayroll ? t('draft.budgetError') : t('draft.startDraft')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // WIZARD LIVE DRAFTING PANEL
            <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {currentStep ? (
                <>
                  <div style={{ marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--primary-accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--primary-accent)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                        {t('draft.stepProgress')} {currentStepIndex + 1} / 22
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {t('draft.budgetSaved')}: <span style={{ color: currentSuggestedBudget - (customBudgets[currentStepIndex]||0) >= 0 ? '#10b981' : '#ef4444' }}>{formatMoney(currentSuggestedBudget - (customBudgets[currentStepIndex]||0))}</span>
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>{t('draft.currentGoal')} <span style={{ color: '#3b82f6' }}>{t(`draft.pos_${currentStep.id}`)}</span></h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('draft.targetBudget')}:</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>{formatMoney(currentSuggestedBudget)}</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', padding: '12px', borderRadius: '0 8px 8px 0', marginBottom: '16px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontWeight: 'bold', marginBottom: '6px' }}>
                      <Lightbulb size={16} /> CP 值 (優先度) 演算法說明
                    </div>
                    <div><strong>🎯 Base (基礎):</strong> 根據「自訂守位期望配比 (Positional Strategy Board)」計算的能力值。</div>
                    <div><strong>📈 Adj (加權):</strong> 結合球員年齡 (超級新秀/衰退) 與多守位等特質後的真實戰力。</div>
                    <div><strong>💰 Bonus (財務):</strong> 低於預算將獲得加分；若超支，將面臨高達 3 倍的豪華稅扣分！</div>
                    <div><strong>🔍 Focus (期望):</strong> 系統自動判定此順位該找 <strong>Stars (容忍超支找球星)</strong> 還是 <strong>Scrubs (嚴格控管找綠葉)</strong>。</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '550px' }}>
                    {wizardCandidates.slice(0, 50).map(p => (
                      <div key={p.name} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className={`rating-badge rating-${p.rating?.replace('+', 'plus').replace('-', 'minus') || 'none'}`} style={{ minWidth: '40px', textAlign: 'center' }}>{p.rating}</div>
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {p.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.age} yrs</span>
                                {p._bonusNotes.length > 0 && <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px' }}>{p._bonusNotes.join(', ')}</span>}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {p.salary} • <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{t('draft.cpValue')}: {p._cpValue.toFixed(1)}</span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                                Pos: {p.primaryPosition} {p.secondaryPositions?.length ? `(+ ${p.secondaryPositions.join(', ')})` : ''}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => handleDraft(p)} className="btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserPlus size={16} /> {t('draft.draftPlayer')}
                          </button>
                        </div>
                        
                        {/* CP Breakdown Panel */}
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '12px', color: 'rgba(255,255,255,0.7)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ color: 'var(--primary-accent)', fontWeight: 'bold' }}>{t('draft.cpBreakdown')}:</div>
                          <div>🎯 Base Score: {p._baseScore}</div>
                          {p._ageBonusNotes.map((note: string, i: number) => (
                            <div key={`age-${i}`} style={{ color: note.includes('+') ? '#10b981' : note.includes('-') ? '#ef4444' : '#9ca3af' }}>👶 Age: {note}</div>
                          ))}
                          {p._bonusNotes.map((note: string, i: number) => (
                            <div key={`trait-${i}`} style={{ color: '#f59e0b' }}>✨ Trait: {note}</div>
                          ))}
                          <div>📈 Adj Score: {p._modifiedScore.toFixed(1)}</div>
                          <div style={{ color: p._savingsBonus >= 0 ? '#10b981' : '#ef4444' }}>
                            💰 Savings Bonus: {p._savingsBonus >= 0 ? '+' : ''}{p._savingsBonus.toFixed(1)} 
                            <span style={{ opacity: 0.5, marginLeft: '4px' }}>(Focus: {p._kFactor < 4 ? 'Stars' : 'Scrubs'})</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {wizardCandidates.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No suitable players found for this role.</p>}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--primary-accent)' }}>
                  <CheckCircle size={64} style={{ marginBottom: '16px' }} />
                  <h2>{t('draft.wizardComplete')}</h2>
                  <button onClick={() => setWizardPhase('setup')} className="btn-primary" style={{ marginTop: '16px' }}>
                    Restart Draft Wizard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel: Drafted Roster */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('draft.roster')}</span>
            <span style={{ color: 'var(--primary-accent)' }}>{draftedPlayers.length} / 22</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '750px' }}>
            {draftedPlayers.map((p, idx) => {
               const stepLabel = t(`draft.pos_${wizardSequence[idx]?.id}`);
               
               return (
                <div key={`drafted-${p.name}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', borderLeft: '4px solid var(--primary-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', width: '24px' }}>{idx + 1}.</span>
                    <div className={`rating-badge rating-${p.rating?.replace('+', 'plus').replace('-', 'minus') || 'none'}`} style={{ minWidth: '40px', textAlign: 'center' }}>{p.rating}</div>
                    <div>
                      <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {p.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>{p.age}y</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {stepLabel ? <span style={{ color: '#3b82f6', marginRight: '8px' }}>[{stepLabel}]</span> : null}
                        {renderPositionBadge(p.primaryPosition)} • {p.salary}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleRelease(p)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}>
                    <UserMinus size={16} />
                  </button>
                </div>
              );
            })}
            {draftedPlayers.length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                <ShoppingCart size={48} style={{ marginBottom: '16px' }} />
                <div>Your roster is empty. Start drafting!</div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default DraftSimulator;
