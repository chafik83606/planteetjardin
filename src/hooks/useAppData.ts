import { useCallback, useEffect, useState } from 'react';
import {
  getUserPlants,
  getUpcomingTasks,
  getOverdueTasks,
  getTodayWateringTasks,
  getJournalEntries,
  initDatabase,
} from '../services/database';
import { scheduleCareReminders } from '../services/notifications';
import { UserPlant, CareTask, JournalEntry } from '../types';

export function useAppData() {
  const [plants, setPlants] = useState<UserPlant[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<CareTask[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<CareTask[]>([]);
  const [todayWatering, setTodayWatering] = useState<CareTask[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(() => {
    setPlants(getUserPlants());
    setUpcomingTasks(getUpcomingTasks());
    setOverdueTasks(getOverdueTasks());
    setTodayWatering(getTodayWateringTasks(3));
    setJournalEntries(getJournalEntries());
  }, []);

  useEffect(() => {
    initDatabase();
    refresh();
    scheduleCareReminders();
    setIsReady(true);
  }, [refresh]);

  return {
    plants,
    upcomingTasks,
    overdueTasks,
    todayWatering,
    journalEntries,
    isReady,
    refresh,
  };
}
