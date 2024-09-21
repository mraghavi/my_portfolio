// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Create particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 5000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 5;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.005,
    color: 0xffffff
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

camera.position.z = 3;

// Mouse interaction
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX / window.innerWidth - 0.5;
    mouseY = event.clientY / window.innerHeight - 0.5;
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    particlesMesh.rotation.x += 0.0002; // Reduced from 0.0005
    particlesMesh.rotation.y += 0.0002; // Reduced from 0.0005
    particlesMesh.rotation.x += mouseY * 0.01; // Reduced from 0.02
    particlesMesh.rotation.y += mouseX * 0.01; // Reduced from 0.02
    renderer.render(scene, camera);
}
animate();

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// GSAP ScrollTrigger and ScrollTo setup
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Smooth scrolling for navigation
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        gsap.to(window, {
            duration: 1, 
            scrollTo: { y: targetElement, offsetY: 70 }, // Changed offsetY to 70
            ease: "power2.inOut"
        });
    });
});

// GSAP Animations
gsap.from('nav', { duration: 1, y: -50, opacity: 0, ease: 'power3.out' });

gsap.utils.toArray('section').forEach((section, index) => {
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: "top center",
            end: "bottom center",
            toggleActions: "play none none reverse"
        }
    });

    tl.from(section.querySelector('h1, h2'), {
        duration: 1,
        y: 50,
        opacity: 0,
        ease: 'power3.out'
    });

    tl.from(section.querySelectorAll('p, .project, .resume-content, #contact-form'), {
        duration: 1,
        y: 50,
        opacity: 0,
        stagger: 0.2,
        ease: 'power3.out'
    }, "-=0.5");
});

// Project interaction
document.querySelectorAll('.project').forEach(project => {
    project.addEventListener('mouseenter', () => {
        gsap.to(project, { scale: 1.05, duration: 0.3 });
    });

    project.addEventListener('mouseleave', () => {
        gsap.to(project, { scale: 1, duration: 0.3 });
    });

    project.addEventListener('click', () => {
        gsap.to(project, {
            rotation: 360,
            scale: 1.1,
            duration: 0.5,
            onComplete: () => {
                gsap.to(project, { scale: 1, duration: 0.3 });
            }
        });
    });
});

// Loading animation
const loadingScreen = document.createElement('div');
loadingScreen.style.position = 'fixed';
loadingScreen.style.top = '0';
loadingScreen.style.left = '0';
loadingScreen.style.width = '100%';
loadingScreen.style.height = '100%';
loadingScreen.style.backgroundColor = '#000';
loadingScreen.style.display = 'flex';
loadingScreen.style.justifyContent = 'center';
loadingScreen.style.alignItems = 'center';
loadingScreen.style.zIndex = '1000';

const loadingText = document.createElement('h2');
loadingText.textContent = 'LOADING...';
loadingText.style.color = '#fff';
loadingText.style.fontFamily = 'Arial, sans-serif';
loadingText.style.fontSize = '2em';

loadingScreen.appendChild(loadingText);
document.body.appendChild(loadingScreen);

window.addEventListener('load', () => {
    gsap.to(loadingScreen, {
        opacity: 0,
        duration: 1,
        onComplete: () => {
            loadingScreen.remove();
        }
    });
    
    initGame(); // Make sure this line is present
});

// Update active nav link on scroll
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');

    sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 70 && rect.bottom >= 70) { // Changed from 100 to 70
            navLinks.forEach(link => link.classList.remove('active'));
            navLinks[index].classList.add('active');
        }
    });
}

window.addEventListener('scroll', updateActiveNavLink);
updateActiveNavLink(); // Call once on load

// Add this to the top of the file
let gameCanvas, gameCtx, rocket, targets, bullets, gameLoop, score, gameActive;

function initGame() {
    gameCanvas = document.getElementById('gameCanvas');
    gameCtx = gameCanvas.getContext('2d');
    
    // Set canvas size to match its display size
    gameCanvas.width = gameCanvas.offsetWidth;
    gameCanvas.height = gameCanvas.offsetHeight;

    rocket = {
        x: gameCanvas.width / 2 - 20,
        y: gameCanvas.height - 30,
        width: 40,
        height: 40,
        speed: 5,
        moving: {left: false, right: false}
    };

    targets = [];
    bullets = [];
    score = 0;
    gameActive = false;

    document.getElementById('startGame').addEventListener('click', startGame);
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Prevent spacebar from scrolling the page
    window.addEventListener('keydown', function(e) {
        if(e.key === ' ' && e.target === document.body) {
            e.preventDefault();
        }
    });

    // Show initial instructions
    showInstructions();
}

