import React from "react";
import { ImagePlus, X } from "lucide-react";

/**
 * Área de upload de imagem integrada ao sistema.
 * Visual de drop zone com ícone Lucide e preview da imagem selecionada.
 *
 * Props:
 * - id: id usado no input file / label
 * - onChange: event handler do input file (a lógica de leitura fica na página)
 * - preview: string base64 ou '' da imagem selecionada
 * - onRemove: handler para remover a imagem
 * - hint: texto auxiliar abaixo do botão (opcional)
 */
const UploadInput = React.forwardRef(
  ({ id, onChange, preview = "", onRemove, hint = "JPG, PNG ou GIF • Máximo 5 MB" }, ref) => (
    <div className="upload-zone">
      <input
        ref={ref}
        id={id}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="upload-input-hidden"
      />

      {preview ? (
        <div className="upload-preview">
          <img src={preview} alt="Preview da imagem" />
          <button type="button" className="upload-remove" onClick={onRemove} title="Remover imagem">
            <X size={14} />
          </button>
        </div>
      ) : (
        <label htmlFor={id} className="upload-label">
          <div className="upload-icon">
            <ImagePlus size={22} />
          </div>
          <span className="upload-title">Clique para selecionar uma imagem</span>
          <span className="upload-hint">{hint}</span>
        </label>
      )}
    </div>
  )
);
UploadInput.displayName = "UploadInput";

export { UploadInput };
