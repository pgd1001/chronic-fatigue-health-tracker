import { type PacingRecommendation } from '../types/ai-pacing.types';

export interface NotificationSettings {
  enabled: boolean;
  quietHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  maxPerDay: number;
  priority: {
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  types: {
    energy_conservation: boolean;
    gentle_activity: boolean;
    rest_recommendation: boolean;
    routine_modification: boolean;
    biometric_concern: boolean;
  };
}

export interface PacingNotification {
  id: string;
  userId: string;
  recommendation: PacingRecommendation;
  scheduledFor: Date;
  delivered: boolean;
  dismissed: boolean;
  createdAt: Date;
}

export class PacingNotificationsService {
  private static readonly DEFAULT_SETTINGS: NotificationSettings = {
    enabled: true,
    quietHours: {
      start: '22:00',
      end: '08:00'
    },
    maxPerDay: 3,
    priority: {
      high: true,
      medium: true,
      low: false
    },
    types: {
      energy_conservation: true,
      gentle_activity: true,
      rest_recommendation: true,
      routine_modification: true,
      biometric_concern: true
    }
  };

  /**
   * Schedules gentle notifications for pacing recommendations
   * Respects user preferences and chronic illness considerations
   */
  static async scheduleNotifications(
    userId: string,
    recommendations: PacingRecommendation[],
    settings: Partial<NotificationSettings> = {}
  ): Promise<PacingNotification[]> {
    try {
      const userSettings = { ...this.DEFAULT_SETTINGS, ...settings };
      const notifications: PacingNotification[] = [];

      if (!userSettings.enabled) {
        return notifications;
      }

      // Filter recommendations based on user preferences
      const filteredRecommendations = recommendations.filter(rec => {
        // Check if user wants this priority level
        if (!userSettings.priority[rec.priority]) {
          return false;
        }

        // Check if user wants this type of recommendation
        if (!userSettings.types[rec.type]) {
          return false;
        }

        return true;
      });

      // Limit to max per day
      const limitedRecommendations = filteredRecommendations
        .slice(0, userSettings.maxPerDay);

      // Schedule notifications with appropriate timing
      for (let i = 0; i < limitedRecommendations.length; i++) {
        const recommendation = limitedRecommendations[i];
        const scheduledTime = this.calculateOptimalNotificationTime(
          recommendation,
          userSettings,
          i
        );

        const notification: PacingNotification = {
          id: this.generateNotificationId(),
          userId,
          recommendation,
          scheduledFor: scheduledTime,
          delivered: false,
          dismissed: false,
          createdAt: new Date()
        };

        notifications.push(notification);
      }

      return notifications;

    } catch (error) {
      console.error('Error scheduling pacing notifications:', error);
      return [];
    }
  }

  /**
   * Formats notification content for gentle, empathetic delivery
   */
  static formatNotificationContent(recommendation: PacingRecommendation): {
    title: string;
    body: string;
    actions?: { action: string; title: string }[];
  } {
    const baseContent = {
      title: this.gentleTitle(recommendation),
      body: this.gentleMessage(recommendation),
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Not Now' }
      ]
    };

    // Add specific actions based on recommendation type
    switch (recommendation.type) {
      case 'rest_recommendation':
        baseContent.actions.unshift({ action: 'rest_timer', title: 'Start Rest Timer' });
        break;
      case 'gentle_activity':
        baseContent.actions.unshift({ action: 'view_activities', title: 'View Activities' });
        break;
      case 'routine_modification':
        baseContent.actions.unshift({ action: 'adapt_routine', title: 'Adapt Routine' });
        break;
    }

    return baseContent;
  }

  /**
   * Checks if it's an appropriate time to send notifications
   */
  static isAppropriateTime(settings: NotificationSettings): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const quietStart = settings.quietHours.start;
    const quietEnd = settings.quietHours.end;
    