function startGame() {
    if (gameLoop) cancelAnimationFrame(gameLoop);
    targets = [];
    bullets = [];
    score = 0;
    gameActive = true;
    updateScore();
    
    // Clear the canvas before starting the game
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Reset rocket position
    rocket.x = gameCanvas.width / 2 - 20;
    rocket.y = gameCanvas.height - 30;
    
    // Start the game loop
    gameLoop = requestAnimationFrame(updateGame);
}

function handleKeyDown(e) {
    if (!gameActive) return;
    if (e.key === 'ArrowLeft') {
        rocket.moving.left = true;
    } else if (e.key === 'ArrowRight') {
        rocket.moving.right = true;
    } else if (e.key === ' ') {
        shootBullet();
    }
}

function handleKeyUp(e) {
    if (e.key === 'ArrowLeft') {
        rocket.moving.left = false;
    } else if (e.key === 'ArrowRight') {
        rocket.moving.right = false;
    }
}

function moveRocket() {
    if (rocket.moving.left && rocket.x > 0) {
        rocket.x -= rocket.speed;
    }
    if (rocket.moving.right && rocket.x < gameCanvas.width - rocket.width) {
        rocket.x += rocket.speed;
    }
}

function shootBullet() {
    if (!gameActive) return; // Add this line to prevent shooting when game is not active
    bullets.push({
        x: rocket.x + rocket.width / 2 - 2,
        y: rocket.y,
        width: 4,
        height: 10,
        speed: 7
    });
}

function updateGame() {
    if (!gameActive) return;
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    moveRocket();

    // Update and draw bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        gameCtx.fillStyle = '#ffffff';
        gameCtx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        if (bullet.y < 0) bullets.splice(index, 1);
    });

    // Create and update targets
    if (Math.random() < 0.02) {
        targets.push({
            x: Math.random() * (gameCanvas.width - 30),
            y: 0,
            width: 30,
            height: 30,
            speed: 2
        });
    }

    let gameOver = false;

    targets.forEach((target, tIndex) => {
        target.y += target.speed;
        gameCtx.fillStyle = '#ff0000';
        gameCtx.fillRect(target.x, target.y, target.width, target.height);

        // Check if target hits the rocket
        if (
            rocket.x < target.x + target.width &&
            rocket.x + rocket.width > target.x &&
            rocket.y < target.y + target.height &&
            rocket.y + rocket.height > target.y
        ) {
            gameOver = true;
        }

        if (target.y > gameCanvas.height) {
            targets.splice(tIndex, 1);
        }

        bullets.forEach((bullet, bIndex) => {
            if (
                bullet.x < target.x + target.width &&
                bullet.x + bullet.width > target.x &&
                bullet.y < target.y + target.height &&
                bullet.y + bullet.height > target.y
            ) {
                targets.splice(tIndex, 1);
                bullets.splice(bIndex, 1);
                score++;
                updateScore();
            }
        });
    });

    // Draw rocket
    gameCtx.fillStyle = '#00ffff';
    gameCtx.fillRect(rocket.x, rocket.y, rocket.width, rocket.height);

    if (gameOver) {
        endGame();
    } else {
        gameLoop = requestAnimationFrame(updateGame);
    }
}

function drawGame() {
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    gameCtx.fillStyle = '#00ffff';
    gameCtx.fillRect(rocket.x, rocket.y, rocket.width, rocket.height);
}

function updateScore() {
    document.getElementById('score').textContent = `Score: ${score}`;
}

function endGame() {
    gameActive = false;
    cancelAnimationFrame(gameLoop);
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    gameCtx.fillStyle = '#ffffff';
    gameCtx.font = '30px Arial';
    gameCtx.textAlign = 'center';
    gameCtx.fillText('Game Over', gameCanvas.width / 2, gameCanvas.height / 2);
    gameCtx.font = '20px Arial';
    gameCtx.fillText(`Final Score: ${score}`, gameCanvas.width / 2, gameCanvas.height / 2 + 40);
    gameCtx.fillText('Click "Start Game" to play again', gameCanvas.width / 2, gameCanvas.height / 2 + 80);
}

