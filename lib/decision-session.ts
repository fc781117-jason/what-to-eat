export type DecisionMode = "roulette" | "nearby" | "compare" | "category";
export type DecisionStatus = "active" | "paused" | "completed" | "abandoned";

export type DecisionEvent =
  | "session_start"
  | "candidate_view"
  | "restaurant_detail_view"
  | "dish_detail_view"
  | "filter_change"
  | "reroll"
  | "skip_once"
  | "exclude_permanent"
  | "app_background"
  | "app_foreground"
  | "session_complete"
  | "session_abandon";

export type DecisionSession = {
  id: string;
  mode: DecisionMode;
  status: DecisionStatus;
  startedAt: number;
  lastActiveAt: number;
  completedAt?: number;
  abandonedAt?: number;
  activeMs: number;
  pausedAt?: number;
  candidateIds: string[];
  restaurantDetailViews: number;
  dishDetailViews: number;
  rerolls: number;
  skipOnceCount: number;
  exclusions: number;
  filterChanges: number;
  finalRestaurantId?: string;
  finalDishId?: string;
};

export function createDecisionSession(mode: DecisionMode, now = Date.now()): DecisionSession {
  return {
    id: `decision-${now}-${Math.random().toString(36).slice(2, 8)}`,
    mode,
    status: "active",
    startedAt: now,
    lastActiveAt: now,
    activeMs: 0,
    candidateIds: [],
    restaurantDetailViews: 0,
    dishDetailViews: 0,
    rerolls: 0,
    skipOnceCount: 0,
    exclusions: 0,
    filterChanges: 0,
  };
}

function accrueActiveTime(session: DecisionSession, now: number) {
  if (session.status !== "active") return session;
  return {
    ...session,
    activeMs: session.activeMs + Math.max(0, now - session.lastActiveAt),
    lastActiveAt: now,
  };
}

export function pauseDecisionSession(session: DecisionSession, now = Date.now()): DecisionSession {
  const accrued = accrueActiveTime(session, now);
  return {
    ...accrued,
    status: "paused",
    pausedAt: now,
  };
}

export function resumeDecisionSession(session: DecisionSession, now = Date.now()): DecisionSession {
  if (session.status !== "paused") return session;
  return {
    ...session,
    status: "active",
    lastActiveAt: now,
    pausedAt: undefined,
  };
}

export function completeDecisionSession(
  session: DecisionSession,
  result: { restaurantId: string; dishId?: string },
  now = Date.now(),
): DecisionSession {
  const accrued = accrueActiveTime(session, now);
  return {
    ...accrued,
    status: "completed",
    completedAt: now,
    finalRestaurantId: result.restaurantId,
    finalDishId: result.dishId,
  };
}

export function abandonDecisionSession(session: DecisionSession, now = Date.now()): DecisionSession {
  const accrued = accrueActiveTime(session, now);
  return {
    ...accrued,
    status: "abandoned",
    abandonedAt: now,
  };
}

export function recordDecisionEvent(
  session: DecisionSession,
  event: DecisionEvent,
  payload: { candidateId?: string } = {},
  now = Date.now(),
): DecisionSession {
  const current = accrueActiveTime(session, now);

  if (event === "candidate_view" && payload.candidateId) {
    return {
      ...current,
      candidateIds: current.candidateIds.includes(payload.candidateId)
        ? current.candidateIds
        : [...current.candidateIds, payload.candidateId],
    };
  }

  if (event === "restaurant_detail_view") {
    return { ...current, restaurantDetailViews: current.restaurantDetailViews + 1 };
  }

  if (event === "dish_detail_view") {
    return { ...current, dishDetailViews: current.dishDetailViews + 1 };
  }

  if (event === "reroll") return { ...current, rerolls: current.rerolls + 1 };
  if (event === "skip_once") return { ...current, skipOnceCount: current.skipOnceCount + 1 };
  if (event === "exclude_permanent") return { ...current, exclusions: current.exclusions + 1 };
  if (event === "filter_change") return { ...current, filterChanges: current.filterChanges + 1 };

  return current;
}

export function successfulDecisionSeconds(session: DecisionSession) {
  return session.status === "completed" ? Math.round(session.activeMs / 1000) : null;
}
