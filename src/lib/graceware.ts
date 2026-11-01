export const gracewareCategories = ["Dinner Sets", "Gift Sets", "Tray Sets", "Bath Sets", "Hot Pots", "Household"] as const;
export type GracewareCategory = (typeof gracewareCategories)[number];

export type GracewareProduct = {
  id: number;
  name: string;
  category: GracewareCategory;
  categories: GracewareCategory[];
  sourceUrl: string;
  image: string;
};

export function filterGraceware(
  products: GracewareProduct[],
  category: string,
  search: string,
): GracewareProduct[] {
  const term = search.trim().toLocaleLowerCase();
  return products.filter((product) =>
    (category === "All" || product.categories.some((value) => value === category)) &&
    (!term || product.name.toLocaleLowerCase().includes(term)),
  );
}