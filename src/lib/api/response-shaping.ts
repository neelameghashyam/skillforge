export function resolveSkillSelect(compact: boolean) {
  if (compact) {
    return "id,name,description,category,level,progress,color,icon,curriculum_id,created_at,updated_at,archived";
  }

  return "*";
}

export function buildQueryString(baseQuery?: string, compact = false) {
  const params = new URLSearchParams(baseQuery ?? "");
  if (compact) params.set("compact", "true");

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function resolveGamificationScope(scope?: string | null) {
  return scope === "dashboard" ? "dashboard" : "full";
}
