export type ScenarioType = "monthly" | "one_off";

export type ScenarioPreset = {
  id: string;
  label: string;
  amount: number;     // positive £
  type: ScenarioType; // monthly or one_off
  month?: number;     // 1-based, only for one_off defaults (editable)
  icon?: string;      // emoji or lucide name
};

export type ScenarioSelection = ScenarioPreset & { active: boolean };