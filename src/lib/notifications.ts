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
 * @deprecated Use scheduleAllNotifications instead
 */
export async function scheduleNotifications(
  morningTime: string,
  eveningTime: string,
) {
  await scheduleAllNotifications({
    morningNotificationTime: morningTime,
    eveningNotificationTime: eveningTime,
    weeklyReviewDay: 6,
    weeklyReviewTime: '19:00',
  })
}

/**
 * Schedule daily morning + evening + weekly review notifications.
 * Cancels all existing scheduled notifications first.
 */
export async function scheduleAllNotifications(settings: {
  morningNotificationTime: string
  eveningNotificationTime: string
  weeklyReviewDay: number   // 0=Mon..6=Sun
  weeklyReviewTime: string
}) {
  if (Platform.OS === 'web') return

  await Notifications.cancelAllScheduledNotificationsAsync()

  const morning = parseTime(settings.morningNotificationTime)
  const evening = parseTime(settings.eveningNotificationTime)
  const weekly = parseTime(settings.weeklyReviewTime)

  // Morning check-in (daily)
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

  // Evening check-in (daily)
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

  // Weekly review — expo-notifications weekday: 1=Sun..7=Sat
  // Our convention: 0=Mon..6=Sun → convert: (day + 2) % 7 || 7
  const expoWeekday = (settings.weeklyReviewDay + 2) % 7 || 7
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('settings:notifications.weeklyTitle'),
      body: i18n.t('settings:notifications.weeklyBody'),
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'checkin-reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: expoWeekday,
      hour: weekly.hour,
      minute: weekly.minute,
    },
  })
}

/** Cancel all scheduled notifications */
export async function cancelAllNotifications() {
  if (Platform.OS === 'web') return
  await Notifications.cancelAllScheduledNotificationsAsync()
}
