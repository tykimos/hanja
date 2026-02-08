import { supabase } from '../config.js';
import Store from '../systems/store.js';

export class RoomManager {
  constructor() {
    this.room = null;
    this.channel = null;
    this._playersCallback = null;
    this._gameStartCallback = null;
    this._scoreCallback = null;
    this._doneCallback = null;
  }

  _generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  async createRoom(gameId) {
    const userId = Store.getUserId();
    if (!userId) return null;

    const code = this._generateCode();
    const { data, error } = await supabase.from('rooms').insert({
      code,
      host_id: userId,
      game_id: gameId,
      status: 'waiting',
      max_players: 8,
    }).select().single();

    if (error) { console.error('Create room error:', error); return null; }
    this.room = data;

    // Join as player
    await supabase.from('room_players').insert({
      room_id: data.id,
      user_id: userId,
    });

    this._subscribeToRoom(data.code);
    return data;
  }

  async joinRoom(code) {
    const userId = Store.getUserId();
    if (!userId) return null;

    const { data: room, error } = await supabase.from('rooms')
      .select('*')
      .eq('code', code)
      .eq('status', 'waiting')
      .single();

    if (error || !room) return null;
    this.room = room;

    // Join as player
    const { error: joinErr } = await supabase.from('room_players').insert({
      room_id: room.id,
      user_id: userId,
    });
    if (joinErr) { console.error('Join error:', joinErr); return null; }

    this._subscribeToRoom(code);

    // Notify others
    this.channel.send({
      type: 'broadcast',
      event: 'player_joined',
      payload: { userId },
    });

    return room;
  }

  _subscribeToRoom(code) {
    this.channel = supabase.channel(`room:${code}`)
      .on('broadcast', { event: 'player_joined' }, () => this._refreshPlayers())
      .on('broadcast', { event: 'player_left' }, () => this._refreshPlayers())
      .on('broadcast', { event: 'game_start' }, ({ payload }) => {
        if (this._gameStartCallback) this._gameStartCallback(payload);
      })
      .on('broadcast', { event: 'player_score' }, ({ payload }) => {
        if (this._scoreCallback) this._scoreCallback(payload);
      })
      .on('broadcast', { event: 'player_done' }, ({ payload }) => {
        if (this._doneCallback) this._doneCallback(payload);
      })
      .on('presence', { event: 'sync' }, () => {
        this._refreshPlayers();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel.track({
            userId: Store.getUserId(),
            username: Store.getCurrentUser(),
            icon: Store.getProfile()?.icon || '🇰🇷',
          });
        }
      });
  }

  async _refreshPlayers() {
    if (!this.room) return;
    const presence = this.channel.presenceState();
    const players = [];
    Object.values(presence).forEach(presences => {
      presences.forEach(p => {
        players.push({
          userId: p.userId,
          username: p.username,
          icon: p.icon,
          isHost: p.userId === this.room.host_id,
        });
      });
    });
    if (this._playersCallback) this._playersCallback(players);
  }

  async startGame() {
    if (!this.room) { console.error('startGame: no room'); return; }
    if (!this.channel) { console.error('startGame: no channel'); return; }
    const seed = Date.now();
    // Update room status (non-blocking, don't fail if RLS blocks)
    supabase.from('rooms')
      .update({ status: 'playing' })
      .eq('id', this.room.id)
      .then(({ error }) => { if (error) console.warn('Room status update failed:', error); });

    // Broadcast game start with seed
    await this.channel.send({
      type: 'broadcast',
      event: 'game_start',
      payload: { seed, gameId: this.room.game_id },
    });

    // Trigger locally for host
    const payload = { seed, gameId: this.room.game_id };
    if (this._gameStartCallback) {
      this._gameStartCallback(payload);
    } else {
      console.error('startGame: no gameStartCallback set');
    }
  }

  broadcastScore(score) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'player_score',
      payload: {
        userId: Store.getUserId(),
        username: Store.getCurrentUser(),
        score,
      },
    });
  }

  broadcastDone(score, total) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'player_done',
      payload: {
        userId: Store.getUserId(),
        username: Store.getCurrentUser(),
        score, total,
      },
    });
    // Update room_players
    supabase.from('room_players')
      .update({ score, finished: true })
      .eq('room_id', this.room.id)
      .eq('user_id', Store.getUserId());
  }

  async leave() {
    if (this.channel) {
      await this.channel.untrack();
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    if (this.room) {
      await supabase.from('room_players')
        .delete()
        .eq('room_id', this.room.id)
        .eq('user_id', Store.getUserId());
      this.room = null;
    }
  }

  onPlayersUpdate(cb) { this._playersCallback = cb; }
  onGameStart(cb) { this._gameStartCallback = cb; }
  onScoreUpdate(cb) { this._scoreCallback = cb; }
  onPlayerDone(cb) { this._doneCallback = cb; }
}
