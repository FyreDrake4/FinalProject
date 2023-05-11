//gamestates
const GameState = {
    Start: "Start",
    Playing: "Playing",
    GameOver: "GameOver",
};

let game = {
    score: 0,
    maxScore: 0,
    maxTime: 30,
    elapsedTime: 0,
    state: GameState.Start,
    targetSprite: 1,
    bonked: 0,
};

//music logic
let level2 = false;
let level3 = false;
let startSound = false;
let gameOverSound = false;
let sounds = new Tone.Players({
    error: "assets/error.wav",
    bonk: "assets/bonk.mp3",
    wind: "assets/woosh.wav",
});

let synth = new Tone.PolySynth().toDestination();
let dSynth = new Tone.PolySynth();

let lowPass = new Tone.Filter(800, "lowpass").toDestination();

dSynth.connect(lowPass);

const melody = new Tone.Sequence(
    (time, note) => {
        synth.triggerAttackRelease(note, 0.15, time);
        // subdivisions are given as subarrays
    },
    [
        "C3",
        null,
        "F3",
        null,
        "C3",
        null,
        "D#3",
        null,
        "C3",
        ["G3", "F3"],
        ["D#3", "D3"],
        "C3",
        null,
        "F3",
        null,
        "C3",
        null,
        "D#3",
        null,
        ["C3", "F3"],
        ["D#3", "D3"],
        ["G3", "D3"],
        ["D#3", "D3"],
    ]
);

const gameovermelody = new Tone.Sequence(
    (time, note) => {
        synth.triggerAttackRelease(note, 0.15, time);
        // subdivisions are given as subarrays
    },
    [
        "G3",
        "C4",
        null,
        "C4",
        "D#4",
        "F4",
        "F#4",
        "F4",
        "D#4",
        "C4",
        null,
        null,
        ["A#3", "D#4"],
        "C4",
        null,
        null,
        "G3",
        "C4",
        null,
        "C4",
        "D#4",
        "F4",
        "F#4",
        "F4",
        "D#4",
        "F#4",
        null,
        null,
        null,
        ["F#4", null, "F4", null],
        ["D#4", null, "F#4", null],
        ["F4", null, "D#4", null],
        "C4",
        null,
        null,
    ]
);

const startmelody = new Tone.Sequence(
    (time, note) => {
        synth.triggerAttackRelease(note, 0.15, time);
        // subdivisions are given as subarrays
    },
    [
        "C5",
        ["F5", "D#5", null],
        "D5",
        "C5",
        ["F5", "D#5", null],
        "D5",
        "C5",
        "G5",
        "F5",
        "D#5",
        "C5",
        "G5",
        "F5",
        "D#5",
    ]
);
//game logic
let hammerLocation = [190, 400, 590, 400, 390, 200];

let up = true;
let hit = false;
let pressed = true;
let rotationIndex = -3.14159 / 4;
let hammerIndex = 1;
let downSwing = true;
let hammerSprite;
let moleholesprite, grassbackground, imposterSprite, moleSprite;
let amongUsBackground;
let enemies = [];
//sensor logic
let port;
let writer, reader;
let slider;
let sensorData = {};
const encoder = new TextEncoder();
const decorder = new TextDecoder();

let activationState = { active: true };

function preload() {
    amongUsBackground = loadImage("assets/amongusBackground.jpg");
    moleholesprite = loadImage("assets/MoleHole2.png");
    grassbackground = loadImage("assets/grass.jpg");
    imposterSprite = loadImage("assets/AmongUs2.png");
    moleSprite = loadImage("assets/mole.png");
    deadMoleSprite = loadImage("assets/deadmole.png");
    hammerSprite = loadImage("assets/hammer.png");

    synth.volume.value = -2;
    dSynth.volume.value = -2;
    Tone.Transport.bpm.value = 80;

    enemies[0] = new MoleHole(
        moleholesprite,
        imposterSprite,
        moleSprite,
        deadMoleSprite,
        2,
        250,
        500,
        1
    );
    enemies[1] = new MoleHole(
        moleholesprite,
        imposterSprite,
        moleSprite,
        deadMoleSprite,
        2,
        650,
        500,
        3
    );
    enemies[2] = new MoleHole(
        moleholesprite,
        imposterSprite,
        moleSprite,
        deadMoleSprite,
        2,
        450,
        300,
        5
    );
}

