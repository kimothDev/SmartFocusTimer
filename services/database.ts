import * as SQLite from 'expo-sqlite';

//define the Session type based on our database schema
export interface DBSession {
  id?: number;
  taskType: string;
  energyLevel: string;
  timeOfDay: string;
  recommendedDuration: number;
  recommendedBreak: number;
  userSelectedDuration: number;
  userSelectedBreak: number;
  acceptedRecommendation: boolean;
  sessionCompleted: boolean;
  focusedUntilSkipped: number;
  reward: number;
  date: string;
  createdAt: string;
  skipReason?: 'skippedFocus' | 'skippedBreak' | 'none';

}

//open the database
const db = SQLite.openDatabaseSync('smart_focus_timer.db');

//initialise the database
export const initDatabase = async (): Promise<void> => {
  try {

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskType TEXT NOT NULL,
        energyLevel TEXT NOT NULL,
        timeOfDay TEXT NOT NULL,
        recommendedDuration INTEGER NOT NULL,
        recommendedBreak INTEGER NOT NULL,
        userSelectedDuration INTEGER NOT NULL,
        userSelectedBreak INTEGER NOT NULL,
        acceptedRecommendation INTEGER NOT NULL,
        sessionCompleted INTEGER NOT NULL,
        focusedUntilSkipped INTEGER NOT NULL,
        reward REAL NOT NULL,
        date TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        skipReason TEXT DEFAULT 'none'
      )
    `);

    console.log("Database initialized with updated schema");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};


//insert a new session
export const insertSession = async (session: Omit<DBSession, 'id'>): Promise<number> => {
  try {
    const result = await db.runAsync(
      `INSERT INTO sessions (
        taskType, energyLevel, timeOfDay, recommendedDuration, recommendedBreak,
        userSelectedDuration, userSelectedBreak, acceptedRecommendation,
        sessionCompleted, focusedUntilSkipped, reward, date, createdAt, skipReason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.taskType,
        session.energyLevel,
        session.timeOfDay,
        session.recommendedDuration,
        session.recommendedBreak,
        session.userSelectedDuration,
        session.userSelectedBreak,
        session.acceptedRecommendation ? 1 : 0,
        session.sessionCompleted ? 1 : 0,
        session.focusedUntilSkipped,
        session.reward,
        session.date,
        session.createdAt,
        session.skipReason || 'none',
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error inserting session:", error);
    throw error;
  }
};

//get all sessions
export const getAllSessions = async (): Promise<DBSession[]> => {
  try {
    const result = await db.getAllAsync<any>(`SELECT * FROM sessions ORDER BY createdAt DESC`);
    return result.map(row => ({
      ...row,
      acceptedRecommendation: !!row.acceptedRecommendation,
      sessionCompleted: !!row.sessionCompleted
    }));
  } catch (error) {
    console.error("Error getting sessions:", error);
    throw error;
  }
};

//get sessions by date range
export const getSessionsByDateRange = async (startDate: string, endDate: string): Promise<DBSession[]> => {
  try {
    const result = await db.getAllAsync<any>(
      `SELECT * FROM sessions WHERE date >= ? AND date <= ? ORDER BY createdAt DESC`,
      [startDate, endDate]
    );
    return result.map(row => ({
      ...row,
      acceptedRecommendation: !!row.acceptedRecommendation,
      sessionCompleted: !!row.sessionCompleted
    }));
  } catch (error) {
    console.error("Error getting sessions by date range:", error);
    throw error;
  }
};

//get sessions by date
export const getSessionsByDate = async (date: string): Promise<DBSession[]> => {
  try {
    const result = await db.getAllAsync<any>(
      `SELECT * FROM sessions WHERE date = ? ORDER BY createdAt DESC`,
      [date]
    );
    return result.map(row => ({
      ...row,
      acceptedRecommendation: !!row.acceptedRecommendation,
      sessionCompleted: !!row.sessionCompleted
    }));
  } catch (error) {
    console.error("Error getting sessions by date:", error);
    throw error;
  }
};

//delete all sessions
export const deleteAllSessions = async (): Promise<void> => {
  try {
    await db.execAsync(`DELETE FROM sessions`);
  } catch (error) {
    console.error("Error deleting all sessions:", error);
    throw error;
  }
};

//get session count
export const getSessionCount = async (): Promise<number> => {
  try {
    const result = await db.getFirstAsync<{count: number}>(`SELECT COUNT(*) as count FROM sessions`);
    return result?.count || 0;
  } catch (error) {
    console.error("Error getting session count:", error);
    throw error;
  }
};