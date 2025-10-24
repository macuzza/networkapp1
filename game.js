/* Minimal Asteroids game on HTML5 Canvas */
(function() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Game state
  const state = {
    score: 0,
    ship: null,
    bullets: [],
    asteroids: [],
    keys: { left: false, right: false, up: false, shoot: false },
    lastShotAt: 0,
    gameOver: false,
  };

  // Utils
  const TAU = Math.PI * 2;
  function wrap(n, max) {
    if (n < 0) return n + max;
    if (n >= max) return n - max;
    return n;
  }
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  // Entities
  function createShip() {
    return {
      x: canvas.width / 2,
      y: canvas.height / 2,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0,
      radius: 12,
      thrust: 0.12,
      friction: 0.99,
      rotationSpeed: 0.06,
    };
  }

  function createAsteroid(x, y, size) {
    const speed = rand(0.5, 2.0) * (Math.random() < 0.5 ? -1 : 1);
    const angle = rand(0, TAU);
    const radius = size === 'big' ? rand(28, 42) : size === 'med' ? rand(18, 26) : rand(10, 14);
    return {
      x: x ?? rand(0, canvas.width),
      y: y ?? rand(0, canvas.height),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      size,
      vertices: Math.floor(rand(8, 12)),
      jaggedness: rand(0.6, 0.9),
    };
  }

  function splitAsteroid(ast) {
    if (ast.size === 'big') return [createAsteroid(ast.x, ast.y, 'med'), createAsteroid(ast.x, ast.y, 'med')];
    if (ast.size === 'med') return [createAsteroid(ast.x, ast.y, 'small'), createAsteroid(ast.x, ast.y, 'small')];
    return [];
  }

  function createBullet(ship) {
    const speed = 8;
    return {
      x: ship.x + Math.cos(ship.angle) * ship.radius,
      y: ship.y + Math.sin(ship.angle) * ship.radius,
      vx: Math.cos(ship.angle) * speed + ship.vx,
      vy: Math.sin(ship.angle) * speed + ship.vy,
      life: 60, // frames
      radius: 2,
    };
  }

  // Input
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') state.keys.left = true;
    if (e.code === 'ArrowRight') state.keys.right = true;
    if (e.code === 'ArrowUp') state.keys.up = true;
    if (e.code === 'Space') state.keys.shoot = true;
    if (e.code === 'KeyR' && state.gameOver) restart();
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') state.keys.left = false;
    if (e.code === 'ArrowRight') state.keys.right = false;
    if (e.code === 'ArrowUp') state.keys.up = false;
    if (e.code === 'Space') state.keys.shoot = false;
  });

  // Initialize
  function start() {
    state.ship = createShip();
    state.asteroids = [];
    for (let i = 0; i < 6; i++) state.asteroids.push(createAsteroid());
    state.bullets = [];
    state.score = 0;
    state.gameOver = false;
  }

  function restart() {
    start();
  }

  // Update
  function update() {
    const ship = state.ship;
    if (!ship) return;

    // Ship rotation
    if (state.keys.left) ship.angle -= ship.rotationSpeed;
    if (state.keys.right) ship.angle += ship.rotationSpeed;

    // Ship thrust
    if (state.keys.up) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    ship.vx *= ship.friction;
    ship.vy *= ship.friction;
    ship.x = wrap(ship.x + ship.vx, canvas.width);
    ship.y = wrap(ship.y + ship.vy, canvas.height);

    // Shooting
    if (state.keys.shoot) {
      const now = performance.now();
      if (now - state.lastShotAt > 200) { // 5 bullets/sec
        state.bullets.push(createBullet(ship));
        state.lastShotAt = now;
      }
    }

    // Update bullets
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      b.x = wrap(b.x + b.vx, canvas.width);
      b.y = wrap(b.y + b.vy, canvas.height);
      b.life -= 1;
      if (b.life <= 0) state.bullets.splice(i, 1);
    }

    // Update asteroids
    for (const a of state.asteroids) {
      a.x = wrap(a.x + a.vx, canvas.width);
      a.y = wrap(a.y + a.vy, canvas.height);
    }

    // Collisions: bullets vs asteroids
    outer: for (let i = state.asteroids.length - 1; i >= 0; i--) {
      const a = state.asteroids[i];
      for (let j = state.bullets.length - 1; j >= 0; j--) {
        const b = state.bullets[j];
        if (dist(a, b) < a.radius + b.radius) {
          state.bullets.splice(j, 1);
          state.asteroids.splice(i, 1);
          const children = splitAsteroid(a);
          state.asteroids.push(...children);
          state.score += a.size === 'big' ? 20 : a.size === 'med' ? 50 : 100;
          break outer;
        }
      }
    }

    // Collision: ship vs asteroids
    for (const a of state.asteroids) {
      if (dist(a, ship) < a.radius + ship.radius * 0.8) {
        state.gameOver = true;
      }
    }

    // Wave clear → spawn next wave
    if (state.asteroids.length === 0) {
      const base = 6 + Math.floor(state.score / 200);
      for (let i = 0; i < base; i++) state.asteroids.push(createAsteroid());
    }

    // Score HUD
    scoreEl.textContent = `Score: ${state.score}`;
  }

  // Render
  function drawShip(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.strokeStyle = '#9cdcfe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.stroke();
    if (state.keys.up) {
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-20, 0);
      ctx.strokeStyle = '#f78c6c';
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAsteroid(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.strokeStyle = '#c3e88d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const steps = a.vertices;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps * TAU;
      const r = a.radius * (1 - (1 - a.jaggedness) * Math.random());
      const px = Math.cos(t) * r;
      const py = Math.sin(t) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawBullet(b) {
    ctx.save();
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Starfield background
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 80; i++) {
      ctx.fillRect((i * 97) % canvas.width, (i * 71) % canvas.height, 1, 1);
    }
    for (const a of state.asteroids) drawAsteroid(a);
    for (const b of state.bullets) drawBullet(b);
    if (state.ship) drawShip(state.ship);

    if (state.gameOver) {
      ctx.fillStyle = '#e6edf3';
      ctx.font = 'bold 36px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over - Press R to Restart', canvas.width/2, canvas.height/2);
    }
  }

  // Loop
  function loop() {
    if (!state.gameOver) update();
    render();
    requestAnimationFrame(loop);
  }

  start();
  loop();
})();


