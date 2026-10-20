import PropTypes from 'prop-types';
import { PageInfoContext } from './pageInfo';

/** Fornece o subtítulo dinâmico do header às páginas montadas dentro do Layout. */
export function PageInfoProvider({ subtitulo, onSubtituloChange, children }) {
  return (
    <PageInfoContext.Provider value={{ subtitulo, setSubtitulo: onSubtituloChange }}>
      {children}
    </PageInfoContext.Provider>
  );
}

PageInfoProvider.propTypes = {
  subtitulo: PropTypes.string,
  onSubtituloChange: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};