function setup() {
    sounds.toDestination();
    createCanvas(800, 600);
    imageMode(CENTER);

    if ("serial" in navigator) {
        // The Web Serial API is supported.
        let button = createButton("connect");
        button.position(0, 600);
        button.mousePressed(connect);
    }
}

function draw() {
    if (reader) {
        serialRead();
    }

    switch (game.state) {
        case GameState.Playing:
            startmelody.stop("0");
            gameovermelody.stop("0");
            if (!startSound) {
                Tone.Transport.stop("0");
                melody.start("0");
                Tone.Transport.start("+8n");
                startSound = !startSound;
            }
            if (game.bonked > 10 && !level2) {
                Tone.Transport.bpm.value = 110;
                level2 = !level2;
            }
            if (game.bonked > 20 && !level3) {
                Tone.Transport.bpm.value = 140;
                level3 = !level3;
            }

            image(grassbackground, 400, 300);
            for (i = 0; i < enemies.length; i++) {
                enemies[i].draw();
            }
            hammerImage();
            textSize(40);

            if (sensorData.inches >= 5) {
                up = true;
            }

            if (sensorData.inches < 2 && up) {
                mouseClicked();
                up = false;
            }

            text("Score: " + game.score, 80, 40);
            let currentTime = game.maxTime - game.elapsedTime;
            text("Time: " + ceil(currentTime), 700, 40);
            game.elapsedTime += deltaTime / 1000;

            if (currentTime < 0) game.state = GameState.GameOver;
            break;
        case GameState.Start:
            Tone.start();
            startmelody.start("0");
            Tone.Transport.start();

            image(amongUsBackground, 400, 300);
            fill(255);
            textSize(50);
            textAlign(CENTER);
            text("Whack Amongus Game", 400, 300);
            textSize(30);
            text("Press Any Key to Start", 400, 370);
            textSize(25);
            text("Bonk the Imposter!", 400, 420);
            text("Use Keys: A W D to control the hole!", 400, 470);
            break;
        case GameState.GameOver:
            game.maxScore = max(game.score, game.maxScore);

            melody.stop("0");
            Tone.Transport.bpm.value = 100;
            if (!gameOverSound) {
                Tone.Transport.stop();
                gameovermelody.start("0");
                Tone.Transport.start("+8n");
                gameOverSound = !gameOverSound;
            }

            background(0);
            fill(255);
            textSize(40);
            textAlign(CENTER);
            text("Game Over!", 400, 300);
            textSize(35);
            text("Score: " + game.score, 400, 370);
            text("Max Score: " + game.maxScore, 400, 420);
            text("Press Any Key to Restart", 400, 470);
            break;
    }
}

function reset() {
    game.elapsedTime = 0;
    game.score = 0;
    game.bonked = 0;
    enemies = [];

    enemies[0] = new MoleHole(
        moleholesprite,
        imposterSprite,
        moleSprite,
        deadMoleSprite,
        2,
        250,
        500,
        1
    );
    enemies[1] = new MoleHole(
        moleholesprite,
        imposterSprite,
        moleSprite,
        deadMoleSprite,
        2,
        650,
        500,
        3
    );
    enemies[2] = new MoleHole(
        moleholesprite,
        imposterSprite,
        moleSprite,
        deadMoleSprite,
        2,
        450,
        300,
        5
    );

    Tone.Transport.bpm.value = 80;
    level2 = level3 = startSound = gameOverSound = false;
    gameovermelody.stop("0");
}

