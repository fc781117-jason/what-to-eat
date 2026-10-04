import type { HistoryEntry } from "./product";

export type StatsPeriod = "week" | "month" | "year" | "all";

export type FoodStats = {
  decisions: number;
  candidates: number;
  averageDecisionSeconds: number;
  fastestDecisionSeconds: number | null;
  slowDecisions: number;
  topCuisine: string | null;
  topRestaurant: string | null;
  cuisineCounts: Array<{ label: string; value: number }>;
  sourceCounts: Array<{ label: string; value: number }>;
};

export function filterHistoryByPeriod(
  history: HistoryEntry[],
  period: StatsPeriod,
  now = new Date(),
) {
  if (period === "all") return history;
  const days = period === "week" ? 7 : period === "month" ? 30 : 365;
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).getTime();
  return history.filter((entry) => new Date(entry.createdAt).getTime() >= cutoff);
}

function topLabel(values: string[]) {
  if (!values.length) return null;
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function buildFoodStats(history: HistoryEntry[]): FoodStats {
  const durations = history
    .map((entry) => entry.decisionSeconds ?? 0)
    .filter((seconds) => seconds > 0);

  const cuisineMap = new Map<string, number>();
  const sourceMap = new Map<string, number>();
  const sourceLabels: Record<HistoryEntry["source"], string> = {
    roulette: "拉霸",
    nearby: "附近",
    compare: "比較",
    category: "分類",
  };

  history.forEach((entry) => {
    cuisineMap.set(entry.cuisine, (cuisineMap.get(entry.cuisine) ?? 0) + 1);
    const source = sourceLabels[entry.source];
    sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
  });

  return {
    decisions: history.length,
    candidates: history.reduce((sum, entry) => sum + (entry.candidateCount ?? 0), 0),
    averageDecisionSeconds: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0,
    fastestDecisionSeconds: durations.length ? Math.min(...durations) : null,
    slowDecisions: durations.filter((seconds) => seconds >= 600).length,
    topCuisine: topLabel(history.map((entry) => entry.cuisine)),
    topRestaurant: topLabel(history.map((entry) => entry.restaurantName)),
    cuisineCounts: [...cuisineMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    sourceCounts: [...sourceMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
  };
}

export function formatDecisionDuration(seconds: number) {
  if (!seconds) return "尚無資料";
  if (seconds < 60) return `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return remain ? `${minutes} 分 ${remain} 秒` : `${minutes} 分鐘`;
}


import type { DecisionSession } from "./decision-session";

export type DecisionBehaviorStats = {
  completed: number;
  abandoned: number;
  averageActiveSeconds: number;
  medianActiveSeconds: number;
  fastestActiveSeconds: number | null;
  slowDecisions: number;
  abandonmentRate: number;
  firstChoiceAcceptanceRate: number;
  averageRerolls: number;
};

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function buildDecisionBehaviorStats(
  sessions: DecisionSession[],
): DecisionBehaviorStats {
  const completed = sessions.filter((session) => session.status === "completed");
  const abandoned = sessions.filter((session) => session.status === "abandoned");
  const durations = completed
    .map((session) => Math.round(session.activeMs / 1000))
    .filter((seconds) => seconds > 0);

  const totalSessions = completed.length + abandoned.length;
  const firstChoiceAccepted = completed.filter((session) => session.rerolls === 0).length;

  return {
    completed: completed.length,
    abandoned: abandoned.length,
    averageActiveSeconds: durations.length
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : 0,
    medianActiveSeconds: median(durations),
    fastestActiveSeconds: durations.length ? Math.min(...durations) : null,
    slowDecisions: durations.filter((seconds) => seconds >= 600).length,
    abandonmentRate: totalSessions
      ? Math.round((abandoned.length / totalSessions) * 100)
      : 0,
    firstChoiceAcceptanceRate: completed.length
      ? Math.round((firstChoiceAccepted / completed.length) * 100)
      : 0,
    averageRerolls: completed.length
      ? Number(
          (
            completed.reduce((sum, session) => sum + session.rerolls, 0) /
            completed.length
          ).toFixed(1),
        )
      : 0,
  };
}
