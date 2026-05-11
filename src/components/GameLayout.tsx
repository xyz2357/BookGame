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

interface SceneIllustrationProps {
  image?: string;
  name?: string;
  portraitOverlay?: ReactNode;
  kind?: 'nodes' | 'events' | 'endings';
}

export function SceneIllustration({ image, name, portraitOverlay, kind = 'nodes' }: SceneIllustrationProps) {
  return (
    <div className={`scene-illustration${portraitOverlay ? ' scene-illustration--with-portrait' : ''}`}>
      {image
        ? <AssetImage kind={kind} image={image} alt={name || ''} />
        : <div className="scene-illustration__placeholder" />}
      {portraitOverlay}
    </div>
  );
}