function hammerImage() {
    if (!pressed) {
        push();
        translate(
            hammerLocation[hammerIndex - 1] - 32,
            hammerLocation[hammerIndex] + 32
        );
        rotate(rotationIndex);
        image(hammerSprite, 32, -32, 175, 175, 0, 0, 64, 64);
        pop();
    } else {
        push();
        translate(
            hammerLocation[hammerIndex - 1] - 32,
            hammerLocation[hammerIndex] + 32
        );
        downSwing ? (rotationIndex += 0.15) : (rotationIndex -= 0.15);
        rotate(rotationIndex);
        image(hammerSprite, 32, -32, 175, 175, 0, 0, 64, 64);
        if (rotationIndex > PI / 4) {
            downSwing = false;
        }
        if (rotationIndex < -3.14159 / 4) {
            downSwing = !downSwing;
            pressed = !pressed;
            rotationIndex = -3.14159 / 4;
        }
        pop();
    }
}

function mouseClicked() {
    switch (game.state) {
        case GameState.Playing:
            pressed = true;
            for (i = 0; i < enemies.length; i++) {
                enemies[i].mouseClicked();
            }
            if (hit) {
                serialWrite(activationState);
                hit = !hit;
            }
    }
}

function keyPressed() {
    switch (game.state) {
        case GameState.Playing:
            if (key === "a") {
                hammerIndex = 1;
            }
            if (key === "w") {
                hammerIndex = 5;
            }
            if (key === "d") {
                hammerIndex = 3;
            }

            break;
        case GameState.Start:
            game.state = GameState.Playing;
            break;
        case GameState.GameOver:
            reset();
            game.state = GameState.Playing;
            break;
    }
}

function serialWrite(jsonObject) {
    if (writer) {
        writer.write(encoder.encode(JSON.stringify(jsonObject) + "\n"));
    }
}

async function serialRead() {
    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            reader.releaseLock();
            break;
        }
        console.log(value);
        sensorData = JSON.parse(value);
    }
}

async function connect() {
    port = await navigator.serial.requestPort();

    await port.open({ baudRate: 9600 });

    writer = port.writable.getWriter();

    reader = port.readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TransformStream(new LineBreakTransformer()))
        .getReader();
}

class LineBreakTransformer {
    constructor() {
        // A container for holding stream data until a new line.
        this.chunks = "";
    }

    transform(chunk, controller) {
        // Append new chunks to existing chunks.
        this.chunks += chunk;
        // For each line breaks in chunks, send the parsed lines out.
        const lines = this.chunks.split("\n");
        this.chunks = lines.pop();
        lines.forEach((line) => controller.enqueue(line));
    }

    flush(controller) {
        // When the stream is closed, flush any remaining chunks out.
        controller.enqueue(this.chunks);
    }
}

class MoleHole {
    constructor(
        holeSprite,
        amongUsSprite,
        moleSprite,
        deadSprite,
        wait = 2,
        x,
        y,
        index
    ) {
        this.holeSprite = holeSprite;
        this.amongUsSprite = amongUsSprite;
        this.moleSprite = moleSprite;
        this.deadSprite = deadSprite;
        this.wait = wait;
        this.x = x;
        this.y = y;
        this.index = index;
        this.imposterActive = false;
        this.moleActive = false;
        this.dead = false;
        this.currentTime = 55;
        this.goingUp = true;
        this.waiting = false;
        this.timer = round(1 * wait, 1);
        this.speed = 2;
    }

