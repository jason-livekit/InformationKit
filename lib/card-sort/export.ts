import type { AnalysisModel } from './analysis';
import type { DendroNode } from './cluster';

/**
 * Serializers for the analysis model. Two audiences:
 *  - `toCSV` — a single view as a spreadsheet, for humans / Excel / Sheets.
 *  - `toMarkdown` / `toJSON` — the same data primed for an LLM. These lead with
 *    a plain-language context block (what a card sort is, what each metric
 *    means, this study's shape) because the whole value to an AI agent is
 *    knowing what it's looking at before it reasons about it.
 */

export type AnalysisScope =
  | 'cards'
  | 'categories'
  | 'grid'
  | 'similarity'
  | 'dendrograms'
  | 'all';

export const SCOPE_LABELS: Record<AnalysisScope, string> = {
  cards: 'Cards',
  categories: 'Categories',
  grid: 'Standardization grid',
  similarity: 'Similarity matrix',
  dendrograms: 'Dendrograms',
  all: 'Full analysis',
};

// ── CSV ──────────────────────────────────────────────────────────────────────

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRows(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}

export function toCSV(model: AnalysisModel, scope: AnalysisScope): string {
  switch (scope) {
    case 'cards': {
      const rows: (string | number)[][] = [
        ['Card', 'Context', 'Categories sorted into', 'Frequency', 'Avg position', 'Top categories'],
      ];
      for (const r of model.cardRows) {
        const top = r.categories
          .map((c) => `${c.name} (freq ${c.frequency}, pos ${c.avgPosition})`)
          .join('; ');
        rows.push([r.card.label, r.card.context ?? '', r.categoryCount, r.frequency, r.avgPosition, top]);
      }
      return csvRows(rows);
    }
    case 'categories': {
      const rows: (string | number)[][] = [
        ['Category', 'Standardized', 'Distinct cards', 'Participants', 'Card', 'Card frequency', 'Card avg position'],
      ];
      for (const c of model.categoryRows) {
        if (c.cards.length === 0) {
          rows.push([c.name, c.standardized ? 'yes' : 'no', c.cardCount, c.participantCount, '', '', '']);
          continue;
        }
        for (const m of c.cards) {
          rows.push([
            c.name,
            c.standardized ? 'yes' : 'no',
            c.cardCount,
            c.participantCount,
            m.card.label,
            m.frequency,
            m.avgPosition,
          ]);
        }
      }
      return csvRows(rows);
    }
    case 'grid': {
      const header = ['Card', ...model.grid.columns.map((c) => c.name)];
      const rows: (string | number)[][] = [header];
      for (const r of model.grid.rows) {
        rows.push([
          r.card.label,
          ...model.grid.columns.map((c) => r.countsByColumn[c.id] ?? 0),
        ]);
      }
      return csvRows(rows);
    }
    case 'similarity': {
      const header = ['', ...model.similarity.order.map((c) => c.label)];
      const rows: (string | number)[][] = [header];
      model.similarity.order.forEach((row, i) => {
        rows.push([row.label, ...model.similarity.matrix[i]!]);
      });
      return csvRows(rows);
    }
    case 'dendrograms': {
      // A flat edge list is the most spreadsheet-friendly tree encoding.
      const rows: (string | number)[][] = [['Method', 'Merge agreement %', 'Cluster members']];
      const walk = (method: string, node: DendroNode | null) => {
        if (!node || node.kind === 'leaf') return;
        rows.push([method, node.height, node.leaves.map(labelFor(model)).join(' | ')]);
        walk(method, node.left);
        walk(method, node.right);
      };
      walk('Actual agreement', model.dendrograms.actual);
      walk('Best merge', model.dendrograms.bestMerge);
      return csvRows(rows);
    }
    case 'all':
    default: {
      return (
        [
          '# Cards',
          toCSV(model, 'cards'),
          '',
          '# Categories',
          toCSV(model, 'categories'),
          '',
          '# Standardization grid',
          toCSV(model, 'grid'),
          '',
          '# Similarity matrix',
          toCSV(model, 'similarity'),
        ].join('\n')
      );
    }
  }
}

// ── Shared label helper ──────────────────────────────────────────────────────

function labelFor(model: AnalysisModel) {
  const byId = new Map(model.cards.map((c) => [c.id, c.label]));
  return (id: string) => byId.get(id) ?? id;
}

// ── Markdown (LLM-primed) ─────────────────────────────────────────────────────

function mdTable(header: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const head = `| ${header.map(esc).join(' | ')} |`;
  const sep = `| ${header.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.map(esc).join(' | ')} |`).join('\n');
  return [head, sep, body].join('\n');
}

