"use strict";

(() => {
  const core = window.LunarRoverCore;
  function seeded(seed) {
    return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  }

  class LunarWorld {
    constructor(host, onContextLost) {
      this.T = window.THREE;
      const T = this.T;
      this.host = host; this.destroyed = false; this.wheels = []; this.markers = new Map();
      this.orbit = 0; this.cameraDistance = 12; this.elevation = .5; this.snap = true; this.lastDistance = 0; this.sampleFocus = 0;
      this.quality = 1; this.performanceStart = performance.now(); this.performanceFrames = 0; this.slowFrames = 0; this.fastFrames = 0;
      this.renderer = new T.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
      const context = this.renderer.getContext(), rendererInfo = context.getExtension("WEBGL_debug_renderer_info");
      const softwareRenderer = rendererInfo && /swiftshader|llvmpipe|software/i.test(context.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL));
      if (softwareRenderer) this.quality = .8;
      this.renderer.outputColorSpace = T.SRGBColorSpace;
      this.renderer.toneMapping = T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.renderer.shadowMap.enabled = !softwareRenderer && innerWidth > 700;
      this.renderer.shadowMap.type = T.PCFSoftShadowMap;
      this.canvas = this.renderer.domElement;
      this.canvas.id = "rover-3d-canvas"; this.canvas.tabIndex = 0;
      this.canvas.setAttribute("aria-label", "3D 月球車駕駛畫面。WASD 或方向鍵駕駛，E 採樣，Esc 暫停。");
      this.canvas.addEventListener("webglcontextlost", (event) => { event.preventDefault(); if (!this.destroyed) onContextLost(); });
      host.prepend(this.canvas);
      this.scene = new T.Scene(); this.scene.background = new T.Color(0x02040a);
      this.camera = new T.PerspectiveCamera(52, 1, .1, 400);
      this.look = new T.Vector3(); this.destination = new T.Vector3(); this.nextLook = new T.Vector3();
      this.scene.add(new T.HemisphereLight(0xa7b7c8, 0x4a4339, .9));
      this.sun = new T.DirectionalLight(0xfff8ee, 2.4);
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(512, 512);
      Object.assign(this.sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 150 });
      this.sun.shadow.bias = -.00035; this.sun.shadow.normalBias = .04;
      this.scene.add(this.sun, this.sun.target);
      this.makeTerrain(); this.makeEnvironment(); this.makeBase(); this.makeSites(); this.makeRover();
      this.effects = new window.LunarRoverEffects(T, this.scene);
      this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host);
      this.resize();
      this.performanceStart = performance.now();
    }

    material(color, options = {}) { return new this.T.MeshStandardMaterial({ color, roughness: .9, metalness: .05, ...options }); }
    mesh(geometry, material, x = 0, y = 0, z = 0, parent = this.scene) {
      const mesh = new this.T.Mesh(geometry, material); mesh.position.set(x, y, z);
      mesh.castShadow = false; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    }
    box(size, material, position, parent) { return this.mesh(new this.T.BoxGeometry(...size), material, ...position, parent); }
    strut(a, b, radius, material, parent) {
      const T = this.T, start = new T.Vector3(...a), end = new T.Vector3(...b), direction = end.clone().sub(start);
      const mesh = this.mesh(new T.CylinderGeometry(radius, radius, 1, 8), material, 0, 0, 0, parent);
      mesh.position.copy(start.add(end).multiplyScalar(.5)); mesh.scale.y = direction.length(); mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), direction.normalize());
      return mesh;
    }
    roundedBox(size, material, position, parent) {
      const T = this.T, [x,y,z] = size, b = .07, shape = new T.Shape();
      shape.moveTo(-x/2+b,-y/2+b); shape.lineTo(x/2-b,-y/2+b); shape.lineTo(x/2-b,y/2-b); shape.lineTo(-x/2+b,y/2-b); shape.closePath();
      const geometry = new T.ExtrudeGeometry(shape,{depth:z-b*2, bevelEnabled:true, bevelSegments:2, steps:1, bevelSize:b, bevelThickness:b});
      geometry.translate(0,0,-(z-b*2)/2); return this.mesh(geometry,material,...position,parent);
    }

    makeTerrain() {
      const T = this.T, random = seeded(3049);
      const canvas = document.createElement("canvas"); canvas.width = canvas.height = 512;
      const ctx = canvas.getContext("2d"), data = ctx.createImageData(512, 512);
      for (let i = 0; i < data.data.length; i += 4) {
        const gray = 155 + Math.floor(random() * 70);
        data.data.set([gray, gray, gray, 255], i);
      }
      ctx.putImageData(data, 0, 0);
      for (let i=0;i<420;i++) {
        const x=random()*512,y=random()*512,r=1+random()*9;
        const gradient=ctx.createRadialGradient(x-r*.2,y-r*.25,0,x,y,r);
        gradient.addColorStop(0,"#35353588"); gradient.addColorStop(.65,"#60606033"); gradient.addColorStop(.82,"#eeeeee44"); gradient.addColorStop(1,"#aaaaaa00");
        ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);
      }
      const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
      texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.repeat.set(38, 38);
      texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
      this.regolithTexture = texture;
      const geometry = new T.PlaneGeometry(180, 180, 180, 180); geometry.rotateX(-Math.PI / 2);
      const positions = geometry.attributes.position, colors = [];
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), z = positions.getZ(i), h = core.heightAt(x, z);
        positions.setY(i, h);
        const d = Math.hypot(x - core.CRATER.x, z - core.CRATER.z);
        let shade = .78 + Math.sin(x*.19+z*.12)*.045 + Math.sin(z*.43-x*.29)*.025 + random() * .035;
        if (d < 17) shade *= .72;
        if (core.roughAt(x, z)) shade *= .88;
        colors.push(shade, shade, shade*.985);
      }
      geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3)); geometry.computeVertexNormals();
      const ground = this.mesh(geometry, this.material(0xd0ceca, { map: texture, bumpMap: texture, bumpScale: .085, vertexColors: true, roughness: 1 }));
      ground.castShadow = false;
    }

    makeEnvironment() {
      const T = this.T, random = seeded(7391), dummy = new T.Object3D();
      const rockMaterial = this.material(0x777570, { bumpMap: this.regolithTexture, bumpScale: .055, roughness: 1 });
      const geometry = new T.IcosahedronGeometry(1, 1), vertices=geometry.attributes.position;
      for(let i=0;i<vertices.count;i++) {
        const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i),s=.92+Math.sin(x*19+y*31+z*23)*.09;
        vertices.setXYZ(i,x*s,y*s,z*s);
      }
      const pebbles = new T.InstancedMesh(geometry, rockMaterial, 280);
      for (let i = 0; i < 280; i++) {
        const x = random() * 150 - 75, z = random() * 150 - 75, s = .12 + random() * .5;
        dummy.position.set(x, core.heightAt(x, z) + s * .2, z);
        dummy.scale.set(s, s * (.45 + random() * .5), s * 1.15);
        dummy.rotation.set(random(), random() * 6, random()); dummy.updateMatrix(); pebbles.setMatrixAt(i, dummy.matrix);
      }
      pebbles.receiveShadow = true; this.scene.add(pebbles);
      const rocks = new T.InstancedMesh(geometry, rockMaterial, core.ROCKS.length);
      core.ROCKS.forEach((rock, index) => {
        dummy.position.set(rock.x, core.heightAt(rock.x, rock.z) + rock.radius * .3, rock.z);
        dummy.scale.set(rock.radius, rock.radius * .7, rock.radius); dummy.rotation.set(.2, random() * 6, .1); dummy.updateMatrix(); rocks.setMatrixAt(index, dummy.matrix);
      });
      rocks.castShadow = true; rocks.receiveShadow = true; this.scene.add(rocks);
      // Continuous, eroded-looking ridges instead of repeated cone silhouettes.
      const ridgeVertices = [], ridgeIndices = [], segments = 160;
      for (let row=0;row<3;row++) for(let i=0;i<=segments;i++) {
        const a=i/segments*Math.PI*2,r=86+row*27;
        const ridge = row===0 ? -1.5 : row===1 ? 5+Math.sin(a*7)*2.5+Math.sin(a*13+.4)*1.8+Math.sin(a*23)*.8 : 1;
        ridgeVertices.push(Math.cos(a)*r,ridge,Math.sin(a)*r);
      }
      for(let row=0;row<2;row++) for(let i=0;i<segments;i++) {
        const a=row*(segments+1)+i,b=a+segments+1; ridgeIndices.push(a,b,a+1,b,b+1,a+1);
      }
      const ridges=new T.BufferGeometry();ridges.setAttribute("position",new T.Float32BufferAttribute(ridgeVertices,3));ridges.setIndex(ridgeIndices);ridges.computeVertexNormals();
      this.mesh(ridges,this.material(0x777570,{side:T.DoubleSide,roughness:1}));
      const stars = [];
      for (let i = 0; i < 850; i++) {
        const theta = random() * Math.PI * 2, elevation = .05 + random() * 1.45;
        stars.push(Math.cos(theta) * Math.cos(elevation) * 260, Math.sin(elevation) * 260, Math.sin(theta) * Math.cos(elevation) * 260);
      }
      const starGeometry = new T.BufferGeometry(); starGeometry.setAttribute("position", new T.Float32BufferAttribute(stars, 3));
      this.scene.add(new T.Points(starGeometry, new T.PointsMaterial({ color: 0xb5c2d2, size: .28, transparent: true, opacity: .55, depthWrite: false })));
      const earthCanvas = document.createElement("canvas"); earthCanvas.width = 256; earthCanvas.height = 128;
      const ctx = earthCanvas.getContext("2d"); ctx.fillStyle = "#356b9e"; ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = "#789284";
      for (let i = 0; i < 22; i++) { ctx.beginPath(); ctx.ellipse(random() * 256, random() * 128, 7 + random() * 22, 4 + random() * 14, random(), 0, 7); ctx.fill(); }
      ctx.strokeStyle = "#e0e7e3"; ctx.lineWidth = 7; ctx.globalAlpha = .7;
      for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.ellipse(random() * 256, random() * 128, 20 + random() * 30, 4, -.3, 0, 3.5); ctx.stroke(); }
      const earthTexture = new T.CanvasTexture(earthCanvas); earthTexture.colorSpace = T.SRGBColorSpace;
      const earth = this.mesh(new T.SphereGeometry(4.5, 32, 24), this.material(0xffffff, { map: earthTexture, emissive: 0x24435b, emissiveIntensity: .25 }), 65, 40, -130);
      earth.castShadow = false; earth.rotation.y = .4;
    }

    label(text, color = "#92f0d1") {
      const T = this.T, canvas = document.createElement("canvas"); canvas.width = 384; canvas.height = 128;
      const ctx = canvas.getContext("2d"); ctx.fillStyle = "rgba(5,15,24,.86)";
      ctx.beginPath(); ctx.roundRect(10, 22, 364, 84, 16); ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = color;
      ctx.font = 'bold 42px "Microsoft JhengHei",sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 192, 66);
      const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
      const sprite = new T.Sprite(new T.SpriteMaterial({ map: texture, depthTest: true, transparent: true }));
      sprite.scale.set(8, 2.66, 1); return sprite;
    }

    makeBase() {
      const T = this.T, { x, z } = core.BASE, h = core.heightAt(x, z);
      const pad = this.mesh(new T.CircleGeometry(6, 48), this.material(0x707b78), x, h + .04, z);
      pad.rotation.x = -Math.PI / 2; pad.castShadow = false;
      const ring = this.mesh(new T.RingGeometry(5.65, 5.9, 64), new T.MeshBasicMaterial({ color: 0x92f0d1, side: T.DoubleSide }), x, h + .06, z);
      ring.rotation.x = -Math.PI / 2; ring.castShadow = false;
      const ivory = this.material(0xe1e2da, { metalness: .25, roughness: .6 });
      const gold = this.material(0xb69b5b, { metalness: .5, roughness: .45 });
      this.box([5.3, 2.8, 3.8], ivory, [x - 5, core.heightAt(x - 5, z + 7) + 1.8, z + 7]).castShadow = true;
      this.box([5.5, .35, 4], gold, [x - 5, core.heightAt(x - 5, z + 7) + 3.4, z + 7]);
      this.box([1.4, 1.4, .12], this.material(0x163849, { metalness: .4 }), [x - 5, h + 2, z + 5.06]);
      for (const side of [-1, 1]) {
        this.box([.15, 2, .15], ivory, [x - 5 + side * 5, h + 1, z + 7]);
        const panel = this.box([4, .12, 3], this.material(0x203c5b, { metalness: .4, roughness: .5 }), [x - 5 + side * 5, h + 2, z + 7]); panel.rotation.z = side * .15;
      }
      const pole = this.mesh(new T.CylinderGeometry(.08, .08, 5, 8), gold, x - 2.5, h + 2.5, z - 4);
      this.mesh(new T.SphereGeometry(.2, 12, 8), new T.MeshBasicMaterial({ color: 0x92f0d1 }), pole.position.x, h + 5.1, pole.position.z);
      this.baseLabel = this.label("基地"); this.baseLabel.position.set(x, h + 5.7, z + 1); this.scene.add(this.baseLabel);
    }

    makeSites() {
      const T = this.T;
      core.SITES.forEach((site, index) => {
        const group = new T.Group(); group.position.set(site.x, core.heightAt(site.x, site.z), site.z); this.scene.add(group);
        const color = index ? 0x9cc9ff : 0xffca8d;
        const ring = this.mesh(new T.RingGeometry(3.8, 4, 48), new T.MeshBasicMaterial({ color, side: T.DoubleSide, transparent: true, opacity: .8 }), 0, .09, 0, group); ring.rotation.x = -Math.PI / 2;
        this.mesh(new T.CylinderGeometry(.07, .07, 4, 8), this.material(0xc9c7bd), -2.3, 2, 0, group);
        const flag = this.box([1.5, .8, .05], new T.MeshBasicMaterial({ color }), [-1.6, 3.4, 0], group); flag.castShadow = false;
        const rock = this.mesh(new T.DodecahedronGeometry(.8, 1), this.material(index ? 0xa19a8c : 0x4b4d4b, { flatShading: true }), .2, .45, .3, group); rock.scale.y = .7;
        const label = this.label(site.id.toUpperCase() + " 採樣點", index ? "#9cc9ff" : "#ffca8d"); label.position.set(0, 5.3, 0); group.add(label);
        this.markers.set(site.id, { group, rock, ring, label });
      });
    }

    makeRover() {
      const T = this.T;
      this.rover = new T.Group(); this.rover.rotation.order = "YXZ"; this.scene.add(this.rover);
      this.contactShadow = this.mesh(new T.CircleGeometry(1.6, 24), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .22, depthWrite: false }), 0, 0, 0);
      this.contactShadow.rotation.x = -Math.PI / 2; this.contactShadow.scale.y = 1.2;
      const ivory = this.material(0xd9dcd8, { metalness: .45, roughness: .42 });
      const steel = this.material(0xa1aaad, { metalness: .78, roughness: .32 });
      const dark = this.material(0x303332, { metalness: .55, roughness: .72 });
      const foilCanvas=document.createElement("canvas");foilCanvas.width=foilCanvas.height=128;
      const foilCtx=foilCanvas.getContext("2d"),random=seeded(823);
      foilCtx.fillStyle="#b18d40";foilCtx.fillRect(0,0,128,128);
      for(let i=0;i<120;i++){foilCtx.strokeStyle=i%2?"#f1d18c66":"#4a381e55";foilCtx.lineWidth=1+random()*2;foilCtx.beginPath();foilCtx.moveTo(random()*128,random()*128);foilCtx.lineTo(random()*128,random()*128);foilCtx.stroke();}
      const foil=new T.CanvasTexture(foilCanvas);foil.colorSpace=T.SRGBColorSpace;
      const gold = this.material(0xc5a66e,{map:foil,bumpMap:foil,bumpScale:.025,metalness:.65,roughness:.55});
      this.roundedBox([1.95,.65,2.65],ivory,[0,1.25,0],this.rover).castShadow=true;
      this.roundedBox([1.72,.38,1.9],gold,[0,1.71,.17],this.rover);
      // Thermal blankets, fasteners, radiators and deck hardware give the body a useful scale.
      for(const side of [-1,1]) {
        this.box([.025,.41,1.9],gold,[side*.985,1.27,.15],this.rover);
        for(const z of [-1.1,-.55,.05,.65,1.12]) this.mesh(new T.SphereGeometry(.035,6,4),steel,side*1.015,1.49,z,this.rover);
        for(let z=-.8;z<.8;z+=.16) this.box([.032,.18,.055],dark,[side*1.01,1.18,z],this.rover);
        this.strut([side*.72,.96,-.85],[side*.72,.96,.85],.055,steel,this.rover);
      }
      const panelCanvas=document.createElement("canvas");panelCanvas.width=512;panelCanvas.height=256;
      const panelCtx=panelCanvas.getContext("2d");panelCtx.fillStyle="#82949a";panelCtx.fillRect(0,0,512,256);
      for(let x=0;x<8;x++) for(let y=0;y<4;y++){
        const g=panelCtx.createLinearGradient(0,y*64,64,64+y*64);g.addColorStop(0,"#182e48");g.addColorStop(.5,"#304c68");g.addColorStop(1,"#122638");panelCtx.fillStyle=g;panelCtx.fillRect(x*64+3,y*64+3,58,58);
        panelCtx.fillStyle="#9aaeb855";panelCtx.fillRect(x*64+19,y*64+3,1,58);panelCtx.fillRect(x*64+43,y*64+3,1,58);
      }
      const panelMap=new T.CanvasTexture(panelCanvas);panelMap.colorSpace=T.SRGBColorSpace;
      this.box([2.2,.065,1.4],steel,[0,1.98,.53],this.rover);
      const panel=this.mesh(new T.PlaneGeometry(2.12,1.32),this.material(0xffffff,{map:panelMap,metalness:.4,roughness:.25}),0,2.02,.53,this.rover);panel.rotation.x=-Math.PI/2;
      this.box([.5,.17,.52],dark,[-.55,1.88,-.85],this.rover);
      const tireGeometry = new T.CylinderGeometry(.54, .54, .36, 32); tireGeometry.rotateZ(Math.PI / 2);
      const hubGeometry = new T.CylinderGeometry(.19, .19, .39, 16); hubGeometry.rotateZ(Math.PI / 2);
      this.suspension=[];
      for (const side of [-1, 1]) for (const z of [-1.05, 0, 1.05]) {
        const wheel = new T.Group(); wheel.position.set(side * 1.23, .59, z); this.rover.add(wheel); this.wheels.push(wheel);
        this.mesh(tireGeometry, dark, 0, 0, 0, wheel).castShadow = true; this.mesh(hubGeometry, steel, 0, 0, 0, wheel);
        for(const face of [-1,1]) {
          const rim=this.mesh(new T.TorusGeometry(.49,.035,6,28),steel,face*.18,0,0,wheel);rim.rotation.y=Math.PI/2;
        }
        const treads = new T.InstancedMesh(new T.BoxGeometry(.39, .045, .065), steel, 24), tread = new T.Object3D();
        for (let i = 0; i < 24; i++) {
          const a = i / 24 * Math.PI * 2;
          tread.position.set(0, Math.cos(a) * .54, Math.sin(a) * .54); tread.rotation.set(a, .14*(i%2?1:-1), 0); tread.updateMatrix(); treads.setMatrixAt(i, tread.matrix);
        }
        wheel.add(treads);
        for(let i=0;i<8;i++) {
          const a=i/8*Math.PI*2;
          this.strut([side*.19,Math.cos(a)*.18,Math.sin(a)*.18],[side*.19,Math.cos(a)*.47,Math.sin(a)*.47],.022,steel,wheel);
        }
        const anchor=[side*.65,1.02,z*.48];
        const axle=this.strut(anchor,[side*1.23,.59,z],.075,steel,this.rover);
        this.suspension.push({wheel,axle,anchor:new T.Vector3(...anchor),side,z});
      }
      this.mesh(new T.CylinderGeometry(.06, .08, 1.2, 10), steel, 0, 2.1, -.87, this.rover);
      this.box([.65, .26, .3], ivory, [0, 2.7, -.9], this.rover);
      for (const x of [-.19, .19]) this.mesh(new T.SphereGeometry(.11, 12, 8), this.material(0x15303d, { metalness: .6, roughness: .2 }), x, 2.71, -1.06, this.rover);
      this.mesh(new T.CylinderGeometry(.025, .025, 1.4, 8), steel, -.7, 2.35, .8, this.rover);
      this.arm = new T.Group(); this.arm.position.set(.86, 1.5, -.75); this.rover.add(this.arm);
      this.mesh(new T.CylinderGeometry(.18,.18,.27,16),steel,0,0,0,this.arm).rotation.z=Math.PI/2;
      this.box([.18,.19,1.3],ivory,[0,0,-.65],this.arm);
      this.strut([.12,.05,-.12],[.12,.05,-1.18],.035,dark,this.arm);
      this.armJoint = new T.Group(); this.armJoint.position.z = -1.3; this.arm.add(this.armJoint);
      this.mesh(new T.CylinderGeometry(.15,.15,.27,16),gold,0,0,0,this.armJoint).rotation.z=Math.PI/2;
      this.box([.13,.15,1.15],steel,[0,0,-.575],this.armJoint);
      this.wrist=new T.Group();this.wrist.position.z=-1.15;this.armJoint.add(this.wrist);
      this.box([.27,.18,.3],gold,[0,0,0],this.wrist);
      this.fingers=[-1,1].map((side)=>{
        const finger=new T.Group();finger.position.set(side*.14,-.03,0);this.wrist.add(finger);
        this.box([.055,.33,.13],steel,[0,-.14,0],finger);this.box([.12,.045,.14],dark,[-side*.03,-.3,0],finger);return finger;
      });
      this.armSample=this.mesh(new T.DodecahedronGeometry(.14,1),this.material(0x5a5852,{flatShading:true}),0,-.21,0,this.wrist);
      this.sampleBin=this.box([.48,.18,.5],dark,[.86,2.02,-.6],this.rover);
      this.binSamples=[0,1].map(i=>this.mesh(new T.DodecahedronGeometry(.13,0),this.material(0x777167),.75+i*.2,2.17,-.6,this.rover));
      this.armSample.visible=false;
    }

    updateArm(sim) {
      // Two-link inverse kinematics: unfold, contact, clamp, lift, place, then fold.
      const p=sim.phase==="sampling"?sim.sampleProgress:0;
      const poses=[[0,.25,.55],[.2,1.0,.25],[.4,1.8,-1.23],[.56,1.8,-1.23],[.74,.95,.45],[.9,-.15,.65],[1,.25,.55]];
      let r=.25,y=.55;
      for(let i=1;i<poses.length;i++) if(p<=poses[i][0]) {
        const a=poses[i-1],b=poses[i],t=(p-a[0])/(b[0]-a[0]),s=t*t*(3-2*t);
        r=a[1]+(b[1]-a[1])*s;y=a[2]+(b[2]-a[2])*s;break;
      }
      const l1=1.3,l2=1.15,d=Math.max(.16,Math.min(2.44,Math.hypot(r,y)));
      const elbow=-Math.acos(Math.max(-1,Math.min(1,(d*d-l1*l1-l2*l2)/(2*l1*l2))));
      const shoulder=Math.atan2(y,r)-Math.atan2(l2*Math.sin(elbow),l1+l2*Math.cos(elbow));
      this.arm.rotation.x=shoulder;this.armJoint.rotation.x=elbow;this.wrist.rotation.x=-shoulder-elbow;
      const closed=p>.49&&p<.88;
      this.fingers.forEach((finger,i)=>{finger.rotation.z=(i?1:-1)*(closed?.08:.5);});
      this.armSample.visible=sim.phase==="sampling"&&p>.51&&p<.89;
      this.binSamples.forEach((rock,i)=>{rock.visible=sim.collected.size>i || (sim.phase==="sampling"&&p>.89&&sim.collected.size===i);});
    }

    resize() {
      if (this.destroyed) return;
      const width = Math.max(1, this.host.clientWidth), height = Math.max(1, this.host.clientHeight);
      const ratio = Math.min(devicePixelRatio || 1, 1.25, Math.sqrt((width < 700 ? 500000 : 900000) / (width * height))) * this.quality;
      this.renderer.setSize(Math.round(width * ratio), Math.round(height * ratio), false);
      this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    }
    recenter() { this.orbit = 0; this.cameraDistance = 12; this.elevation = .5; this.snap = true; }

    render(sim, dt, reduceMotion = false) {
      if (this.destroyed) return;
      const T = this.T, heading = sim.heading, forwardX = Math.sin(heading), forwardZ = -Math.cos(heading);
      const y = core.heightAt(sim.x, sim.z);
      const front = core.heightAt(sim.x + forwardX, sim.z + forwardZ), back = core.heightAt(sim.x - forwardX, sim.z - forwardZ);
      const left = core.heightAt(sim.x - Math.cos(heading), sim.z - Math.sin(heading));
      const right = core.heightAt(sim.x + Math.cos(heading), sim.z + Math.sin(heading));
      this.rover.position.set(sim.x, y + .06, sim.z);
      this.contactShadow.position.set(sim.x, y + .04, sim.z);
      this.contactShadow.visible = !this.renderer.shadowMap.enabled;
      this.rover.rotation.set(Math.atan2(front - back, 2), -heading, Math.atan2(right - left, 2), "YXZ");
      const travelled = Math.max(0, sim.distance - this.lastDistance); this.lastDistance = sim.distance;
      this.rover.updateMatrixWorld(true);
      this.suspension.forEach(({wheel,axle,anchor,side,z})=>{
        const x=sim.x+Math.cos(heading)*side*1.23-Math.sin(heading)*z, wz=sim.z+Math.sin(heading)*side*1.23+Math.cos(heading)*z;
        const contact=this.rover.worldToLocal(new T.Vector3(x,core.heightAt(x,wz)+.59,wz));
        wheel.position.y=Math.max(.28,Math.min(.9,contact.y));wheel.rotation.x-=travelled/.54*(sim.speed<0?-1:1);
        const end=wheel.position.clone(),direction=end.clone().sub(anchor);axle.position.copy(anchor).add(end).multiplyScalar(.5);axle.scale.y=direction.length();axle.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
      });
      this.updateArm(sim); this.effects.render(this.canvas.height,reduceMotion);
      this.markers.forEach((marker, id) => {
        marker.rock.visible = !sim.collected.has(id); marker.ring.material.opacity = sim.collected.has(id) ? .22 : .85;
        marker.label.visible = core.distance(sim, core.SITES.find((site) => site.id === id)) > 9;
      });
      this.baseLabel.visible = core.distance(sim, core.BASE) > 10;
      const focus = sim.phase === "sampling" && !reduceMotion ? 1 : 0;
      this.sampleFocus += (focus-this.sampleFocus)*(1-Math.exp(-dt*3));
      const angle = heading + this.orbit - this.sampleFocus*2.1, d = this.cameraDistance;
      this.destination.set(sim.x - Math.sin(angle) * d, y + 2 + d * this.elevation, sim.z + Math.cos(angle) * d);
      this.destination.y = Math.max(this.destination.y, core.heightAt(this.destination.x, this.destination.z) + 2);
      this.nextLook.set(sim.x + forwardX * 3, y + 1.2, sim.z + forwardZ * 3);
      const blend = this.snap || reduceMotion ? 1 : 1 - Math.exp(-dt * 5);
      this.camera.position.lerp(this.destination, blend); this.look.lerp(this.nextLook, blend); this.camera.lookAt(this.look); this.snap = false;
      this.sun.position.set(sim.x - 35, 38, sim.z + 28); this.sun.target.position.set(sim.x, 0, sim.z);
      this.renderer.render(this.scene, this.camera);
      this.performanceFrames++;
      const now = performance.now(), interval = now - this.performanceStart;
      if (interval > 2000) {
        const fps = this.performanceFrames * 1000 / interval;
        this.canvas.dataset.renderFps = Math.round(fps);
        this.slowFrames = fps < 22 ? this.slowFrames + 1 : 0;
        this.fastFrames = fps > 48 ? this.fastFrames + 1 : 0;
        if (this.slowFrames >= 2 && this.quality > .55) { this.quality = Math.max(.5, this.quality * .75); this.slowFrames = 0; this.resize(); }
        if (this.fastFrames >= 3 && this.quality < 1) { this.quality = Math.min(1, this.quality * 1.2); this.fastFrames = 0; this.resize(); }
        this.performanceStart = now; this.performanceFrames = 0;
      }
    }

    dispose() {
      if (this.destroyed) return;
      this.destroyed = true; this.observer.disconnect();
      const geometries = new Set(), materials = new Set(), textures = new Set();
      this.scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        const list = Array.isArray(object.material) ? object.material : [object.material];
        list.filter(Boolean).forEach((material) => {
          materials.add(material); Object.values(material).forEach((value) => { if (value?.isTexture) textures.add(value); });
        });
      });
      geometries.forEach((value) => value.dispose()); materials.forEach((value) => value.dispose()); textures.forEach((value) => value.dispose());
      this.sun.shadow.dispose(); this.renderer.dispose(); this.renderer.forceContextLoss(); this.canvas.remove();
    }
  }
  window.LunarRoverWorld = LunarWorld;
})();
