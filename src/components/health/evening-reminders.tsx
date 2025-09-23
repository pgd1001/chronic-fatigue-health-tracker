'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Moon, 
  Shield, 
  Smartphone, 
  Clock,
  Settings,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';

interface EveningRemindersProps {
  userId: string;
  onReminderUpdate?: (reminders: EveningReminder[]) => void;
}

interface EveningReminder {
  id: string;
  reminderTime: string; // HH:MM format
  enabled: boolean;
  reminderType: 'routine_start' | 'blue_light' | 'screen_replacement' | 'bedtime';
  message: string;
  daysOfWeek: number[]; // 0 = Sunday
}

const DEFAULT_REMINDERS: Omit<EveningReminder, 'id'>[] = [
  {
    reminderTime: '18:00',
    enabled: true,
    reminderType: 'routine_start',
    message: 'Time to start your gentle evening routine 🌅',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    reminderTime: '19:30',
    enabled: true,
    reminderType: 'blue_light',
    message: 'Consider putting on blue light blocking glasses 🕶️',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    reminderTime: '20:30',
    enabled: true,
    reminderType: 'screen_replacement',
    message: 'Time for screen-free activities - perhaps some gentle reading? 📖',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    reminderTime: '21:30',
    enabled: false,
    reminderType: 'bedtime',
    message: 'Bedtime approaching - time to wind down 🌙',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
  }
];

const REMINDER_TYPE_LABELS = {
  routine_start: 'Evening Routine Start',
  blue_light: 'Blue Light Protection',
  screen_replacement: 'Screen-Free Time',
  bedtime: 'Bedtime Preparation'
};

