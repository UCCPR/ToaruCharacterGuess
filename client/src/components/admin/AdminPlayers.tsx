import { useTranslation } from 'react-i18next';

/** Character editing is intentionally seed-only during the catalog migration. */
export default function AdminPlayers() {
  const { t } = useTranslation();
  return (
    <div className="card admin-players-card">
      <h2>{t('admin.characterEditingDisabledTitle')}</h2>
      <p>{t('admin.characterEditingDisabledDescription')}</p>
    </div>
  );
}
