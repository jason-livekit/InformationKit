import Link from "next/link";
import { CATEGORIES } from "./_shared/component-registry";

export default function ComponentsOverview() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-fg0">Components</h1>
        <p className="text-fg2 mt-2 text-sm max-w-2xl">
          A curated showcase of all available prototyping components. Each
          example is fully interactive — click, toggle, and explore.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            href={`/components/${category.slug}`}
            className="group block rounded-lg border border-separator1 bg-bg1 p-5 hover:border-fgAccent1/40 hover:bg-bgAccent1/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-sm font-semibold text-fg0 group-hover:text-fgAccent1 transition-colors">
                {category.title}
              </h2>
              <span className="text-[11px] tabular-nums text-fg3 bg-bg2 rounded-full px-2 py-0.5">
                {category.components.length}
              </span>
            </div>
            <p className="text-xs text-fg3 mb-3">{category.description}</p>
            <div className="flex flex-wrap gap-1">
              {category.components.slice(0, 5).map((comp) => (
                <span
                  key={comp.id}
                  className="text-[10px] text-fg3 bg-bg2 rounded px-1.5 py-0.5"
                >
                  {comp.label}
                </span>
              ))}
              {category.components.length > 5 && (
                <span className="text-[10px] text-fg3 bg-bg2 rounded px-1.5 py-0.5">
                  +{category.components.length - 5} more
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
