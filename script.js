const joystickZone = document.getElementById('joystick');
const hpBar = document.getElementById('hpBar');
let playerX = window.innerWidth / 2;
let playerY = window.innerHeight - 100;
let isHPDecreasing = false;
let speed = 3;
let removedEnemiesCount = 0;
let bossCollisions = 0;
let removedBossesCount = 0; // Counter for the number of bosses removed
const ultimateBossHPBar = document.getElementById('ultimateBossHPBar');
let ultimateBossHP = 100; // Set the initial HP value
const playerMaxHP = 150; // Set the maximum HP for the player
let playerHP = playerMaxHP;
let leftRightEnemyRespawnInterval;
let bulletSound = null;
let enemyBulletSound = null;
let playerHitSound = null;
let winSound = null;
let overSound = null;






player.style.left = `${playerX}px`;
player.style.top = `${playerY}px`;


const idleSpriteURL = 'https://raw.githubusercontent.com/Benedict0530/Astro-Strike-Armada/main/spritesheet%20(11)%20(1).png';
const runSpriteURL = 'https://raw.githubusercontent.com/Benedict0530/Astro-Strike-Armada/main/spritesheet%20(11)%20(1).png';

const downSpriteURL = 'https://raw.githubusercontent.com/Benedict0530/Astro-Strike-Armada/main/spritesheet%20(11)%20(1).png';

const upSpriteURL = 'https://raw.githubusercontent.com/Benedict0530/Astro-Strike-Armada/main/spritesheet%20(11)%20(1).png';


setPlayerSprite(idleSpriteURL);

player.style.left = `${playerX}px`;
player.style.top = `${playerY}px`;

const manager = nipplejs.create({
	zone: joystickZone,
	color: 'black',
	multitouch: true,
});

let joystickAngle = 0;
let isJoystickActive = false;

manager.on('move', handleJoystickMove);
manager.on('start', handleJoystickStart);
manager.on('end', handleJoystickEnd);

function handleJoystickMove(event, nipple) {
	const angle = nipple.angle.radian;
	const moveX = Math.cos(angle) * speed;
	const moveY = Math.sin(angle) * speed;
	const invertedMoveY = -moveY;
	if (isJoystickActive) {
		// Create a bullet when the player moves
		createBullet();
	}
	playerX += moveX;
	playerY += invertedMoveY;

	playerX = Math.min(Math.max(playerX, 0), window.innerWidth - player.offsetWidth + 1000);
	playerY = Math.min(Math.max(playerY, 0), window.innerHeight - player.offsetHeight);

	updatePlayerPosition();

	// Check the direction of movement and set the appropriate sprite
	if (Math.abs(moveY) > Math.abs(moveX)) {
		// Moving vertically more than horizontally
		if (moveY > 0) {
			// Moving down
			setPlayerSprite(upSpriteURL);
		} else {
			// Moving up
			setPlayerSprite(downSpriteURL);
		}
	} else {
		// Moving horizontally more than vertically
		if (moveX > 0) {
			player.classList.remove('flipped');
		} else if (moveX < 0) {
			player.classList.add('flipped');
		}
		setPlayerSprite(runSpriteURL);
	}

	joystickAngle = angle;
}


function handleJoystickStart() {
	isJoystickActive = true;
	playermovement();
	setPlayerSprite(runSpriteURL);



}

function handleJoystickEnd() {
	isJoystickActive = false;
	setPlayerSprite(idleSpriteURL);
}

function setPlayerSprite(spriteURL) {
	player.style.backgroundImage = `url('${spriteURL}')`;
}

function updatePlayerPosition() {
	player.style.left = `${playerX}px`;
	player.style.top = `${playerY}px`;
}


const bulletSpeed = 30; // Set the speed of the bullet
const enemybulletSpeed = 50;
let bullets = []; // Array to store bullet elements
let lastBulletTime = 0; // Timestamp of the last bullet creation

function createBullet() {
    const currentTime = Date.now();

    // Check if enough time has passed since the last bullet creation
    if (currentTime - lastBulletTime < 500) {
        return; // Do not create new bullets yet
    }

    lastBulletTime = currentTime; // Update the last bullet creation time

    const numBullets = 10; // Number of bullets to create
    const spaceBetweenBullets = 1; // Space between bullets in pixels

    // Stop the previous sound instance if it exists
    if (bulletSound) {
        bulletSound.pause();
        bulletSound.currentTime = 0; // Reset the sound to the beginning
    }

    bulletSound = new Audio('laser.mp3'); // Replace 'path/to/laser.mp3' with your actual file path

    for (let i = 0; i < numBullets; i++) {
        const bullet = document.createElement('div');
        bullet.classList.add('bullet');

        // Add a 'source' property to indicate the bullet's origin
        bullet.source = 'player';

        document.body.appendChild(bullet);
        bullets.push(bullet);

        // Position the bullets next to each other
        const bulletX = playerX + i * (bullet.offsetWidth + spaceBetweenBullets);
        const bulletY = playerY;
        bullet.style.left = `${bulletX}px`;
        bullet.style.top = `${bulletY}px`;

        animateBullet(bullet);

        // Play the bullet sound
        bulletSound.play();
    }
}



