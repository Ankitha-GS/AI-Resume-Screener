import { useState } from "react";
import { createJob, errorMessage } from "../services/api.js";

export default function JobForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onCreated(await createJob({ title, description }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>Create a job</h2>
      <label>
        Job title
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Backend Engineer" required minLength={2} />
      </label>
      <label>
        Job description
        <textarea rows={9} value={description} onChange={(e) => setDescription(e.target.value)} required minLength={30}
          placeholder="Paste the full description: responsibilities, required skills, years of experience…" />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? "Analysing job…" : "Create job"}</button>
    </form>
  );
}
