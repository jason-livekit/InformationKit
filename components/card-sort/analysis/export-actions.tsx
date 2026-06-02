'use client';

import * as React from 'react';
import { Button } from '@/components/bytes/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/bytes/DropdownMenu';
import { toast } from '@/components/bytes/Toaster';
import { writeToClipboard } from '@/lib/bytes/clipboard';
import {
  ChevronDownSmallIcon,
  CodeBracketsIcon,
  FileDownloadIcon,
  PageTextIcon,
  SparklesTwoIcon,
  TableIcon,
} from '@/icons/react';
import type { AnalysisModel } from '@/lib/card-sort/analysis';
import {
  exportFilename,
  SCOPE_LABELS,
  toCSV,
  toJSON,
  toMarkdown,
  type AnalysisScope,
} from '@/lib/card-sort/export';

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text: string, what: string) {
  if (await writeToClipboard(text)) {
    toast.success(`${what} copied`, {
      description: 'Paste it into Claude, ChatGPT, or any coding agent.',
    });
  } else {
    toast.error('Could not copy to clipboard', {
      description: 'Your browser blocked clipboard access — use Download instead.',
    });
  }
}

interface ExportActionsProps {
  model: AnalysisModel;
  scope: AnalysisScope;
  /** Hide the CSV option (e.g. for views without a single clean table). */
  csv?: boolean;
}

/**
 * The shared "Copy for AI" + "Download" actions shown in every analysis view's
 * header. Copy-for-AI puts LLM-primed Markdown/JSON on the clipboard; Download
 * saves CSV / Markdown / JSON files.
 */
export function ExportActions({ model, scope, csv = true }: ExportActionsProps) {
  const disabled = model.totalParticipants === 0;
  const label = SCOPE_LABELS[scope];

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" disabled={disabled} leftIcon={<SparklesTwoIcon />} rightIcon={<ChevronDownSmallIcon />}>
            Copy for AI
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-60">
          <DropdownMenuLabel className="text-fg3">
            {scope === 'all' ? 'Full analysis' : label} · primed for an LLM
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => copyText(toMarkdown(model, scope), `${label} (Markdown)`)}>
            <PageTextIcon className="mr-2 h-3.5 w-3.5" />
            <div className="flex flex-col">
              <span className="text-fg0 font-medium">As Markdown</span>
              <span className="text-fg3 text-[11px]">Context + tables, best for chat</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => copyText(toJSON(model, scope), `${label} (JSON)`)}>
            <CodeBracketsIcon className="mr-2 h-3.5 w-3.5" />
            <div className="flex flex-col">
              <span className="text-fg0 font-medium">As JSON</span>
              <span className="text-fg3 text-[11px]">Structured, best for agents/tools</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled} leftIcon={<FileDownloadIcon />} rightIcon={<ChevronDownSmallIcon />}>
            Download
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          {csv && (
            <DropdownMenuItem
              onSelect={() =>
                downloadText(exportFilename(model, scope, 'csv'), toCSV(model, scope), 'text/csv')
              }
            >
              <TableIcon className="mr-2 h-3.5 w-3.5" /> CSV
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() =>
              downloadText(
                exportFilename(model, scope, 'md'),
                toMarkdown(model, scope),
                'text/markdown',
              )
            }
          >
            <PageTextIcon className="mr-2 h-3.5 w-3.5" /> Markdown
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              downloadText(
                exportFilename(model, scope, 'json'),
                toJSON(model, scope),
                'application/json',
              )
            }
          >
            <CodeBracketsIcon className="mr-2 h-3.5 w-3.5" /> JSON
          </DropdownMenuItem>
          {scope !== 'all' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() =>
                  downloadText(exportFilename(model, 'all', 'md'), toMarkdown(model, 'all'), 'text/markdown')
                }
              >
                <PageTextIcon className="mr-2 h-3.5 w-3.5" /> Full analysis (Markdown)
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