function animateBullet(bullet) {
    function moveBullet() {
        const bulletRect = bullet.getBoundingClientRect();
        const bulletY = bulletRect.top - bulletSpeed;

        if (bulletY + bulletRect.height < 0) {
            // Remove the bullet only if it's still a child of document.body
            if (document.body.contains(bullet)) {
                document.body.removeChild(bullet);
                bullets = bullets.filter((b) => b !== bullet);
            }
        } else {
            bullet.style.top = `${bulletY}px`;

            // Check for collisions with enemies
            checkBulletCollision(bullet);

            requestAnimationFrame(moveBullet);
        }
    }

    moveBullet();
}


function checkBulletCollision(bullet) {
    const bulletRect = bullet.getBoundingClientRect();

    // Check for collisions with normal enemies
    document.querySelectorAll('.enemy').forEach((enemy) => {
        const enemyRect = enemy.getBoundingClientRect();
        if (isColliding(bulletRect, enemyRect)) {
            // Remove the bullet and enemy
            if (bullet.parentNode) {
                document.body.removeChild(bullet);
                bullets = bullets.filter((b) => b !== bullet);
            }

            if (enemy.parentNode) {
                // Create and append explosion element
                createExplosion(enemyRect.left, enemyRect.top);
                document.body.removeChild(enemy);

                removedEnemiesCount++;

            }
        }
    });


    // Check for collisions with left-right enemies
    document.querySelectorAll('.left-right-enemy').forEach((enemy) => {
        const enemyRect = enemy.getBoundingClientRect();
        if (isColliding(bulletRect, enemyRect)) {
            // Only remove the bullet and create an explosion
            if (bullet.parentNode) {
                document.body.removeChild(bullet);
                bullets = bullets.filter((b) => b !== bullet);
            }

            // Create and append explosion element
            createExplosion(enemyRect.left, enemyRect.top);
        }
    });

// Check for collisions with the boss
    const bossElement = document.querySelector('.boss-element');
    if (bossElement) {
        const bossRect = bossElement.getBoundingClientRect();

        // Check if the bullet is from the player
        if (bullet.source === 'player' && isColliding(bulletRect, bossRect)) {
            // Remove the bullet and apply damage to the boss
            if (bullet.parentNode) {
                document.body.removeChild(bullet);
                createExplosion(bossRect.left, bossRect.top);
                bullets = bullets.filter((b) => b !== bullet);
            }

            // Increment the boss collisions counter
            bossCollisions++;

            // Implement logic to handle boss damage (e.g., decrease boss HP)
            // Example: decreaseBossHP();

            // Check if the boss has been hit 10 times
            if (bossCollisions >= 50) {
                // Remove the boss
                if (bossElement.parentNode) {
                    document.body.removeChild(bossElement);
                    // Increment the removed bosses counter
                    removedBossesCount++;

                    // Check if 10 or more bosses have been removed
                    if (removedBossesCount === 10) {

                        // Add the ultimate boss
                        addUltimateBoss();

                        removedBossesCount = 0;
                    }
                }

                // Reset the boss collisions counter
                bossCollisions = 0;
            }
        }
    }
     // Check for collisions with the ultimate boss
        const ultimateBossElement = document.querySelector('.ultimate-boss');
        if (ultimateBossElement) {
            const ultimateBossRect = ultimateBossElement.getBoundingClientRect();

            // Check if the bullet is from the player
            if (bullet.source === 'player' && isColliding(bulletRect, ultimateBossRect)) {
                // Remove the bullet and apply damage to the ultimate boss
                if (bullet.parentNode) {
                    document.body.removeChild(bullet);
                    createExplosion(ultimateBossRect.left, ultimateBossRect.top);
                    bullets = bullets.filter((b) => b !== bullet);
                }

              // Decrease the ultimate boss HP
                 decreaseUltimateBossHP();


                 // Update the HP bar appearance
                 updateUltimateBossHPBar();


            }
        }


}