    draw() {
        let randInt1 = floor(random(1, 31));
        if (randInt1 == 5 && !this.imposterActive && !this.moleActive) {
            let randInt2 = floor(random(1, 5));
            if (randInt2 == 3 || randInt2 == 4) {
                this.moleActive = true;
            } else {
                this.imposterActive = true;
            }
        }
        if (this.imposterActive) {
            push();
            if (!this.dead && this.goingUp) {
                this.moveUp();
            } else if (!this.dead && this.waiting) {
                this.waitEnemy();
            } else if (!this.dead) {
                this.moveDown();
            } else if (this.dead) {
                this.deadEnemy();
            }
            pop();
        } else if (this.moleActive) {
            push();
            if (!this.dead && this.goingUp) {
                this.moveUp();
            } else if (!this.dead && this.waiting) {
                this.waitEnemy();
            } else if (!this.dead) {
                this.moveDown();
            } else if (this.dead) {
                this.deadEnemy();
            }
            pop();
        }

        image(this.holeSprite, this.x, this.y);
    }

    moveUp() {
        if (this.imposterActive)
            image(
                this.amongUsSprite,
                this.x,
                this.y + this.currentTime,
                150,
                150,
                0,
                0,
                128,
                128
            );
        else if (this.moleActive) {
            image(
                this.moleSprite,
                this.x,
                this.y + this.currentTime,
                150,
                150,
                1024,
                384,
                256,
                256
            );
        }
        this.currentTime -= 0.5 * this.speed + 0.05 * game.bonked;
        if (this.currentTime < 0) {
            this.goingUp = false;
            this.waiting = true;
        }
    }

    waitEnemy() {
        if (this.imposterActive)
            image(
                this.amongUsSprite,
                this.x,
                this.y + this.currentTime,
                150,
                150,
                0,
                0,
                128,
                128
            );
        else if (this.moleActive) {
            image(
                this.moleSprite,
                this.x,
                this.y + this.currentTime,
                150,
                150,
                1024,
                384,
                256,
                256
            );
        }
        if (frameCount % 6 == 0 && this.timer > 0) {
            // if the frameCount is divisible by 60, then a second has passed. it will stop at 0
            this.timer -= 0.1;
        }
        if (this.timer <= 0) {
            this.waiting = false;
            this.timer = round(1 * this.wait, 1);
        }
    }

    moveDown() {
        if (this.imposterActive)
            image(
                this.amongUsSprite,
                this.x,
                this.y + this.currentTime,
                150,
                150,
                0,
                0,
                128,
                128
            );
        else if (this.moleActive) {
            image(
                this.moleSprite,
                this.x,
                this.y + this.currentTime,
                150,
                150,
                1024,
                384,
                256,
                256
            );
        }
        this.currentTime += 0.5 * this.speed + 0 + 0.05 * game.bonked;
        if (this.currentTime > 55) {
            this.goingUp = true;
            this.imposterActive = false;
            this.moleActive = false;
        }
    }

    deadEnemy() {
        if (this.imposterActive)
            image(
                this.amongUsSprite,
                this.x,
                this.y + this.currentTime - 50,
                150,
                150,
                384,
                128,
                128,
                128
            );
        else if (this.moleActive) {
            image(
                this.deadSprite,
                this.x,
                this.y + this.currentTime,
                150,
                150,
                1024,
                384,
                256,
                256
            );
        }
        this.currentTime += 0.5 * this.speed + 0.05 * game.bonked;
        if (this.currentTime > 55) {
            this.resetHole();
        }
    }

    resetHole() {
        this.imposterActive = false;
        this.moleActive = false;
        this.dead = false;
        this.currentTime = 55;
        this.goingUp = true;
        this.waiting = false;
        this.wait = this.wait - 0.3;
        this.timer = round(1 * this.wait, 1);
    }

    mouseClicked() {
        if (!this.dead && this.index == hammerIndex) {
            if (this.moleActive) {
                game.score -= 1;
                game.bonked += 1;
                this.dead = true;
                sounds.player("error").start();
                hit = !hit;
            } else if (this.imposterActive) {
                game.score += 1;
                game.bonked += 1;
                this.dead = true;
                sounds.player("bonk").start();
            } else {
                sounds.player("wind").start();
            }
        }
    }
}
