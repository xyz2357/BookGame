import { useEffect, useMemo, useRef, useState } from 'react';

type AssetKind = 'books' | 'nodes' | 'characters' | 'events' | 'endings';

interface AssetImageProps {
  alt: string;
  className?: string;
  image: string;
  kind: AssetKind;
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}

function buildSrcChain(image: string, kind: AssetKind): string[] {
  const base = `${import.meta.env.BASE_URL}images/${kind}`;
  const name = stripExtension(image);
  return [
    `${base}/${name}.webp`,
    `${base}/${name}.png`,
    `${base}/${name}.svg`,
  ];
}

export default function AssetImage({ alt, className, image, kind }: AssetImageProps) {
  const chain = useMemo(() => buildSrcChain(image, kind), [image, kind]);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  useEffect(() => {
    setIndex(0);
    indexRef.current = 0;
  }, [chain]);

  return (
    <img
      alt={alt}
      className={className}
      onError={() => {
        const next = indexRef.current + 1;
        if (next < chain.length) {
          indexRef.current = next;
          setIndex(next);
        }
      }}
      src={chain[index]}
    />
  );
}
