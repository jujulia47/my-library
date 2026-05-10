import GlobalSearch from "./GlobalSearch";

/**
 * Topbar fixa no desktop com search global. No mobile o search aparece via
 * link/ícone no header existente do SideMenuMobile (vai pra /search).
 *
 * Posicionada acima do conteúdo `lg:left-60` pra alinhar com o sidebar; z-30
 * pra ficar abaixo do drawer mobile (z-50) mas acima do conteúdo.
 */
export default function TopBar() {
  return (
    <header className="hidden lg:flex fixed top-0 left-60 right-0 h-14 bg-paper border-b border-border z-30 items-center px-6">
      <GlobalSearch />
    </header>
  );
}
