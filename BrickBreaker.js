/* jshint -W069, esversion:6 */

/** @type {HTMLCanvasElement} */
let canvas =
	/** @type {HTMLCanvasElement} */ document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");

let height = window.innerHeight - 75;
let width = Math.min(1.5 * height, window.innerWidth - 60);
canvas.width = width;
canvas.height = height;

// make bottom left canvas origin
ctx.translate(0, height);
ctx.scale(1, -1);

// game variables
ctx.fillStyle = "white";
ctx.strokeStyle = "red";
const animationSpeed = 1;
const radius = width / 85;
let ballSpeed = 4;
let numBalls = 10;
const bricksRow = 10;
const bricksCol = 15;
const barSpeed = 12;
const barWidth = width / 6;
const barHeight = radius;
const brickHeight = 1.75 * radius;
const brickWidth = width / bricksRow;
const endHeight = 2 * radius;
const barFac = 0.8;
const xVelFac = 0.4;
const hitCoolFrames = 4;
const hitCool = Math.ceil(1.7 * (hitCoolFrames - 1));

let inputBallSpeed = document.getElementById("ballSpeed");
inputBallSpeed.onchange = () => (ballSpeed = inputBallSpeed.value);
let inputNumBalls = document.getElementById("numBalls");

function addBall() {
	let x = (width - 6 * radius) * Math.random() + 3 * radius;
	let y = (height - 6 * radius) * Math.random() + 3 * radius + endHeight;

	let vx = 2 * Math.random() - 1;
	let vy = Math.sqrt(1 - vx * vx);
	if (Math.random() < 0.5) vy *= -1;

	let r = 175 * Math.random() + 80;
	let g = 175 * Math.random() + 80;
	let b = 175 * Math.random() + 80;

	balls.push({
		x: x,
		y: y,
		vx: vx,
		vy: vy,
		color: "rgb(" + r + "," + g + "," + b + ")",
		hit: 0,
	});
}

function bounceBallOffBrick(ball, brick, xn, yn) {
	if (yn == brick.y) {
		// off bottom
		ball.vy = -Math.abs(ball.vy);
	} else if (yn == brick.y + brickHeight) {
		// off top
		ball.vy = Math.abs(ball.vy);
	} else if (xn == brick.x) {
		// off left
		ball.vx = -Math.abs(ball.vx);
	} else if (xn == brick.x + brickWidth) {
		// off right
		ball.vx = Math.abs(ball.vx);
	}
}

function brickBallCollision(brick) {
	balls.every((ball) => {
		// polet closest to center of ball
		let xn = Math.max(brick.x, Math.min(ball.x, brick.x + brickWidth));
		let yn = Math.max(brick.y, Math.min(ball.y, brick.y + brickHeight));

		let dx = xn - ball.x;
		let dy = yn - ball.y;
		let collide = dx * dx + dy * dy <= radius * radius;

		if (collide) {
			brick.on = false;
			bounceBallOffBrick(ball, brick, xn, yn);
			return false;
		}

		return true;
	});
}

function barBallCollision(ball) {
	let xn = Math.max(barPos, Math.min(ball.x, barPos + barWidth));
	let yn = Math.max(
		endHeight - barHeight / 2,
		Math.min(ball.y, endHeight + barHeight / 2)
	);

	let dx = xn - ball.x;
	let dy = yn - ball.y;
	let collide = dx * dx + dy * dy <= radius * radius;

	if (collide && ball.hit == 0) {
		if (yn == endHeight + barHeight / 2) {
			let dist = (ball.x - barPos) / barWidth;
			let b = 2 * dist - 1;

			ball.vx = xVelFac * ball.vx + barFac * b;
			if (ball.vx > 0.95) ball.vx = 0.95;
			if (ball.vx < -0.95) ball.vx = -0.95;

			ball.vy = Math.sqrt(1 - ball.vx * ball.vx);
			ball.hit = hitCool;
		}
	}
}

function ballStuff(ball, delta) {
	ctx.save();
	ctx.fillStyle = ball.color;
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, radius, 0, 2 * Math.PI);
	ctx.closePath();
	ctx.fill();
	ctx.restore();

	barBallCollision(ball);

	ball.x += delta * ballSpeed * ball.vx;
	ball.y += delta * ballSpeed * ball.vy;

	if (ball.hit == 0) {
		if (ball.x - radius <= 0 || ball.x + radius >= width) {
			// left/right walls
			ball.vx *= -1;
			ball.hit = hitCool;
		}
		if (ball.y + radius >= height || ball.y - radius <= 0) {
			// top/bottom walls
			ball.vy *= -1;
			ball.hit = hitCool;
		}
	}

	if (ball.hit > 0) {
		ball.hit -= delta;
	} else if (ball.hit < 0) {
		ball.hit = 0;
	}
}

function brickStuff(brick) {
	if (brick.on) brickBallCollision(brick);

	if (brick.on) {
		ctx.save();
		ctx.fillStyle = "blue";
		ctx.fillRect(brick.x, brick.y, brickWidth, brickHeight);
		ctx.strokeRect(brick.x, brick.y, brickWidth, brickHeight);
		ctx.restore();
	}
}

// creates and stores balls
let balls = [];
for (let i = 0; i < numBalls; i++) {
	addBall();
}

// create and store bricks
let bricks = [];
for (let i = 0; i < bricksRow; i++) {
	for (let j = 0; j < bricksCol; j++) {
		bricks.push({
			on: true,
			x: brickWidth * i,
			y: height - 5 * brickHeight - brickHeight * j,
		});
	}
}

// animation storage
let prevTime;
let barPos = width / 2 - barWidth / 2;
let keys = [];

function animate(timestamp) {
	if (!timestamp) timestamp = 0;
	ctx.clearRect(0, 0, width, height);
	if (!prevTime) prevTime = timestamp;
	let delta = (animationSpeed * (timestamp - prevTime)) / 10.0;

	ctx.save();
	ctx.fillStyle = "#b33";
	ctx.fillRect(0, 0, width, endHeight);
	ctx.restore();

	bricks.forEach(brickStuff);
	balls.forEach((ball) => ballStuff(ball, delta));
	balls = balls.filter((ball) => ball.y + radius > endHeight);
	if (balls.length == 0) {
		inputNumBalls.style = "width: 5.2em";
		inputNumBalls.value = "Game Over";
	} else {
		inputNumBalls.value = balls.length;
	}

	moveBar(delta);

	ctx.save();
	ctx.fillStyle = "#fff";
	ctx.fillRect(barPos, endHeight - barHeight / 2, barWidth, barHeight);
	ctx.restore();

	prevTime = timestamp;
	window.requestAnimationFrame(animate);
}
animate();

// controls
window.addEventListener("keydown", function (event) {
	keys[event.keyCode] = true;
});
window.addEventListener("keyup", function (event) {
	delete keys[event.keyCode];
});

function moveBar(delta) {
	if (keys[37] && barPos > 2 * radius) barPos -= delta * barSpeed;
	if (keys[39] && barPos < width - 2 * radius - barWidth)
		barPos += delta * barSpeed;
}
