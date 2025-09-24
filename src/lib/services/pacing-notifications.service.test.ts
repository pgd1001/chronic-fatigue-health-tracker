import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PacingNotificationsService, type NotificationSettings } from './pacing-notifications.service';
import type { PacingRecommendation } from '../types/ai-pacing.types';
import { afterEach } from 'node:test';

describe('PacingNotificationsService', () => {
  let mockRecommendations: PacingRecommendation[];
  let defaultSettings: NotificationSettings;

  beforeEach(() => {
    // Reset time mocks
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T14:00:00Z')); // 2 PM

    mockRecommendations = [
      {
        type: 'rest_recommendation',
        priority: 'high',
        title: 'Rest Needed',
        message: 'Your energy levels suggest you need rest.',
        reasoning: 'Low energy detected',
        actionItems: ['Take a break', 'Rest for 30 minutes'],
        validUntil: new Date('2024-01-15T18:00:00Z'),
        confidence: 0.8,
        disclaimers: ['This is not medical advice']
      },
      {
        type: 'gentle_activity',
        priority: 'medium',
        title: 'Activity Window',
        message: 'You might have energy for gentle activities.',
        reasoning: 'Moderate energy levels',
        actionItems: ['Consider light movement', 'Listen to your body'],
        validUntil: new Date('2024-01-15T16:00:00Z'),
        confidence: 0.6,
        disclaimers: ['This is not medical advice']
      },
      {
        type: 'energy_conservation',
        priority: 'low',
        title: 'Energy Tips',
        message: 'Some tips for conserving energy today.',
        reasoning: 'General guidance',
        actionItems: ['Pace yourself', 'Take breaks'],
        validUntil: new Date('2024-01-15T20:00:00Z'),
        confidence: 0.5,
        disclaimers: ['This is not medical advice']
      }
    ];

    defaultSettings = {
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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('scheduleNotifications', () => {
    it('should schedule notifications for enabled recommendations', async () => {
      const notifications = await PacingNotificationsService.scheduleNotifications(
        'user-123',
        mockRecommendations,
        defaultSettings
      );

      expect(notifications).toHaveLength(2); // High and medium priority only
      expect(notifications[0].recommendation.priority).toBe('high');
      expect(notifications[1].recommendation.priority).toBe('medium');
    });

    it('should respect user priority preferences', async () => {
      const settings = {
        ...defaultSettings,
        priority: {
          high: true,
          medium: false,
          low: false
        }
      };

      const notifications = await PacingNotificationsService.scheduleNotifications(
        'user-123',
        mockRecommendations,
        settings
      );

      expect(notifications).toHaveLength(1);
      expect(notifications[0].recommendation.priority).toBe('high');
    });

    it('should respect user type preferences', async () => {
      const settings = {
        ...defaultSettings,
        types: {
          energy_conservation: false,
          gentle_activity: false,
          rest_recommendation: true,
          routine_modification: true,
          biometric_concern: true
        }
      };

      const notifications = await PacingNotificationsService.scheduleNotifications(
        'user-123',
        mockRecommendations,
        settings
      );

      expect(notifications).toHaveLength(1);
      expect(notifications[0].recommendation.type).toBe('rest_recommendation');
    });

    it('should limit notifications to maxPerDay', async () => {
      const settings = {
        ...defaultSettings,
        maxPerDay: 1,
        priority: {
          high: true,
          medium: true,
          low: true
        }
      };

      const notifications = await PacingNotificationsService.scheduleNotifications(
        'user-123',
        mockRecommendations,
        settings
      );

      expect(notifications).toHaveLength(1);
    });

    it('should return empty array when notifications disabled', async () => {
      const settings = {
        ...defaultSettings,
        enabled: false
      };

      const notifications = await PacingNotificationsService.scheduleNotifications(
        'user-123',
        mockRecommendations,
        settings
      );

      expect(notifications).toHaveLength(0);
    });

    it('should schedule high priority notifications immediately if appropriate time', async () => {
      vi.setSystemTime(new Date('2024-01-15T14:00:00Z')); // 2 PM - appropriate time

      const notifications = await PacingNotificationsService.scheduleNotifications(
        'user-123',
        [mockRecommendations[0]], // High priority recommendation
        defaultSettings
      );

      expect(notifications).toHaveLength(1);
      const scheduledTime = notifications[0].scheduledFor;
      const now = new Date();
      const timeDiff = scheduledTime.getTime() - now.getTime();
      expect(timeDiff).toBeLessThan(10 * 60 * 1000); // Within 10 minutes
    });

    it('should delay notifications during quiet hours', async () => {
      vi.setSystemTime(new Date('2024-01-15T23:00:00Z')); // 11 PM - quiet hours

      const notifications = await PacingNotificationsService.scheduleNotifications(
        'user-123',
        [mockRecommendations[0]], // High priority recommendation
        defaultSettings
      );

      expect(notifications).toHaveLength(1);
      const scheduledTime = notifications[0].scheduledFor;
      expect(scheduledTime.getHours()).toBe(8); // Should be scheduled for 8 AM next day
    });
  });

  describe('formatNotificationContent', () => {
    it('should format rest recommendation content', () => {
      const content = PacingNotificationsService.formatNotificationContent(mockRecommendations[0]);

      expect(content.title).toBe('🛌 Rest Suggestion');
      expect(content.body).toContain('Your body might really benefit from this');
      expect(content.actions).toBeDefined();
      expect(content.actions?.some(a => a.action === 'rest_timer')).toBe(true);
    });

    it('should format activity suggestion content', () => {
      const content = PacingNotificationsService.formatNotificationContent(mockRecommendations[1]);

      expect(content.title).toBe('🌱 Activity Window');
      expect(content.body).toContain('A gentle suggestion');
      expect(content.actions?.some(a => a.action === 'view_activities')).toBe(true);
    });

    it('should use appropriate gentle language for different priorities', () => {
      const highPriorityContent = PacingNotificationsService.formatNotificationContent(mockRecommendations[0]);
      const lowPriorityContent = PacingNotificationsService.formatNotificationContent(mockRecommendations[2]);

      expect(highPriorityContent.body).toContain('might really benefit');
      expect(lowPriorityContent.body).toContain('When you\'re ready');
    });

    it('should include standard actions for all notifications', () => {
      const content = PacingNotificationsService.formatNotificationContent(mockRecommendations[0]);

      expect(content.actions?.some(a => a.action === 'view')).toBe(true);
      expect(content.actions?.some(a => a.action === 'dismiss')).toBe(true);
    });
  });

  describe('isAppropriateTime', () => {
    it('should return true during normal hours', () => {
      vi.setSystemTime(new Date('2024-01-15T14:00:00Z')); // 2 PM

      const isAppropriate = PacingNotificationsService.isAppropriateTime(defaultSettings);

      expect(isAppropriate).toBe(true);
    });

    it('should return false during quiet hours', () => {
      vi.setSystemTime(new Date('2024-01-15T23:00:00Z')); // 11 PM

      const isAppropriate = PacingNotificationsService.isAppropriateTime(defaultSettings);

      expect(isAppropriate).toBe(false);
    });

    it('should handle quiet hours spanning midnight', () => {
      const settings = {
        ...defaultSettings,
        quietHours: {
          start: '22:00',
          end: '08:00'
        }
      };

      // Test late night (should be quiet)
      vi.setSystemTime(new Date('2024-01-15T23:00:00Z'));
      expect(PacingNotificationsService.isAppropriateTime(settings)).toBe(false);

      // Test early morning (should be quiet)
      vi.setSystemTime(new Date('2024-01-15T06:00:00Z'));
      expect(PacingNotificationsService.isAppropriateTime(settings)).toBe(false);

      // Test morning (should be appropriate)
      vi.setSystemTime(new Date('2024-01-15T09:00:00Z'));
      expect(PacingNotificationsService.isAppropriateTime(settings)).toBe(true);
    });
  });

  describe('createRestReminder', () => {
    it('should create high priority reminder for very low energy', () => {
      const notification = PacingNotificationsService.createRestReminder('user-123', 2);

      expect(notification.recommendation.priority).toBe('high');
      expect(notification.recommendation.type).toBe('rest_recommendation');
      expect(notification.recommendation.title).toBe('Gentle Rest Reminder');
      expect(notification.recommendation.actionItems).toContain('Find a comfortable position to rest');
    });

    it('should create medium priority reminder for moderate low energy', () => {
      const notification = PacingNotificationsService.createRestReminder('user-123', 4);

      expect(notification.recommendation.priority).toBe('medium');
      expect(notification.recommendation.type).toBe('rest_recommendation');
    });

    it('should include empathetic messaging', () => {
      const notification = PacingNotificationsService.createRestReminder('user-123', 3);

      expect(notification.recommendation.message).toContain('might benefit');
      expect(notification.recommendation.actionItems.some(item => 
        item.includes('Be kind to yourself')
      )).toBe(true);
    });
  });

  describe('createActivitySuggestion', () => {
    it('should create low priority activity suggestion', () => {
      const notification = PacingNotificationsService.createActivitySuggestion('user-123', 7);

      expect(notification.recommendation.priority).toBe('low');
      expect(notification.recommendation.type).toBe('gentle_activity');
      expect(notification.recommendation.title).toBe('Gentle Activity Window');
    });

    it('should include safety reminders', () => {
      const notification = PacingNotificationsService.createActivitySuggestion('user-123', 6);

      expect(notification.recommendation.actionItems.some(item => 
        item.includes('listen to your body')
      )).toBe(true);
      expect(notification.recommendation.actionItems.some(item => 
        item.includes('Stop if you feel')
      )).toBe(true);
    });

    it('should use conditional language', () => {
      const notification = PacingNotificationsService.createActivitySuggestion('user-123', 6);

      expect(notification.recommendation.message).toContain('if you feel up to it');
      expect(notification.recommendation.disclaimers[0]).toContain('Only do what feels right');
    });
  });

  describe('handleNotificationAction', () => {
    it('should handle view action', async () => {
      const result = await PacingNotificationsService.handleNotificationAction('notif-123', 'view');

      expect(result.success).toBe(true);
      expect(result.nextAction).toBe('show_recommendation_details');
    });

    it('should handle dismiss action', async () => {
      const result = await PacingNotificationsService.handleNotificationAction('notif-123', 'dismiss');

      expect(result.success).toBe(true);
    });

    it('should handle snooze action', async () => {
      const result = await PacingNotificationsService.handleNotificationAction('notif-123', 'snooze');

      expect(result.success).toBe(true);
      expect(result.nextAction).toBe('reschedule_notification');
    });

    it('should handle rest timer action', async () => {
      const result = await PacingNotificationsService.handleNotificationAction('notif-123', 'rest_timer');

      expect(result.success).toBe(true);
      expect(result.nextAction).toBe('start_rest_timer');
    });

    it('should handle view activities action', async () => {
      const result = await PacingNotificationsService.handleNotificationAction('notif-123', 'view_activities');

      expect(result.success).toBe(true);
      expect(result.nextAction).toBe('show_activity_options');
    });

    it('should handle adapt routine action', async () => {
      const result = await PacingNotificationsService.handleNotificationAction('notif-123', 'adapt_routine');

      expect(result.success).toBe(true);
      expect(result.nextAction).toBe('show_routine_adaptations');
    });

    it('should handle invalid action gracefully', async () => {
      const result = await PacingNotificationsService.handleNotificationAction('notif-123', 'invalid' as any);

      expect(result.success).toBe(false);
    });
  });

  describe('Chronic Fatigue Considerations', () => {
    it('should use gentle, non-prescriptive language', () => {
      const notification = PacingNotificationsService.createRestReminder('user-123', 3);

      expect(notification.recommendation.message).not.toMatch(/must|should|need to/i);
      expect(notification.recommendation.message).toMatch(/might|could|consider/i);
    });

    it('should respect user autonomy in action items', () => {
      const notification = PacingNotificationsService.createActivitySuggestion('user-123', 6);

      notification.recommendation.actionItems.forEach(item => {
        expect(item).not.toMatch(/must|should|need to/i);
        // More flexible check for empathetic language
        expect(item.toLowerCase()).toMatch(/consider|if you|listen to|gently|when you|plan|take/);
      });
    });

    it('should include appropriate disclaimers', () => {
      const notification = PacingNotificationsService.createRestReminder('user-123', 3);

      expect(notification.recommendation.disclaimers.some(d => 
        d.includes('gentle suggestion')
      )).toBe(true);
    });

    it('should prioritize rest over activity', () => {
      const restNotification = PacingNotificationsService.createRestReminder('user-123', 3);
      const activityNotification = PacingNotificationsService.createActivitySuggestion('user-123', 7);

      expect(restNotification.recommendation.priority).toBe('high');
      expect(activityNotification.recommendation.priority).toBe('low');
    });

    it('should use empathetic emojis and language', () => {
      const content = PacingNotificationsService.formatNotificationContent(mockRecommendations[0]);

      expect(content.title).toMatch(/💙|🛌|🌱|💗/); // Contains empathetic emojis
      expect(content.body).toContain('benefit');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty recommendations array', async () => {
      const notifications = await PacingNotificationsService.scheduleNotifications(
        'user-123',
        [],
        defaultSettings
      );

      expect(notifications).toHaveLength(0);
    });

    it('should handle malformed recommendations gracefully', async () => {
      const malformedRecommendations = [null, undefined, {}] as any;

      const notifications = await PacingNotificationsService.scheduleNotifications(
        'user-123',
        malformedRecommendations,
        defaultSettings
      );

      expect(notifications).toHaveLength(0);
    });

    it('should handle notification action errors gracefully', async () => {
      // Simulate error by passing null notification ID
      const result = await PacingNotificationsService.handleNotificationAction('', 'view');

      expect(result.success).toBe(true); // Should still succeed for valid action
    });
  });
});