const REMINDER_TYPE_ICONS = {
  routine_start: Moon,
  blue_light: Shield,
  screen_replacement: Smartphone,
  bedtime: Clock
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function EveningReminders({ userId, onReminderUpdate }: EveningRemindersProps) {
  const [reminders, setReminders] = useState<EveningReminder[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeReminders, setActiveReminders] = useState<EveningReminder[]>([]);

  // Initialize with default reminders
  useEffect(() => {
    const initialReminders: EveningReminder[] = DEFAULT_REMINDERS.map((reminder, index) => ({
      ...reminder,
      id: `default-${index}`
    }));
    setReminders(initialReminders);
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Check for active reminders
  useEffect(() => {
    const now = new Date();
    const currentTimeString = now.toTimeString().slice(0, 5); // HH:MM
    const currentDay = now.getDay();

    const active = reminders.filter(reminder => {
      if (!reminder.enabled) return false;
      if (!reminder.daysOfWeek.includes(currentDay)) return false;
      
      // Check if current time matches reminder time (within 1 minute)
      const reminderMinutes = timeStringToMinutes(reminder.reminderTime);
      const currentMinutes = timeStringToMinutes(currentTimeString);
      
      return Math.abs(currentMinutes - reminderMinutes) <= 1;
    });

    setActiveReminders(active);
  }, [currentTime, reminders]);

  const timeStringToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleReminderToggle = (id: string, enabled: boolean) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === id ? { ...reminder, enabled } : reminder
    );
    setReminders(updatedReminders);
    onReminderUpdate?.(updatedReminders);
  };

  const handleTimeChange = (id: string, newTime: string) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === id ? { ...reminder, reminderTime: newTime } : reminder
    );
    setReminders(updatedReminders);
    onReminderUpdate?.(updatedReminders);
  };

  const handleDayToggle = (id: string, day: number) => {
    const updatedReminders = reminders.map(reminder => {
      if (reminder.id === id) {
        const daysOfWeek = reminder.daysOfWeek.includes(day)
          ? reminder.daysOfWeek.filter(d => d !== day)
          : [...reminder.daysOfWeek, day].sort();
        return { ...reminder, daysOfWeek };
      }
      return reminder;
    });
    setReminders(updatedReminders);
    onReminderUpdate?.(updatedReminders);
  };

  const addCustomReminder = () => {
    const newReminder: EveningReminder = {
      id: `custom-${Date.now()}`,
      reminderTime: '20:00',
      enabled: true,
      reminderType: 'routine_start',
      message: 'Custom evening reminder',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
    };
    
    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    onReminderUpdate?.(updatedReminders);
  };

  const deleteReminder = (id: string) => {
    const updatedReminders = reminders.filter(reminder => reminder.id !== id);
    setReminders(updatedReminders);
    onReminderUpdate?.(updatedReminders);
  };

  const dismissActiveReminder = (id: string) => {
    setActiveReminders(prev => prev.filter(reminder => reminder.id !== id));
  };

  const getNextReminderTime = (): string | null => {
    const now = new Date();
    const currentMinutes = timeStringToMinutes(now.toTimeString().slice(0, 5));
    const currentDay = now.getDay();

    const enabledReminders = reminders.filter(r => r.enabled);
    
    // Find next reminder today
    const todayReminders = enabledReminders
      .filter(r => r.daysOfWeek.includes(currentDay))
      .map(r => ({ ...r, minutes: timeStringToMinutes(r.reminderTime) }))
      .filter(r => r.minutes > currentMinutes)
      .sort((a, b) => a.minutes - b.minutes);

    if (todayReminders.length > 0) {
      return todayReminders[0].reminderTime;
    }

    // Find next reminder tomorrow or later
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const checkDay = (currentDay + dayOffset) % 7;
      const dayReminders = enabledReminders
        .filter(r => r.daysOfWeek.includes(checkDay))
        .map(r => ({ ...r, minutes: timeStringToMinutes(r.reminderTime) }))
        .sort((a, b) => a.minutes - b.minutes);

      if (dayReminders.length > 0) {
        const dayName = DAYS_OF_WEEK[checkDay];
        return `${dayName} ${dayReminders[0].reminderTime}`;
      }
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Active Reminders */}
      {activeReminders.length > 0 && (
        <div className="space-y-2">
          {activeReminders.map(reminder => {
            const Icon = REMINDER_TYPE_ICONS[reminder.reminderType];
            return (
              <Card key={reminder.id} className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">{reminder.message}</p>
                        <p className="text-sm text-blue-700">
                          {REMINDER_TYPE_LABELS[reminder.reminderType]}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dismissActiveReminder(reminder.id)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Done
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Reminders Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-600" />
              <CardTitle>Evening Reminders</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {getNextReminderTime() && (
                <Badge variant="secondary" className="text-xs">
                  Next: {getNextReminderTime()}
                </Badge>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Settings className="h-4 w-4 mr-1" />
                {isEditing ? 'Done' : 'Edit'}
              </Button>
            </div>
          </div>
          <CardDescription>
            Gentle notifications to support your evening routine and sleep preparation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reminders.map(reminder => {
              const Icon = REMINDER_TYPE_ICONS[reminder.reminderType];
              return (
                <div key={reminder.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {REMINDER_TYPE_LABELS[reminder.reminderType]}
                          </span>
                          <Switch
                            checked={reminder.enabled}
                            onCheckedChange={(enabled) => 
                              handleReminderToggle(reminder.id, enabled)
                            }
                          />
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {reminder.message}
                        </p>

                        {isEditing && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium">Time</label>
                              <input
                                type="time"
                                value={reminder.reminderTime}
                                onChange={(e) => handleTimeChange(reminder.id, e.target.value)}
                                className="ml-2 p-1 border rounded text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium block mb-1">Days</label>
                              <div className="flex gap-1">
                                {DAYS_OF_WEEK.map((day, index) => (
                                  <Button
                                    key={day}
                                    size="sm"
                                    variant={reminder.daysOfWeek.includes(index) ? "default" : "outline"}
                                    onClick={() => handleDayToggle(reminder.id, index)}
                                    className="w-10 h-8 p-0 text-xs"
                                  >
                                    {day}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">
                        {reminder.reminderTime}
                      </span>
                      {isEditing && reminder.id.startsWith('custom-') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteReminder(reminder.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isEditing && (
              <Button
                variant="outline"
                onClick={addCustomReminder}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Reminder
              </Button>
            )}
          </div>

          <div className="mt-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              💡 <strong>Gentle Approach:</strong> These reminders are designed to be supportive, 
              not demanding. Feel free to adjust or disable them based on your energy levels and needs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}