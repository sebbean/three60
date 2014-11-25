function three60() {
	var self = this;

	this.debug              = true;
	this.containerObj       = null;
	this.fileName           = null;
	this.totalFrames        = null;
	this.framesLoaded       = 0;
	this.frameIndex         = 1;
	this.lastFrameIndex     = 1;
	this.dragging           = false;
	this.lastScreenX        = 0;
	this.inertiaInterval    = null;
	this.direction          = null;
	this.frameSpeed         = 0;
	this.inertiaFrameSpeed  = 0;
	this.timeInertia        = 0;
	this.inertiaDuration    = 0;
	this.imageObjects       = Array();
	this.RAFrunning         = false;

	// initialize
	this.init = function(containerObj, fileName, totalFrames) {
		self.containerObj = containerObj
		self.fileName = fileName;
		self.totalFrames = totalFrames;

		Math.easeOutQuad = function (t, b, c, d) {
			return -c *(t/=d)*(t-2) + b;
		}

		Math.easeOutQuart = function (t, b, c, d) {
			t /= d;
			t--;
			return -c * (t*t*t*t - 1) + b;
		}

		Math.easeOutExpo = function (t, b, c, d) {
			return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
		};

		window.requestAnimFrame = (function() {
			return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function(callback) {
				window.setTimeout(callback, 1000 / 60);
			};
		})();

		self.loadFrames();
	}

	this.loadFrames = function() {
		for (var i = 1; i <= self.totalFrames; i++) {
			self.imageObjects [i] = new Image();
			self.imageObjects[i].src = self.fileName.replace('{i}', zeroFill(i));
			self.imageObjects[i].onload = function() {
				self.framesLoaded++;
				if (self.framesLoaded == self.totalFrames) self.loadComplete();
			}
		}
	}

	this.loadComplete = function() {
		var imgFrame;

		self.containerObj.className = "hide"
		for (var i = 1; i <= self.totalFrames; i++) {
			imgFrame = document.createElement('img');
			imgFrame.setAttribute('src', self.fileName.replace('{i}', i));
			imgFrame.setAttribute('style', i == 1 ? "display: block;" : "display: none;");
			imgFrame.setAttribute('data-index', i);
			self.containerObj.appendChild(imgFrame);
		}
		self.attachHandlers();
	}

	this.attachHandlers = function() {
		// handlers for mobile
		if (typeof document.ontouchstart !== 'undefined' && typeof document.ontouchmove !== 'undefined' && typeof document.ontouchend !== 'undefined' && typeof document.ontouchcancel !== 'undefined') {
			self.containerObj.addEventListener('touchstart', function(e) {
				e.preventDefault();
				self.down(e.touches[0].pageX);
			});

			self.containerObj.addEventListener('touchmove', function(e) {
				e.preventDefault();
				self.move(e.touches[0].pageX);
			});

			self.containerObj.addEventListener('touchend', function(e) {
				e.preventDefault();
				self.up();
			});

			self.containerObj.addEventListener('touchcancel', function(e) {
				e.preventDefault();
				self.up();
			});
		}

		// handlers for desktop
		self.containerObj.addEventListener('mousedown', function(e) {
			e.preventDefault();
			self.down(e.screenX);
		});

		self.containerObj.addEventListener('mousemove', function(e) {
			e.preventDefault();
			self.move(e.screenX);
		});

		self.containerObj.addEventListener('mouseup', function(e) {
			e.preventDefault();
			self.up();
		});

		self.containerObj.addEventListener('mouseout', function(e) {
			e.preventDefault();

			var relatedTarget = ('relatedTarget' in e? e.relatedTarget : e.toElement);
			if (relatedTarget.nodeName == "IMG" || relatedTarget.id == self.containerObj.id) return false;
			self.up();
		});
	}

	this.down = function(x) {
		self.dragging = true;
		self.lastScreenX = x;
		self.stopInertia();
	}

	this.move = function(x) {
		if (self.dragging) {
			self.frameSpeed = (parseInt(Math.abs(self.lastScreenX - x) * 0.05) == 0 ? 1 : parseInt(Math.abs(self.lastScreenX - x) * 0.05));
			self.lastFrameIndex = self.frameIndex;

			if (x > self.lastScreenX) {
				self.frameIndex = self.frameIndex - self.frameSpeed;
				self.direction = 'left';
			} else if (x < self.lastScreenX) {
				self.direction = 'right';
				self.frameIndex = self.frameIndex + self.frameSpeed;
			}

			if (self.frameIndex > self.totalFrames) self.frameIndex = 1;
			if (self.frameIndex < 1) self.frameIndex = self.totalFrames;

			if (self.lastFrameIndex != self.lastScreenX) self.updateFrames();
			self.lastScreenX = x;
		}
	}

	this.up = function() {
		self.dragging = false;
		if (self.frameSpeed > 1) self.inertia();
	}

	this.inertia = function() {
		self.inertiaDuration = self.frameSpeed;
		self.inertiaFrameSpeed = 0;

		if (!self.RAFrunning) requestAnimFrame(self.inertiaRAF);
		this.RAFrunning = true;
	}

	this.inertiaRAF = function() {
		self.timeInertia += 0.04;
		self.frameSpeed = self.inertiaDuration - parseInt(Math.easeOutQuart(self.timeInertia, 0, self.inertiaDuration, self.inertiaDuration));
		self.inertiaFrameSpeed += self.inertiaDuration - Math.easeOutQuart(self.timeInertia, 0, self.inertiaDuration, self.inertiaDuration);

		if (self.inertiaFrameSpeed >= 1) {
			self.lastFrameIndex = self.frameIndex;
			if (self.direction == "right") self.frameIndex = self.frameIndex + Math.floor(self.inertiaFrameSpeed); else self.frameIndex = self.frameIndex - Math.floor(self.inertiaFrameSpeed);
			if (self.frameIndex > self.totalFrames) self.frameIndex = 1;
			if (self.frameIndex < 1) self.frameIndex = self.totalFrames;
			self.inertiaFrameSpeed = 0;
			self.updateFrames();
		}

		if (self.timeInertia > self.inertiaDuration || self.frameSpeed < 1) self.stopInertia(); else requestAnimFrame(self.inertiaRAF);
	}

	this.stopInertia = function() {
		self.timeInertia = 0;
		self.inertiaDuration = 0;
		this.RAFrunning = false;
	}

	self.updateFrames = function() {
		self.containerObj.querySelector('img[data-index="' + self.lastFrameIndex + '"]').style.display = "none"
		self.containerObj.querySelector('img[data-index="' + self.frameIndex + '"]').style.display = "block"
	}
}
