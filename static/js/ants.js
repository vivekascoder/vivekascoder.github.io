(() => {
    const canvas = document.getElementById("ants-canvas");
    if (!canvas) {
        return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
        return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ants = [];
    const dyingAnts = [];
    const audioState = {
        context: null,
        masterGain: null,
        noiseBuffer: null,
        lastBurnAt: 0,
    };
    const pointer = {
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.45,
        targetX: window.innerWidth * 0.5,
        targetY: window.innerHeight * 0.45,
        vx: 0,
        vy: 1,
        active: false,
        leftDown: false,
        lastEventTime: performance.now(),
    };

    let viewportWidth = 0;
    let viewportHeight = 0;
    let lastFrameTime = performance.now();
    let spawnBuffer = 0;

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function mix(start, end, amount) {
        return start + (end - start) * amount;
    }

    function wrapAngle(angle) {
        if (angle > Math.PI) {
            return angle - Math.PI * 2;
        }
        if (angle < -Math.PI) {
            return angle + Math.PI * 2;
        }
        return angle;
    }

    function getAudioContextConstructor() {
        return window.AudioContext || window.webkitAudioContext || null;
    }

    function createNoiseBuffer(audioContext) {
        const durationSeconds = 0.24;
        const frameCount = Math.floor(audioContext.sampleRate * durationSeconds);
        const buffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
        const samples = buffer.getChannelData(0);

        for (let index = 0; index < frameCount; index += 1) {
            const progress = index / frameCount;
            samples[index] = (Math.random() * 2 - 1) * (1 - progress);
        }

        return buffer;
    }

    function ensureAudioReady() {
        const AudioContextCtor = getAudioContextConstructor();
        if (!AudioContextCtor) {
            return null;
        }

        if (!audioState.context) {
            const audioContext = new AudioContextCtor();
            const masterGain = audioContext.createGain();
            masterGain.gain.value = 0.5;
            masterGain.connect(audioContext.destination);

            audioState.context = audioContext;
            audioState.masterGain = masterGain;
            audioState.noiseBuffer = createNoiseBuffer(audioContext);
        }

        return audioState.context;
    }

    function unlockAudio() {
        const audioContext = ensureAudioReady();
        if (!audioContext || audioContext.state === "running") {
            return;
        }

        audioContext.resume().catch(() => {});
    }

    function playBurnSound() {
        const audioContext = ensureAudioReady();
        if (!audioContext || audioContext.state !== "running" || !audioState.masterGain || !audioState.noiseBuffer) {
            return;
        }

        const now = audioContext.currentTime;
        if (now - audioState.lastBurnAt < 0.045) {
            return;
        }
        audioState.lastBurnAt = now;

        const noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = audioState.noiseBuffer;

        const noiseFilter = audioContext.createBiquadFilter();
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.setValueAtTime(1450 + Math.random() * 350, now);
        noiseFilter.Q.setValueAtTime(0.8, now);

        const noiseGain = audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.0001, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

        const toneOscillator = audioContext.createOscillator();
        toneOscillator.type = "triangle";
        toneOscillator.frequency.setValueAtTime(240 + Math.random() * 45, now);
        toneOscillator.frequency.exponentialRampToValueAtTime(95, now + 0.22);

        const toneGain = audioContext.createGain();
        toneGain.gain.setValueAtTime(0.0001, now);
        toneGain.gain.exponentialRampToValueAtTime(0.035, now + 0.02);
        toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioState.masterGain);

        toneOscillator.connect(toneGain);
        toneGain.connect(audioState.masterGain);

        noiseSource.start(now);
        noiseSource.stop(now + 0.24);
        toneOscillator.start(now);
        toneOscillator.stop(now + 0.24);
    }

    function resizeCanvas() {
        viewportWidth = window.innerWidth;
        viewportHeight = window.innerHeight;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(viewportWidth * dpr);
        canvas.height = Math.round(viewportHeight * dpr);
        canvas.style.width = `${viewportWidth}px`;
        canvas.style.height = `${viewportHeight}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function updatePointerTarget(x, y, eventTime) {
        const deltaMs = Math.max(16, eventTime - pointer.lastEventTime);
        const deltaSeconds = deltaMs / 1000;
        const nextVx = (x - pointer.targetX) / deltaSeconds;
        const nextVy = (y - pointer.targetY) / deltaSeconds;

        pointer.vx = mix(pointer.vx, nextVx, 0.35);
        pointer.vy = mix(pointer.vy, nextVy, 0.35);
        pointer.targetX = x;
        pointer.targetY = y;
        pointer.lastEventTime = eventTime;
        pointer.active = true;
    }

    function handlePointerMove(event) {
        updatePointerTarget(event.clientX, event.clientY, performance.now());
    }

    function handleTouchMove(event) {
        const touch = event.touches[0];
        if (!touch) {
            return;
        }

        updatePointerTarget(touch.clientX, touch.clientY, performance.now());
    }

    function handleTouchStart() {
        unlockAudio();
    }

    function handlePointerDown(event) {
        if (event.button === 0) {
            pointer.leftDown = true;
            unlockAudio();
            updatePointerTarget(event.clientX, event.clientY, performance.now());
        }
    }

    function handlePointerUp(event) {
        if (event.button === 0) {
            pointer.leftDown = false;
        }
    }

    function getSpawnPoint() {
        const margin = 24;
        const side = Math.floor(Math.random() * 4);

        if (side === 0) {
            return { x: Math.random() * viewportWidth, y: -margin };
        }
        if (side === 1) {
            return { x: viewportWidth + margin, y: Math.random() * viewportHeight };
        }
        if (side === 2) {
            return { x: Math.random() * viewportWidth, y: viewportHeight + margin };
        }
        return { x: -margin, y: Math.random() * viewportHeight };
    }

    function createAnt() {
        const spawn = getSpawnPoint();
        const angle = Math.atan2(pointer.y - spawn.y, pointer.x - spawn.x) + (Math.random() - 0.5) * 0.45;
        const speed = 38 + Math.random() * 28;

        ants.push({
            x: spawn.x,
            y: spawn.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            angle,
            speed,
            size: 2.8 + Math.random() * 2.3,
            phase: Math.random() * Math.PI * 2,
            cadence: 7 + Math.random() * 4,
            turnRate: 2.6 + Math.random() * 1.6,
            age: 0,
        });
    }

    function getMaxAnts() {
        const density = Math.round((viewportWidth * viewportHeight) / 12000);
        const limit = clamp(density, 28, 132);
        return reducedMotion.matches ? Math.max(14, Math.round(limit * 0.4)) : limit;
    }

    function igniteAnt(index) {
        const ant = ants[index];
        if (!ant) {
            return;
        }

        ants.splice(index, 1);
        playBurnSound();
        const sparks = [];
        const sparkCount = reducedMotion.matches ? 7 : 16;

        for (let sparkIndex = 0; sparkIndex < sparkCount; sparkIndex += 1) {
            const speed = 30 + Math.random() * 75;
            const angle = ant.angle + (Math.random() - 0.5) * 1.8;
            sparks.push({
                x: ant.x,
                y: ant.y,
                vx: Math.cos(angle) * speed * 0.75,
                vy: Math.sin(angle) * speed - 18,
                life: 0.25 + Math.random() * 0.55,
                maxLife: 0.25 + Math.random() * 0.55,
                size: 1.2 + Math.random() * 2.6,
                heat: 0.45 + Math.random() * 0.55,
            });
        }

        dyingAnts.push({
            x: ant.x,
            y: ant.y,
            vx: ant.vx * 0.18 + (Math.random() - 0.5) * 18,
            vy: Math.min(ant.vy * 0.15, 24) - 8,
            angle: ant.angle,
            spin: (Math.random() - 0.5) * 5.5,
            size: ant.size,
            age: 0,
            ttl: reducedMotion.matches ? 1.1 : 1.9,
            flameSeed: Math.random() * Math.PI * 2,
            gravityX: 0,
            gravityY: 520,
            sparks,
        });
    }

    function drawCorpseBody(deadAnt, alpha) {
        context.strokeStyle = `rgba(102, 72, 48, ${alpha * 0.65})`;
        context.lineWidth = 1.05;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(-2.1, -0.8);
        context.lineTo(-5.1, -3.1);
        context.moveTo(-2.1, 0.7);
        context.lineTo(-4.8, 3.1);
        context.moveTo(1.1, -0.9);
        context.lineTo(4.4, -3.1);
        context.moveTo(1, 0.7);
        context.lineTo(4.5, 3);
        context.stroke();

        context.fillStyle = `rgba(98, 67, 42, ${alpha * 0.92})`;
        context.beginPath();
        context.ellipse(-5.2, 0, 4.2, 3, 0, 0, Math.PI * 2);
        context.ellipse(0.1, 0, 3.4, 2.7, 0, 0, Math.PI * 2);
        context.ellipse(5.2, 0, 2.4, 2, 0, 0, Math.PI * 2);
        context.fill();
    }

    function drawAliveAnt(ant, time) {
        const stride = Math.sin(time * ant.cadence + ant.phase);
        const legSwing = stride * 2.1;

        context.save();
        context.translate(ant.x, ant.y);
        context.rotate(ant.angle);
        context.scale(ant.size / 4, ant.size / 4);

        context.strokeStyle = "rgba(132, 94, 62, 0.9)";
        context.lineWidth = 1.15;
        context.lineCap = "round";

        context.beginPath();
        context.moveTo(-2.4, -0.8);
        context.lineTo(-6.6, -3.8 - legSwing);
        context.moveTo(-2.4, 0.5);
        context.lineTo(-6.3, 2.8 + legSwing * 0.7);
        context.moveTo(0, -1);
        context.lineTo(-3.8, -4.9 + legSwing * 0.6);
        context.moveTo(0.2, 0.8);
        context.lineTo(-3.8, 4.1 - legSwing * 0.4);
        context.moveTo(2.8, -0.7);
        context.lineTo(6.6, -4 + legSwing * 0.8);
        context.moveTo(2.8, 0.7);
        context.lineTo(6.4, 3.7 - legSwing * 0.7);
        context.moveTo(4.5, -0.6);
        context.lineTo(8.2, -2.5 - legSwing * 0.35);
        context.moveTo(4.6, 0.5);
        context.lineTo(8.1, 2.2 + legSwing * 0.35);
        context.stroke();

        context.fillStyle = "#8f6240";
        context.beginPath();
        context.ellipse(-5.4, 0, 4.3, 3.1, 0, 0, Math.PI * 2);
        context.ellipse(0.2, 0, 3.6, 2.8, 0, 0, Math.PI * 2);
        context.ellipse(5.3, 0, 2.5, 2.1, 0, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = "rgba(255, 255, 255, 0.12)";
        context.beginPath();
        context.ellipse(-4.7, -0.9, 1.5, 0.75, -0.2, 0, Math.PI * 2);
        context.ellipse(0.8, -0.8, 1.2, 0.6, -0.25, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }

    function drawDyingAnt(deadAnt, time) {
        const life = 1 - deadAnt.age / deadAnt.ttl;
        const gravity = Math.hypot(deadAnt.gravityX, deadAnt.gravityY) || 1;
        const trailX = -deadAnt.gravityX / gravity;
        const trailY = -deadAnt.gravityY / gravity;

        for (let index = 0; index < deadAnt.sparks.length; index += 1) {
            const spark = deadAnt.sparks[index];
            const alpha = spark.life / spark.maxLife;
            const warm = 180 + spark.heat * 60;

            context.fillStyle = `rgba(255, ${warm}, ${80 + spark.heat * 60}, ${alpha})`;
            context.beginPath();
            context.arc(spark.x, spark.y, spark.size * alpha, 0, Math.PI * 2);
            context.fill();
        }

        context.save();
        context.translate(deadAnt.x, deadAnt.y);
        context.rotate(deadAnt.angle);
        context.scale(deadAnt.size / 4, deadAnt.size / 4);

        const flicker = 0.75 + Math.sin(time * 22 + deadAnt.flameSeed) * 0.18;
        const flameStretch = 3.4 + flicker * 2.2;
        const flameWidth = 2.8 + flicker;

        context.fillStyle = `rgba(255, 179, 54, ${life * 0.28})`;
        context.beginPath();
        context.ellipse(
            trailX * 3.2,
            trailY * 3.2,
            flameWidth * 1.7,
            flameStretch * 1.4,
            Math.atan2(trailY, trailX),
            0,
            Math.PI * 2
        );
        context.fill();

        context.fillStyle = `rgba(255, 92, 0, ${life * 0.42})`;
        context.beginPath();
        context.ellipse(
            trailX * 2.2,
            trailY * 2.2,
            flameWidth,
            flameStretch,
            Math.atan2(trailY, trailX),
            0,
            Math.PI * 2
        );
        context.fill();

        context.fillStyle = `rgba(255, 245, 196, ${life * 0.22})`;
        context.beginPath();
        context.ellipse(
            trailX * 1.2,
            trailY * 1.2,
            flameWidth * 0.55,
            flameStretch * 0.55,
            Math.atan2(trailY, trailX),
            0,
            Math.PI * 2
        );
        context.fill();

        drawCorpseBody(deadAnt, life);

        context.restore();
    }

    function updateAliveAnts(deltaSeconds, elapsedTime) {
        const speedMultiplier = pointer.leftDown ? 3 : 1;

        for (let index = ants.length - 1; index >= 0; index -= 1) {
            const ant = ants[index];
            ant.age += deltaSeconds;

            const desiredAngle =
                Math.atan2(pointer.y - ant.y, pointer.x - ant.x) +
                Math.sin(elapsedTime * ant.cadence + ant.phase) * 0.18;
            const angleDelta = wrapAngle(desiredAngle - ant.angle);
            ant.angle += clamp(angleDelta, -ant.turnRate * deltaSeconds, ant.turnRate * deltaSeconds);

            const cruiseSpeed =
                ant.speed * speedMultiplier * (0.92 + Math.sin(elapsedTime * 6 + ant.phase) * 0.08);
            const targetVx = Math.cos(ant.angle) * cruiseSpeed;
            const targetVy = Math.sin(ant.angle) * cruiseSpeed;

            ant.vx = mix(ant.vx, targetVx, clamp(deltaSeconds * 4.5, 0, 1));
            ant.vy = mix(ant.vy, targetVy, clamp(deltaSeconds * 4.5, 0, 1));
            ant.x += ant.vx * deltaSeconds;
            ant.y += ant.vy * deltaSeconds;

            const dx = pointer.x - ant.x;
            const dy = pointer.y - ant.y;
            const killRadius = 14 + ant.size;
            if (dx * dx + dy * dy <= killRadius * killRadius) {
                igniteAnt(index);
                continue;
            }

            if (
                ant.x < -80 ||
                ant.x > viewportWidth + 80 ||
                ant.y < -80 ||
                ant.y > viewportHeight + 80
            ) {
                ants.splice(index, 1);
            }
        }
    }

    function updateDyingAnts(deltaSeconds) {
        for (let index = dyingAnts.length - 1; index >= 0; index -= 1) {
            const deadAnt = dyingAnts[index];
            deadAnt.age += deltaSeconds;
            deadAnt.vx += deadAnt.gravityX * deltaSeconds;
            deadAnt.vy += deadAnt.gravityY * deltaSeconds;
            deadAnt.x += deadAnt.vx * deltaSeconds;
            deadAnt.y += deadAnt.vy * deltaSeconds;
            deadAnt.angle += deadAnt.spin * deltaSeconds;
            deadAnt.spin *= 0.988;

            for (let sparkIndex = deadAnt.sparks.length - 1; sparkIndex >= 0; sparkIndex -= 1) {
                const spark = deadAnt.sparks[sparkIndex];
                spark.life -= deltaSeconds;
                spark.vx *= 0.985;
                spark.vy *= 0.985;
                spark.vx += deadAnt.gravityX * 0.18 * deltaSeconds;
                spark.vy += deadAnt.gravityY * 0.18 * deltaSeconds;
                spark.x += spark.vx * deltaSeconds;
                spark.y += spark.vy * deltaSeconds;

                if (spark.life <= 0) {
                    deadAnt.sparks.splice(sparkIndex, 1);
                }
            }

            if (
                deadAnt.age >= deadAnt.ttl &&
                deadAnt.sparks.length === 0
            ) {
                dyingAnts.splice(index, 1);
                continue;
            }

            if (deadAnt.y - deadAnt.size > viewportHeight + 32) {
                dyingAnts.splice(index, 1);
            }
        }
    }

    function renderScene(elapsedTime) {
        context.clearRect(0, 0, viewportWidth, viewportHeight);

        for (let index = 0; index < ants.length; index += 1) {
            drawAliveAnt(ants[index], elapsedTime);
        }

        for (let index = 0; index < dyingAnts.length; index += 1) {
            drawDyingAnt(dyingAnts[index], elapsedTime);
        }
    }

    function tick(frameTime) {
        const deltaSeconds = Math.min(0.033, (frameTime - lastFrameTime) / 1000);
        lastFrameTime = frameTime;

        pointer.x = mix(pointer.x, pointer.targetX, clamp(deltaSeconds * 7.5, 0, 1));
        pointer.y = mix(pointer.y, pointer.targetY, clamp(deltaSeconds * 7.5, 0, 1));

        const maxAnts = getMaxAnts();
        if (ants.length < maxAnts) {
            const spawnRate = reducedMotion.matches ? 6 : 22;
            spawnBuffer += deltaSeconds * spawnRate;
            while (spawnBuffer >= 1 && ants.length < maxAnts) {
                createAnt();
                spawnBuffer -= 1;
            }
        } else {
            spawnBuffer = 0;
        }

        updateAliveAnts(deltaSeconds, frameTime / 1000);
        updateDyingAnts(deltaSeconds);
        renderScene(frameTime / 1000);
        requestAnimationFrame(tick);
    }

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", () => {
        pointer.leftDown = false;
    });
    window.addEventListener("pointerleave", () => {
        pointer.active = false;
        pointer.leftDown = false;
    });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("keydown", unlockAudio, { passive: true });

    requestAnimationFrame((time) => {
        lastFrameTime = time;
        tick(time);
    });
})();
