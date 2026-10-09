import { useRef, useState } from "react";
import { errorMessage, uploadResumes } from "../services/api.js";

export default function ResumeUploader({ jobId, onUploaded }) {
  const input = useRef();
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState([]);

  const send = async (fileList) => {
    const files = [...fileList];
    if (!files.length) return;
    setBusy(true);
    setError("");
    setFailed([]);
    try {
      const res = await uploadResumes(jobId, files);
      setFailed(res.failed);
      onUploaded(res.uploaded);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <div
        className={`dropzone ${drag ? "drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); send(e.dataTransfer.files); }}
      >
        <p>{busy ? "Reading resumes…" : "Drop PDF resumes here"}</p>
        <button type="button" className="btn ghost" disabled={busy} onClick={() => input.current.click()}>
          Choose files
        </button>
        <input ref={input} type="file" accept="application/pdf" multiple hidden onChange={(e) => send(e.target.files)} />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {failed.length > 0 && (
        <ul className="error-list">
          {failed.map((f) => <li key={f.filename}><strong>{f.filename}</strong>: {f.reason}</li>)}
        </ul>
      )}
    </div>
  );
}
