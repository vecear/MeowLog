import { CareLog, DayStatus, TaskProgress, WeightLog } from '../types';
import { signOut } from './googleAuth';

const LOGS_FILE_NAME = 'meowlog_data.json';
const WEIGHT_LOGS_FILE_NAME = 'meowlog_weight_data.json';

// --- Helper Functions to interact with Google Drive ---

const handleAuthError = (e: any) => {
  // Check for GAPI error structure or generic 401
  const status = e?.status || e?.result?.error?.code;
  if (status === 401) {
    console.warn("Authentication expired (401). Signing out...");
    signOut();
    window.location.reload();
  }
};

async function findFile(fileName: string): Promise<string | null> {
  try {
    const response = await window.gapi.client.drive.files.list({
      q: `name = '${fileName}' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    const files = response.result.files;
    if (files && files.length > 0) {
      return files[0].id; // Return the first matching file ID
    }
    return null;
  } catch (e) {
    handleAuthError(e);
    console.error(`Error finding file ${fileName}:`, e);
    return null;
  }
}

async function createFile(fileName: string, content: any[]): Promise<string> {
  try {
    const fileContent = JSON.stringify(content);
    const file = new Blob([fileContent], { type: 'application/json' });
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
    };

    const accessToken = window.gapi.auth.getToken().access_token;
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
      body: form,
    });

    if (response.status === 401) {
      handleAuthError({ status: 401 });
      throw new Error("Authentication expired");
    }

    if (!response.ok) {
      throw new Error(`Failed to create file: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  } catch (e) {
    handleAuthError(e); // Catch generic errors too if needed, though 401 usually caught above or by fetch throwing? Fetch doesn't throw on 401 usually.
    console.error(`Error creating file ${fileName}:`, e);
    throw e;
  }
}

async function readFile(fileId: string): Promise<any[]> {
  try {
    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });
    // response.result should be the JSON object if simple get, or response.body if stream?
    // gapi client usually parses JSON response if content-type is json.
    return response.result as any[];
  } catch (e) {
    handleAuthError(e);
    console.error("Error reading file:", e);
    return [];
  }
}

async function updateFile(fileId: string, content: any[]): Promise<void> {
  try {
    const fileContent = JSON.stringify(content);
    const file = new Blob([fileContent], { type: 'application/json' });

    const accessToken = window.gapi.auth.getToken().access_token;

    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: new Headers({
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      }),
      body: fileContent, // Simple upload for small JSON files is fine via body
    });

    if (response.status === 401) {
      handleAuthError({ status: 401 });
      throw new Error("Authentication expired");
    }

    if (!response.ok) {
      throw new Error(`Failed to update file: ${response.statusText}`);
    }

  } catch (e) {
    handleAuthError(e);
    console.error("Error updating file:", e);
    throw e;
  }
}

// --- Data Layer Impl ---
// We will simply read the whole array, modify, and write it back.
// Ideally we cache this locally to avoid too many requests.

// Simple In-memory cache for this session
let logsCache: CareLog[] | null = null;
let weightLogsCache: WeightLog[] | null = null;
let logsFileId: string | null = null;
let weightLogsFileId: string | null = null;


// --- Care Logs Functions ---

const ensureLogsLoaded = async (): Promise<CareLog[]> => {
  if (logsCache) return logsCache;

  // 1. Find or Create File
  if (!logsFileId) {
    logsFileId = await findFile(LOGS_FILE_NAME);
  }

  if (!logsFileId) {
    // Create new
    logsFileId = await createFile(LOGS_FILE_NAME, []);
    logsCache = [];
    return [];
  }

  // 2. Read File
  const content = await readFile(logsFileId);
  logsCache = Array.isArray(content) ? content : [];
  // Ensure dates are parsed if they were stored as strings (JSON standard)
  // Our types say timestamp is number, so JSON.stringify/parse preserves it correctly.
  return logsCache!;
}


export const getLogs = async (): Promise<CareLog[]> => {
  const logs = await ensureLogsLoaded();
  // Sort desc by timestamp
  return logs.sort((a, b) => b.timestamp - a.timestamp);
};

export const getLog = async (id: string): Promise<CareLog | null> => {
  const logs = await ensureLogsLoaded();
  return logs.find(l => l.id === id) || null;
};

