import React, { lazy, Suspense } from 'react';
import { Bell, Settings } from 'lucide-react';
import { PageLoadingSkeleton } from '../../components/ui/Skeleton';
import { SectionTabs } from '../core/SectionTabs';
import { useAppStore } from '../../store/useAppStore';

const AboutModule = lazy(() => import('./About').then(module => ({ default: module.AboutModule })));
const SmartNotificationSettings = lazy(() => import('./SmartNotificationSettings').then(module => ({ default: module.SmartNotificationSettings })));
type SettingsTab = 'preferences' | 'notifications';

export const SettingsHub: React.FC = () => {
  const { lang, currentRoute, navigateToRoute } = useAppStore();
  const tab: SettingsTab = currentRoute === 'settings:notifications' ? 'notifications' : 'preferences';
  const tabPrefs = { tr: 'Tercihler', en: 'Preferences', de: 'Einstellungen', fr: 'Préférences', es: 'Preferencias', ar: 'التفضيلات', it: 'Preferenze', pt: 'Preferências' }[lang] || 'Preferences';
  const tabNotifs = { tr: 'Bildirimler', en: 'Notifications', de: 'Benachrichtigungen', fr: 'Notifications', es: 'Notificaciones', ar: 'الإشعارات', it: 'Notifiche', pt: 'Notificações' }[lang] || 'Notifications';
  return (
    <div className="space-y-5">
      <SectionTabs
        active={tab}
        onChange={next => navigateToRoute(next === 'notifications' ? 'settings:notifications' : 'settings')}
        tabs={[
          { id: 'preferences', label: tabPrefs, icon: <Settings className="w-4 h-4" /> },
          { id: 'notifications', label: tabNotifs, icon: <Bell className="w-4 h-4" /> },
        ]}
      />
      <Suspense fallback={<PageLoadingSkeleton />}>
        {tab === 'preferences' && <AboutModule />}
        {tab === 'notifications' && <SmartNotificationSettings />}
      </Suspense>
    </div>
  );
};
