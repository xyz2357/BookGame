import type { ReactNode } from 'react';
import AssetImage from './AssetImage';

interface GameLayoutProps {
  illustration?: ReactNode;
  title: ReactNode;
  narrative: ReactNode;
  actions: ReactNode;
}

export default function GameLayout({ illustration, title, narrative, actions }: GameLayoutProps) {
  return (
    <div>
      {illustration}
      <h2>{title}</h2>
      <div className="node-layout">
        <div className="node-layout__story">{narrative}</div>
        <div className="node-layout__actions">{actions}</div>
      </div>
    </div>
  );
}

export function SceneIllustration({ image, name }: { image?: string; name?: string }) {
  return (
    <div className="scene-illustration">
      {image
        ? <AssetImage kind="nodes" image={image} alt={name || ''} />
        : <div className="scene-illustration__placeholder" />}
    </div>
  );
}