function decreaseUltimateBossHP() {
    // Implement your logic to decrease the ultimate boss's HP
    // For example, decrease the HP by a certain amount
    ultimateBossHP -= 1; // Decrease by 10 for demonstration purposes

    // Ensure the HP does not go below 0
    ultimateBossHP = Math.max(ultimateBossHP, -1);

    // Check if the ultimate boss is defeated
    if (ultimateBossHP <= 0) {
        handleUltimateBossDefeat();
    }

    // Update the HP bar appearance
    updateUltimateBossHPBar();
}
function showGameOverScreen() {
  const gameOverScreen = document.getElementById('gameOverScreen');
  gameOverScreen.style.display = 'block';
}

function showWinScreen() {
      // Stop the previous sound instance if it exists
      if (winSound) {
        winSound.pause();
        winSound.currentTime = 0; // Reset the sound to the beginning
    }
    winSound = new Audio('win.wav'); 
  const winScreen = document.getElementById('winScreen');
  winScreen.style.display = 'block';
  winSound.play();
}

function restartGame() {
  // Reset game variables and hide screens
  playerHP = playerMaxHP;
  ultimateBossHP = 100;
  removedEnemiesCount = 0;
  bossCollisions = 0;
  removedBossesCount = 0;
  hasUltimateBossSpawned = false;

  const gameOverScreen = document.getElementById('gameOverScreen');
  const winScreen = document.getElementById('winScreen');

  gameOverScreen.style.display = 'none';
  winScreen.style.display = 'none';
updatePlayerHPBar();
  updateUltimateBossHPBar();
  // Call any other initialization functions or start your game loop again
  // gameLoop();
}

function handleUltimateBossDefeat() {

showWinScreen()
    // Remove all enemies, including regular bosses and ultimate bosses
    document.querySelectorAll('.enemy, .boss, .ultimate-boss').forEach((enemy) => {
        if (enemy.parentNode) {
            document.body.removeChild(enemy);
        }
    });


    clearInterval(leftRightEnemyRespawnInterval);

    // Optionally, perform other actions or trigger the next phase of the game
}








let hasUltimateBossSpawned = false;

function addUltimateBoss() {
    // Check if the ultimate boss has already been spawned
    if (!hasUltimateBossSpawned) {
        // Set the flag to true to prevent further respawns
        hasUltimateBossSpawned = true;

        const ultimateBossElement = document.createElement('div');
        ultimateBossElement.classList.add('ultimate-boss');
        document.body.appendChild(ultimateBossElement);

        const circularCenter = { x: 100, y: 100 }; // Set the center of the circular path
        const circularRadius = 150; // Set the radius of the circular path

        moveUltimateBoss(ultimateBossElement, circularCenter, circularRadius);

        // Optionally, set up a timer to continuously respawn ultimate boss bullets
        setInterval(() => {
            if (document.contains(ultimateBossElement)) {
                createEnemyBullet(ultimateBossElement);
            }
        }, 500); // respawn every 0.5 seconds as an example
    }
}

// In your game loop or wherever appropriate, call addUltimateBoss
// when the conditions for spawning the ultimate boss are met.


function moveUltimateBoss(ultimateBoss, center, radius) {
    let angle = 0;

    function move() {
        const bossX = center.x + radius * Math.cos(angle);
        const bossY = center.y + radius * Math.sin(angle);

        // Update the position of the ultimate boss
        ultimateBoss.style.left = `${bossX}px`;
        ultimateBoss.style.top = `${bossY}px`;

        angle += 0.01; // Adjust the angle increment for desired speed

        requestAnimationFrame(move);
    }

    move();
}



function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.classList.add('explosion');
    explosion.style.left = `${x}px`;
    explosion.style.top = `${y}px`;
    document.body.appendChild(explosion);

    // Remove the explosion element after the animation finishes
    explosion.addEventListener('animationend', () => {
        document.body.removeChild(explosion);
    });
}



// Function to check if two elements are colliding
function isColliding(rect1, rect2) {
	return (
		rect1.left < rect2.right &&
		rect1.right > rect2.left &&
		rect1.top < rect2.bottom &&
		rect1.bottom > rect2.top
	);
}


function playermovement() {
	if (isJoystickActive) {
		const moveX = Math.cos(joystickAngle) * speed;
		const moveY = Math.sin(joystickAngle) * speed;
		const invertedMoveY = -moveY;

		playerX += moveX;
		playerY += invertedMoveY;

		playerX = Math.min(Math.max(playerX, 0), window.innerWidth - player.offsetWidth);
		playerY = Math.min(Math.max(playerY, 0), window.innerHeight - player.offsetHeight);
		updatePlayerPosition();

		requestAnimationFrame(playermovement);
	}
}




