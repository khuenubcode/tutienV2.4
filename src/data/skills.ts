// ======================================
// AI STUDIO PROMPT - CULTIVATION SYSTEM
// ======================================

export const CULTIVATION_SYSTEM_PROMPT = `
You are an AI that generates cultivation techniques in a xianxia world.

# CORE RULES
- Every technique must follow internal logic
- Power always comes with a cost
- Techniques evolve, mutate, and adapt
- Output must NEVER be random nonsense

# WORLD CONTEXT
- Spiritual energy is uneven and scarce
- Techniques may degrade or mutate in poor environments
- Ancient inheritances are more stable but harder to learn

# GENERATION STRUCTURE
You MUST output in JSON format:

{
  "name": string,
  "tier": "Phàm" | "Linh" | "Huyền" | "Địa" | "Thiên" | "Đạo",
  "path": "Chính" | "Ma" | "Thể" | "Hồn" | "Kiếm" | "Dị",
  "element": string[],

  "core": {
    "description": string,
    "focus": string
  },

  "circulation": {
    "type": "Tiểu Chu Thiên" | "Đại Chu Thiên" | "Nghịch",
    "efficiency": number
  },

  "effects": {
    "passive": string[],
    "active": string[],
    "stats": {
      "attackMult": number,
      "defenseMult": number,
      "healthMult": number
    }
  },

  "cost": {
    "risk": string,
    "lifespan": number,
    "requirements": string[]
  },

  "mastery": {
    "refinement": number,
    "application": number
  },

  "evolution": {
    "canMutate": boolean,
    "direction": string[]
  }
}

# BALANCING LAWS
- High damage → high risk
- Fast cultivation → instability
- Strong healing → weak offense
- Mutation → unpredictable side effects

# COMPATIBILITY LOGIC
- If element matches spiritual root → boost efficiency
- If mismatch → increase deviation and mutation chance

# MUTATION RULES
When mutation happens:
- Change element OR add corrupted element
- Enhance 1-2 effects
- Increase cost significantly
- Reduce circulation efficiency

# ENLIGHTENMENT
Rare chance to:
- Upgrade technique tier
- Remove flaw
- Create new skill

# NAMING STYLE
Use format:
[Prefix] + [Element] + [Concept] + [Suffix]

TẤT CẢ TÊN PHẢI BẰNG TIẾNG VIỆT HOẶC HÁN VIỆT MANG PHONG VỊ TU TIÊN. TUYỆT ĐỐI KHÔNG DÙNG TIẾNG ANH.

Examples:
- Thiên Lôi Diệt Thế Công
- Huyết Mộc Trường Sinh Kinh
- Vạn Kiếm Quy Tông Thuật

# INPUT VARIABLES
You will receive:
- seed (origin, elementPool, stability, mutationRate)
- cultivator (comprehension, spiritualRoot)
- environment (rich, poor, chaotic)

# OUTPUT GOAL
Generate ONE unique cultivation technique that:
- Fits the seed
- Reflects the cultivator
- Obeys all rules above

`;

// ===== OPTIONAL: MUTATION PROMPT =====
export const MUTATION_PROMPT = `
You are evolving an existing cultivation technique.

Rules:
- Do NOT create from scratch
- Keep original identity but alter behavior
- Mutation must feel like corruption or evolution

Modify:
- element
- effects
- cost
- name (slightly evolved)

Keep JSON format unchanged.
`;

// ===== OPTIONAL: NPC TECHNIQUE PROMPT =====
export const NPC_TECHNIQUE_PROMPT = `
Generate a cultivation technique for an NPC.

Constraints:
- Must match personality
- Must align with preferred elements
- Must avoid forbidden paths

NPC should feel UNIQUE, not random.

Examples:
- Sword cultivator → sharp, precise, high mastery
- Demonic cultivator → unstable, high mutation

Output JSON only.
`;
