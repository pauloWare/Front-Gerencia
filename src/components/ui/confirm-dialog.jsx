import PropTypes from "prop-types";
import { AlertTriangle } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "./dialog";

/**
 * Confirmação padronizada para operações destrutivas.
 * Substitui o window.confirm do navegador mantendo o MESMO texto de confirmação
 * e o MESMO contrato de ação (aoConfirmar só é chamado quando o usuário confirma).
 */
const ConfirmDialog = ({
  open,
  titulo = "Confirmar ação",
  mensagem,
  rotuloConfirmar = "Confirmar",
  processando = false,
  aoConfirmar,
  aoCancelar,
}) => (
  <Dialog
    open={open}
    onOpenChange={(aberto) => {
      if (!aberto) aoCancelar();
    }}
  >
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          <span className="dialog-title-icon">
            <AlertTriangle size={18} aria-hidden="true" /> {titulo}
          </span>
        </DialogTitle>
        <DialogDescription>{mensagem}</DialogDescription>
      </DialogHeader>
      <DialogFooter className="dialog-footer">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={aoCancelar}
          disabled={processando}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={aoConfirmar}
          disabled={processando}
        >
          {processando ? "Processando..." : rotuloConfirmar}
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  titulo: PropTypes.string,
  mensagem: PropTypes.string.isRequired,
  rotuloConfirmar: PropTypes.string,
  processando: PropTypes.bool,
  aoConfirmar: PropTypes.func.isRequired,
  aoCancelar: PropTypes.func.isRequired,
};

export { ConfirmDialog };