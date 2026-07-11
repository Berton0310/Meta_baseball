import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import PlayerRadar from './PlayerRadar';

interface Props {
  player: any | null;
  onClose: () => void;
}

/**
 * Shared player detail modal. Renders null when no player is selected.
 * Backdrop click, ✕, and Esc all close it. Reuses the existing
 * `.player-detail-modal-*` styles and i18n keys.
 */
const PlayerDetailModal: React.FC<Props> = ({ player, onClose }) => {
  const { t } = useLanguage();

  // Close on Esc. Bound only while the modal is open.
  useEffect(() => {
    if (!player) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [player, onClose]);

  if (!player) return null;

  return (
    <div className="player-detail-modal-backdrop" onClick={onClose}>
      <div
        className="player-detail-modal glass-panel"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="player-detail-modal-header">
          <h3 className="player-detail-modal-title">
            {t('lineup.detailTitle').replace('{name}', player.name)}
          </h3>
          <button
            className="player-detail-modal-close"
            onClick={onClose}
            aria-label={t('lineup.closeDetail')}
            title={t('lineup.closeDetail')}
          >
            ✕
          </button>
        </div>
        <div className="player-detail-modal-body">
          <PlayerRadar player={player} />
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailModal;
