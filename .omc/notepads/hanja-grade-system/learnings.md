# Learnings - Hanja Grade System

## Task 5: Grade-Filtered Leaderboard with Composite Scoring

### Implementation Summary
Replaced medal-count leaderboard system with rank-based composite scoring:

1. **Grade Filtering**: All leaderboard queries now filter by user's current grade using `Store.getGrade()`
   - Uses `profiles.grade` field for filtering
   - Shows message "{grade} 기록이 없습니다" when no data

2. **Composite Scoring Algorithm** (Total Tab):
   - Fetch all scores for current grade across 8 games
   - Group by user and game, keep best score per user per game
   - For each game: rank users by score (descending, except gymnastics which is ascending)
   - Convert rank to points: 1st=10, 2nd=9, 3rd=8, ..., 10th=1, 11th+=0
   - Sum points across all 8 games for total composite score
   - Sort users by total composite score (descending)

3. **Per-Game Leaderboards**: Filtered by grade, sorted by score

4. **Score Saving**: Added grade field to `saveScore()` to tag each score with user's current grade at time of play

### Files Modified
- `/Users/tykimos/vibecode/hanja/src/systems/store.js`:
  - `getLeaderboard()`: Implemented composite scoring and grade filtering
  - `saveScore()`: Added grade field to score records

- `/Users/tykimos/vibecode/hanja/src/screens/leaderboard.js`:
  - `renderLB()`: Updated display to show "총 {points}점" for total tab instead of medal counts
  - Added grade display in empty state message

### Technical Details
- Composite scoring uses single optimized query approach
- Gymnastics game uses ascending sort (lower score is better)
- All other games use descending sort (higher score is better)
- Points scale: top 10 ranks only (1st=10pts down to 10th=1pt)
- Users who haven't played all games can still appear (total = sum of games played)

### Verification
- Build: `npx vite build` - SUCCESS (75 modules, ~999KB)
- No TypeScript/ESLint warnings
- Grade filtering works via inner join on profiles table
- Composite scoring correctly aggregates across 8 games