const enemySpeed = 2;

function moveEnemy(enemy) {
	function move() {
		const enemyRect = enemy.getBoundingClientRect();
		const enemyY = enemyRect.top + enemySpeed;

		if (enemyY > window.innerHeight) {
			// Remove the enemy when it goes out of the screen
			document.body.removeChild(enemy);
		} else {
			enemy.style.top = `${enemyY}px`;
			requestAnimationFrame(move);
		}
	}

	move();
}



function createLeftRightEnemy() {
	const enemy = document.createElement('div');
	enemy.classList.add('enemy');
	document.body.appendChild(enemy);

	const enemyX = Math.random() * (window.innerWidth - enemy.offsetWidth);
	const enemyY = 0;
	enemy.style.left = `${enemyX}px`;
	enemy.style.top = `${enemyY}px`;

	const moveDirection = Math.random() < 0.5 ? -1 : 1; // Randomly choose left or right direction
	moveLeftRightEnemy(enemy, moveDirection);
}

// Function to move enemies left and right
function moveLeftRightEnemy(enemy, moveDirection) {
	function move() {
		const enemyRect = enemy.getBoundingClientRect();
		const enemyX = enemyRect.left + moveDirection * enemySpeed;

		if (enemyX < 0 || enemyX + enemyRect.width > window.innerWidth) {
			// Change direction when reaching the edges of the screen
			moveDirection *= -1;
		}

		enemy.style.left = `${enemyX}px`;
		requestAnimationFrame(move);
	}

  // Set up a timer to shoot bullets every 2 seconds
    leftRightEnemyRespawnInterval = setInterval(() => {
        if (document.contains(enemy)) {
            createEnemyBullet(enemy);
        }
    }, 2000);

    move();
}

let enemyBullets = [];
// Function to create bullets shot by the enemies
function createEnemyBullet(enemy) {
    const bullet = document.createElement('div');
    bullet.classList.add('enemy-bullet');
    document.body.appendChild(bullet);

    const bulletX = enemy.offsetLeft + enemy.offsetWidth / 2;
    const bulletY = enemy.offsetTop + enemy.offsetHeight;

    if (enemyBulletSound) {
        enemyBulletSound.pause();
        enemyBulletSound.currentTime = 0; // Reset the sound to the beginning
    }
    enemyBulletSound = new Audio('enemybullet.wav');

    bullet.style.left = `${bulletX}px`;
    bullet.style.top = `${bulletY}px`;

    enemyBullets.push(bullet); // Add the bullet to the array

    animateEnemyBullet(bullet);
    enemyBulletSound.play();
}

// Function to animate enemy bullets
function animateEnemyBullet(bullet) {
	function moveBullet() {
		const bulletRect = bullet.getBoundingClientRect();
		const bulletY = bulletRect.top + enemybulletSpeed;

		if (bulletY > window.innerHeight) {
			// Remove the bullet when it goes out of the screen
			document.body.removeChild(bullet);
		} else {
			bullet.style.top = `${bulletY}px`;

			// Check if the bullet is still a child of the document.body
			if (document.body.contains(bullet)) {
				// Check for collisions with enemies and player
				checkBulletCollision(bullet);

				// Continue the animation
				requestAnimationFrame(moveBullet);
			}
		}
	}

	moveBullet();
}


function checkPlayerCollision() {
    const playerRect = player.getBoundingClientRect();

    enemyBullets.forEach((enemyBullet, index) => {
        const enemyBulletRect = enemyBullet.getBoundingClientRect();

        if (isColliding(playerRect, enemyBulletRect)) {
            // Remove the collided enemy bullet
            if (enemyBullet.parentNode) {
                document.body.removeChild(enemyBullet);
            }

            // Remove the bullet from the array
            enemyBullets.splice(index, 1);

            // Handle player collision after removing the bullet
            handlePlayerCollision();
        }
    });
}





function createExplosion1(x, y) {
    const explosion = document.createElement('div');
    explosion.classList.add('player-body-explosion');
    explosion.style.left = `${x}px`;
    explosion.style.top = `${y}px`;
    document.body.appendChild(explosion);

    // Remove the explosion element after the animation finishes
    explosion.addEventListener('animationend', () => {
        document.body.removeChild(explosion);
    });
}

