import { supabase } from '../config.js';

// Supabase-based Store (replaces localStorage)
const Store = {
  _user: null,
  _profile: null,

  async init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      this._user = session.user;
      await this._loadProfile();
    }
    supabase.auth.onAuthStateChange(async (event, session) => {
      this._user = session?.user || null;
      if (this._user) await this._loadProfile();
      else this._profile = null;
    });
  },

  async _loadProfile() {
    if (!this._user) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', this._user.id).maybeSingle();
    if (!error && data) {
      this._profile = data;
    } else {
      this._profile = null;
    }
  },

  getCurrentUser() { return this._profile?.username || null; },
  getProfile() { return this._profile; },
  getUserId() { return this._user?.id || null; },

  async signup(email, password, username, icon) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // Create profile
    const { error: pErr } = await supabase.from('profiles').insert({
      id: data.user.id, username, icon: icon || '\ud83c\uddf0\ud83c\uddf7'
    });
    if (pErr) return { error: pErr.message };
    this._user = data.user;
    await this._loadProfile();
    return { data };
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    this._user = data.user;
    await this._loadProfile();
    return { data };
  },

  async logout() {
    await supabase.auth.signOut();
    this._user = null;
    this._profile = null;
  },

  async saveScore(gameId, score, total, medal, wrongAnswers) {
    if (!this._user) return;
    const { error } = await supabase.from('scores').insert({
      user_id: this._user.id,
      game_id: gameId,
      score, total,
      medal: medal || null,
      wrong_answers: wrongAnswers || [],
      grade: this.getGrade(),
    });
    return { error };
  },

  async getBestScores(userId) {
    const uid = userId || this._user?.id;
    if (!uid) return {};
    const { data } = await supabase.from('scores')
      .select('game_id, score, total, medal, played_at')
      .eq('user_id', uid)
      .order('score', { ascending: false });
    const best = {};
    (data || []).forEach(s => {
      if (!best[s.game_id] || (s.game_id === 'gymnastics' ? s.score < best[s.game_id].score : s.score > best[s.game_id].score)) {
        best[s.game_id] = s;
      }
    });
    return best;
  },

  async getLeaderboard(gameId) {
    const currentGrade = this.getGrade();

    if (!gameId || gameId === 'total') {
      // Composite scoring: rank-based points across all 8 games
      const games = ['archery', 'swimming', 'weightlifting', 'gymnastics', 'marathon', 'antonym', 'idiom', 'homonym'];

      // Fetch all scores for current grade
      const { data } = await supabase.from('scores')
        .select('user_id, game_id, score, profiles!inner(username, icon, grade)')
        .eq('profiles.grade', currentGrade)
        .order('score', { ascending: false });

      if (!data || data.length === 0) return [];

      // Group by user and game, keep best score
      const userGameScores = {};
      data.forEach(s => {
        const key = `${s.user_id}_${s.game_id}`;
        const isGymnastics = s.game_id === 'gymnastics';
        if (!userGameScores[key] || (isGymnastics ? s.score < userGameScores[key].score : s.score > userGameScores[key].score)) {
          userGameScores[key] = {
            user_id: s.user_id,
            game_id: s.game_id,
            score: s.score,
            username: s.profiles.username,
            icon: s.profiles.icon
          };
        }
      });

      // Calculate ranks for each game and convert to points
      const userPoints = {};
      games.forEach(game => {
        const gameScores = Object.values(userGameScores).filter(s => s.game_id === game);
        const isGymnastics = game === 'gymnastics';
        gameScores.sort((a, b) => isGymnastics ? a.score - b.score : b.score - a.score);

        gameScores.forEach((s, idx) => {
          const rank = idx + 1;
          const points = rank <= 10 ? 11 - rank : 0; // 1st=10, 2nd=9, ..., 10th=1, 11th+=0

          if (!userPoints[s.user_id]) {
            userPoints[s.user_id] = {
              username: s.username,
              icon: s.icon,
              totalPoints: 0,
              gameBreakdown: {}
            };
          }
          userPoints[s.user_id].totalPoints += points;
          userPoints[s.user_id].gameBreakdown[game] = { rank, points };
        });
      });

      return Object.values(userPoints)
        .map(u => ({ ...u, compositeScore: u.totalPoints }))
        .sort((a, b) => b.totalPoints - a.totalPoints);
    } else {
      // Per-game: best score per user (grade-filtered)
      const { data } = await supabase.from('scores')
        .select('user_id, score, medal, profiles!inner(username, icon, grade)')
        .eq('game_id', gameId)
        .eq('profiles.grade', currentGrade)
        .order('score', { ascending: gameId === 'gymnastics' });

      if (!data || data.length === 0) return [];

      const best = {};
      data.forEach(s => {
        if (!best[s.user_id] || (gameId === 'gymnastics' ? s.score < best[s.user_id].score : s.score > best[s.user_id].score)) {
          best[s.user_id] = { username: s.profiles.username, icon: s.profiles.icon, score: s.score, medal: s.medal };
        }
      });
      return Object.values(best).sort((a, b) => gameId === 'gymnastics' ? a.score - b.score : b.score - a.score);
    }
  },

  async saveDailyChallenge(score, medal) {
    if (!this._user) return;
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('daily_challenges').upsert({
      user_id: this._user.id,
      challenge_date: today,
      score, medal,
    });
  },

  async getDailyChallenge() {
    if (!this._user) return null;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from('daily_challenges')
      .select('*')
      .eq('user_id', this._user.id)
      .eq('challenge_date', today)
      .single();
    return data;
  },

  async getTopScoresForGame(gameId, limit = 5) {
    const cacheKey = 'top_' + gameId;
    const now = Date.now();
    if (this._topCache && this._topCache[cacheKey] && now - this._topCache[cacheKey].ts < 60000) {
      return this._topCache[cacheKey].data;
    }
    const ascending = gameId === 'gymnastics';
    const { data } = await supabase.from('scores')
      .select('user_id, score, profiles!inner(username, icon)')
      .eq('game_id', gameId)
      .order('score', { ascending })
      .limit(20);
    const best = {};
    (data || []).forEach(s => {
      if (!best[s.user_id] || (ascending ? s.score < best[s.user_id].score : s.score > best[s.user_id].score)) {
        best[s.user_id] = { username: s.profiles.username, icon: s.profiles.icon, score: s.score };
      }
    });
    const sorted = Object.values(best).sort((a, b) => ascending ? a.score - b.score : b.score - a.score).slice(0, limit);
    if (!this._topCache) this._topCache = {};
    this._topCache[cacheKey] = { ts: now, data: sorted };
    return sorted;
  },

  async getDailyStreak() {
    if (!this._user) return 0;
    const { data } = await supabase.from('daily_challenges')
      .select('challenge_date')
      .eq('user_id', this._user.id)
      .order('challenge_date', { ascending: false })
      .limit(30);
    if (!data || data.length === 0) return 0;
    let streak = 1;
    for (let i = 1; i < data.length; i++) {
      const prev = new Date(data[i - 1].challenge_date);
      const curr = new Date(data[i].challenge_date);
      const diff = (prev - curr) / (1000 * 60 * 60 * 24);
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  },

  getGrade() {
    return this._profile?.grade || '8급';
  },

  async setGrade(grade) {
    if (!this._user) throw new Error('No user logged in');

    // Check if profile exists
    const { data: existing } = await supabase.from('profiles')
      .select('id')
      .eq('id', this._user.id)
      .single();

    if (!existing) {
      // Create profile if it doesn't exist
      const { error: insertError } = await supabase.from('profiles').insert({
        id: this._user.id,
        username: this._user.email?.split('@')[0] || 'User',
        icon: '🇰🇷',
        grade: grade
      });
      if (insertError) throw insertError;
    } else {
      // Update existing profile
      const { error: updateError } = await supabase.from('profiles')
        .update({ grade })
        .eq('id', this._user.id);
      if (updateError) throw updateError;
    }

    // Reload profile
    await this._loadProfile();

    return grade;
  },
};

export { Store };
export default Store;