function contextPreamble(model: AnalysisModel, scope: AnalysisScope): string {
  const lines = [
    `You are looking at results from an **open card sort** study analyzed in Information Kit.`,
    ``,
    `In a card sort, participants group a set of cards (concepts/terms) into categories they name themselves. This reveals how people expect information to be organized — useful for designing navigation, taxonomies, and information architecture.`,
    ``,
    `**Study:** ${model.study.name}`,
  ];
  if (model.study.description) lines.push(`**Goal:** ${model.study.description}`);
  lines.push(
    `**Participants:** ${model.totalParticipants}`,
    `**Cards:** ${model.cards.length}`,
    `**Standardized categories defined:** ${model.standardizedCategoryCount}`,
    ``,
    `**How to read the metrics:**`,
    `- *Frequency* — how many participants did the thing in question (placed a card, used a category).`,
    `- *Position* — a card's average 1-based rank within a category (1 = sorted first/most important).`,
    `- *Similarity %* — the share of participants who put two cards in the same category (0–100).`,
    `- *Standardization* — merging differently-worded categories that mean the same thing into one canonical category.`,
    `- *Dendrogram* — hierarchical clustering of cards by agreement; the higher the merge %, the more participants agreed those cards belong together.`,
  );
  lines.push('', `_This export covers: **${SCOPE_LABELS[scope]}**._`);
  return lines.join('\n');
}

function mdCards(model: AnalysisModel): string {
  const rows = model.cardRows.map((r) => [
    r.card.label,
    r.categoryCount,
    r.frequency,
    r.avgPosition,
    r.categories.map((c) => `${c.name} (${c.frequency}× pos ${c.avgPosition})`).join(', ') || '—',
  ]);
  return [
    `## Cards`,
    `For each card: how many distinct categories it was sorted into, how many participants sorted it, its average position, and where it landed.`,
    ``,
    mdTable(['Card', 'Categories', 'Frequency', 'Avg position', 'Sorted into'], rows),
  ].join('\n');
}

function mdCategories(model: AnalysisModel): string {
  const sections = model.categoryRows.map((c) => {
    const tag = c.standardized ? ' _(standardized)_' : '';
    const agreement = c.agreement === null ? '—' : `${Math.round(c.agreement * 100)}%`;
    const table = mdTable(
      ['Card', 'Frequency', 'Avg position'],
      c.cards.map((m) => [m.card.label, m.frequency, m.avgPosition]),
    );
    return [
      `### ${c.name}${tag}`,
      `${c.cardCount} distinct card(s) · ${c.participantCount} participant(s) · agreement ${agreement}`,
      ``,
      table,
    ].join('\n');
  });
  return [
    `## Categories`,
    `Each category participants created, the cards inside it, and how often each card appeared. Standardized categories merge multiple raw labels.`,
    ``,
    sections.join('\n\n'),
  ].join('\n');
}

function mdGrid(model: AnalysisModel): string {
  const header = ['Card', ...model.grid.columns.map((c) => c.name)];
  const rows = model.grid.rows.map((r) => [
    r.card.label,
    ...model.grid.columns.map((c) => r.countsByColumn[c.id] ?? 0),
  ]);
  return [
    `## Standardization grid`,
    `Cards as rows and standardized categories as columns. Cell values are participant counts (out of ${model.totalParticipants}).`,
    ``,
    mdTable(header, rows),
  ].join('\n');
}

function mdSimilarity(model: AnalysisModel): string {
  const header = ['', ...model.similarity.order.map((c) => c.label)];
  const rows = model.similarity.order.map((row, i) => [
    row.label,
    ...model.similarity.matrix[i]!.map((v) => String(v)),
  ]);
  return [
    `## Similarity matrix`,
    `Percentage of participants who placed each pair of cards in the same category. Cards are ordered by clustering, so high values cluster near the diagonal.`,
    ``,
    mdTable(header, rows),
  ].join('\n');
}

function dendroToText(node: DendroNode | null, label: (id: string) => string, depth = 0): string {
  if (!node) return '_(not enough data)_';
  const pad = '  '.repeat(depth);
  if (node.kind === 'leaf') return `${pad}- ${label(node.cardId)}`;
  return [
    `${pad}- ⤚ merge @ ${node.height}% agreement`,
    dendroToText(node.left, label, depth + 1),
    dendroToText(node.right, label, depth + 1),
  ].join('\n');
}

function mdDendrograms(model: AnalysisModel): string {
  const label = labelFor(model);
  return [
    `## Dendrograms`,
    `Hierarchical clustering of cards by agreement. *Actual agreement* (skeptical) only keeps a cluster high when every member co-occurs; *best merge* makes softer assumptions and works better with few participants.`,
    ``,
    `### Actual agreement method`,
    '```',
    dendroToText(model.dendrograms.actual, label),
    '```',
    ``,
    `### Best merge method`,
    '```',
    dendroToText(model.dendrograms.bestMerge, label),
    '```',
  ].join('\n');
}

