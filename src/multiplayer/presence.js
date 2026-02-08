import { supabase } from '../config.js';
import Store from '../systems/store.js';

// Track online users globally
export class PresenceTracker {
  constructor() {
    this.channel = null;
    this._onlineUsers = [];
    this._callback = null;
  }

  async start() {
    this.channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel.presenceState();
        this._onlineUsers = [];
        Object.values(state).forEach(presences => {
          presences.forEach(p => {
            this._onlineUsers.push({
              userId: p.userId,
              username: p.username,
              icon: p.icon,
            });
          });
        });
        if (this._callback) this._callback(this._onlineUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const profile = Store.getProfile();
          await this.channel.track({
            userId: Store.getUserId(),
            username: profile?.username || 'Unknown',
            icon: profile?.icon || '🇰🇷',
          });
        }
      });
  }

  stop() {
    if (this.channel) {
      this.channel.untrack();
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  getOnlineUsers() { return this._onlineUsers; }
  onUpdate(cb) { this._callback = cb; }
}
