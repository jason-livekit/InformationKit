export type CardId = string;

export type GroupId = string;

export interface Card {
  id: CardId;
  label: string;
  context?: string;
}

export interface Group {
  id: GroupId;
  label: string;
  cardIds: CardId[];
}

export interface Submission {
  id: string;
  createdAt: number;
  groups: Group[];
  unsorted: CardId[];
  notUseful: CardId[];
}

export interface SubmissionInput {
  groups: Group[];
  unsorted: CardId[];
  notUseful: CardId[];
}

export interface AggregatedResults {
  totalSubmissions: number;
  cards: Card[];
  notUsefulByCard: Record<CardId, number>;
  pairCounts: Record<CardId, Record<CardId, number>>;
  groupNameCountsByCard: Record<CardId, Record<string, number>>;
  groupNameTotals: Record<string, number>;
  recentSubmissions: { id: string; createdAt: number; groupCount: number; notUsefulCount: number }[];
}
