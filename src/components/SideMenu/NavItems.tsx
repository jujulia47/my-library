"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  BookOpenIcon,
  Squares2X2Icon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  ArchiveBoxIcon,
  HomeIcon,
  TagIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  CubeIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { BookOpenIcon as BookOpenSolid } from "@heroicons/react/24/solid";

type NavItem = {
  href: string;
  label: string;
  Icon: typeof BookOpenIcon;
  /** Sessão 17.8: cor opcional do ícone (override do herdado do label). */
  iconClassName?: string;
};

const items: NavItem[] = [
  { href: "/", label: "Início", Icon: HomeIcon },
  { href: "/today", label: "Diário de hoje", Icon: PencilSquareIcon },
  { href: "/book", label: "Livros", Icon: BookOpenIcon },
  { href: "/serie", label: "Séries", Icon: Squares2X2Icon },
  { href: "/quote", label: "Citações", Icon: ChatBubbleLeftRightIcon },
  { href: "/author", label: "Autores", Icon: UserCircleIcon },
  { href: "/wishlist", label: "Wishlist", Icon: HeartIcon },
  { href: "/collection", label: "Coleções", Icon: ArchiveBoxIcon },
  // Sessão 17.8: ícone "Biblioteca" trocado de BuildingLibraryIcon (apagado)
  // pra BookOpenIcon solid em gold-deep — mais nítido na sidebar.
  {
    href: "/library",
    label: "Biblioteca",
    Icon: BookOpenSolid,
    iconClassName: "text-gold-deep",
  },
  { href: "/year", label: "Resumo do ano", Icon: CalendarDaysIcon },
  { href: "/category", label: "Categorias", Icon: TagIcon },
  { href: "/box", label: "Boxes / kits", Icon: CubeIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavItems({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-1">
      {items.map(({ href, label, Icon, iconClassName }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-base transition-colors duration-150 border-l-2",
                active
                  ? "bg-ivory-light text-ink-deep border-gold font-medium"
                  : "text-ink-soft border-transparent hover:bg-paper-soft hover:text-ink-deep",
              )}
            >
              <Icon className={clsx("w-5 h-5", iconClassName)} />
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
