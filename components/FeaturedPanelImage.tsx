'use client';

import { useState } from 'react';
import { PanelArt } from './PanelArt';

/** 优先用 public/showcase/{key}.png, 404 自动回退到 PanelArt SVG */
export function FeaturedPanelImage({
  panelKey,
  fallbackKind,
  alt
}: {
  panelKey: string;
  fallbackKind: string;
  alt: string;
}) {
  const [errored, setErrored] = useState(false);
  if (errored) return <PanelArt kind={fallbackKind} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/showcase/${panelKey}.png`}
      alt={alt}
      onError={() => setErrored(true)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block'
      }}
      loading="lazy"
    />
  );
}
