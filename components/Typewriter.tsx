'use client';

import { useEffect, useState } from 'react';

export function useTypewriter(text: string, speedMs = 30) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) return;

    const chars = Array.from(text);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplayed(chars.slice(0, i).join(''));
      if (i >= chars.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speedMs);
    return () => clearInterval(id);
  }, [text, speedMs]);

  return { displayed, done };
}

export function Typewriter({
  text,
  speedMs = 30,
  className,
  caret = true,
  onDone
}: {
  text: string;
  speedMs?: number;
  className?: string;
  caret?: boolean;
  onDone?: () => void;
}) {
  const { displayed, done } = useTypewriter(text, speedMs);

  useEffect(() => {
    if (done) onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <p className={className}>
      {displayed}
      {caret && !done && <span className="caret" />}
    </p>
  );
}
