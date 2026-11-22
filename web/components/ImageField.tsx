'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
} from 'react';

type ImageFieldProps = {
  value: string;
  onChange: (next: string | File) => void;
};

type Mode = 'upload' | 'url';

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Campo de imagen con el mismo comportamiento que el CRM de clientes:
 * permite subir un archivo (clic o arrastrar) con vista previa, o pegar una URL.
 * El archivo se entrega al formulario; la conversión a Base64 es solo local.
 */
export function ImageField({ value, onChange }: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('upload');
  const [preview, setPreview] = useState(value);
  const [hasFile, setHasFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFile) setPreview(value);
  }, [value, hasFile]);

  function openPicker() {
    inputRef.current?.click();
  }

  function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('La imagen no puede superar los 5 MB.');
      return;
    }

    setError(null);
    setHasFile(true);
    onChange(file);

    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0]);
    event.target.value = '';
  }

  function handleUrl(event: ChangeEvent<HTMLInputElement>) {
    const url = event.target.value;
    setError(null);
    setHasFile(false);
    setPreview(url);
    onChange(url);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    handleFile(event.dataTransfer.files[0]);
  }

  function clearImage(event?: MouseEvent<HTMLButtonElement>) {
    event?.stopPropagation();
    setError(null);
    setHasFile(false);
    setPreview('');
    if (inputRef.current) inputRef.current.value = '';
    onChange('');
  }

  function selectMode(next: Mode) {
    setMode(next);
    setError(null);
    if (next === 'url' && hasFile) {
      setHasFile(false);
      setPreview(value);
      onChange(value);
    }
  }

  return (
    <div className="field">
      <span>Imagen</span>

      <div className="image-field">
        <div className="image-field-tabs" role="group" aria-label="Modo de imagen">
          <button
            type="button"
            className={mode === 'upload' ? 'image-field-tab is-active' : 'image-field-tab'}
            onClick={() => selectMode('upload')}
          >
            Subir
          </button>
          <button
            type="button"
            className={mode === 'url' ? 'image-field-tab is-active' : 'image-field-tab'}
            onClick={() => selectMode('url')}
          >
            URL
          </button>
        </div>

        {mode === 'upload' ? (
          <div
            className={dragOver ? 'image-dropzone is-dragover' : 'image-dropzone'}
            onClick={openPicker}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="image-field-file"
              onChange={handleInputChange}
            />

            {preview ? (
              <img src={preview} alt="Vista previa" className="image-dropzone-preview" />
            ) : (
              <div className="image-dropzone-placeholder">
                <span className="image-dropzone-icon" aria-hidden="true">＋</span>
                <strong>Haz clic o arrastra una imagen</strong>
                <span>JPG, PNG, WEBP o GIF · máx. 5 MB</span>
              </div>
            )}

            {preview && (
              <button
                type="button"
                className="image-field-clear"
                title="Quitar imagen"
                onClick={clearImage}
              >
                Quitar imagen
              </button>
            )}
          </div>
        ) : (
          <div className="image-url-field">
            <input
              type="url"
              value={hasFile ? '' : value}
              onChange={handleUrl}
              placeholder="https://imagen.com/..."
              maxLength={500}
            />
            {preview && <img src={preview} alt="Vista previa" className="image-url-preview" />}
            {preview && (
              <button type="button" className="image-field-clear" onClick={clearImage}>
                Quitar
              </button>
            )}
          </div>
        )}

        {error && <p className="image-field-error">{error}</p>}
      </div>
    </div>
  );
}