export const saveLog = async (log: CareLog): Promise<void> => {
  const logs = await ensureLogsLoaded();

  // Add new log
  // Warning: If log.id is not set, we should generate one. Check AddLog impl.
  // Assuming log has id.

  // If id exists, it might be an update? The original Firebase code differentiated updateLog and saveLog.
  // saveLog seemed to match "addDoc" which implies new.
  // But earlier I noted "Remove id from log if it exists...".
  // Let's assume this is always NEW.

  // Generate ID if missing (just in case)
  if (!log.id) {
    log.id = crypto.randomUUID();
  }

  logsCache = [log, ...logs];
  // Sync to drive
  if (logsFileId) await updateFile(logsFileId, logsCache);
  else {
    // Should have been created by ensureLogsLoaded, but safeguard
    logsFileId = await createFile(LOGS_FILE_NAME, logsCache);
  }
};

export const updateLog = async (log: CareLog): Promise<void> => {
  const logs = await ensureLogsLoaded();
  const index = logs.findIndex(l => l.id === log.id);
  if (index !== -1) {
    logs[index] = log;
    logsCache = [...logs];
    if (logsFileId) await updateFile(logsFileId, logsCache);
  } else {
    throw new Error("Log not found to update");
  }
};

export const deleteLog = async (id: string): Promise<void> => {
  const logs = await ensureLogsLoaded();
  const newLogs = logs.filter(l => l.id !== id);
  logsCache = newLogs;
  if (logsFileId) await updateFile(logsFileId, logsCache);
};

export const clearAllLogs = async (): Promise<void> => {
  logsCache = [];
  if (logsFileId) await updateFile(logsFileId, logsCache);
};


// --- Weight Log Functions ---

const ensureWeightLogsLoaded = async (): Promise<WeightLog[]> => {
  if (weightLogsCache) return weightLogsCache;

  if (!weightLogsFileId) {
    weightLogsFileId = await findFile(WEIGHT_LOGS_FILE_NAME);
  }

  if (!weightLogsFileId) {
    weightLogsFileId = await createFile(WEIGHT_LOGS_FILE_NAME, []);
    weightLogsCache = [];
    return [];
  }

  const content = await readFile(weightLogsFileId);
  weightLogsCache = Array.isArray(content) ? content : [];
  return weightLogsCache!;
}

export const getWeightLogs = async (): Promise<WeightLog[]> => {
  const logs = await ensureWeightLogsLoaded();
  return logs.sort((a, b) => b.timestamp - a.timestamp);
};

export const getLatestWeightLog = async (): Promise<WeightLog | null> => {
  const logs = await ensureWeightLogsLoaded();
  if (logs.length === 0) return null;
  logs.sort((a, b) => b.timestamp - a.timestamp);
  return logs[0];
};

export const saveWeightLog = async (log: WeightLog): Promise<void> => {
  const logs = await ensureWeightLogsLoaded();
  // Assuming new
  if (!log.id) log.id = crypto.randomUUID();

  weightLogsCache = [log, ...logs];
  if (weightLogsFileId) await updateFile(weightLogsFileId, weightLogsCache);
  else weightLogsFileId = await createFile(WEIGHT_LOGS_FILE_NAME, weightLogsCache);
};

export const deleteWeightLog = async (id: string): Promise<void> => {
  const logs = await ensureWeightLogsLoaded();
  const newLogs = logs.filter(l => l.id !== id);
  weightLogsCache = newLogs;
  if (weightLogsFileId) await updateFile(weightLogsFileId, weightLogsCache);
};

export const updateWeightLog = async (log: WeightLog): Promise<void> => {
  const logs = await ensureWeightLogsLoaded();
  const index = logs.findIndex(l => l.id === log.id);
  if (index !== -1) {
    logs[index] = log;
    weightLogsCache = [...logs];
    if (weightLogsFileId) await updateFile(weightLogsFileId, weightLogsCache);
  } else {
    throw new Error("Weight log not found");
  }
};


// --- Status Helper (Client-side calc, same as before) ---
// Since we have all logs locally, this is even easier/faster.

const getTimePeriod = (timestamp: number): 'morning' | 'noon' | 'evening' | 'bedtime' => {
  const hour = new Date(timestamp).getHours();
  if (hour < 11) return 'morning'; // 00:00 - 10:59
  if (hour < 16) return 'noon'; // 11:00 - 15:59
  if (hour < 21) return 'evening'; // 16:00 - 20:59
  return 'bedtime'; // 21:00 - 23:59
};

