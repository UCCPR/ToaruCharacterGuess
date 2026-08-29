import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import BuildMeta from './BuildMeta';
import { ConfirmProvider } from '../../client/src/components/ConfirmDialog';
import ToastViewport from '../../client/src/components/Toast';
import { initializeTheme } from '../../client/src/store/theme';
import { initializeMotionPreference } from '../../client/src/store/motion';
import '../../client/src/i18n';
import '../../client/src/styles/index.css';
import blastFoundationUrl from '../../client/src/styles/themes/blast-foundation.css?url';
import blastPagesUrl from '../../client/src/styles/themes/blast-pages.css?url';
import blastResponsiveUrl from '../../client/src/styles/themes/blast-responsive.css?url';
import './static.css';

for (const href of [blastFoundationUrl, blastPagesUrl, blastResponsiveUrl]) {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = href;
  stylesheet.media = document.documentElement.dataset.theme === 'blast' ? 'all' : 'not all';
  stylesheet.dataset.blastTheme = '';
  document.head.append(stylesheet);
}

initializeTheme();
initializeMotionPreference();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ConfirmProvider>
        <App />
        <BuildMeta />
        <ToastViewport />
      </ConfirmProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
