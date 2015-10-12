function GameObject(id, shape) {
	this.id = id;
	this.x = 0;
	this.y = 0;
	this.vx = 0;
	this.vy = 0;
	this.w = 0;
	this.h = 0;
	this.scale = 1;
	this.rot = 0;
	this.speed = 0;
	this.element = shape ? shape.call(this) : function() {};
}

GameObject.prototype.update = function(whith, height) {
	var rad = this.calculateRad();

	this.vx = Math.cos(rad) * this.speed;
	this.vy = Math.sin(rad) * this.speed;

	this.x += this.vx;
	this.y += this.vy;

	this.translePosition(width, height);

	this.updateElement();
};

GameObject.prototype.translePosition = function(width, height) {
	if(this.x - this.w > width) {
		this.x = 0;
	}
	else if(this.x + this.w < 0) {
		this.x = width;
	}
	
	if(this.y - this.h > height) {
		this.y = 0;
	}
	else if(this.y + this.h < 0) {
		this.y = height;
	}
};

GameObject.prototype.updateElement = function() {
	var transform = 'translate(' + this.x + ', ' + this.y + ')';

	if(this.scale != 1) {
		transform += 'scale(' + this.scale + ')';
	}

	this.element.setAttribute('transform', transform);
};

GameObject.prototype.calculateRad = function() {
	return this.rot * Math.PI / 180;
};

GameObject.prototype.getCenter = function() {
	return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
};

GameObject.prototype.isOutside = function(width, height) {
	return !utils.inRange(this.x, 0, width) || !utils.inRange(this.y, 0, height);
};

GameObject.prototype.hide = function() {
	this.element.setAttribute('visibility', 'hidden');
};

GameObject.prototype.show = function() {
	this.element.setAttribute('visibility', 'visible');
};

function Ship(id, shape) {
	GameObject.call(this, id, shape);

	this.thrust = .1;
	this.topSpeed = 3;
	this.rotateSpeed = 2;
	this.reloadingCount = 0;
	this.reloadingTime = 5;
	this.reloading = false;
	this.bullets = 5;
	this.health = 3;
	this.shields = 3;
	this.shieldActive = false;
	this.shieldActiveCount = 0;
	this.shieldActiveTime = 250;
}

Ship.prototype = new GameObject();

Ship.prototype.update = function(width, height) {

	this.x += this.vx;
	this.y += this.vy;

	this.translePosition(width, height);

	if(this.reloading) {
		if(this.reloadingCount-- === 0) {
			this.reloading = false;
		}
	}

	if(this.shieldActive) {
		if(this.shieldActiveCount-- === 0) {
			this.shieldActive = false;
		}
	}

	//showPos(this)

	this.updateElement();
};

Ship.prototype.updateElement = function() {
	var transform = 'rotate(' + this.rot + ' ' + 
		(this.x + 1) + ' ' +
		(this.y + 1) + ') ' +
		'translate(' + (this.x - this.w / 2) + ', ' + (this.y - this.h / 2) + ')';

	if(this.scale != 1) {
		transform += ' scale(' + this.scale + ')';
	}

	this.element.setAttribute('transform', transform);
};

Ship.prototype.rotateLeft = function() {
	this.rot -= this.rotateSpeed;
};

Ship.prototype.rotateRight = function() {
	ship.rot += ship.rotateSpeed;
};

Ship.prototype.accelerate = function() {
	var rad = this.calculateRad();

	this.vx += Math.cos(rad) * this.thrust;
	this.vy += Math.sin(rad) * this.thrust;

	this.vx = utils.keepInRange(this.vx, -this.topSpeed, this.topSpeed);
	this.vy = utils.keepInRange(this.vy, -this.topSpeed, this.topSpeed);
};

Ship.prototype.startReloading = function() {
	this.reloadingCount = this.reloadingTime;
	this.reloading = true;
};

Ship.prototype.activateShield = function() {

	if(this.shields === 0) { return; }

	this.shieldActiveCount = this.shieldActiveTime;
	this.shieldActive = true;
	this.shields--;
};

Ship.prototype.calculateNosePosition = function() {
	var rad = this.calculateRad(),
		x = Math.cos(rad) * (this.w / 2),
		y = Math.sin(rad) * (this.h / 2);

	return [x, y];
};

function Asteroid(id, shape) {
	GameObject.call(this, id, shape);

	this.size = AsteroidSize.big;
	this.alive = false;
	this.index = -1;
}

Asteroid.prototype = new GameObject();

var AsteroidSize = {
	big: 3,
	medium: 2,
	small: 1
};