export const getTodayStatus = async (): Promise<DayStatus> => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  try {
    const allLogs = await ensureLogsLoaded();
    const todayLogs = allLogs.filter(l => l.timestamp >= startOfDay);

    const initProgress = (): TaskProgress => ({
      morning: false,
      noon: false,
      evening: false,
      bedtime: false,
      isComplete: false
    });

    const status: DayStatus = {
      food: initProgress(),
      water: initProgress(),
      litter: initProgress(),
      grooming: initProgress(),
      medication: initProgress(),
      weight: initProgress(),
    };

    todayLogs.forEach(log => {
      const period = getTimePeriod(log.timestamp);

      if (log.actions.food) {
        if (period === 'morning') status.food.morning = true;
        if (period === 'noon') status.food.noon = true;
        if (period === 'evening') status.food.evening = true;
        if (period === 'bedtime') status.food.bedtime = true;
      }

      if (log.actions.water) {
        if (period === 'morning') status.water.morning = true;
        if (period === 'noon') status.water.noon = true;
        if (period === 'evening') status.water.evening = true;
        if (period === 'bedtime') status.water.bedtime = true;
      }

      if (log.actions.litter) {
        if (period === 'morning') status.litter.morning = true;
        if (period === 'noon') status.litter.noon = true;
        if (period === 'evening') status.litter.evening = true;
        if (period === 'bedtime') status.litter.bedtime = true;
      }

      if (log.actions.grooming) {
        if (period === 'morning') status.grooming.morning = true;
        if (period === 'noon') status.grooming.noon = true;
        if (period === 'evening') status.grooming.evening = true;
        if (period === 'bedtime') status.grooming.bedtime = true;
      }

      if (log.actions.medication) {
        if (period === 'morning') status.medication.morning = true;
        if (period === 'noon') status.medication.noon = true;
        if (period === 'evening') status.medication.evening = true;
        if (period === 'bedtime') status.medication.bedtime = true;
      }

      if (log.weight !== undefined && log.weight !== null) {
        if (period === 'morning') status.weight.morning = true;
        if (period === 'noon') status.weight.noon = true;
        if (period === 'evening') status.weight.evening = true;
        if (period === 'bedtime') status.weight.bedtime = true;
      }
    });

    // Calculate completion (all 4 periods must be done)
    status.food.isComplete = status.food.morning && status.food.noon && status.food.evening && status.food.bedtime;
    status.water.isComplete = status.water.morning && status.water.noon && status.water.evening && status.water.bedtime;
    status.litter.isComplete = status.litter.morning && status.litter.noon && status.litter.evening && status.litter.bedtime;
    status.grooming.isComplete = status.grooming.morning && status.grooming.noon && status.grooming.evening && status.grooming.bedtime;
    status.medication.isComplete = status.medication.morning && status.medication.noon && status.medication.evening && status.medication.bedtime;
    status.weight.isComplete = status.weight.morning && status.weight.noon && status.weight.evening && status.weight.bedtime;

    return status;

  } catch (e) {
    console.error("Failed to calculate today's status", e);
    return {
      food: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
      water: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
      litter: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
      grooming: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
      medication: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
      weight: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false }
    };
  }
};

// --- Settings Functions ---
import { AppSettings } from '../types';
import { SETTINGS_FILE_NAME } from '../constants';

let settingsCache: AppSettings | null = null;
let settingsFileId: string | null = null;

const ensureSettingsLoaded = async (): Promise<AppSettings> => {
  if (settingsCache) return settingsCache;

  if (!settingsFileId) {
    settingsFileId = await findFile(SETTINGS_FILE_NAME);
  }

  if (!settingsFileId) {
    // Return default unconfigured state, but don't create file yet until they save?
    // Or handle creation on save.
    // Let's return a default object indicating not configured.
    return {
      pet: { name: '', type: 'CAT' },
      owners: [],
      isConfigured: false
    };
  }

  const content = await readFile(settingsFileId);
  // content should be the object directly if readFile returns JSON, 
  // BUT readFile impl returns array (as any[]) in previous code?
  // Wait, readFile: `return response.result as any[];`
  // If the file content is an object (not array), this cast might be misleading but JS runtime is fine.
  // Let's check readFile impl.
  // Ideally readFile should return `any`.

  settingsCache = content as unknown as AppSettings;
  return settingsCache;
}

export const getSettings = async (): Promise<AppSettings> => {
  return await ensureSettingsLoaded();
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  settingsCache = settings;
  if (!settingsFileId) {
    settingsFileId = await findFile(SETTINGS_FILE_NAME);
  }

  if (settingsFileId) {
    // cast to any[] to satisfy current helper logic if needed, or update helper
    // updateFile helper expects `any[]`. Let's fix helper or cast.
    // Actually `updateFile` does `JSON.stringify(content)`. It doesn't care if array or object.
    await updateFile(settingsFileId, settings as any);
  } else {
    settingsFileId = await createFile(SETTINGS_FILE_NAME, settings as any);
  }
};
