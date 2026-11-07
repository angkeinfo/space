"use strict";

// Fixed-size pools: tracks stay on the surface; dust follows ballistic arcs, without wind.
(() => {
  class LunarEffects {
    constructor(T, scene) {
      this.T = T; this.scene = scene; this.trackIndex = 0; this.trackCount = 0; this.last = null;
      this.cursor = 0; this.emission = 0; this.dust = Array.from({ length: 180 }, () => ({ life: 0 }));
      this.dummy = new T.Object3D(); this.up = new T.Vector3(0, 1, 0);
      const canvas = document.createElement("canvas"); canvas.width = 64; canvas.height = 96;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#000"; ctx.fillRect(0,0,64,96);
      ctx.fillStyle = "#333"; ctx.fillRect(4, 0, 56, 96);
      ctx.strokeStyle = "#ccc"; ctx.lineWidth = 8;
      for (let y = -20; y < 120; y += 24) { ctx.beginPath(); ctx.moveTo(6,y); ctx.lineTo(32,y+13); ctx.lineTo(58,y); ctx.stroke(); }
      const map = new T.CanvasTexture(canvas);
      const geometry = new T.PlaneGeometry(.42, .34); geometry.rotateX(-Math.PI / 2);
      this.tracks = new T.InstancedMesh(geometry, new T.MeshBasicMaterial({ color: 0x282622, alphaMap: map, transparent: true, opacity: .38, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), 1800);
      this.tracks.instanceMatrix.setUsage(T.DynamicDrawUsage); this.tracks.count = 0; this.tracks.frustumCulled = false; this.tracks.renderOrder = 1; scene.add(this.tracks);
      this.positions = new Float32Array(this.dust.length * 3); this.fades = new Float32Array(this.dust.length);
      const dustGeometry = new T.BufferGeometry();
      dustGeometry.setAttribute("position", new T.BufferAttribute(this.positions, 3).setUsage(T.DynamicDrawUsage));
      dustGeometry.setAttribute("fade", new T.BufferAttribute(this.fades, 1).setUsage(T.DynamicDrawUsage));
      this.cloud = new T.Points(dustGeometry, new T.ShaderMaterial({
        transparent: true, depthWrite: false, uniforms: { scale: { value: 320 } },
        vertexShader: "attribute float fade; varying float alpha; uniform float scale; void main(){alpha=fade;vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(scale*.12/max(1.,-p.z),1.,18.);gl_Position=projectionMatrix*p;}",
        fragmentShader: "varying float alpha; void main(){float r=length(gl_PointCoord-.5)*2.;float a=(1.-smoothstep(.1,1.,r))*alpha*.38;if(a<.005)discard;gl_FragColor=vec4(.57,.55,.51,a);}"
      }));
      this.cloud.frustumCulled = false; scene.add(this.cloud);
    }
    reset() {
      this.trackIndex = this.trackCount = this.tracks.count = 0; this.last = null; this.emission = 0;
      this.dust.forEach((p) => { p.life = 0; }); this.fades.fill(0);
      this.cloud.geometry.attributes.fade.needsUpdate = true;
    }
    emit(x, y, z, vx, vz, strength = 1) {
      const p = this.dust[this.cursor++ % this.dust.length];
      Object.assign(p, { x, y: y + .05, z, vx: vx + (Math.random()-.5)*.7, vz: vz + (Math.random()-.5)*.7, vy: (.35+Math.random()*.65)*strength, life: 1.4, max: 1.4 });
    }
    step(sim, dt, reducedMotion) {
      const core = window.LunarRoverCore, h = sim.heading, cos = Math.cos(h), sin = Math.sin(h);
      const gap = this.last ? Math.hypot(sim.x-this.last.x, sim.z-this.last.z) : 0;
      if (!this.last || gap > 2) this.last = { x: sim.x, z: sim.z };
      if (gap >= .28 && gap <= 2) {
        for (const side of [-1, 1]) {
          const x = sim.x + cos * side * 1.23 - sin * 1.05, z = sim.z + sin * side * 1.23 + cos * 1.05;
          this.dummy.position.set(x, core.heightAt(x,z)+.065, z);
          const normal = new this.T.Vector3(core.heightAt(x-.2,z)-core.heightAt(x+.2,z), .4, core.heightAt(x,z-.2)-core.heightAt(x,z+.2)).normalize();
          this.dummy.quaternion.setFromUnitVectors(this.up, normal); this.dummy.rotateY(-h); this.dummy.updateMatrix();
          this.tracks.setMatrixAt(this.trackIndex, this.dummy.matrix); this.trackIndex = (this.trackIndex+1)%1800;
          this.trackCount = Math.min(1800, this.trackCount+1);
          if (!reducedMotion && Math.abs(sim.speed) > .6) this.emit(x, core.heightAt(x,z), z, -sin*sim.speed*.22, cos*sim.speed*.22);
        }
        this.tracks.count = this.trackCount; this.tracks.instanceMatrix.needsUpdate = true;
        this.last = { x: sim.x, z: sim.z };
      }
      if (!reducedMotion && sim.phase === "sampling" && sim.sampleProgress > .39 && sim.sampleProgress < .58) {
        this.emission += dt;
        if (this.emission > .06) {
          this.emission = 0;
          const x = sim.x + cos*.86 + sin*2.55, z = sim.z + sin*.86 - cos*2.55;
          this.emit(x, core.heightAt(x,z), z, 0, 0, .45);
        }
      }
      this.dust.forEach((p) => {
        if (p.life <= 0) return;
        p.life -= dt; p.vy -= 1.62*dt; p.x += p.vx*dt; p.z += p.vz*dt; p.y += p.vy*dt;
        if (p.y < core.heightAt(p.x,p.z)+.02) p.life = 0;
      });
    }
    render(height, reducedMotion) {
      this.dust.forEach((p,i) => {
        this.positions[i*3] = p.x || 0; this.positions[i*3+1] = p.y || 0; this.positions[i*3+2] = p.z || 0;
        this.fades[i] = reducedMotion ? 0 : Math.max(0,p.life/p.max) || 0;
      });
      this.cloud.material.uniforms.scale.value = height;
      this.cloud.geometry.attributes.position.needsUpdate = true; this.cloud.geometry.attributes.fade.needsUpdate = true;
    }
  }
  window.LunarRoverEffects = LunarEffects;
})();
