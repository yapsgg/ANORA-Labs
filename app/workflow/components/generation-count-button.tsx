'use client';

import { Button } from '@/components/ui/button';

type GenerationCountButtonProps = {
  count: number;
  onChange: (count: number) => void;
};

export function GenerationCountButton({
  count,
  onChange,
}: GenerationCountButtonProps) {
  const cycle = () => {
    onChange(count >= 4 ? 1 : count + 1);
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      className="h-6 w-6 rounded-full mr-1 text-[10px] font-semibold"
      onClick={cycle}
      type="button"
      aria-label={`Generate ${count} variation${count > 1 ? 's' : ''}`}
    >
      {count}x
    </Button>
  );
}