// Add this function after the initGame function
function showInstructions() {
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    gameCtx.fillStyle = '#ffffff';
    gameCtx.font = '24px Arial';
    gameCtx.textAlign = 'center';
    gameCtx.fillText('Space Shooter', gameCanvas.width / 2, gameCanvas.height / 2 - 80);
    gameCtx.font = '18px Arial';
    gameCtx.fillText('Use Left and Right Arrow keys to move', gameCanvas.width / 2, gameCanvas.height / 2 - 40);
    gameCtx.fillText('Press Spacebar to shoot', gameCanvas.width / 2, gameCanvas.height / 2);
    gameCtx.fillText('Avoid hitting the red obstacles', gameCanvas.width / 2, gameCanvas.height / 2 + 40);
    gameCtx.fillText('Click "Start Game" to begin', gameCanvas.width / 2, gameCanvas.height / 2 + 80);
}

window.addEventListener('load', initGame);

// Add this to the top of the file
let dinoCanvas, dinoCtx, dino, obstacles, dinoGameLoop, dinoScore, dinoGameActive;

function initDinoGame() {
    dinoCanvas = document.getElementById('dinoCanvas');
    dinoCtx = dinoCanvas.getContext('2d');
    
    dinoCanvas.width = dinoCanvas.offsetWidth;
    dinoCanvas.height = dinoCanvas.offsetHeight;

    dino = {
        x: 50,
        y: dinoCanvas.height - 60,
        width: 40,
        height: 60,
        jumping: false,
        yVelocity: 0,
        gravity: 0.5,
        jumpStrength: -10
    };

    obstacles = [];
    dinoScore = 0;
    dinoGameActive = false;

    document.getElementById('startDinoGame').addEventListener('click', startDinoGame);
    document.addEventListener('keydown', jumpDino);
    document.addEventListener('keyup', handleKeyUp);

    showDinoInstructions();
}

function startDinoGame() {
    if (dinoGameLoop) cancelAnimationFrame(dinoGameLoop);
    obstacles = [];
    dinoScore = 0;
    dinoGameActive = true;
    updateDinoScore();
    
    dinoCtx.clearRect(0, 0, dinoCanvas.width, dinoCanvas.height);
    
    dino.y = dinoCanvas.height - 60;
    dino.jumping = false;
    dino.yVelocity = 0;
    
    dinoGameLoop = requestAnimationFrame(updateDinoGame);
}

function jumpDino(e) {
    if (!dinoGameActive) return;
    if (e.code === 'Space') {
        if (!dino.jumping) {
            dino.jumping = true;
            dino.yVelocity = dino.jumpStrength;
        }
    }
}

function handleKeyUp(e) {
    if (e.code === 'Space') {
        dino.jumping = false;
    }
}

function updateDinoGame() {
    if (!dinoGameActive) return;
    dinoCtx.clearRect(0, 0, dinoCanvas.width, dinoCanvas.height);

    // Update dino position
    if (dino.jumping) {
        dino.yVelocity += dino.gravity;
    } else {
        dino.yVelocity += dino.gravity * 2;
    }
    dino.y += dino.yVelocity;

    // Keep dino on the ground
    if (dino.y > dinoCanvas.height - 60) {
        dino.y = dinoCanvas.height - 60;
        dino.yVelocity = 0;
    }

    // Draw dino
    dinoCtx.fillStyle = '#00ffff';
    dinoCtx.fillRect(dino.x, dino.y, dino.width, dino.height);

    // Create and update obstacles
    if (Math.random() < 0.02) {
        let obstacleHeight = Math.random() < 0.5 ? 40 : 20; // 50% chance for tall or short obstacle
        let obstacleY = Math.random() < 0.7 ? dinoCanvas.height - obstacleHeight : dinoCanvas.height - 100 - obstacleHeight; // 30% chance for air obstacle
        obstacles.push({
            x: dinoCanvas.width,
            y: obstacleY,
            width: 20,
            height: obstacleHeight
        });
    }

    obstacles.forEach((obstacle, index) => {
        obstacle.x -= 5;
        dinoCtx.fillStyle = '#ff0000';
        dinoCtx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            dinoScore++;
            updateDinoScore();
        }

        // Collision detection
        if (
            dino.x < obstacle.x + obstacle.width &&
            dino.x + dino.width > obstacle.x &&
            dino.y < obstacle.y + obstacle.height &&
            dino.y + dino.height > obstacle.y
        ) {
            endDinoGame();
            return;
        }
    });

    dinoGameLoop = requestAnimationFrame(updateDinoGame);
}

function updateDinoScore() {
    document.getElementById('dinoScore').textContent = `Score: ${dinoScore}`;
}