function Bullet(id, shape) {
	GameObject.call(this, id, shape);

	this.alive = false;
	this.index = -1;
}

Bullet.prototype = new GameObject;

Bullet.prototype.update = function(width, height) {

	var rad = this.calculateRad();

	this.vx = Math.cos(rad) * this.speed;
	this.vy = Math.sin(rad) * this.speed;

	this.x += this.vx;
	this.y += this.vy;

	this.updateElement();

};

var turningLeft = false,
	turningRight = false,
	thrusting = false,
	shielding = false,
	width = window.innerWidth,
	height = window.innerHeight,
	ship,
	asteroidsCount = 5 * 3 * 3,
	asteroids = [],
	asteroidIndex = [],
	bulletsCount = 5,
	bullets = [],
	bulletIndex = [],
	shooting = false,
	hud,
	score = 0,
	shapes = {
		ship: function() {
			return '<use id="' + this.id + '" xlink:href="#defShip" width="' + this.w + '" height="' + this.h + '" />';
		},
		asteroid: function() {
			return '<use id="' + this.id + '" xlink:href="#defAsteroid" width="' + this.w + '" height="' + this.h + '" />';
		},
		bullet: function() {
			return '<g id="' + this.id + '"><circle r="' + this.w / 2 + '" cy="0" cx="0" stroke-width="1" stroke="#000000" fill="#00FF00"/></g>';
		},
		shield: function() {
			return '<circle ' +
		       'r="' + this.w / 2 + '" ' +
		       'cy="0" ' +
		       'cx="0" ' +
		       'id="' + this.id + '" ' +
		       'style="fill:#ffffff;stroke:#ffffff;stroke-width:1;stroke-opacity:1;fill-opacity:0.1" />';
		}
	},
	utils = {
		inRange: function(value, min, max) {
			return value >= min && value <= max;
		},
		keepInRange: function(value, min, max) {
			if(value > max) {
				value = max;
			}
			else if(value < min) {
				value = min;
			}

			return value;
		},
		random: function(min, max) {
	    	return Math.floor(Math.random() * (max - min + 1) + min);
		},
		distanceXY: function(x0, y0, x1, y1) {
			var dx = x1 - x0,
				dy = y1 - y0;
			return Math.sqrt(dx * dx + dy * dy);
		},
		circlePointCollision: function(x, y, cx, cy, cr) {
			return utils.distanceXY(x, y, cx, cy) < cr;
		}
	};

window.onload = function() {

	var elementsSvg = '',
		i = 0;

	ship = new Ship('ship');

	ship.x = width / 2;
	ship.y = height / 2;
	ship.w = 79.5;
	ship.h = 50;
	ship.scale = ship.w / 159;
	ship.rot = 0;
	ship.element = shapes['ship'].call(ship);

	elementsSvg += ship.element;

	shield = new GameObject('shield');

	shield.x = ship.x;
	shield.y = ship.y;
	shield.w = ship.w * 1.3;
	shield.h = ship.h * 1.3;
	shield.rot = ship.rot;
	shield.element = shapes['shield'].call(shield);

	elementsSvg += shield.element;

	for(i = 0; i < asteroidsCount; i++) {
		var asteroid = new Asteroid('asteroid' + i);

		asteroid.x = utils.random(100, width - 100);
		asteroid.y = utils.random(100, height - 100);
		asteroid.w = utils.random(80, 100);
		asteroid.h = asteroid.w;
		asteroid.scale = asteroid.w / 100;
		asteroid.speed = utils.random(2, 3);
		asteroid.rot = utils.random(1, 360);
		asteroid.element = shapes['asteroid'].call(asteroid);
		asteroid.alive = i < 5;
		asteroid.index = i;

		asteroids.push(asteroid);

		if(!asteroid.alive) {
			asteroidIndex.push(i);
		}

		elementsSvg += asteroid.element;
	}

	for(i = 0; i < bulletsCount; i++) {
		var bullet = new Bullet('bullet' + i);

		bullet.w = 5;
		bullet.h = 5;
		bullet.index = i;

		bullet.element = shapes['bullet'].call(bullet);

		bullets.push(bullet);

		bulletIndex.push(bullet.index);

		elementsSvg += bullet.element;
	}

	document.getElementById('game').setAttribute('viewBox', '0 0 ' + width + ' ' + height);

	document.getElementById('game').innerHTML += elementsSvg;

	createElement(ship);

	createElement(shield);

	asteroids.forEach(function(a) {
		createElement(a);

		if(!a.alive) {
			a.hide();
		}
	});

	bullets.forEach(function(b) {
		createElement(b);
	});

	hud = document.getElementById('hud');

	update();

};