    // Handle quiet hours that span midnight
    if (quietStart > quietEnd) {
      return currentTime < quietStart && currentTime >= quietEnd;
    } else {
      return currentTime < quietStart || currentTime >= quietEnd;
    }
  }

  /**
   * Creates a gentle rest reminder notification
   */
  static createRestReminder(userId: string, energyLevel: number): PacingNotification {
    const recommendation: PacingRecommendation = {
      type: 'rest_recommendation',
      priority: energyLevel <= 3 ? 'high' : 'medium',
      title: 'Gentle Rest Reminder',
      message: 'Your body might benefit from some gentle rest right now.',
      reasoning: `Energy level of ${energyLevel}/10 suggests rest could be helpful.`,
      actionItems: [
        'Find a comfortable position to rest',
        'Try some gentle breathing exercises',
        'Stay hydrated',
        'Be kind to yourself'
      ],
      validUntil: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
      confidence: 0.7,
      disclaimers: ['This is a gentle suggestion based on your energy tracking.']
    };

    return {
      id: this.generateNotificationId(),
      userId,
      recommendation,
      scheduledFor: new Date(),
      delivered: false,
      dismissed: false,
      createdAt: new Date()
    };
  }

  /**
   * Creates an activity suggestion notification
   */
  static createActivitySuggestion(userId: string, energyLevel: number): PacingNotification {
    const recommendation: PacingRecommendation = {
      type: 'gentle_activity',
      priority: 'low',
      title: 'Gentle Activity Window',
      message: 'You might have energy for some gentle activities if you feel up to it.',
      reasoning: `Energy level of ${energyLevel}/10 suggests you might tolerate light activity.`,
      actionItems: [
        'Consider your daily anchor routine',
        'Take it slowly and listen to your body',
        'Stop if you feel any increase in symptoms',
        'Plan rest time after any activity'
      ],
      validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      confidence: 0.6,
      disclaimers: ['Only do what feels right for your body today.']
    };

    return {
      id: this.generateNotificationId(),
      userId,
      recommendation,
      scheduledFor: new Date(),
      delivered: false,
      dismissed: false,
      createdAt: new Date()
    };
  }

  /**
   * Handles notification interactions (view, dismiss, snooze)
   */
  static async handleNotificationAction(
    notificationId: string,
    action: 'view' | 'dismiss' | 'snooze' | 'rest_timer' | 'view_activities' | 'adapt_routine'
  ): Promise<{ success: boolean; nextAction?: string }> {
    try {
      switch (action) {
        case 'view':
          return { success: true, nextAction: 'show_recommendation_details' };
        
        case 'dismiss':
          // Mark notification as dismissed
          return { success: true };
        
        case 'snooze':
          // Reschedule for 1 hour later
          return { success: true, nextAction: 'reschedule_notification' };
        
        case 'rest_timer':
          return { success: true, nextAction: 'start_rest_timer' };
        
        case 'view_activities':
          return { success: true, nextAction: 'show_activity_options' };
        
        case 'adapt_routine':
          return { success: true, nextAction: 'show_routine_adaptations' };
        
        default:
          return { success: false };
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
      return { success: false };
    }
  }

  // Private helper methods

  private static calculateOptimalNotificationTime(
    recommendation: PacingRecommendation,
    settings: NotificationSettings,
    index: number
  ): Date {
    const now = new Date();
    let scheduledTime = new Date(now);

    // High priority recommendations - send soon if appropriate time
    if (recommendation.priority === 'high') {
      if (this.isAppropriateTime(settings)) {
        scheduledTime.setMinutes(scheduledTime.getMinutes() + 5); // 5 minutes from now
      } else {
        // Schedule for next appropriate time
        scheduledTime = this.getNextAppropriateTime(settings);
      }
    } else {
      // Medium/low priority - space them out more
      const delayMinutes = (index + 1) * 30; // 30, 60, 90 minutes apart
      scheduledTime.setMinutes(scheduledTime.getMinutes() + delayMinutes);
      
      // If this falls in quiet hours, move to next appropriate time
      if (!this.isAppropriateTimeForDate(scheduledTime, settings)) {
        scheduledTime = this.getNextAppropriateTime(settings, scheduledTime);
      }
    }

    return scheduledTime;
  }

  private static getNextAppropriateTime(
    settings: NotificationSettings,
    fromTime: Date = new Date()
  ): Date {
    const nextTime = new Date(fromTime);
    const quietEnd = settings.quietHours.end;
    const [endHour, endMinute] = quietEnd.split(':').map(Number);
    
    // If we're in quiet hours, schedule for when quiet hours end
    if (!this.isAppropriateTimeForDate(nextTime, settings)) {
      nextTime.setHours(endHour, endMinute, 0, 0);
      
      // If that's in the past, add a day
      if (nextTime <= fromTime) {
        nextTime.setDate(nextTime.getDate() + 1);
      }
    }
    
    return nextTime;
  }

  private static isAppropriateTimeForDate(date: Date, settings: NotificationSettings): boolean {
    const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    const quietStart = settings.quietHours.start;
    const quietEnd = settings.quietHours.end;
    
    if (quietStart > quietEnd) {
      return timeString < quietStart && timeString >= quietEnd;
    } else {
      return timeString < quietStart || timeString >= quietEnd;
    }
  }

  private static gentleTitle(recommendation: PacingRecommendation): string {
    const gentleTitles = {
      energy_conservation: '💙 Gentle Reminder',
      gentle_activity: '🌱 Activity Window',
      rest_recommendation: '🛌 Rest Suggestion',
      routine_modification: '🔄 Routine Adjustment',
      biometric_concern: '💗 Body Check-in'
    };

    return gentleTitles[recommendation.type] || '💙 Pacing Reminder';
  }

  private static gentleMessage(recommendation: PacingRecommendation): string {
    // Make the message more gentle and less clinical
    const message = recommendation.message;
    
    // Add gentle prefixes for different priorities
    if (recommendation.priority === 'high') {
      return `Your body might really benefit from this: ${message}`;
    } else if (recommendation.priority === 'medium') {
      return `A gentle suggestion: ${message}`;
    } else {
      return `When you're ready: ${message}`;
    }
  }

  private static generateNotificationId(): string {
    return `pacing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Default notification templates for common scenarios
export const NOTIFICATION_TEMPLATES = {
  morningCheckIn: {
    title: '🌅 Morning Check-in',
    message: 'How are you feeling this morning? Your energy level helps us provide better suggestions.',
    type: 'energy_conservation' as const,
    priority: 'low' as const
  },
  
  afternoonRest: {
    title: '☀️ Afternoon Rest',
    message: 'Afternoon can be a good time for a gentle rest break if you need one.',
    type: 'rest_recommendation' as const,
    priority: 'medium' as const
  },
  
  eveningReflection: {
    title: '🌙 Evening Reflection',
    message: 'How did today go? Tracking your experience helps improve tomorrow\'s suggestions.',
    type: 'energy_conservation' as const,
    priority: 'low' as const
  },
  
  hydrationReminder: {
    title: '💧 Hydration Reminder',
    message: 'A gentle reminder to stay hydrated - it can help with energy and symptoms.',
    type: 'energy_conservation' as const,
    priority: 'low' as const
  }
} as const;