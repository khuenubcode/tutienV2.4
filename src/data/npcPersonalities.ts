import { NPCPersonality } from '../types';

export const getRandomPersonality = (): NPCPersonality => ({
  rationality: Math.floor(Math.random() * 101), // Cảm tính ↔ Lý trí
  bravery: Math.floor(Math.random() * 101),     // Hèn nhát ↔ Gan lì
  morality: Math.floor(Math.random() * 101),    // Ma tính ↔ Nhân tính
  ambition: Math.floor(Math.random() * 101),    // An phận ↔ Tham vọng
});

export const getPersonalityLabel = (personality: NPCPersonality) => {
  const traits = [];
  
  if (personality.rationality > 70) traits.push("Lý Trí");
  else if (personality.rationality < 30) traits.push("Cảm Tính");
  
  if (personality.bravery > 70) traits.push("Dũng Cảm");
  else if (personality.bravery < 30) traits.push("Nhát Gan");
  
  if (personality.morality > 70) traits.push("Chính Đạo");
  else if (personality.morality < 30) traits.push("Ma Đạo");
  
  if (personality.ambition > 70) traits.push("Tham Vọng");
  else if (personality.ambition < 30) traits.push("An Phận");
  
  return traits.length > 0 ? traits.join(", ") : "Bình Thường";
};
