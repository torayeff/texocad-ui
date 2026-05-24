interface SlugifyOptions {
  maxLength: number;
  normalize?: boolean;
}

export function slugify(value: string, options: SlugifyOptions): string {
  let slug = value.trim();

  if (options.normalize) {
    slug = slug.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  }

  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, options.maxLength)
    .replace(/^-+|-+$/g, "");
}
