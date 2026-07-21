import React, { useState, useEffect, useMemo } from "react";
import { Zap, Save, List, Trash2, Loader2, ArrowLeft } from "lucide-react";

export default function StromTracker() {
  const [view, setView] = useState("form");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    datum: today,
    uhrzeit: "18:00",
    jason: "",
    eltern: "",
  });

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);
    setError("");
    try {
      const result = await window.storage.get("stromverbrauch-eintraege", true);
      if (result && result.value) {
        const parsed = JSON.parse(result.value);
        setEntries(parsed);
      }
    } catch (e) {
      // key not found is expected on first run
    } finally {
      setLoading(false);
    }
  }

  async function saveEntries(next) {
    setSaving(true);
    setError("");
    try {
      const res = await window.storage.set(
        "stromverbrauch-eintraege",
        JSON.stringify(next),
        true
      );
      if (!res) throw new Error("Speichern fehlgeschlagen");
      setEntries(next);
    } catch (e) {
      setError("Speichern hat nicht geklappt. Bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!form.datum || !form.uhrzeit) {
      setError("Bitte Datum und Uhrzeit angeben.");
      return;
    }
    if (form.jason === "" && form.eltern === "") {
      setError("Bitte mindestens einen Zählerstand eintragen.");
      return;
    }
    const newEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      ...form,
    };
    const next = [newEntry, ...entries];
    saveEntries(next);
    setForm({
      datum: today,
      uhrzeit: form.uhrzeit === "18:00" ? "09:00" : "18:00",
      jason: "",
      eltern: "",
    });
  }

  function handleDelete(id) {
    const next = entries.filter((en) => en.id !== id);
    saveEntries(next);
  }

  const withConsumption = useMemo(() => {
    const chronological = [...entries].sort((a, b) => {
      const da = `${a.datum}T${a.uhrzeit || "00:00"}`;
      const db = `${b.datum}T${b.uhrzeit || "00:00"}`;
      return da.localeCompare(db);
    });

    let lastJason = null;
    let lastEltern = null;
    const result = [];

    for (const en of chronological) {
      const jasonVal = en.jason !== "" && en.jason != null ? parseFloat(en.jason) : null;
      const elternVal = en.eltern !== "" && en.eltern != null ? parseFloat(en.eltern) : null;

      const verbrauchJason =
        jasonVal !== null && lastJason !== null ? +(jasonVal - lastJason).toFixed(2) : null;
      const verbrauchEltern =
        elternVal !== null && lastEltern !== null ? +(elternVal - lastEltern).toFixed(2) : null;

      result.push({ ...en, verbrauchJason, verbrauchEltern });

      if (jasonVal !== null) lastJason = jasonVal;
      if (elternVal !== null) lastEltern = elternVal;
    }

    return result.reverse();
  }, [entries]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-xl mx-auto px-4 pb-16">
        {/* Header */}
        <header className="pt-8 pb-6 flex items-center gap-3">
          {view === "list" ? (
            <button
              onClick={() => setView("form")}
              aria-label="Zurück zur Eingabe"
              className="w-11 h-11 rounded-full bg-gray-800 flex items-center justify-center shrink-0 hover:bg-gray-700 active:scale-95 transition"
            >
              <ArrowLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>
          ) : (
            <div className="w-11 h-11 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-yellow-400" strokeWidth={2.5} />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {view === "form" ? "Stromverbrauch" : "Bisherige Einträge"}
            </h1>
            <p className="text-sm text-gray-600">
              Zählerstände 18:00 – 09:00 Uhr
            </p>
          </div>
        </header>

        {view === "form" ? (
          <>
            {/* Form */}
            <form
              onSubmit={handleAdd}
              className="bg-white rounded-lg p-6 shadow-md border border-gray-200 mb-4"
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Datum
                  </label>
                  <input
                    type="date"
                    value={form.datum}
                    onChange={(e) => handleChange("datum", e.target.value)}
                    className="rounded-lg border-2 border-gray-300 px-3 py-2 text-base focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Uhrzeit
                  </label>
                  <input
                    type="time"
                    value={form.uhrzeit}
                    onChange={(e) => handleChange("uhrzeit", e.target.value)}
                    className="rounded-lg border-2 border-gray-300 px-3 py-2 text-base focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Zählerstand Jason
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0.00"
                    value={form.jason}
                    onChange={(e) => handleChange("jason", e.target.value)}
                    className="rounded-lg border-2 border-gray-300 px-3 py-2 text-base focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Zählerstand Eltern
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0.00"
                    value={form.eltern}
                    onChange={(e) => handleChange("eltern", e.target.value)}
                    className="rounded-lg border-2 border-gray-300 px-3 py-2 text-base focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Der Verbrauch je Zähler wird automatisch aus der Differenz zur vorherigen Ablesung berechnet.
              </p>

              {error && (
                <p className="text-sm text-red-600 mb-4 font-semibold">{error}</p>
              )}

              {/* Grüner Button mit schwarzem Text */}
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-green-500 text-black font-bold rounded-lg py-3 text-base hover:bg-green-600 active:scale-95 transition disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Wert speichern
              </button>
            </form>

            {/* Blauer Button */}
            <button
              onClick={() => setView("list")}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold rounded-lg py-3 text-base hover:bg-blue-700 active:scale-95 transition"
            >
              <List className="w-4 h-4" />
              Zur Liste
            </button>
          </>
        ) : (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-600">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : withConsumption.length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center border border-gray-200 shadow-md">
                <p className="text-gray-600">
                  Noch keine Einträge. Der erste Eintrag füllt die Liste.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {withConsumption.map((en) => (
                  <li
                    key={en.id}
                    className="bg-white rounded-lg px-4 py-3 border border-gray-200 shadow-md flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-base font-semibold">
                        {formatDate(en.datum)} · {en.uhrzeit}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Jason: {en.jason || "–"}
                        {en.verbrauchJason !== null ? ` (${signed(en.verbrauchJason)} kWh)` : ""}
                      </p>
                      <p className="text-sm text-gray-600">
                        Eltern: {en.eltern || "–"}
                        {en.verbrauchEltern !== null ? ` (${signed(en.verbrauchEltern)} kWh)` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(en.id)}
                      aria-label="Eintrag löschen"
                      className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-red-600 hover:bg-red-50 active:scale-95 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function signed(n) {
  return n > 0 ? `+${n}` : `${n}`;
}
