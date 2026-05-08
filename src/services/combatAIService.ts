
import { CombatUnit, Skill } from '../types';
import { getCounterMultiplier, getReaction, ElementType } from '../data/element_system';
import { getBeastDecision, BeastAction } from '../prompts/MindsetBeast';

export interface AIStep {
  skill: Skill;
  targetId: string;
  score: number;
  reason: string;
}

export class CombatAIService {
  /**
   * Suggests the best action for a unit
   */
  static getBestAction(actor: CombatUnit, allParticipants: CombatUnit[], turnIndex: number): AIStep {
    const aliveEnemies = allParticipants.filter(p => p.isAlive && p.isPlayer !== actor.isPlayer);
    const aliveAllies = allParticipants.filter(p => p.isAlive && p.isPlayer === actor.isPlayer);
    
    if (aliveEnemies.length === 0) {
      return this.getSkipAction(actor);
    }

    // Handle Beast AI decisions
    let beastAction: BeastAction = "ATTACK";
    if (actor.isBeast) {
      const decision = getBeastDecision(actor, allParticipants, "Không xác định");
      beastAction = decision.action;
    }

    const availableSkills = actor.skills.filter(s => 
      actor.mana >= (s.cost || 0) && (turnIndex >= (actor.cooldowns[s.id] || 0))
    );

    const candidates: AIStep[] = [];

    // Evaluate basic attack if no skills or just as a baseline
    const basicAttack = actor.skills.find(s => s.id === 'basic_attack') || {
      id: 'basic_attack',
      name: 'Tấn công cơ bản',
      type: 'ACTIVE',
      baseDamage: 10,
      scaling: 100,
      element: 'VẬT LÝ',
      cost: 0,
      cooldown: 0,
      targetType: 'SINGLE'
    } as any;

    // Evaluate each skill against each possible target
    const skillsToEvaluate = availableSkills.length > 0 ? availableSkills : [basicAttack];

    for (const skill of skillsToEvaluate) {
      const targetType = skill.targetType || 'SINGLE';

      // Beast action logic filtering
      if (actor.isBeast) {
        if (beastAction === "RETREAT" && skill.type === 'ACTIVE' && skill.baseDamage > 0) continue; 
        if (beastAction === "DEFEND_TERRITORY" && skill.type === 'ACTIVE' && skill.baseDamage > 0) continue;
      }

      if (targetType === 'SINGLE') {
        aliveEnemies.forEach(target => {
          candidates.push(this.evaluateAction(actor, skill, target, turnIndex));
        });
      } else if (targetType === 'AOE') {
        candidates.push(this.evaluateAOEAction(actor, skill, aliveEnemies, turnIndex));
      } else if (targetType === 'SELF') {
        candidates.push(this.evaluateAction(actor, skill, actor, turnIndex));
      }
    }
    
    if (actor.isBeast && candidates.length === 0) {
        return this.getSkipAction(actor);
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    return candidates[0] || this.getSkipAction(actor);
  }

  private static evaluateAction(actor: CombatUnit, skill: Skill, target: CombatUnit, turnIndex: number): AIStep {
    let score = 0;
    let reasons: string[] = [];

    const isOffensive = target.isPlayer !== actor.isPlayer;

    if (isOffensive) {
      // Elemental Multiplier
      const skillElements = Array.isArray(skill.element) ? skill.element : [skill.element];
      const primaryElement = skillElements[0] as ElementType;
      const counterMult = getCounterMultiplier(primaryElement, target.element as ElementType);
      const reaction = getReaction(primaryElement, target.element as ElementType);
      const totalMult = counterMult * (reaction.multiplier || 1);

      if (totalMult > 1.2) reasons.push("Khắc chế nguyên tố");
      if (totalMult < 0.8) reasons.push("Bị kháng nguyên tố");

      // Damage estimation
      const estimatedDamage = (skill.baseDamage + actor.attack * (skill.scaling / 100)) * totalMult;
      score += estimatedDamage;

      // Finishing blow priority
      if (estimatedDamage >= target.hp) {
        score += 1000;
        reasons.push("Kết liễu đối thủ");
      }

      // CC Priority
      const hasCC = skill.effects?.some(e => e.id === 'stun' || e.id === 'freeze');
      if (hasCC) {
        const isTargetAlreadyCCed = target.activeEffects?.some(e => e.id === 'stun' || e.id === 'freeze');
        if (!isTargetAlreadyCCed) {
          score += 500;
          reasons.push("Khống chế mục tiêu");
        } else {
          score -= 300; // Diminishing returns on overlapping CC
        }
      }

      // Status Effects Priority
      const hasDOT = skill.effects?.some(e => e.id === 'burn' || e.id === 'poison' || e.id === 'weaken');
      if (hasDOT && !target.activeEffects?.some(e => e.id === 'burn' || e.id === 'poison' || e.id === 'weaken')) {
        score += 200;
        reasons.push("Gây sát thương theo thời gian/Suy yếu");
      }

    } else {
      // Support/Healing
      const hasHeal = skill.effects?.some(e => e.id === 'regen');
      const hasBuff = skill.effects?.some(e => e.id === 'def_up' || e.id === 'atk_up');

      if (hasHeal) {
        const hpRatio = target.hp / target.maxHp;
        if (hpRatio < 0.3) {
          score += 1500;
          reasons.push("Cứu viện đồng đội (HP Thấp)");
        } else if (hpRatio < 0.7) {
          score += 600;
          reasons.push("Hồi phục HP");
        }
      }

      if (hasBuff) {
        const alreadyBuffed = target.activeEffects?.some(e => e.id === 'def_up' || e.id === 'atk_up' || e.id === 'regen');
        if (!alreadyBuffed) {
          score += 400;
          reasons.push("Cường hóa thuộc tính");
        }
      }
    }

    // Mana efficiency check
    if (skill.cost > 0 && actor.mana < actor.maxMana * 0.3) {
       score *= 0.8; // Be cautious when mana is low
    }

    // Rarity bonus
    const rarityBonus: Record<string, number> = { 'COMMON': 1, 'RARE': 1.1, 'EPIC': 1.25, 'LEGENDARY': 1.5, 'MYTHIC': 2 };
    score *= (rarityBonus[skill.rarity] || 1);

    return {
      skill,
      targetId: target.id,
      score,
      reason: reasons.join(", ") || "Hành động tối ưu"
    };
  }

  private static evaluateAOEAction(actor: CombatUnit, skill: Skill, enemies: CombatUnit[], turnIndex: number): AIStep {
    let totalScore = 0;
    let reasons: string[] = ["Tấn công diện rộng"];

    enemies.forEach(enemy => {
      const step = this.evaluateAction(actor, skill, enemy, turnIndex);
      totalScore += step.score;
    });

    // AOE is generally better when multiple targets are alive
    if (enemies.length > 1) {
      totalScore *= (1 + (enemies.length - 1) * 0.2);
    }

    return {
      skill,
      targetId: enemies[0]?.id || actor.id, // TargetId doesn't matter much for AOE in execution logic
      score: totalScore,
      reason: reasons.join(", ")
    };
  }

  private static getSkipAction(actor: CombatUnit): AIStep {
    return {
      skill: { id: 'SKIP', name: 'Bỏ lượt', cost: 0 } as any,
      targetId: actor.id,
      score: 0,
      reason: "Không có hành động khả dụng"
    };
  }
}
