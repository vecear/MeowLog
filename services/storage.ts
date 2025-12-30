import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where, Timestamp, getDoc, updateDoc } from 'firebase/firestore';
import { CareLog, DayStatus, TaskProgress } from '../types';

const COLLECTION_NAME = 'logs';

export const getLogs = async (): Promise<CareLog[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CareLog));
  } catch (e) {
    console.error("Failed to load logs from Firebase", e);
    return [];
  }
};

export const getLog = async (id: string): Promise<CareLog | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as CareLog;
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch log", e);
    return null;
  }
};

export const saveLog = async (log: CareLog): Promise<void> => {
  try {
    // Remove id from log if it exists (Firestore generates its own, or we use log.id as doc id?)
    // Best practice: let Firestore generate ID or use the one we created.
    // If we want to use the ID we generated:
    // await setDoc(doc(db, COLLECTION_NAME, log.id), log);
    // But since `log` object usually has ID, we can exclude it when adding?
    // Let's use `addDoc` and let Firestore generate ID, BUT our app expects `id`.
    // We should probably just store the log with its ID or omit ID.
    // Let's keep it simple: Use `addDoc`. The returned doc ref has ID.
    // But the UI generates an ID for optimistic UI? The AddLog page generated a UUID.
    // Let's just save the whole object first.
    // WAIT: If we use `addDoc`, the document ID is not inside the document data by default.
    // When reading back, we map `doc.id` to `id`.
    // So when saving, we should NOT save `id` field if we want to rely on Firestore ID.
    // However, AddLog generates an ID.
    // Let's remove `id` from the object before saving to avoid duplication/confusion,
    // OR just save it as a field `uid`?
    // Let's trust Firestore ID.
    const { id, ...logData } = log;
    await addDoc(collection(db, COLLECTION_NAME), logData);
  } catch (e) {
    console.error("Failed to save log to Firebase", e);
    throw e;
  }
};

export const updateLog = async (log: CareLog): Promise<void> => {
  try {
    const { id, ...logData } = log;
    if (!id) throw new Error("Log ID is required for update");
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, logData);
  } catch (e) {
    console.error("Failed to update log", e);
    throw e;
  }
};

export const deleteLog = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (e) {
    console.error("Failed to delete log", e);
    throw e;
  }
};

export const clearAllLogs = async (): Promise<void> => {
  // Warning: Deleting all documents in a collection from client is expensive/not direct.
  // We have to list and delete one by one.
  const logs = await getLogs();
  const batchPromises = logs.map(log => deleteLog(log.id));
  await Promise.all(batchPromises);
};

// Helper for status calculation
const getTimePeriod = (timestamp: number): 'morning' | 'afternoon' | 'bedtime' => {
  const hour = new Date(timestamp).getHours();
  if (hour < 12) return 'morning'; // 00:00 - 11:59
  if (hour < 18) return 'afternoon'; // 12:00 - 17:59
  return 'bedtime'; // 18:00 - 23:59
};

// Optimization: We could query only today's logs from Firestore
export const getTodayStatus = async (): Promise<DayStatus> => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  try {
    // Query logs where timestamp >= startOfDay
    const q = query(
      collection(db, COLLECTION_NAME),
      where('timestamp', '>=', startOfDay)
    );
    const querySnapshot = await getDocs(q);
    const todayLogs = querySnapshot.docs.map(doc => ({ ...doc.data() } as CareLog));

    const initProgress = (hasAfternoon: boolean): TaskProgress => ({
      morning: false,
      afternoon: hasAfternoon ? false : undefined,
      bedtime: false,
      isComplete: false
    });

    const status: DayStatus = {
      food: initProgress(false),
      water: initProgress(false),
      litter: initProgress(true),
    };

    todayLogs.forEach(log => {
      const period = getTimePeriod(log.timestamp);

      if (log.actions.food) {
        if (period === 'morning') status.food.morning = true;
        if (period === 'bedtime') status.food.bedtime = true;
      }

      if (log.actions.water) {
        if (period === 'morning') status.water.morning = true;
        if (period === 'bedtime') status.water.bedtime = true;
      }

      if (log.actions.litter) {
        if (period === 'morning') status.litter.morning = true;
        if (period === 'afternoon') status.litter.afternoon = true;
        if (period === 'bedtime') status.litter.bedtime = true;
      }
    });

    // Calculate completion
    status.food.isComplete = status.food.morning && status.food.bedtime;
    status.water.isComplete = status.water.morning && status.water.bedtime;
    status.litter.isComplete = status.litter.morning && (status.litter.afternoon === true) && status.litter.bedtime;

    return status;

  } catch (e) {
    console.error("Failed to calculate today's status", e);
    // Return empty status on error
    return {
      food: { morning: false, bedtime: false, isComplete: false },
      water: { morning: false, bedtime: false, isComplete: false },
      litter: { morning: false, bedtime: false, afternoon: false, isComplete: false }
    };
  }
};