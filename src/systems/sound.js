export const SoundSystem={
  ctx:null,
  init(){if(!this.ctx)this.ctx=new(window.AudioContext||window.webkitAudioContext)();},
  playSound(type){
    if(!this.ctx)return;
    const now=this.ctx.currentTime;
    const osc=this.ctx.createOscillator();
    const gain=this.ctx.createGain();
    osc.connect(gain);gain.connect(this.ctx.destination);
    switch(type){
      case 'correct':{
        osc.type='sine';osc.frequency.setValueAtTime(523.25,now);
        osc.frequency.linearRampToValueAtTime(659.25,now+0.15);
        gain.gain.setValueAtTime(0.3,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.3);
        osc.start(now);osc.stop(now+0.3);break;
      }
      case 'wrong':{
        osc.type='square';osc.frequency.setValueAtTime(200,now);
        osc.frequency.linearRampToValueAtTime(150,now+0.3);
        gain.gain.setValueAtTime(0.2,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.3);
        osc.start(now);osc.stop(now+0.3);break;
      }
      case 'medal':{
        const notes=[523.25,659.25,783.99,1046.5];
        notes.forEach((freq,i)=>{
          const o=this.ctx.createOscillator();const g=this.ctx.createGain();
          o.connect(g);g.connect(this.ctx.destination);o.type='sine';
          o.frequency.setValueAtTime(freq,now+i*0.2);
          g.gain.setValueAtTime(0.25,now+i*0.2);
          g.gain.exponentialRampToValueAtTime(0.01,now+i*0.2+0.25);
          o.start(now+i*0.2);o.stop(now+i*0.2+0.25);
        });break;
      }
      case 'flip':{
        osc.type='sine';osc.frequency.setValueAtTime(800,now);
        gain.gain.setValueAtTime(0.15,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.05);
        osc.start(now);osc.stop(now+0.05);break;
      }
      case 'tick':{
        osc.type='sine';osc.frequency.setValueAtTime(1000,now);
        gain.gain.setValueAtTime(0.1,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.05);
        osc.start(now);osc.stop(now+0.05);break;
      }
      case 'impact_light':{
        osc.type='sine';osc.frequency.setValueAtTime(800,now);osc.frequency.exponentialRampToValueAtTime(200,now+0.05);
        gain.gain.setValueAtTime(0.35,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.08);
        osc.start(now);osc.stop(now+0.08);break;
      }
      case 'impact_heavy':{
        osc.type='square';osc.frequency.setValueAtTime(200,now);osc.frequency.exponentialRampToValueAtTime(60,now+0.15);
        gain.gain.setValueAtTime(0.4,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.2);
        osc.start(now);osc.stop(now+0.2);break;
      }
      case 'whoosh':{
        const buf=this.ctx.createBuffer(1,this.ctx.sampleRate*0.2,this.ctx.sampleRate);
        const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.max(0,1-i/d.length);
        const src=this.ctx.createBufferSource();src.buffer=buf;
        const flt=this.ctx.createBiquadFilter();flt.type='bandpass';flt.frequency.value=2000;flt.Q.value=1;
        const g2=this.ctx.createGain();g2.gain.setValueAtTime(0.25,now);g2.gain.exponentialRampToValueAtTime(0.01,now+0.2);
        src.connect(flt);flt.connect(g2);g2.connect(this.ctx.destination);src.start(now);
        osc.frequency.setValueAtTime(20,now);gain.gain.setValueAtTime(0,now);osc.start(now);osc.stop(now+0.01);break;
      }
      case 'splash_sfx':{
        const buf=this.ctx.createBuffer(1,this.ctx.sampleRate*0.15,this.ctx.sampleRate);
        const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.max(0,1-i/d.length*2);
        const src=this.ctx.createBufferSource();src.buffer=buf;
        const flt=this.ctx.createBiquadFilter();flt.type='lowpass';flt.frequency.value=1500;
        const g2=this.ctx.createGain();g2.gain.setValueAtTime(0.3,now);g2.gain.exponentialRampToValueAtTime(0.01,now+0.15);
        src.connect(flt);flt.connect(g2);g2.connect(this.ctx.destination);src.start(now);
        osc.frequency.setValueAtTime(20,now);gain.gain.setValueAtTime(0,now);osc.start(now);osc.stop(now+0.01);break;
      }
      case 'metal_clang':{
        osc.type='triangle';osc.frequency.setValueAtTime(440,now);
        gain.gain.setValueAtTime(0.35,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.3);
        const o2=this.ctx.createOscillator();const g2=this.ctx.createGain();
        o2.connect(g2);g2.connect(this.ctx.destination);o2.type='triangle';
        o2.frequency.setValueAtTime(880,now);g2.gain.setValueAtTime(0.15,now);g2.gain.exponentialRampToValueAtTime(0.01,now+0.2);
        o2.start(now);o2.stop(now+0.2);osc.start(now);osc.stop(now+0.3);break;
      }
      case 'countdown_tick':{
        osc.type='sine';osc.frequency.setValueAtTime(440,now);
        gain.gain.setValueAtTime(0.3,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.12);
        osc.start(now);osc.stop(now+0.12);break;
      }
      case 'countdown_go':{
        [523.25,659.25,783.99].forEach((f,i)=>{
          const o=this.ctx.createOscillator();const g=this.ctx.createGain();
          o.connect(g);g.connect(this.ctx.destination);o.type='sine';
          o.frequency.setValueAtTime(f,now);g.gain.setValueAtTime(0.25,now);g.gain.exponentialRampToValueAtTime(0.01,now+0.35);
          o.start(now);o.stop(now+0.35);
        });
        osc.frequency.setValueAtTime(20,now);gain.gain.setValueAtTime(0,now);osc.start(now);osc.stop(now+0.01);break;
      }
      case 'combo_hit':{
        const freq=600+(this._comboFreq||0)*80;this._comboFreq=(this._comboFreq||0)+1;
        osc.type='sine';osc.frequency.setValueAtTime(freq,now);osc.frequency.linearRampToValueAtTime(freq*1.5,now+0.1);
        gain.gain.setValueAtTime(0.3,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.15);
        osc.start(now);osc.stop(now+0.15);break;
      }
      case 'power_charge':{
        osc.type='sawtooth';osc.frequency.setValueAtTime(100,now);osc.frequency.linearRampToValueAtTime(800,now+0.3);
        gain.gain.setValueAtTime(0.15,now);gain.gain.linearRampToValueAtTime(0.3,now+0.25);gain.gain.exponentialRampToValueAtTime(0.01,now+0.35);
        osc.start(now);osc.stop(now+0.35);break;
      }
      case 'gauge_stop':{
        osc.type='square';osc.frequency.setValueAtTime(600,now);
        gain.gain.setValueAtTime(0.35,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.06);
        osc.start(now);osc.stop(now+0.06);break;
      }
      case 'cheer':{
        const buf=this.ctx.createBuffer(1,this.ctx.sampleRate*0.5,this.ctx.sampleRate);
        const d=buf.getChannelData(0);for(let i=0;i<d.length;i++){const t=i/this.ctx.sampleRate;d[i]=(Math.random()*2-1)*Math.max(0,1-t*2)*0.3;}
        const src=this.ctx.createBufferSource();src.buffer=buf;
        const flt=this.ctx.createBiquadFilter();flt.type='bandpass';flt.frequency.value=1200;flt.Q.value=0.5;
        const g2=this.ctx.createGain();g2.gain.setValueAtTime(0.3,now);
        src.connect(flt);flt.connect(g2);g2.connect(this.ctx.destination);src.start(now);
        osc.frequency.setValueAtTime(20,now);gain.gain.setValueAtTime(0,now);osc.start(now);osc.stop(now+0.01);break;
      }
      case 'whistle':{
        osc.type='sine';osc.frequency.setValueAtTime(2000,now);osc.frequency.linearRampToValueAtTime(1500,now+0.15);
        osc.frequency.setValueAtTime(2000,now+0.2);osc.frequency.linearRampToValueAtTime(1500,now+0.4);
        gain.gain.setValueAtTime(0.2,now);gain.gain.setValueAtTime(0.2,now+0.15);gain.gain.exponentialRampToValueAtTime(0.01,now+0.45);
        osc.start(now);osc.stop(now+0.45);break;
      }
      case 'heartbeat':{
        osc.type='sine';osc.frequency.setValueAtTime(60,now);
        gain.gain.setValueAtTime(0.3,now);gain.gain.exponentialRampToValueAtTime(0.01,now+0.15);
        const o2=this.ctx.createOscillator();const g2=this.ctx.createGain();
        o2.connect(g2);g2.connect(this.ctx.destination);o2.type='sine';o2.frequency.setValueAtTime(55,now+0.2);
        g2.gain.setValueAtTime(0.25,now+0.2);g2.gain.exponentialRampToValueAtTime(0.01,now+0.35);
        o2.start(now+0.2);o2.stop(now+0.35);osc.start(now);osc.stop(now+0.15);break;
      }
    }
  },
  resetCombo(){this._comboFreq=0;},

  // === BGM System ===
  _bgmNodes: null,
  _bgmPlaying: false,

  startBGM(type = 'zen') {
    if (!this.ctx || this._bgmPlaying) return;
    this._bgmPlaying = true;
    const masterGain = this.ctx.createGain();
    masterGain.gain.value = 0.08;
    masterGain.connect(this.ctx.destination);

    // Pad drone (two detuned sine waves for warmth)
    const pad1 = this.ctx.createOscillator();
    const pad2 = this.ctx.createOscillator();
    const padGain = this.ctx.createGain();
    pad1.type = 'sine'; pad1.frequency.value = 220;
    pad2.type = 'sine'; pad2.frequency.value = 223;
    padGain.gain.value = 0.5;
    pad1.connect(padGain); pad2.connect(padGain); padGain.connect(masterGain);
    pad1.start(); pad2.start();

    // Pentatonic melody (C, D, E, G, A, C5)
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    let noteIdx = 0;
    const melodyGain = this.ctx.createGain();
    melodyGain.gain.value = 0.3;
    melodyGain.connect(masterGain);

    const playNote = () => {
      if (!this._bgmPlaying) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = notes[noteIdx % notes.length];
      g.gain.setValueAtTime(0.3, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.5);
      osc.connect(g); g.connect(melodyGain);
      osc.start(); osc.stop(this.ctx.currentTime + 1.5);
      noteIdx++;
    };
    playNote();
    const interval = setInterval(playNote, 2000);

    this._bgmNodes = { pad1, pad2, padGain, masterGain, interval };
  },

  stopBGM() {
    if (!this._bgmNodes) return;
    this._bgmPlaying = false;
    const { pad1, pad2, masterGain, interval } = this._bgmNodes;
    clearInterval(interval);
    masterGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1);
    setTimeout(() => {
      try { pad1.stop(); pad2.stop(); } catch(e) {}
    }, 1200);
    this._bgmNodes = null;
  },

  setBGMVolume(v) {
    if (this._bgmNodes && this._bgmNodes.masterGain) {
      this._bgmNodes.masterGain.gain.value = Math.max(0, Math.min(0.15, v));
    }
  },

  _loops:{},
  startLoop(id,type,interval){
    this.stopLoop(id);
    const play=()=>this.playSound(type);
    play();this._loops[id]=setInterval(play,interval);
  },
  stopLoop(id){if(this._loops[id]){clearInterval(this._loops[id]);delete this._loops[id];}},
  stopAllLoops(){Object.keys(this._loops).forEach(id=>this.stopLoop(id));}
};

document.addEventListener('click',()=>SoundSystem.init(),{once:true});
document.addEventListener('touchstart',()=>SoundSystem.init(),{once:true});
