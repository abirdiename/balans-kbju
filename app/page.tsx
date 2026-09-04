"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Nutrition = { calories: number; protein: number; fat: number; carbs: number };
type Entry = Nutrition & { id: number; name: string; meal: string; createdAt: string };
type DayData = { goals: Nutrition; entries: Entry[] };

const DEFAULT_GOALS: Nutrition = { calories: 2100, protein: 120, fat: 70, carbs: 240 };
const EMPTY_FOOD = { name: "", meal: "Завтрак", calories: "", protein: "", fat: "", carbs: "" };
const nutrients = [
  { key: "calories", label: "Калории", unit: "ккал", color: "#ff6b55" },
  { key: "protein", label: "Белки", unit: "г", color: "#8b6cff" },
  { key: "fat", label: "Жиры", unit: "г", color: "#e9aa37" },
  { key: "carbs", label: "Углеводы", unit: "г", color: "#31a57b" },
] as const;

const isoDate = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

function getClientId() {
  const key = "balans-client-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function Home() {
  const [date, setDate] = useState(isoDate());
  const [data, setData] = useState<DayData>({ goals: DEFAULT_GOALS, entries: [] });
  const [food, setFood] = useState(EMPTY_FOOD);
  const [goalDraft, setGoalDraft] = useState(DEFAULT_GOALS);
  const [showGoals, setShowGoals] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadDay = async (selectedDate: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/day?clientId=${encodeURIComponent(getClientId())}&date=${selectedDate}`);
      if (!response.ok) throw new Error("Не удалось загрузить день");
      const next = (await response.json()) as DayData;
      setData(next);
      setGoalDraft(next.goals);
    } catch {
      setError("Не получилось связаться с хранилищем. Попробуйте обновить страницу.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDay(date); }, [date]);

  const totals = useMemo(() => data.entries.reduce<Nutrition>((sum, item) => ({
    calories: sum.calories + item.calories,
    protein: sum.protein + item.protein,
    fat: sum.fat + item.fat,
    carbs: sum.carbs + item.carbs,
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 }), [data.entries]);

  const changeDate = (days: number) => {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + days);
    setDate(isoDate(next));
  };

  const addFood = async (event: FormEvent) => {
    event.preventDefault();
    if (!food.name.trim() || !food.calories) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: getClientId(), date, ...food }),
      });
      if (!response.ok) throw new Error();
      const { entry } = await response.json();
      setData((current) => ({ ...current, entries: [...current.entries, entry] }));
      setFood({ ...EMPTY_FOOD, meal: food.meal });
    } catch { setError("Не удалось сохранить приём пищи."); }
    finally { setSaving(false); }
  };

  const deleteEntry = async (id: number) => {
    const previous = data.entries;
    setData((current) => ({ ...current, entries: current.entries.filter((entry) => entry.id !== id) }));
    const response = await fetch(`/api/entries?id=${id}&clientId=${encodeURIComponent(getClientId())}`, { method: "DELETE" });
    if (!response.ok) {
      setData((current) => ({ ...current, entries: previous }));
      setError("Не удалось удалить запись.");
    }
  };

  const saveGoals = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: getClientId(), ...goalDraft }),
      });
      if (!response.ok) throw new Error();
      setData((current) => ({ ...current, goals: goalDraft }));
      setShowGoals(false);
    } catch { setError("Не удалось сохранить цели."); }
    finally { setSaving(false); }
  };

  const displayDate = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", weekday: "long" })
    .format(new Date(`${date}T12:00:00`));

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Баланс — наверх"><span>Б</span>Баланс</a>
        <button className="goal-button" onClick={() => setShowGoals(true)}><span>◎</span> Мои цели</button>
      </header>

      <section className="page" id="top">
        <div className="date-row">
          <div>
            <p className="eyebrow">Дневник питания</p>
            <h1>{date === isoDate() ? "Сегодня" : displayDate.split(",")[0]}</h1>
          </div>
          <div className="date-picker" aria-label="Выбор дня">
            <button onClick={() => changeDate(-1)} aria-label="Предыдущий день">←</button>
            <button className="date-label" onClick={() => setDate(isoDate())}>{displayDate}</button>
            <button onClick={() => changeDate(1)} aria-label="Следующий день">→</button>
          </div>
        </div>

        {error && <div className="error" role="alert">{error}</div>}

        <section className="summary-card" aria-label="Итоги дня">
          <div className="summary-heading">
            <div><p className="eyebrow">Итоги дня</p><h2>{loading ? "Загружаем…" : totals.calories === 0 ? "Начнём с первого приёма пищи" : "Вы на верном пути"}</h2></div>
            <div className={`status ${totals.calories > data.goals.calories ? "over" : ""}`}>
              {totals.calories > data.goals.calories ? "Перебор" : "Осталось"} <strong>{Math.round(Math.abs(data.goals.calories - totals.calories))} ккал</strong>
            </div>
          </div>
          <div className="nutrient-grid">
            {nutrients.map((item) => {
              const eaten = totals[item.key];
              const goal = data.goals[item.key];
              const percent = goal ? Math.round((eaten / goal) * 100) : 0;
              const diff = goal - eaten;
              const roundedDiff = Math.round(Math.abs(diff));
              return <article className="nutrient" key={item.key} style={{ "--accent": item.color } as React.CSSProperties}>
                <div className="ring" style={{ "--progress": `${Math.min(percent, 100) * 3.6}deg` } as React.CSSProperties}><span>{percent}%</span></div>
                <div className="nutrient-copy"><h3>{item.label}</h3><p><strong>{eaten}</strong> / {goal} {item.unit}</p><small className={diff < 0 ? "negative" : ""}>{diff < 0 ? `Перебор ${roundedDiff}` : `Ещё ${roundedDiff}`} {item.unit}</small></div>
              </article>;
            })}
          </div>
        </section>

        <div className="content-grid">
          <section className="panel add-panel">
            <div className="panel-title"><div><p className="eyebrow">Новая запись</p><h2>Что вы ели?</h2></div><span className="plus">+</span></div>
            <form onSubmit={addFood}>
              <label>Название продукта или блюда<input autoFocus value={food.name} onChange={(e) => setFood({ ...food, name: e.target.value })} placeholder="Например, творог с ягодами" required /></label>
              <label>Приём пищи<select value={food.meal} onChange={(e) => setFood({ ...food, meal: e.target.value })}><option>Завтрак</option><option>Обед</option><option>Ужин</option><option>Перекус</option></select></label>
              <div className="macro-inputs">
                {nutrients.map((item) => <label key={item.key}>{item.label}<span><input inputMode="decimal" type="number" min="0" step="0.1" placeholder="0" value={food[item.key]} onChange={(e) => setFood({ ...food, [item.key]: e.target.value })} required={item.key === "calories"} />{item.unit}</span></label>)}
              </div>
              <button className="primary" disabled={saving}>{saving ? "Сохраняю…" : "Добавить в дневник"}</button>
            </form>
          </section>

          <section className="panel diary-panel">
            <div className="panel-title"><div><p className="eyebrow">За день</p><h2>Ваш рацион</h2></div><span className="count">{data.entries.length}</span></div>
            {data.entries.length === 0 && !loading ? <div className="empty"><span>◒</span><h3>Пока здесь пусто</h3><p>Добавьте первый приём пищи — итоги пересчитаются сразу.</p></div> :
              <div className="entries">{data.entries.map((entry) => <article className="entry" key={entry.id}>
                <div className="meal-mark">{entry.meal.slice(0, 1)}</div>
                <div className="entry-main"><small>{entry.meal}</small><h3>{entry.name}</h3><p>Б {entry.protein} · Ж {entry.fat} · У {entry.carbs}</p></div>
                <strong>{entry.calories}<small> ккал</small></strong>
                <button className="delete" onClick={() => deleteEntry(entry.id)} aria-label={`Удалить ${entry.name}`}>×</button>
              </article>)}</div>}
          </section>
        </div>
      </section>

      {showGoals && <div className="modal-backdrop" onMouseDown={() => setShowGoals(false)}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="goals-title" onMouseDown={(e) => e.stopPropagation()}>
          <button className="close" onClick={() => setShowGoals(false)} aria-label="Закрыть">×</button>
          <p className="eyebrow">Персональные ориентиры</p><h2 id="goals-title">Мои цели на день</h2><p className="modal-intro">Задайте значения, к которым хотите прийти. Они применятся ко всем дням.</p>
          <form onSubmit={saveGoals} className="goal-form">
            {nutrients.map((item) => <label key={item.key}>{item.label}<span><input type="number" min="0" step="1" value={goalDraft[item.key]} onChange={(e) => setGoalDraft({ ...goalDraft, [item.key]: Number(e.target.value) })} />{item.unit}</span></label>)}
            <button className="primary" disabled={saving}>Сохранить цели</button>
          </form>
        </section>
      </div>}
    </main>
  );
}
