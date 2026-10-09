const LABELS = { skills: "Skills", experience: "Experience", semantic: "AI fit" };

function tone(score) {
  if (score >= 75) return "high";
  if (score >= 50) return "mid";
  return "low";
}

export default function CandidateCard({ rank, m }) {
  const c = m.candidate;
  return (
    <article className="candidate">
      <div className="cand-head">
        <div className={`score ${tone(m.score)}`}>
          <span className="score-num">{Math.round(m.score)}</span>
          <span className="score-cap">of 100</span>
        </div>
        <div>
          <h3>#{rank} {c.name}</h3>
          <p className="muted">
            {[c.current_title, c.email, m.filename].filter(Boolean).join("  |  ")}
          </p>
        </div>
      </div>

      <div className="breakdown" aria-label="Score breakdown">
        {Object.entries(m.breakdown).map(([k, v]) => (
          <div key={k} className="bd-row">
            <span>{LABELS[k] || k}</span>
            <div className="bar"><i style={{ width: `${v.value}%` }} /></div>
            <b>{Math.round(v.value)}</b>
          </div>
        ))}
      </div>

      <p className="explain">{m.explanation}</p>

      <div className="cols">
        <div>
          <h4>Matching skills</h4>
          <div className="chips">
            {m.matching_skills.length ? m.matching_skills.map((s) => <span key={s} className="chip ok">{s}</span>) : <span className="muted">None found</span>}
          </div>
        </div>
        <div>
          <h4>Missing skills</h4>
          <div className="chips">
            {m.missing_skills.length ? m.missing_skills.map((s) => <span key={s} className="chip miss">{s}</span>) : <span className="muted">Nothing missing</span>}
          </div>
        </div>
        <div>
          <h4>Experience fit</h4>
          <p><strong>{m.experience_fit}</strong></p>
          <p className="muted">{m.experience_note}</p>
        </div>
      </div>
    </article>
  );
}
