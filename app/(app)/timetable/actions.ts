"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";

export async function createSubject(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const color = String(formData.get("color") ?? "#3B82F6");
  const weekly_periods = Math.max(
    0,
    Number(formData.get("weekly_periods") ?? 0) || 0
  );

  const { error } = await supabase
    .from("subjects")
    .insert({ user_id: user.id, name, color, weekly_periods });
  logSupabaseError("timetable.createSubject", error);
  revalidatePath("/timetable");
}

export async function updateSubjectWeeklyPeriods(
  subjectId: string,
  weeklyPeriods: number
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("subjects")
    .update({ weekly_periods: Math.max(0, weeklyPeriods || 0) })
    .eq("id", subjectId);
  logSupabaseError("timetable.updateSubjectWeeklyPeriods", error);
  revalidatePath("/timetable");
}

export async function deleteSubject(subjectId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", subjectId);
  logSupabaseError("timetable.deleteSubject", error);
  revalidatePath("/timetable");
}

export async function createClassGroup(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const grade = String(formData.get("grade") ?? "").trim() || null;

  const { error } = await supabase
    .from("classes")
    .insert({ user_id: user.id, name, grade });
  logSupabaseError("timetable.createClassGroup", error);
  revalidatePath("/timetable");
}

export async function deleteClassGroup(classId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("classes").delete().eq("id", classId);
  logSupabaseError("timetable.deleteClassGroup", error);
  revalidatePath("/timetable");
}

export async function saveSlot({
  timetableId,
  dayOfWeek,
  period,
  subjectId,
  classId,
  room,
}: {
  timetableId: string;
  dayOfWeek: number;
  period: number;
  subjectId: string | null;
  classId: string | null;
  room: string | null;
}) {
  const supabase = createClient();

  const { data: existing, error: selectError } = await supabase
    .from("timetable_slots")
    .select("id")
    .eq("timetable_id", timetableId)
    .eq("day_of_week", dayOfWeek)
    .eq("period", period)
    .maybeSingle();
  logSupabaseError("timetable.saveSlot.select", selectError);

  if (!subjectId) {
    if (existing) {
      const { error } = await supabase
        .from("timetable_slots")
        .delete()
        .eq("id", existing.id);
      logSupabaseError("timetable.saveSlot.delete", error);
    }
    revalidatePath("/timetable");
    return;
  }

  if (existing) {
    const { error } = await supabase
      .from("timetable_slots")
      .update({ subject_id: subjectId, class_id: classId, room })
      .eq("id", existing.id);
    logSupabaseError("timetable.saveSlot.update", error);
  } else {
    const { error } = await supabase.from("timetable_slots").insert({
      timetable_id: timetableId,
      day_of_week: dayOfWeek,
      period,
      subject_id: subjectId,
      class_id: classId,
      room,
    });
    logSupabaseError("timetable.saveSlot.insert", error);
  }

  revalidatePath("/timetable");
}

const DAYS_PER_WEEK = 5; // 0=月 ... 4=金
const PERIODS_PER_DAY = 6;

export async function autoGenerateTimetable(timetableId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { placed: 0, unplaced: 0 };

  const [{ data: subjects, error: subjectsError }, { data: slots, error: slotsError }] =
    await Promise.all([
      supabase
        .from("subjects")
        .select("id, weekly_periods")
        .eq("user_id", user.id)
        .gt("weekly_periods", 0),
      supabase
        .from("timetable_slots")
        .select("day_of_week, period")
        .eq("timetable_id", timetableId),
    ]);
  logSupabaseError("timetable.autoGenerate.subjects", subjectsError);
  logSupabaseError("timetable.autoGenerate.slots", slotsError);

  const occupied = new Set(
    (slots ?? []).map((s: any) => `${s.day_of_week}-${s.period}`)
  );

  // 各科目が現在何曜日に入っているかを数え、自動生成でも分散を優先する
  const dayCountBySubject: Record<string, number[]> = {};

  const toInsert: {
    timetable_id: string;
    day_of_week: number;
    period: number;
    subject_id: string;
  }[] = [];

  let unplaced = 0;

  const sortedSubjects = [...(subjects ?? [])].sort(
    (a: any, b: any) => b.weekly_periods - a.weekly_periods
  );

  sortedSubjects.forEach((subject: any, subjectIndex: number) => {
    dayCountBySubject[subject.id] = Array(DAYS_PER_WEEK).fill(0);
    let remaining = subject.weekly_periods as number;
    const dayOrder = Array.from(
      { length: DAYS_PER_WEEK },
      (_, i) => (i + subjectIndex) % DAYS_PER_WEEK
    );

    while (remaining > 0) {
      // その科目がまだ入っていない曜日を優先。全曜日に入っていたら少ない曜日から
      const daysBySparsity = [...dayOrder].sort(
        (a, b) => dayCountBySubject[subject.id][a] - dayCountBySubject[subject.id][b]
      );

      let placedThisRound = false;
      for (const day of daysBySparsity) {
        let placedOnThisDay = false;
        for (let period = 1; period <= PERIODS_PER_DAY; period++) {
          const key = `${day}-${period}`;
          if (occupied.has(key)) continue;
          occupied.add(key);
          toInsert.push({
            timetable_id: timetableId,
            day_of_week: day,
            period,
            subject_id: subject.id,
          });
          dayCountBySubject[subject.id][day] += 1;
          remaining -= 1;
          placedThisRound = true;
          placedOnThisDay = true;
          break;
        }
        if (placedOnThisDay) break;
      }

      if (!placedThisRound) {
        unplaced += remaining;
        remaining = 0;
      }
    }
  });

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("timetable_slots")
      .insert(toInsert);
    logSupabaseError("timetable.autoGenerate.insert", insertError);
  }

  revalidatePath("/timetable");
  return { placed: toInsert.length, unplaced };
}

