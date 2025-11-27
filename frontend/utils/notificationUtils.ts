import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure notification behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007AFF',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }

  return true;
}

/**
 * Schedule a notification for a specific date
 * @param materialTitle - Title of the material to review
 * @param materialId - ID of the material
 * @param reviewDate - Date when review is due (YYYY-MM-DD format)
 * @returns notification identifier
 */
export async function scheduleReviewNotification(
  materialTitle: string,
  materialId: string,
  reviewDate: string
): Promise<string | null> {
  try {
    // Parse the review date
    const date = new Date(reviewDate);

    // Set notification time to 9:00 AM on the review date
    date.setHours(9, 0, 0, 0);

    // Check if the date is in the future
    const now = new Date();
    if (date <= now) {
      console.log('Review date is in the past, skipping notification');
      return null;
    }

    // Calculate trigger time
    const trigger = date.getTime();

    // Schedule the notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 복습 시간이에요!',
        body: `"${materialTitle}" 복습할 시간입니다.`,
        data: {
          materialId,
          type: 'review',
          navigateTo: 'review', // Navigate to review tab
        },
        sound: true,
      },
      trigger: {
        date: trigger,
      },
    });

    console.log(`Scheduled notification ${identifier} for ${materialTitle} at ${date}`);
    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 * @param identifier - Notification identifier to cancel
 */
export async function cancelNotification(identifier: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log(`Cancelled notification ${identifier}`);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications for a specific material
 * This is a simplified version - in production, you'd track notification IDs in the store
 */
export async function cancelAllMaterialNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all notifications');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`Found ${notifications.length} scheduled notifications`);
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}
