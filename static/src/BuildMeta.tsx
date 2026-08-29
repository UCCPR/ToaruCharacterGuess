import { useTranslation } from 'react-i18next';

const version = import.meta.env.VITE_STATIC_APP_VERSION || 'dev';
const updatedDate = import.meta.env.VITE_STATIC_UPDATED_DATE || 'dev';

export default function BuildMeta() {
  const { t } = useTranslation();
  const label = t('staticMeta.label', { version, date: updatedDate });

  return <small className="static-build-meta">{label}</small>;
}