export async function saveOverride({
  timetableId,
  overrideDate,
  period,
  subjectId,
  customLabel,
  classId,
  room,
}: {
  timetableId: string;
  overrideDate: string;
  period: number;
  subjectId: string | null;
  customLabel: string | null;
  classId: string | null;
  room: string | null;
}) {
  const supabase = createClient();

  const { data: existing, error: selectError } = await supabase
    .from("timetable_overrides")
    .select("id")
    .eq("timetable_id", timetableId)
    .eq("override_date", overrideDate)
    .eq("period", period)
    .maybeSingle();
  logSupabaseError("timetable.saveOverride.select", selectError);

  const payload = {
    subject_id: subjectId,
    custom_label: customLabel,
    class_id: classId,
    room,
  };

  if (existing) {
    const { error } = await supabase
      .from("timetable_overrides")
      .update(payload)
      .eq("id", existing.id);
    logSupabaseError("timetable.saveOverride.update", error);
  } else {
    const { error } = await supabase.from("timetable_overrides").insert({
      timetable_id: timetableId,
      override_date: overrideDate,
      period,
      ...payload,
    });
    logSupabaseError("timetable.saveOverride.insert", error);
  }

  revalidatePath("/timetable");
  revalidatePath("/timetable/special");
  revalidatePath("/dashboard");
}

const PERIODS_IN_DAY = [1, 2, 3, 4, 5, 6];

// その日の学校の時間割を、別の曜日のパターンに丸ごと差し替える（例：今日を月曜日の時間割にする）。
// 自分の時間割・担任クラスの時間割の両方に同じ曜日パターンを適用する。
export async function applyDaySwap({
  date,
  sourceDayOfWeek,
  timetableIds,
}: {
  date: string;
  sourceDayOfWeek: number;
  timetableIds: string[];
}) {
  const supabase = createClient();

  for (const timetableId of timetableIds) {
    const { data: recurring, error: recurringError } = await supabase
      .from("timetable_slots")
      .select("period, subject_id, class_id, room")
      .eq("timetable_id", timetableId)
      .eq("day_of_week", sourceDayOfWeek);
    logSupabaseError("timetable.applyDaySwap.select", recurringError);

    const byPeriod = new Map<number, any>();
    (recurring ?? []).forEach((s: any) => byPeriod.set(s.period, s));

    const { data: existingOverrides, error: existingError } = await supabase
      .from("timetable_overrides")
      .select("id, period")
      .eq("timetable_id", timetableId)
      .eq("override_date", date);
    logSupabaseError("timetable.applyDaySwap.existing", existingError);

    const existingByPeriod = new Map<number, string>();
    (existingOverrides ?? []).forEach((o: any) => existingByPeriod.set(o.period, o.id));

    for (const period of PERIODS_IN_DAY) {
      const slot = byPeriod.get(period);
      const payload = {
        subject_id: slot?.subject_id ?? null,
        custom_label: null,
        class_id: slot?.class_id ?? null,
        room: slot?.room ?? null,
      };
      const existingId = existingByPeriod.get(period);
      if (existingId) {
        const { error } = await supabase
          .from("timetable_overrides")
          .update(payload)
          .eq("id", existingId);
        logSupabaseError("timetable.applyDaySwap.update", error);
      } else {
        const { error } = await supabase.from("timetable_overrides").insert({
          timetable_id: timetableId,
          override_date: date,
          period,
          ...payload,
        });
        logSupabaseError("timetable.applyDaySwap.insert", error);
      }
    }
  }

  revalidatePath("/timetable/special");
  revalidatePath("/dashboard");
}

export async function clearOverride({
  timetableId,
  overrideDate,
  period,
}: {
  timetableId: string;
  overrideDate: string;
  period: number;
}) {
  const supabase = createClient();
  const { error } = await supabase
    .from("timetable_overrides")
    .delete()
    .eq("timetable_id", timetableId)
    .eq("override_date", overrideDate)
    .eq("period", period);
  logSupabaseError("timetable.clearOverride", error);
  revalidatePath("/timetable");
  revalidatePath("/timetable/special");
  revalidatePath("/dashboard");
}
