import { ScenarioPreset } from "../types/scenarios";

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  { id: "no_takeaways", label: "Cancel Takeaways", amount: 80,  type: "monthly",  icon: "🍕" },
  { id: "cancel_streaming", label: "Cancel Netflix & Spotify", amount: 25, type: "monthly", icon: "🍿" },
  { id: "sober_month", label: "Go Sober (1 month)", amount: 150, type: "one_off", month: 1, icon: "🍺" },
  { id: "sell_stuff", label: "Sell on eBay", amount: 200, type: "one_off", month: 2, icon: "📦" },
  { id: "bus_commute", label: "Swap Car for Bus", amount: 120, type: "monthly", icon: "🚌" },
  { id: "side_hustle", label: "Side Hustle", amount: 100, type: "monthly", icon: "💼" },
];