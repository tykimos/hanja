import { supabase } from '../config.js';
import Store from './store.js';

/**
 * Logs an answer to the database (fire-and-forget)
 * @param {string} gameId - The game ID (e.g., 'archery', 'swimming')
 * @param {string} hanjaChar - The hanja character being answered
 * @param {boolean} isCorrect - Whether the answer was correct
 */
export function logAnswer(gameId, hanjaChar, isCorrect) {
  const userId = Store.getUserId();
  const userGrade = Store.getGrade();

  if (!userId) return;

  // Fire and forget - don't await, don't block gameplay
  supabase.from('answer_log').insert({
    user_id: userId,
    game_id: gameId,
    hanja_char: hanjaChar,
    is_correct: isCorrect,
    user_grade: userGrade
  }).then(() => {
    // Also update hanja_stats via the upsert function
    return supabase.rpc('upsert_hanja_stat', {
      p_user_id: userId,
      p_hanja_char: hanjaChar,
      p_is_correct: isCorrect
    });
  }).catch(err => {
    // Silent fail - don't interrupt gameplay
    console.debug('Answer logging failed (non-critical):', err);
  });
}
