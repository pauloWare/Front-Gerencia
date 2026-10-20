import { createContext, useContext, useEffect } from 'react';

// ==============================================================================
// PageInfo — subtítulo dinâmico do header (page-header) por página.
//
// O Layout fornece o contexto (PageInfoProvider) em volta do <Outlet />;
// páginas/formulários publicam o subtítulo via usePageSubtitle enquanto
// estiverem montados. Sem provider, o contexto decai para no-ops.
// ==============================================================================
export const PageInfoContext = createContext({ subtitulo: null, setSubtitulo: () => {} });

export function usePageInfo() {
  return useContext(PageInfoContext);
}

/** Publica o subtítulo do header enquanto o componente chamador estiver montado. */
export function usePageSubtitle(subtitulo) {
  const { setSubtitulo } = usePageInfo();
  useEffect(() => {
    setSubtitulo(subtitulo ?? null);
    return () => setSubtitulo(null);
  }, [subtitulo, setSubtitulo]);
}