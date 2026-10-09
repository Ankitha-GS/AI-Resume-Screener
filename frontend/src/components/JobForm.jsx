import { useState } from "react";
import { createJob, errorMessage } from "../services/api.js";

export default function JobForm({ onCreated, Icon }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    try { onCreated(await createJob({ title: title.trim(), description: description.trim() })); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return <form className="job-form" onSubmit={submit}>
    <div className="form-field"><label htmlFor="job-title">Role title <span>REQUIRED</span></label><input id="job-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Customer Success Manager" required minLength={2} maxLength={200}/></div>
    <div className="form-field"><label htmlFor="job-description">Job description <span>REQUIRED</span></label><textarea id="job-description" rows={7} value={description} onChange={(e) => setDescription(e.target.value)} required minLength={30} placeholder="Paste the responsibilities, required qualifications, experience expectations, and what success looks like in this role…"/><div className="field-hint">Include the full description for a more useful assessment.</div></div>
    {error && <div className="alert alert-error" role="alert">{error}</div>}
    <button className="button button-dark button-full" disabled={busy}>{busy ? <><span className="button-spinner"/>Analysing the role…</> : <>Create screening <Icon name="arrow" size={17}/></>}</button>
    <p className="form-footnote"><Icon name="check" size={14}/> No industry-specific template required.</p>
  </form>;
}