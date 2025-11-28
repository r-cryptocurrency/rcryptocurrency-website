'use client';

import { Button } from "@tremor/react";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

export default function OpenInUniswap({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <Button variant="secondary" icon={ArrowTopRightOnSquareIcon}>
        Open in Uniswap
      </Button>
    </a>
  );
}