function update() {

	if(turningLeft) {
		ship.rotateLeft();
	}
	else if(turningRight) {
		ship.rotateRight();
	}

	if(thrusting) {
		ship.accelerate();
		document.getElementById('flame').classList.add('thrusting');
	}
	else {
		document.getElementById('flame').classList.remove('thrusting');
	}

	if(shielding && !ship.shieldActive && ship.shields > 0) {
		ship.activateShield();
		shield.show();
	}
	else if(!ship.shieldActive) {
		shield.hide();
	}

	if(!ship.reloading && shooting && bulletIndex.length > 0) {
		var bullet = bullets[bulletIndex.shift()],
			pos = ship.calculateNosePosition();

		bullet.x = ship.x + pos[0];
		bullet.y = ship.y + pos[1];
		bullet.w = 10;
		bullet.h = 10;
		bullet.rot = ship.rot;
		bullet.speed = 10;
		bullet.alive = true;
		bullet.show();

		ship.startReloading();
	}

	bullets.filter(function(b) { return b.alive; }).forEach(function(bullet) {
		bullet.update(width, height);

		if(bullet.isOutside(width, height)) {
			bullet.alive = false;
			bulletIndex.push(bullet.index);
		}

		asteroids.filter(function(a) { return a.alive; }).forEach(function(asteroid, index) {
			var asteroidCenter = asteroid.getCenter();
		
			if(utils.circlePointCollision(bullet.x, bullet.y, asteroidCenter.x, asteroidCenter.y, asteroid.w / 2)) {
				asteroid.alive = false;
				asteroid.hide();
				asteroidIndex.push(asteroid.index);
				bullet.alive = false;
				bulletIndex.push(bullet.index);
				bullet.hide();

				var newAsteroidWidth = asteroid.w * .75,
					newAsteroidSize = asteroid.size - 1;

				if(asteroid.size > AsteroidSize.small) {
					for(var i = 0; i < 3 && asteroidIndex.length; i++) {
						var newAsteroid = asteroids[asteroidIndex.shift()];

						//console.log('created new asteroid ', newAsteroid.id, ' asteroidIndex lenght is ', asteroidIndex.length);

						newAsteroid.w = newAsteroid.h = newAsteroidWidth;
						newAsteroid.scale = newAsteroidWidth / 100;
						newAsteroid.x = asteroid.x;
						newAsteroid.y = asteroid.y;
						newAsteroid.rot = (i + 1) * 120 + 45;
						newAsteroid.alive = true;
						newAsteroid.size = newAsteroidSize;
						newAsteroid.speed = utils.random(2, 3);
						newAsteroid.show();
					}
				}

				score++;
			}

		});
	});

	asteroids.filter(function(a) { return a.alive; }).forEach(function(asteroid) {
		asteroid.update(width, height);

		if(!ship.shieldActive && utils.circlePointCollision(ship.x, ship.y, asteroid.x, asteroid.y, asteroid.w / 2)) {
			console.log('ship crashed with ', asteroid.id);
			ship.health--;
		}
	});

	ship.update(width, height);

	shield.rot = ship.rot;
	shield.x = ship.x;
	shield.y = ship.y;
	shield.update();

	updateHud();

	requestAnimationFrame(update);

}

function updateHud() {
	hud.querySelector('.text').innerHTML = 'Health: ' + ship.health + ', shields: ' + ship.shields + ', Score: ' + score;
}

function createElement(gObj) {

	gObj.element = document.getElementById(gObj.id);
}

document.body.addEventListener('keydown', function(event) {
	updateInput(event.keyCode, true);
});

document.body.addEventListener('keyup', function(event) {
	updateInput(event.keyCode, false)
});

function updateInput(keyCode, pressed) {
	switch(keyCode) {
		case 38: // up
			thrusting = pressed;
			break;
		case 37: // left
			turningLeft = pressed;
			break;
		case 39: // right
			turningRight = pressed;
			break;
		case 32: // space
			shooting = pressed;
			break;
		case 13: // enter
			shielding = pressed;
			break;
		default:
			break;
	}
}

function showPos() {

	var p = document.getElementById('posdiv');

	if(arguments.length === 1) {
		p.style.width = arguments[0].x + 'px';
		p.style.height = arguments[0].y + 'px';
	}
	else {
		p.style.width = arguments[0] + 'px';
		p.style.height = arguments[1] + 'px';
	}

	p.style.display = 'block';
}