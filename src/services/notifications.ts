import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getOverdueTasks, getUpcomingTasks, getUserPlant } from './database';
import { getCatalogPlant } from '../data/plants';
import { CARE_LABELS } from '../types';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;
let handlerConfigured = false;

/** Expo Go sur Android (SDK 53+) ne supporte plus expo-notifications. */
export function areNotificationsSupported(): boolean {
  if (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient') {
    return false;
  }
  return true;
}

async function getNotifications(): Promise<NotificationsModule | null> {
  if (!areNotificationsSupported()) return null;

  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  try {
    const Notifications = await import('expo-notifications');

    if (!handlerConfigured) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerConfigured = true;
    }

    notificationsModule = Notifications;
    return Notifications;
  } catch {
    notificationsModule = null;
    return null;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleCareReminders(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('care-reminders', {
      name: 'Rappels d\'entretien',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const overdue = getOverdueTasks();
  const upcoming = getUpcomingTasks(7);

  for (const task of [...overdue, ...upcoming]) {
    const plant = getUserPlant(task.plantId);
    if (!plant) continue;

    const catalog = getCatalogPlant(plant.catalogId);
    const plantName = plant.nickname || catalog?.name || 'Votre plante';
    const careLabel = CARE_LABELS[task.type];

    const triggerDate = new Date(task.dueDate);
    triggerDate.setHours(9, 0, 0, 0);

    if (triggerDate <= new Date()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
      triggerDate.setHours(9, 0, 0, 0);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${catalog?.emoji || '🌱'} ${careLabel} — ${plantName}`,
        body: overdue.includes(task)
          ? `C'est en retard ! Pensez à ${careLabel.toLowerCase()} votre plante.`
          : `N'oubliez pas de ${careLabel.toLowerCase()} votre plante aujourd'hui.`,
        data: { taskId: task.id, plantId: task.plantId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: 'care-reminders',
      },
    });
  }
}

export async function sendImmediateNotification(title: string, body: string): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}
