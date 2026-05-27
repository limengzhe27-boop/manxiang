'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export function Reveal({
  children,
  delay = 0,
  y = 32,
  className
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerSplit({
  text,
  className,
  charDelay = 0.04
}: {
  text: string;
  className?: string;
  charDelay?: number;
}) {
  const chars = Array.from(text);
  return (
    <span className={className}>
      {chars.map((c, i) => (
        <motion.span
          key={`${c}-${i}`}
          initial={{ opacity: 0, y: 28, rotate: -3 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.6, delay: i * charDelay, ease: [0.2, 0.8, 0.2, 1] }}
          className="inline-block"
          style={{ whiteSpace: c === ' ' ? 'pre' : 'normal' }}
        >
          {c}
        </motion.span>
      ))}
    </span>
  );
}

export function ScrollFloat({
  text,
  className
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const chars = Array.from(text);

  return (
    <span ref={ref} className={className}>
      {chars.map((c, i) => (
        <motion.span
          key={`${c}-${i}`}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: i * 0.03, ease: [0.2, 0.8, 0.2, 1] }}
          className="inline-block"
        >
          {c}
        </motion.span>
      ))}
    </span>
  );
}
