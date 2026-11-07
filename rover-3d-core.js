"use strict";

// Rendering-independent mission rules. The same simulation drives keyboard and touch controls.
((root) => {
  const BASE = Object.freeze({ x: -42, z: 36 });
  const CRATER = Object.freeze({ x: -5, z: -7, radius: 18 });
  const SITES = Object.freeze([
    Object.freeze({ id: "a", x: 30, z: 32, name: "玄武岩", detail: "玄武岩樣本可用來討論月球過去的熔岩活動。" }),
    Object.freeze({ id: "b", x: 34, z: -32, name: "角礫岩", detail: "角礫岩混合了多種岩屑，可用來討論撞擊如何破碎與混合岩石。" })
  ]);
  const ROCKS = Object.freeze([
    [-28, 22, 1.6], [-15, 42, 1.3], [10, 23, 1.4], [19, 44, 1.7],
    [42, 19, 1.8], [48, 41, 1.2], [-33, -15, 2.0], [-37, -34, 1.5],
    [19, -19, 1.2], [45, -23, 1.6], [25, -44, 1.4], [5, -42, 1.9],
    [-13, -34, 1.2], [-48, 5, 1.4], [50, -5, 1.6], [8, 51, 1.3]
  ].map(([x, z, radius]) => Object.freeze({ x, z, radius })));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const roughAt = (x, z) => x > 17 && z < -12;
  const SAMPLE_SECONDS = 5.2;
  const SMALL_CRATERS = Object.freeze([[-23, 1, 4], [13, 9, 2.8], [-8, 45, 3], [47, -43, 4.2], [-43, -39, 5], [9, -49, 3.5], [55, 5, 2.5]]);

  function heightAt(x, z) {
    const d = Math.hypot(x - CRATER.x, z - CRATER.z);
    const ground = Math.sin(x * .075) * .38 + Math.cos(z * .085) * .3 + Math.sin(x * .23 + z * .18) * .09;
    const bowl = -3.9 * Math.exp(-((d / 14) ** 4));
    const rim = 1.65 * Math.exp(-(((d - 18) / 3.1) ** 2));
    let small = 0;
    for (const [cx, cz, radius] of SMALL_CRATERS) {
      const r = Math.hypot(x-cx,z-cz) / radius;
      small += -.42*Math.exp(-(r**4)*2) + .16*Math.exp(-(((r-1)/.18)**2));
    }
    return ground + bowl + rim + small + (roughAt(x, z) ? Math.sin(x * 1.1) * Math.cos(z * .9) * .16 : 0);
  }

  function obstruction(x, z) {
    if (Math.abs(x) > 61 || Math.abs(z) > 61) return "已到探索區邊界，請轉向。";
    if (Math.abs(x - (BASE.x - 5)) < 3.9 && Math.abs(z - (BASE.z + 7)) < 3.2) return "前方是基地設備，請繞行。";
    if (Math.hypot(x - CRATER.x, z - CRATER.z) < CRATER.radius + 1.3) return "前方是撞擊坑，請沿邊緣繞行。";
    if (ROCKS.some((rock) => Math.hypot(x - rock.x, z - rock.z) < rock.radius + 1.25)) return "前方有岩石，請倒車或轉向繞過。";
    return "";
  }

  class Simulation {
    constructor() { this.reset(); }
    reset() {
      this.x = BASE.x; this.z = BASE.z; this.heading = Math.PI / 2;
      this.speed = 0; this.battery = 100; this.distance = 0; this.elapsed = 0;
      this.phase = "ready"; this.collected = new Set(); this.sampling = null;
      this.sampleProgress = 0; this.blocked = ""; this.recoveries = 0;
      this.trail = [{ x: this.x, z: this.z }];
    }
    start() { if (this.phase === "ready") this.phase = "active"; }
    get rough() { return roughAt(this.x, this.z); }
    get atBase() { return distance(this, BASE) <= 6; }
    get nearbySite() { return SITES.find((site) => distance(this, site) <= 5); }
    get canCollect() {
      const site = this.nearbySite;
      return this.phase === "active" && Math.abs(this.speed) < .65 && !!site && !this.collected.has(site.id);
    }
    get canFinish() { return this.phase === "active" && this.atBase && Math.abs(this.speed) < .65 && this.collected.size > 0; }
    get target() { return this.collected.size ? { ...BASE, name: "基地" } : { ...SITES[0], name: "A 採樣點" }; }
    collect() {
      if (!this.canCollect) return false;
      this.phase = "sampling"; this.sampling = this.nearbySite;
      this.sampleProgress = 0; this.speed = 0; this.battery = Math.max(0, this.battery - 2.5);
      if (!this.battery) this.phase = "failed";
      return true;
    }
    finish() { if (!this.canFinish) return false; this.phase = "complete"; this.speed = 0; return true; }
    recover() {
      if (this.phase !== "active") return false;
      const x = this.x - Math.sin(this.heading) * 2;
      const z = this.z + Math.cos(this.heading) * 2;
      if (!obstruction(x, z)) { this.x = x; this.z = z; }
      this.heading = Math.atan2(this.target.x - this.x, -(this.target.z - this.z));
      this.speed = 0; this.blocked = ""; this.recoveries++;
      this.battery = Math.max(0, this.battery - 5);
      if (!this.battery) this.phase = "failed";
      return true;
    }
    step(seconds, input = {}) {
      const dt = clamp(seconds, 0, .05);
      if (!["active", "sampling"].includes(this.phase)) return;
      this.elapsed += dt;
      if (this.phase === "sampling") {
        this.sampleProgress = Math.min(1, this.sampleProgress + dt / SAMPLE_SECONDS);
        if (this.sampleProgress >= 1) {
          this.collected.add(this.sampling.id); this.phase = "active"; this.sampling = null;
        }
        return;
      }
      const throttle = clamp(input.throttle || 0, -1, 1);
      const steer = clamp(input.steer || 0, -1, 1);
      const maxSpeed = this.rough ? 2.5 : 4.8;
      const desiredSpeed = throttle >= 0 ? throttle * maxSpeed : throttle * 2.4;
      const rate = throttle ? 2.4 : 4.8;
      this.speed += clamp(desiredSpeed - this.speed, -rate * dt, rate * dt);
      this.heading += steer * dt * (Math.abs(this.speed) > .1 ? 1.05 : .72) * (this.speed < -.1 ? -1 : 1);
      this.heading = Math.atan2(Math.sin(this.heading), Math.cos(this.heading));
      const x = this.x + Math.sin(this.heading) * this.speed * dt;
      const z = this.z - Math.cos(this.heading) * this.speed * dt;
      this.blocked = obstruction(x, z);
      if (this.blocked) this.speed = 0;
      else {
        const travelled = Math.hypot(x - this.x, z - this.z);
        this.distance += travelled;
        this.battery -= travelled * (this.rough ? .52 : .24);
        this.x = x; this.z = z;
        if (distance(this, this.trail.at(-1)) > 1.5) {
          this.trail.push({ x, z });
          if (this.trail.length > 900) this.trail.shift();
        }
      }
      this.battery = clamp(this.battery - dt * .012, 0, 100);
      if (!this.battery) { this.phase = "failed"; this.speed = 0; }
    }
  }
  const api = { Simulation, BASE, CRATER, SITES, ROCKS, SAMPLE_SECONDS, SMALL_CRATERS, heightAt, roughAt, obstruction, distance };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LunarRoverCore = api;
})(typeof window === "undefined" ? globalThis : window);
