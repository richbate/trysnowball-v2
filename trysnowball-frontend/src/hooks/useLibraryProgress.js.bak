import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'libraryProgress';

const useLibraryProgress = () => {
 const [done, setDone] = useState([]);
 const [saved, setSaved] = useState([]);

 // Load progress from localStorage on mount
 useEffect(() => {
  try {
   const storedProgress = localStorage.getItem(STORAGE_KEY);
   if (storedProgress) {
    const parsed = JSON.parse(storedProgress);
    setDone(parsed.done || []);
    setSaved(parsed.saved || []);
   }
  } catch (error) {
   console.error('Error loading library progress:', error);
  }
 }, []);

 // Save progress to localStorage whenever it changes
 useEffect(() => {
  try {
   const progressData = { done, saved };
   localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
  } catch (error) {
   console.error('Error saving library progress:', error);
  }
 }, [done, saved]);

 // Mark an article as done
 const markDone = useCallback((articleId) => {
  setDone(prev => {
   if (prev.includes(articleId)) {
    return prev; // Already marked as done
   }
   return [...prev, articleId];
  });
  
  // Remove from saved if it was there
  setSaved(prev => prev.filter(id => id !== articleId));
 }, []);

 // Mark an article as not done
 const markUndone = useCallback((articleId) => {
  setDone(prev => prev.filter(id => id !== articleId));
 }, []);

 // Toggle saved status
 const toggleSave = useCallback((articleId) => {
  setSaved(prev => {
   if (prev.includes(articleId)) {
    return prev.filter(id => id !== articleId);
   }
   return [...prev, articleId];
  });
 }, []);

 // Check if an article is done
 const isDone = useCallback((articleId) => {
  return done.includes(articleId);
 }, [done]);

 // Check if an article is saved
 const isSaved = useCallback((articleId) => {
  return saved.includes(articleId);
 }, [saved]);

 // Clear all progress
 const clearProgress = useCallback(() => {
  setDone([]);
  setSaved([]);
  try {
   localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
   console.error('Error clearing library progress:', error);
  }
 }, []);

 // Get progress stats
 const getStats = useCallback(() => {
  return {
   doneCount: done.length,
   savedCount: saved.length,
   totalCompleted: done.length
  };
 }, [done, saved]);

 return {
  done,
  saved,
  markDone,
  markUndone,
  toggleSave,
  isDone,
  isSaved,
  clearProgress,
  getStats
 };
};

export default useLibraryProgress;