function mdSection(model: AnalysisModel, scope: AnalysisScope): string {
  switch (scope) {
    case 'cards':
      return mdCards(model);
    case 'categories':
      return mdCategories(model);
    case 'grid':
      return mdGrid(model);
    case 'similarity':
      return mdSimilarity(model);
    case 'dendrograms':
      return mdDendrograms(model);
    case 'all':
      return [
        mdCards(model),
        mdCategories(model),
        mdGrid(model),
        mdSimilarity(model),
        mdDendrograms(model),
      ].join('\n\n');
  }
}

const ASK_PROMPT = [
  `---`,
  `**What I'd like help with:** Interpret these results. Identify the strongest clusters and any cards with weak or split agreement, then propose a clear information architecture (category names + the cards under each) with a short rationale. Flag cards that don't fit anywhere and suggest how to handle them.`,
].join('\n');

export function toMarkdown(model: AnalysisModel, scope: AnalysisScope): string {
  if (model.totalParticipants === 0) {
    return `${contextPreamble(model, scope)}\n\n_No submissions yet — there is no data to analyze._`;
  }
  return [contextPreamble(model, scope), '', mdSection(model, scope), '', ASK_PROMPT].join('\n');
}

// ── JSON (LLM-primed) ─────────────────────────────────────────────────────────

function jsonData(model: AnalysisModel, scope: AnalysisScope): Record<string, unknown> {
  const cards = () =>
    model.cardRows.map((r) => ({
      card: r.card.label,
      context: r.card.context,
      categoriesSortedInto: r.categoryCount,
      frequency: r.frequency,
      avgPosition: r.avgPosition,
      categories: r.categories.map((c) => ({
        name: c.name,
        standardized: c.standardized,
        frequency: c.frequency,
        avgPosition: c.avgPosition,
      })),
    }));
  const categories = () =>
    model.categoryRows.map((c) => ({
      name: c.name,
      standardized: c.standardized,
      distinctCards: c.cardCount,
      participants: c.participantCount,
      agreement: c.agreement,
      cards: c.cards.map((m) => ({
        card: m.card.label,
        frequency: m.frequency,
        avgPosition: m.avgPosition,
      })),
    }));
  const grid = () => ({
    columns: model.grid.columns.map((c) => c.name),
    rows: model.grid.rows.map((r) => ({
      card: r.card.label,
      counts: Object.fromEntries(
        model.grid.columns.map((c) => [c.name, r.countsByColumn[c.id] ?? 0]),
      ),
      total: r.total,
    })),
  });
  const similarity = () => ({
    order: model.similarity.order.map((c) => c.label),
    matrix: model.similarity.matrix,
  });
  const dendrograms = () => {
    const label = labelFor(model);
    const serialize = (node: DendroNode | null): unknown => {
      if (!node) return null;
      if (node.kind === 'leaf') return { card: label(node.cardId) };
      return {
        mergeAgreement: node.height,
        members: node.leaves.map(label),
        children: [serialize(node.left), serialize(node.right)],
      };
    };
    return {
      actualAgreement: serialize(model.dendrograms.actual),
      bestMerge: serialize(model.dendrograms.bestMerge),
    };
  };

  switch (scope) {
    case 'cards':
      return { cards: cards() };
    case 'categories':
      return { categories: categories() };
    case 'grid':
      return { standardizationGrid: grid() };
    case 'similarity':
      return { similarityMatrix: similarity() };
    case 'dendrograms':
      return { dendrograms: dendrograms() };
    case 'all':
      return {
        cards: cards(),
        categories: categories(),
        standardizationGrid: grid(),
        similarityMatrix: similarity(),
        dendrograms: dendrograms(),
      };
  }
}

export function toJSON(model: AnalysisModel, scope: AnalysisScope): string {
  const payload = {
    _context:
      'Open card-sort study results from Information Kit. Participants grouped cards into self-named categories. frequency = participant count; position = 1-based rank within a category; similarity = % of participants who co-grouped a pair; standardization = merged equivalent categories.',
    _instructions:
      'Interpret these results: surface the strongest clusters, flag cards with weak/split agreement, and propose an information architecture (category names + member cards) with rationale.',
    study: {
      name: model.study.name,
      goal: model.study.description || undefined,
      participants: model.totalParticipants,
      cardCount: model.cards.length,
      standardizedCategoryCount: model.standardizedCategoryCount,
      view: SCOPE_LABELS[scope],
    },
    ...jsonData(model, scope),
  };
  return JSON.stringify(payload, null, 2);
}

// ── File naming + download trigger ────────────────────────────────────────────

export function exportFilename(model: AnalysisModel, scope: AnalysisScope, ext: string): string {
  const slug = model.study.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'study';
  return `${slug}-${scope}.${ext}`;
}
