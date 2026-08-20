import { getAnimation } from '../animation/animationRegistry';
import type { NeoState } from '../types/neo';

interface NeoCharacterProps {
  state: NeoState;
  onClick: () => void;
}

export function NeoCharacter({ state, onClick }: NeoCharacterProps) {
  const animation = getAnimation(state);

  return (
    <div
      className={`neo-character ${animation.className}`}
      role="button"
      tabIndex={0}
      aria-label={`NEO: ${animation.label}`}
      onClick={onClick}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onClick();
      }}
    >
      <div className="neo-aura" />
      <div className="neo-hologram-ring" />
      <div className="neo-robot">
        <div className="neo-head">
          <div className="neo-antenna" />
          <div className="neo-face"><span className="neo-eye neo-eye-left" /><span className="neo-eye neo-eye-right" /></div>
          <span className="neo-ear neo-ear-left" /><span className="neo-ear neo-ear-right" />
        </div>
        <div className="neo-neck" />
        <div className="neo-torso">
          <div className="neo-chest-line" />
          <div className="neo-core"><span>N</span></div>
          <div className="neo-core-glow" />
        </div>
        <div className="neo-arm neo-arm-left"><span className="neo-palm" /></div>
        <div className="neo-arm neo-arm-right"><span className="neo-palm" /></div>
        <div className="neo-leg neo-leg-left"><span className="neo-boot" /></div>
        <div className="neo-leg neo-leg-right"><span className="neo-boot" /></div>
      </div>
      <div className="neo-hologram-card"><span>{animation.label}</span></div>
      <div className="neo-ground-shadow" />
    </div>
  );
}
