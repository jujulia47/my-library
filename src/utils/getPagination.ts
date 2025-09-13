import { redirect } from "next/navigation";

interface PaginationResult<T> {
  currentItems: T[];
  validPage: number;
  totalPages: number;
}

export async function getPagination<T>({
  items,
  searchParams,
  itemsPerPage,
  baseUrl,
}: {
  items: T[];
  searchParams?: { page?: string | string[] };
  itemsPerPage: number;
  baseUrl: string;
}): Promise<PaginationResult<T>> {

  const pageParam = (await searchParams)?.page;
  const pageString = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const currentPage = parseInt(pageString || "1", 10);
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  if (currentPage !== validPage) {
    redirect(`${baseUrl}?page=${validPage}`);
  }

  const firstItemIndex = (validPage - 1) * itemsPerPage;
  const lastItemIndex = validPage * itemsPerPage;

  return {
    currentItems: items.slice(firstItemIndex, lastItemIndex),
    validPage,
    totalPages,
  };
}
