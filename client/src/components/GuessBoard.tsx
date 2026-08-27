import { ArrowUp, ArrowDown } from 'lucide-react';
import { memo } from 'react';
import type { ReactNode } from 'react';
import {
  AttributeFeedback,
  HiddenAttributeFeedback,
  MultiplayerGuessFeedback,
} from '../types';
import { useTranslation } from 'react-i18next';
import { genderLabelKey } from '../utils/gender';
import { localizedPlayerName } from '../api/playerList';
import { localizeLoreValue } from '../i18n/lore';

function Cell({
  attr,
  label,
  bool,
  format,
  closeLabel,
}: {
  attr?: AttributeFeedback | HiddenAttributeFeedback;
  label: string;
  bool?: boolean;
  format?: (value: string) => string;
  closeLabel?: string;
}) {
  const { t, i18n } = useTranslation();
  if (!attr) {
    return <td className="wrong masked-cell" data-label={label}>—</td>;
  }
  if (!('value' in attr)) {
    return (
      <td className={`${attr.level} masked-cell`} data-label={label}>
        {attr.hint && attr.level !== 'correct' && (
          <span className="dir">
            {attr.hint === 'higher' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
          </span>
        )}
      </td>
    );
  }
  const text =
    typeof attr.value === 'boolean' || bool
      ? attr.value
        ? t('common.active')
        : t('common.retired')
      : format
        ? format(String(attr.value))
        : localizeLoreValue(t, String(attr.value), i18n.language);
  return (
    <td className={attr.level} data-label={label}>
      {text}
      {closeLabel && attr.level === 'close' && (
        <small className="close-reason">{closeLabel}</small>
      )}
      {attr.hint && attr.level !== 'correct' && (
        <span className="dir">
          {attr.hint === 'higher' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
        </span>
      )}
    </td>
  );
}

/** 猜测反馈表:原版 game-table 布局,每行一次猜测的逐属性对比 */
function GuessBoard({
  guesses,
  rowAnnotations,
}: {
  guesses: MultiplayerGuessFeedback[];
  rowAnnotations?: Array<{ content: ReactNode; title?: string; tone?: 'self' | 'other' }>;
}) {
  const { t, i18n } = useTranslation();
  const columns = [
    t('guess.columns.nickname'),
    t('guess.columns.nationality'),
    t('guess.columns.team'),
    t('guess.columns.region'),
    t('guess.columns.gender'),
    t('guess.columns.role'),
    t('guess.columns.debutWork'),
    t('guess.columns.majorAppearances'),
  ];
  return (
    <div className="game-table-wrap">
      <table className="game-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guesses.map((g, i) => {
            const annotation = rowAnnotations?.[i];
            return (
              <tr
                key={'hidden' in g ? `hidden-${i}` : `${g.playerId}-${i}`}
                className={`${i === guesses.length - 1 ? 'row-latest' : ''} ${g.correct ? 'row-correct' : ''}`}
              >
                <td
                  className={`name ${g.correct ? 'correct' : ''} ${'hidden' in g ? 'masked-cell' : ''}`}
                  data-label={columns[0]}
                >
                  {annotation && (
                    <span
                      className={`guess-row-actor${annotation.tone ? ` guess-row-actor-${annotation.tone}` : ''}`}
                      title={annotation.title}
                    >
                      {annotation.content}
                    </span>
                  )}
                  {'hidden' in g ? null : localizedPlayerName(g.playerId, g.nickname, i18n.language)}
                </td>
                <Cell attr={g.attributes.nationality} label={columns[1]} />
                <Cell attr={g.attributes.team} label={columns[2]} closeLabel={t('guess.relatedOrganization')} />
                <Cell attr={g.attributes.region} label={columns[3]} />
                <Cell attr={g.attributes.majorChampionships} label={columns[4]} format={(value) => t(genderLabelKey(value))} />
                <Cell attr={g.attributes.role} label={columns[5]} closeLabel={t('guess.relatedIdentity')} />
                <Cell attr={g.attributes.debutWork} label={columns[6]} />
                <Cell attr={g.attributes.majorAppearances} label={columns[7]} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default memo(GuessBoard);
