"use strict";

// Interior/structure-borne sound design. No atmospheric wind on the lunar surface.
(() => {
  class RoverAudio {
    constructor() { this.muted = false; this.context = null; this.nodes = []; this.count = 0; this.low = false; this.stage = -1; }
    unlock() {
      try {
        if (!this.context) {
          const Context = window.AudioContext || window.webkitAudioContext;
          if (!Context) return;
          const ctx = this.context = new Context();
          this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : .24; this.master.connect(ctx.destination);
          this.motor = this.loop("triangle", 55); this.servo = this.loop("sine", 240);
          const buffer = ctx.createBuffer(1, ctx.sampleRate*2, ctx.sampleRate), data = buffer.getChannelData(0);
          for (let i=0;i<data.length;i++) data[i] = Math.random()*2-1;
          const noise = ctx.createBufferSource(); noise.buffer = buffer; noise.loop = true;
          const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 420;
          this.gravel = ctx.createGain(); this.gravel.gain.value = 0;
          noise.connect(filter); filter.connect(this.gravel); this.gravel.connect(this.master); noise.start(); this.nodes.push(noise);
        }
        this.context.resume().catch(() => {});
      } catch { /* Audio support is optional; driving remains available. */ }
    }
    loop(type, frequency) {
      const oscillator = this.context.createOscillator(), gain = this.context.createGain();
      oscillator.type = type; oscillator.frequency.value = frequency; gain.gain.value = 0;
      oscillator.connect(gain); gain.connect(this.master); oscillator.start(); this.nodes.push(oscillator);
      return { oscillator, gain };
    }
    setMuted(value) {
      this.muted = value;
      if (this.context) this.master.gain.setTargetAtTime(value ? 0 : .24, this.context.currentTime, .035);
    }
    reset() { this.count = 0; this.low = false; this.stage = -1; this.stop(); }
    stop() {
      if (!this.context) return;
      const time = this.context.currentTime;
      [this.motor?.gain, this.servo?.gain, this.gravel].filter(Boolean).forEach((gain) => gain.gain.setTargetAtTime(0,time,.035));
    }
    cue(kind) {
      const ctx = this.context; if (!ctx || ctx.state !== "running" || this.muted) return;
      const notes = kind === "success" ? [523,659,784] : kind === "sample" ? [660,880] : kind === "warning" ? [330,330] : [140,100];
      notes.forEach((frequency,i) => {
        const oscillator = ctx.createOscillator(), gain = ctx.createGain(), time = ctx.currentTime+i*.15;
        oscillator.type = "sine"; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0,time); gain.gain.linearRampToValueAtTime(.2,time+.015); gain.gain.exponentialRampToValueAtTime(.001,time+.23);
        oscillator.connect(gain); gain.connect(this.master); oscillator.start(time); oscillator.stop(time+.25);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    }
    update(sim) {
      const ctx = this.context; if (!ctx || ctx.state !== "running") return;
      const t = ctx.currentTime, speed = Math.abs(sim.speed)/4.8, sampling = sim.phase === "sampling";
      this.motor.oscillator.frequency.setTargetAtTime(42+speed*100,t,.12);
      this.motor.gain.gain.setTargetAtTime(speed*.17,t,.09);
      this.gravel.gain.setTargetAtTime(speed*(sim.rough ? .16 : .065),t,.09);
      this.servo.oscillator.frequency.setTargetAtTime(210+Math.sin(sim.sampleProgress*Math.PI*8)*45,t,.06);
      this.servo.gain.gain.setTargetAtTime(sampling ? .065 : 0,t,.04);
      if (sim.collected.size > this.count) this.cue("sample"); this.count = sim.collected.size;
      if (sim.battery < 25 && !this.low) { this.low = true; this.cue("warning"); }
    }
    dispose() {
      this.nodes.forEach((node) => { try { node.stop(); node.disconnect(); } catch {} }); this.nodes = [];
      if (this.context) this.context.close().catch(() => {}); this.context = null;
    }
  }
  window.LunarRoverAudio = RoverAudio;
})();
