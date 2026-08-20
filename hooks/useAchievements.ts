// hooks/useAchievements.ts
// Fetches real achievement data from GET /quiz/achievements and maps it into
// the badge shape both the Home tab and My Learning render via AchievementCard.
import { API_URL } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AchievementItem } from "@/components/AchievementCard";

export type QuestionSetSummary = {
  question_set_id: number;
  name: string;
  category_name: string | null;
  attempts_count: number;
  best_score_percentage: number;
  last_attempted_at: string;
};

const BADGE_META: Record<string, { icon: string; color: string }> = {
  quick_learner: { icon: "rocket-outline", color: "#7c3aed" },
  quiz_master: { icon: "trophy-outline", color: "#f59e0b" },
  perfectionist: { icon: "star-outline", color: "#059669" },
  streak_champion: { icon: "flame-outline", color: "#ef4444" },
};

export function useAchievements() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [summary, setSummary] = useState<QuestionSetSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(() => {
    if (!token) {
      setAchievements([]);
      setSummary([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_URL}/quiz/achievements`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const badges: AchievementItem[] = (d.data.badges ?? []).map((b: any) => ({
          id: b.id,
          progress: b.progress,
          icon: BADGE_META[b.id]?.icon ?? "star-outline",
          color: BADGE_META[b.id]?.color ?? "#7c3aed",
          title: t(`home.${toCamelCase(b.id)}`),
          description: t(`home.${toCamelCase(b.id)}Desc`),
        }));
        setAchievements(badges);
        setSummary(d.data.summary ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, t]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return { achievements, summary, loading, isLoggedIn: !!token, refresh: fetchAchievements };
}

function toCamelCase(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
