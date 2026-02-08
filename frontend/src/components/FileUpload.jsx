import { useState } from "react";

export default function FileUpload({ label, onSubmit }) {
  const [file, setFile] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    onSubmit(file);
  }

  return (
    <form className="upload" onSubmit={handleSubmit}>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button className="primary">{label}</button>
    </form>
  );
}