function handlePlayerCollision() {
    // Get the center coordinates of the player
    const playerRect = player.getBoundingClientRect();
    const playerCenterX = playerRect.left + playerRect.width / 5;
    const playerCenterY = playerRect.top + playerRect.height / 100;

    // Create and append explosion element at the center of the player
    createExplosion1(playerCenterX, playerCenterY);

    if (playerHitSound) {
        playerHitSound.pause();
        playerHitSound.currentTime = 0; // Reset the sound to the beginning
    }
    playerHitSound = new Audio('playerCollide.wav');
    // Implement any other logic you want for handling player collision
    // For example, decrease player's HP, update UI, or trigger game over
    if (!isHPDecreasing) {
        isHPDecreasing = true;
        decreasePlayerHP();
        setTimeout(() => {
            isHPDecreasing = false;
        }, 1000); // Add a delay to prevent rapid HP decrease
    }

    playerHitSound.play();
    console.log('Player collided.');
}






function decreasePlayerHP() {
	// Implement your logic to decrease player's HP here
	// For example, update the HP bar or perform other actions
	// You can access the HP bar element using the 'hpBar' variable
	// Example: hpBar.style.width = `${newWidth}px`;
}





function gameLoop() {
	// Your existing game logic here

	// Check for collisions with enemy bullets
	checkPlayerCollision();

   if (removedEnemiesCount >= 5) {
        // Respawn the boss or any other action you want to take
        respawnBoss();
        removedEnemiesCount = 0; // Reset the count
    }

	// Continue with the rest of your game logic
	requestAnimationFrame(gameLoop);
}

function respawnBoss() {
    // Create the boss element
    const boss = document.createElement('div');
    boss.classList.add('boss'); // Add the CSS class for styling
    boss.classList.add('boss-element'); // Add a unique class for identifying the boss
    document.body.appendChild(boss);

    // Set the initial position of the boss
    const bossX = window.innerWidth / 2;
    const bossY = 50;
    boss.style.left = `${bossX}px`;
    boss.style.top = `${bossY}px`;

    // Add any additional logic for the boss behavior
    moveBoss(boss);

    // Optionally, set up a timer to continuously respawn boss bullets
    setInterval(() => {
        if (document.contains(boss)) {
            createEnemyBullet(boss);
        }
    }, 2000); // respawn every 2 seconds as an example
}


// Function to move the boss left and right
function moveBoss(boss) {
    let moveDirection = 1; // 1 for right, -1 for left
    const bossSpeed = 2; // Adjust the speed as needed

    function move() {
        const bossRect = boss.getBoundingClientRect();
        const bossX = bossRect.left + moveDirection * bossSpeed;

        if (bossX < 0 || bossX + bossRect.width > window.innerWidth) {
            // Change direction when reaching the edges of the screen
            moveDirection *= -1;
        }

        boss.style.left = `${bossX}px`;
        requestAnimationFrame(move);
    }

    move();
}

function updateUltimateBossHPBar() {
    const percentage = (ultimateBossHP / 100) * 100; // Calculate the percentage of HP
    ultimateBossHPBar.style.width = `${percentage}%`; // Update the width of the HP bar
}
// Function to update the player's HP bar appearance
function updatePlayerHPBar() {
  const percentage = (playerHP / playerMaxHP) * 100;
  document.getElementById('playerHPBar').style.width = `${percentage}%`;
}

function decreasePlayerHP(amount) {
  playerHP -= 5;

  // Ensure the HP does not go below 0
  playerHP = Math.max(playerHP, 0);

  // Update the player's HP bar appearance
  updatePlayerHPBar();

  // Check if the player is defeated (you can customize this logic)
  if (playerHP === 0) {
    handlePlayerDefeat();
  }
}

// Function to handle player defeat (customize as needed)
function handlePlayerDefeat() {
    if(overSound){
        overSound.pause();
        overSound.currentTime = 0;
    }

    overSound = new Audio('path/to/laser.mp3'); 
    overSound.play();
showGameOverScreen();
 // Remove all enemies, including regular bosses and ultimate bosses
    document.querySelectorAll('.enemy, .boss, .ultimate-boss').forEach((enemy) => {
        if (enemy.parentNode) {
            document.body.removeChild(enemy);
        }
    });
  

    clearInterval(leftRightEnemyRespawnInterval);

  

    // Optionally, perform other actions or trigger the next phase of the game
}






// Call the gameLoop function to start the game loop
gameLoop();







// Optionally, set up a timer to continuously respawn left-right enemies
setInterval(() => {
    // Check if the ultimateBossHP is greater than 0 before creating left-right enemies
    if (ultimateBossHP&&playerHP > 10) {
        createLeftRightEnemy();
    }
}, 1000); // respawn every 5 seconds as an example


updatePlayerHPBar();

updateUltimateBossHPBar(); // Call this function to set the initial HP bar appearance

playermovement();
