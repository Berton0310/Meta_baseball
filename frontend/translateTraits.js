const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'src', 'data', 'traits.json');
const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

const translate = (text) => {
  if (!text) return text;
  let res = text;
  // Common terms
  res = res.replace(/2x effect/gi, '2倍效果');
  res = res.replace(/3x effect/gi, '3倍效果');
  res = res.replace(/4x effect/gi, '4倍效果');
  res = res.replace(/Minor/gi, '小幅');
  res = res.replace(/Major/gi, '大幅');
  res = res.replace(/Increased/gi, '增加');
  res = res.replace(/Decreased/gi, '減少');
  res = res.replace(/throw speed/gi, '傳球速度');
  res = res.replace(/throw /gi, '傳球');
  res = res.replace(/throwing/gi, '傳球時');
  res = res.replace(/with maximum power/gi, '使用最大力量');
  res = res.replace(/when/gi, '當');
  res = res.replace(/pitch speed/gi, '球速');
  res = res.replace(/break/gi, '變化幅度');
  res = res.replace(/pitching a/gi, '投出');
  res = res.replace(/swing power/gi, '揮擊力量');
  res = res.replace(/contact/gi, '擊球率');
  res = res.replace(/improves/gi, '提升');
  res = res.replace(/swinging at a/gi, '揮擊');
  res = res.replace(/pitch/gi, '球種');
  res = res.replace(/targetting/gi, '瞄準');
  res = res.replace(/upper half/gi, '上半部');
  res = res.replace(/lower half/gi, '下半部');
  res = res.replace(/outside half/gi, '外側');
  res = res.replace(/inside half/gi, '內側');
  res = res.replace(/of the strike zone/gi, '的好球帶');
  res = res.replace(/running speed/gi, '跑速');
  res = res.replace(/while rounding a base/gi, '繞壘時');
  res = res.replace(/while rounding bases/gi, '繞壘時');
  return res;
};

data.forEach(t => {
  if (t.level1Zh) t.level1Zh = translate(t.level1Zh);
  else if (t.level1) t.level1Zh = translate(t.level1);
  
  if (t.level2Zh) t.level2Zh = translate(t.level2Zh);
  else if (t.level2) t.level2Zh = translate(t.level2);
  
  if (t.level3Zh) t.level3Zh = translate(t.level3Zh);
  else if (t.level3) t.level3Zh = translate(t.level3);
});

fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
console.log('Done translating traits.json');
