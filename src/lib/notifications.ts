import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import i18n from '@/i18n'

/** Configure foreground notification display */
export function setupNotificationHandler() {
  if (Platform.OS === 'web') return
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}

/** Create Android notification channel */
export async function setupNotificationChannel() {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('checkin-reminders', {
    name: 'Check-in Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  })
}

/** Request notification permissions. Returns true if granted. */
export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  if (!Device.isDevice) return false

  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

/** Parse "HH:mm" string into { hour, minute } */
function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number)
  return { hour: h, minute: m }
}

/**
 * Schedule daily morning + evening notifications.
 * Cancels all existing scheduled notifications first.
 */
export async function scheduleNotifications(
  morningTime: string,
  eveningTime: string,
) {
  if (Platform.OS === 'web') return

  await Notifications.cancelAllScheduledNotificationsAsync()

  const morning = parseTime(morningTime)
  const evening = parseTime(eveningTime)

  // Morning check-in
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('settings:notifications.morningTitle'),
      body: i18n.t('settings:notifications.morningBody'),
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'checkin-reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: morning.hour,
      minute: morning.minute,
    },
  })

  // Evening check-in
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('settings:notifications.eveningTitle'),
      body: i18n.t('settings:notifications.eveningBody'),
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'checkin-reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: evening.hour,
      minute: evening.minute,
    },
  })
}

/** Cancel all scheduled notifications */
export async function cancelAllNotifications() {
  if (Platform.OS === 'web') return
  await Notifications.cancelAllScheduledNotificationsAsync()
}
