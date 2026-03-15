"use server";

import { db } from "./prisma";

/**
 * A wrapper function for database operations that provides graceful error handling
 * when the database is unavailable. This allows the application to continue functioning
 * in development or when the database connection is temporarily lost.
 * 
 * @param {Function} operation - The database operation to execute
 * @param {any} fallback - The fallback value to return if database is unavailable
 * @param {boolean} logError - Whether to log the error (default: true)
 * @returns {Promise<any>} The result of the operation or fallback value
 */
export async function withDbFallback(operation, fallback = null, logError = true) {
  try {
    return await operation();
  } catch (error) {
    // Check if this is a database connection error
    const isConnectionError = error.code === "P1001" || 
                             error.message?.includes("Can't reach database server") ||
                             error.message?.includes("database server");
    
    if (isConnectionError) {
      // Only log connection errors once to avoid spam
      if (logError) {
        console.warn("Database is unavailable, using fallback behavior");
      }
      return fallback;
    }
    
    // For non-connection errors, log them as before
    if (logError) {
      console.error("Database operation failed:", error.message);
    }
    
    // Re-throw non-connection errors
    throw error;
  }
}

/**
 * Safely execute a database findUnique operation with fallback
 */
export async function safeFindUnique(model, where, fallback = null) {
  return withDbFallback(
    () => db[model].findUnique({ where }),
    fallback
  );
}

/**
 * Safely execute a database findMany operation with fallback
 */
export async function safeFindMany(model, query = {}, fallback = []) {
  return withDbFallback(
    () => db[model].findMany(query),
    fallback
  );
}

/**
 * Safely execute a database create operation with fallback
 */
export async function safeCreate(model, data, fallback = null) {
  return withDbFallback(
    () => db[model].create({ data }),
    fallback
  );
}

/**
 * Safely execute a database update operation with fallback
 */
export async function safeUpdate(model, where, data, fallback = null) {
  return withDbFallback(
    () => db[model].update({ where, data }),
    fallback
  );
}

/**
 * Check if database is available by attempting a simple query
 */
export async function isDatabaseAvailable() {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}