// Small pill shown under the "Owned" tag on a question-set / package card (and in
// the package detail header) telling the user how much of their paid grant is left:
//   - attempt grants  -> "3 attempts left" (updates on the next list refetch, i.e.
//     after each completed quiz)
//   - time grants     -> "5h 12m left", counting down live once per second
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import type { QuizAccessSummary } from "@/utils/quizStore";

const TIME_KINDS = ["days", "hours", "minutes", "trial_days"];

function formatDuration(ms: number, t: (k: string, o?: any) => string): string {
  if (ms <= 0) return t("quiz.accessExpired");
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const uD = t("quiz.timeUnitDay");
  const uH = t("quiz.timeUnitHour");
  const uM = t("quiz.timeUnitMinute");
  const uS = t("quiz.timeUnitSecond");
  if (d > 0) return `${d}${uD} ${h}${uH}`;
  if (h > 0) return `${h}${uH} ${m}${uM}`;
  if (m > 0) return `${m}${uM} ${s}${uS}`;
  return `${s}${uS}`;
}

export default function AccessRemainingBadge({
  access,
  style,
}: {
  access?: QuizAccessSummary | null;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();
  const isTime = !!access && TIME_KINDS.includes(access.kind) && !!access.expires_at;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isTime) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isTime]);

  if (!access) return null;

  let icon = "time-outline";
  let label: string;
  let expired = false;

  switch (access.kind) {
    case "attempts":
    case "trial_attempts": {
      const rem =
        access.attempts_remaining ??
        Math.max(0, (access.attempts_total ?? 0) - (access.attempts_used ?? 0));
      icon = "ticket-outline";
      label = t("quiz.accessAttemptsLeft", { count: rem });
      expired = rem <= 0;
      break;
    }
    case "wallet":
      icon = "wallet-outline";
      label = t("quiz.accessAttemptsLeft", { count: access.attempts_remaining ?? 0 });
      break;
    case "days":
    case "hours":
    case "minutes":
    case "trial_days": {
      icon = "time-outline";
      const remMs = access.expires_at ? new Date(access.expires_at).getTime() - now : 0;
      expired = remMs <= 0;
      label = expired
        ? t("quiz.accessExpired")
        : t("quiz.accessTimeLeft", { time: formatDuration(remMs, t) });
      break;
    }
    case "subscription":
      icon = "infinite-outline";
      label = t("quizPlay.accessSubscription");
      break;
    default:
      return null;
  }

  return (
    <View style={[styles.badge, expired && styles.badgeExpired, style]}>
      <Ionicons name={icon as any} size={11} color={expired ? "#b91c1c" : "#0369a1"} />
      <Text style={[styles.text, expired && styles.textExpired]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  badgeExpired: {
    backgroundColor: "#fee2e2",
  },
  text: {
    color: "#0369a1",
    fontSize: 11,
    fontWeight: "700",
  },
  textExpired: {
    color: "#b91c1c",
  },
});
