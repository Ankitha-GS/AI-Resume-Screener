import { useRef, useState } from "react";
import { errorMessage, uploadResumes } from "../services/api.js";

export default function ResumeUploader({ jobId, onUploaded, Icon }) {
  const input = useRef(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState([]);

  const send = async (fileList) => {
    const files = [...(fileList || [])];
    if (!files.length) return;
    const pdfs = files.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (!pdfs.length) { setError("Please choose PDF resumes."); return; }
    if (pdfs.length !== files.length) setError("Only PDF files are supported. Non-PDF files were skipped.");
    else setError("");
    setBusy(true); setFailed([]);
    try {
      const res = await uploadResumes(jobId, pdfs);
      setFailed(res.failed || []);
      onUploaded(res.uploaded || []);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  };

  return <div className="upload-wrap">
    <div className={`dropzone-modern ${drag ? "drag" : ""} ${busy ? "uploading" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); send(e.dataTransfer.files); }}>
      <div className="upload-symbol"><Icon name="upload" size={23}/></div>
      <strong>{busy ? "Reading your resumes…" : "Drop resume PDFs here"}</strong>
      <span>or choose files from your computer</span>
      <button type="button" className="button button-outline button-small" disabled={busy} onClick={() => input.current?.click()}>Browse files</button>
      <small>PDF format · Multiple files supported</small>
      <input ref={input} type="file" accept="application/pdf,.pdf" multiple hidden onChange={(e) => send(e.target.files)}/>
    </div>
    {busy && <div className="upload-progress"><span/></div>}
    {error && <p className="inline-error" role="alert">{error}</p>}
    {failed.length > 0 && <div className="alert alert-error"><strong>Some files couldn't be processed</strong><ul>{failed.map((f) => <li key={f.filename}>{f.filename}: {f.reason}</li>)}</ul></div>}
  </div>;
}