function endDinoGame() {
    dinoGameActive = false;
    cancelAnimationFrame(dinoGameLoop);
    dinoCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    dinoCtx.fillRect(0, 0, dinoCanvas.width, dinoCanvas.height);
    dinoCtx.fillStyle = '#ffffff';
    dinoCtx.font = '30px Arial';
    dinoCtx.textAlign = 'center';
    dinoCtx.fillText('Game Over', dinoCanvas.width / 2, dinoCanvas.height / 2);
    dinoCtx.font = '20px Arial';
    dinoCtx.fillText(`Final Score: ${dinoScore}`, dinoCanvas.width / 2, dinoCanvas.height / 2 + 40);
    dinoCtx.fillText('Click "Start Game" to play again', dinoCanvas.width / 2, dinoCanvas.height / 2 + 80);
}

function showDinoInstructions() {
    dinoCtx.fillStyle = '#f7f7f7';
    dinoCtx.fillRect(0, 0, dinoCanvas.width, dinoCanvas.height);
    dinoCtx.fillStyle = '#000000';
    dinoCtx.font = '24px Arial';
    dinoCtx.textAlign = 'center';
    dinoCtx.fillText('Dinosaur Game', dinoCanvas.width / 2, dinoCanvas.height / 2 - 80);
    dinoCtx.font = '18px Arial';
    dinoCtx.fillText('Press Spacebar to jump', dinoCanvas.width / 2, dinoCanvas.height / 2 - 40);
    dinoCtx.fillText('Avoid the red obstacles', dinoCanvas.width / 2, dinoCanvas.height / 2);
    dinoCtx.fillText('Click "Start Game" to begin', dinoCanvas.width / 2, dinoCanvas.height / 2 + 40);
}

// Call initDinoGame when the window loads
window.addEventListener('load', initDinoGame);

// Pong Game
let pongCanvas, pongCtx, paddle1, paddle2, ball, pongScore;

function initPong() {
    pongCanvas = document.getElementById('pongCanvas');
    pongCtx = pongCanvas.getContext('2d');

    pongCanvas.width = pongCanvas.offsetWidth;
    pongCanvas.height = pongCanvas.offsetHeight;

    paddle1 = { x: 0, y: pongCanvas.height / 2 - 30, width: 10, height: 60, dy: 5 };
    paddle2 = { x: pongCanvas.width - 10, y: pongCanvas.height / 2 - 30, width: 10, height: 60, dy: 5 };
    ball = { x: pongCanvas.width / 2, y: pongCanvas.height / 2, radius: 5, dx: 3, dy: 3 };
    pongScore = { player: 0, ai: 0 };

    pongCanvas.addEventListener('mousemove', movePaddle);
    updatePong();
}

function movePaddle(e) {
    const rect = pongCanvas.getBoundingClientRect();
    paddle1.y = e.clientY - rect.top - paddle1.height / 2;
}

function updatePong() {
    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom
    if (ball.y + ball.radius > pongCanvas.height || ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }

    // Ball collision with paddles
    if (
        (ball.x - ball.radius < paddle1.x + paddle1.width && ball.y > paddle1.y && ball.y < paddle1.y + paddle1.height) ||
        (ball.x + ball.radius > paddle2.x && ball.y > paddle2.y && ball.y < paddle2.y + paddle2.height)
    ) {
        ball.dx *= -1;
    }

    // Score
    if (ball.x + ball.radius > pongCanvas.width) {
        pongScore.player++;
        resetBall();
    } else if (ball.x - ball.radius < 0) {
        pongScore.ai++;
        resetBall();
    }

    // AI paddle movement
    if (paddle2.y + paddle2.height / 2 < ball.y) {
        paddle2.y += paddle2.dy;
    } else {
        paddle2.y -= paddle2.dy;
    }

    // Draw everything
    pongCtx.clearRect(0, 0, pongCanvas.width, pongCanvas.height);
    
    pongCtx.fillStyle = '#fff';
    pongCtx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
    pongCtx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);
    
    pongCtx.beginPath();
    pongCtx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    pongCtx.fill();
    
    pongCtx.font = '20px Arial';
    pongCtx.fillText(pongScore.player, pongCanvas.width / 4, 30);
    pongCtx.fillText(pongScore.ai, 3 * pongCanvas.width / 4, 30);

    requestAnimationFrame(updatePong);
}

function resetBall() {
    ball.x = pongCanvas.width / 2;
    ball.y = pongCanvas.height / 2;
    ball.dx = -ball.dx;
    ball.dy = Math.random() > 0.5 ? 3 : -3;
}

// Call initPong when the window loads
window.addEventListener('load', initPong);
