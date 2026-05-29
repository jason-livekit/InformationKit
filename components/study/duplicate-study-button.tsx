'use client';

import { Button } from '@/components/bytes/Button';
import { FilesIcon } from '@/icons/react';
import { useDuplicateStudy } from './use-duplicate-study';

interface DuplicateStudyButtonProps {
  studyId: string;
}

export function DuplicateStudyButton({ studyId }: DuplicateStudyButtonProps) {
  const { duplicate, pending } = useDuplicateStudy();
  return (
    <Button
      variant="secondary"
      size="sm"
      leftIcon={<FilesIcon />}
      onClick={() => duplicate(studyId)}
      disabled={pending}
    >
      {pending ? 'Duplicating…' : 'Duplicate'}
    </Button>
  );
}
