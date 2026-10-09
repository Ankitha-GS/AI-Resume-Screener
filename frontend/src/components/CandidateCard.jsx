const LABELS = { skills: "Requirements", experience: "Experience", semantic: "Contextual fit" };
function tone(score) { if (score >= 75) return "high"; if (score >= 50) return "mid"; return "low"; }

export default function CandidateCard({ rank, m, Icon }) {
  const c = m.candidate || {};
  const score = Math.round(m.score || 0);
  const verdict = score >= 75 ? "Higher alignment" : score >= 50 ? "Partial alignment" : "Lower alignment";
  return <article className="candidate-card">
    <div className="candidate-rank">{String(rank).padStart(2, "0")}</div>
    <div className="candidate-content">
      <div className="candidate-topline">
        <div className="candidate-identity"><span className={`candidate-avatar avatar-${rank % 4}`}>{(c.name || "?").trim().charAt(0).toUpperCase()}</span><div><h3>{c.name || "Unnamed candidate"}</h3><p>{[c.current_title, c.email, m.filename].filter(Boolean).join(" · ")}</p></div></div>
        <div className={`match-score ${tone(score)}`}><strong>{score}<small>%</small></strong><span>overall fit</span></div>
      </div>
      <div className="candidate-meter"><span style={{ width: `${Math.max(0, Math.min(100, score))}%` }}/></div>
      <div className="candidate-verdict"><span className={`verdict-dot ${tone(score)}`}/><strong>{verdict}</strong><span className="verdict-divider">·</span><span>{m.experience_fit || "Experience not assessed"}</span></div>
      <p className="candidate-explanation">{m.explanation || "No additional explanation was returned."}</p>
      <div className="score-breakdown">{Object.entries(m.breakdown || {}).map(([k, v]) => <div className="breakdown-item" key={k}><span>{LABELS[k] || k}</span><strong>{Math.round(v.value)}<small>/100</small></strong><div className="mini-track"><span style={{ width: `${Math.max(0, Math.min(100, v.value))}%` }}/></div><small className="weight-label">{Math.round((v.weight || 0) * 100)}% weight</small></div>)}</div>
      <div className="candidate-evidence-grid">
        <section><div className="evidence-heading"><span className="evidence-symbol positive"><Icon name="check" size={14}/></span><h4>Supported requirements</h4><span className="evidence-count">{m.matching_skills?.length || 0}</span></div><div className="evidence-chips">{m.matching_skills?.length ? m.matching_skills.map((s) => <span className="evidence-chip matched" key={s}>{s}</span>) : <p className="subtle-copy">No supported requirements listed.</p>}</div></section>
        <section><div className="evidence-heading"><span className="evidence-symbol partial">!</span><h4>Unconfirmed requirements</h4><span className="evidence-count">{m.missing_skills?.length || 0}</span></div><div className="evidence-chips">{m.missing_skills?.length ? m.missing_skills.map((s) => <span className="evidence-chip missing" key={s}>{s}</span>) : <p className="subtle-copy">No unmatched required items.</p>}</div></section>
      </div>
      {m.experience_note && <div className="experience-note"><strong>Experience note</strong><p>{m.experience_note}</p></div>}
    </div>
  </article>;
}