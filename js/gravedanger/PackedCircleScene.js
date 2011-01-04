/**
 * PackedCircleScene
 */
(function() {
	GRAVEDANGER.PackedCircleScene = function() {
		return this;
	};

	GRAVEDANGER.PackedCircleScene.prototype= {// Meta info
		// CAAT Info
		packedCircleManager: null,
		director:	null,
		scene:	null,
		targetDelta: null, // Determined by framerate 16 = 60fps

		// Mouse information
		mousePosition: null,
		isDragging: false,

		// Current info
		gameTick: 0,
		gameClock: 0,
		lastFrameDelta: 0,
		speedFactor: 1, 			// A number where 1.0 means we're running exactly at the desired framerate, 0.5 means half, and of course 2.0 means double
		currentChain: null,
		clockActualTime: null,

		// HUD
		hud: null,

		// GAMEOVER!
		timeLeft: 0,
		timeLeftStart: 45 * 1000,
		timeLeftDepleteRate : 0.001,		// How fast the anchor will decrease, gets faster as game progresses

		// Difficulty progression
		currentMaxHeads: 25,

		init: function(director)
		{
			this.initDirector(director);
			this.initLayers();
			this.initBackground();
			this.initObjectPools();
			this.initCircles();
			this.initMouseEvents();
			this.initIslands();
			this.initHud();
			this.initFinal();

			GRAVEDANGER.SimpleDispatcher.addListener("warWereDeclared", this.onWarWereDeclared, this);
		},

		onWarWereDeclared: function(event, data) {
//		   console.log("(PackedCircleScene)::onWarWereDeclared - Event: '", event, "' | Data :"+ data.circle + " | this:", this);
		},

		/**
		 * Main initilization, creates the packed circle manager
		 * @param director
		 */
		initDirector: function()
		{
			this.director = GRAVEDANGER.CAATHelper.getDirector();
			this.scene = new CAAT.Scene().
				create();

			// store pointer
			GRAVEDANGER.CAATHelper.setScene(this.scene);

			// Collision simulation
			this.packedCircleManager = new CAAT.modules.CircleManager.PackedCircleManager();
			this.packedCircleManager.setBounds(0, 0, this.director.width, this.director.height);
			this.packedCircleManager.setNumberOfCollisionPasses(1);
			this.packedCircleManager.setNumberOfTargetingPasses(0);

			// Add to the director
			this.scene.mouseEnabled = false;
			this.scene.fillStyle = "#000000";
			this.director.addScene(this.scene);
		},

		/**
		 * Creates the layers where objects live
		 * Layers are stored in CAATHelper.layers
		 */
		initLayers: function()
		{
			for(var i = 0; i <= 2; i++)
			{
				var aLayer = new CAAT.ActorContainer().
					create().
					setBounds(0,0, this.director.width, this.director.height);
				this.scene.addChild( aLayer );

				aLayer.mouseEnabled = false;
				GRAVEDANGER.CAATHelper.currentSceneLayers.push( aLayer );
			}
		},

		initBackground: function()
		{
			var imageRef = GRAVEDANGER.director.getImage("gameBackground"),
				conpoundImage = new CAAT.CompoundImage().initialize(imageRef, 1, 1),
				gameDimensions = GRAVEDANGER.CAATHelper.getGameDimensions(),
				backgroundActor = null;

			if( GRAVEDANGER.CAATHelper.getUseCanvas() )
			{
				backgroundActor = new CAAT.SpriteActor().
					create().
					setSpriteImage(conpoundImage)
			} else {
				backgroundActor = new CAAT.CSSActor()
					.createOneday( GRAVEDANGER.CAATHelper.getContainerDiv() )
					.setClassName("actor")
					.setBackground( conpoundImage.image.src )
					.setSize(backgroundActor.width, backgroundActor.height);
			}

			GRAVEDANGER.CAATHelper.currentSceneLayers[0].addChild(backgroundActor)
		},

		initObjectPools: function() {
			this.circlePool = new CAAT.ObjectPool()
				.create('GRAVEDANGER.Circle', false)
				.setPoolConstructor(GRAVEDANGER.Circle)
				.allocate(32);
		},

		/**
		 * Creates the circles which will be used in the scene
		 */
		initCircles: function()
		{
			// Create a bunch of circles!
			var total = 25;

			// temp place groups into array to pull from randomly
			var allColors = [GRAVEDANGER.Circle.prototype.GROUPS.RED, GRAVEDANGER.Circle.prototype.GROUPS.GREEN, GRAVEDANGER.Circle.prototype.GROUPS.BLUE];

			for(var i = 0; i < total; i++)
			{
				// Size
				var aRadius = 18;
				                      //circle.getPackedCircle().position.x
				// Create the circle, that holds our 'CAAT' actor, and 'PackedCircle'
				var circle = this.circlePool.getObject()
					.setColor( GRAVEDANGER.UTILS.randomFromArray( allColors ) )
					.create(aRadius)
					.setFallSpeed( Math.random() * 4 + 1)
					.setLocation( Math.random() * this.director.width, -aRadius )
					.setState( GRAVEDANGER.Circle.prototype.STATES.ACTIVE )
					.setToRandomSpriteInSheet()
					.setDefaultScale(0.6);


				// Add to the collision simulation
				this.packedCircleManager.addCircle( circle.getPackedCircle() );

				// Add actor to the scene
				GRAVEDANGER.CAATHelper.currentSceneLayers[1].addChild( circle.getCAATActor() );

				// Animate in
				GRAVEDANGER.CAATHelper.animateScale(circle.getCAATActor(), this.director.time+Math.random() * 20, 500, 1.0, circle.defaultScale );
			}
		},

		/**
		 * Creates the floating islands where 'circles' are placed
		 */
		initIslands: function()
		{
			// DRY:
			var allColors = [GRAVEDANGER.Circle.prototype.GROUPS.RED, GRAVEDANGER.Circle.prototype.GROUPS.BLUE, GRAVEDANGER.Circle.prototype.GROUPS.GREEN];

			var totalIslands = 2;
			var padding = 150;
			for(var i = 0; i < totalIslands; i++) {
				// Create the circle, that holds our 'CAAT' actor, and 'PackedCircle'
				var island = new GRAVEDANGER.Island()
					.setColor( GRAVEDANGER.UTILS.randomFromArray( allColors ) )
					.create( 120 )
					.setLocation( padding + ((this.director.width - (padding*2)) * i) , this.director.height - 175);

				this.packedCircleManager.addCircle( island.getPackedCircle() );
				GRAVEDANGER.CAATHelper.currentSceneLayers[1].addChild( island.getCAATActor() );

				// The debris must be added after the island is in the scene
				island.createDebrisPieces();
			}
		},

		/**
		 * Creates MouseEvent listeners
		 */
		initMouseEvents: function()
		{
			this.mousePosition = new CAAT.Point(this.director.width/2, this.director.height/2);
			GRAVEDANGER.CAATHelper.setMousePosition(this.mousePosition);

			var that = this;

			// listen for the mouse
			GRAVEDANGER.CAATHelper.getContainerDiv().addEventListener("mousemove", function(e) {
				that.mouseMove(e);
			}, true);

			GRAVEDANGER.CAATHelper.getContainerDiv().addEventListener("mousedown", function(e) {
				that.mouseDown(e);
			}, true);

			window.addEventListener("mouseup", function(e) {
				that.mouseUp(e);
			}, true);
		},


		/**
		 * One final place to do any necessary initialization
		 * It's assumed all other initialization took place and objects exist!
		 */
		initHud: function() {
			this.hud = new GRAVEDANGER.HudController().create();

			var buffer = 5,
				gameDimensions = GRAVEDANGER.CAATHelper.getGameDimensions(),
				timeGauge = this.hud.getTimeGauge();

			// Place the gauge and add it to the HUD layer
			timeGauge.setLocation(gameDimensions.width - timeGauge.getActor().width - (buffer*2), buffer*2);
			GRAVEDANGER.CAATHelper.currentSceneLayers[2].addChild( timeGauge.getActor() );
			GRAVEDANGER.CAATHelper.currentSceneLayers[2].addChild( timeGauge.getMask() );

			// Place and add the score
			var scoreField = this.hud.getScorefield();
			scoreField.setLocation(buffer*2, buffer+3);
			GRAVEDANGER.CAATHelper.currentSceneLayers[2].addChild( scoreField );
		},

		/**
		 * One final place to do any necessary initialization
		 * It's assumed all other initialization took place and objects exist!
		 */
		initFinal: function() {
			// Force all packedCircles to move to the position of their delegates
			this.packedCircleManager.forceCirclesToMatchDelegatePositions();
			this.packedCircleManager.setCallback(this.onCollision, this);
		},

		/**
		 * Final prep-work and start the game loop
		 */
		start: function()
		{
			// Reset temporal info
			this.clockActualTime = new Date().getTime();
			this.gameClock = 0; // Our game clock is relative
			this.gameTick = 0;
			this.timeLeft = this.timeLeftStart;
			// framerate
			this.targetDelta = 30;//Math.round(1000/30);

			var that = this;
			this.director.loop(this.targetDelta, function(director, delta){
				that.loop(director, delta);
			});
		},

		onCollision: function(ci, cj, v)
		{
			if(!this.currentChain)
				return;

			// TODO: Seems hacky, delegate.delegate?
			var circleA = ci.delegate.delegate,
				circleB = cj.delegate.delegate;

			// Check if one of the two objects colliding is the head circle of the chain
			var head = this.currentChain.returnHeadInSet(circleA, circleB);
			if(!head) return; // Neither is the chain head - no good.

			//
			var atLeastOneAdded = this.currentChain.shouldAddLink(circleA) || this.currentChain.shouldAddLink(circleB);

			// do something!
			if(atLeastOneAdded)
				this.onLinkAdded(atLeastOneAdded);
		},

		loop: function(director, delta)
		{
			this.gameTick++;
			this.updateGameClock();

			// Handle anchor
			this.timeLeft -= this.lastFrameDelta;
			if(this.timeLeft > this.timeLeftStart) {
				this.timeLeft = this.timeLeftStart;
			} else if (this.timeLeft < 0) {
//				this.onTimeExpired();
			}
			this.hud.timeGauge.setToScale(this.timeLeft/this.timeLeftStart);

			// Handle current chain
			if(this.currentChain) {
				this.currentChain.chaseTarget(this.mousePosition);
			}

			this.packedCircleManager.handleCollisions();

			var circleList = this.packedCircleManager.allCircles,
				len = circleList.length;
			while(len--)
			{
				var packedCircle = circleList[len];
				var circle = packedCircle.delegate.delegate;

				circle.onTick();
			}
		},

		/**
		 * Updates the internal game clock
		 * Also sets 'speedFactor' a number which we use to base our animations and etc, incase the game is running slightly slower or faster than we intended
		 */
		updateGameClock: function()
		{
			// Store the previous clockTime, then set it to whatever it is no, and compare time
			var oldTime = this.clockActualTime;
			var now = this.clockActualTime = new Date().getTime();
			var delta = ( now - oldTime );			// Note (var framerate = 1000/delta);

			// Our clock is zero based, so if for example it says 10,000 - that means the game started 10 seconds ago
			this.gameClock += delta;

			// Framerate independent motion
			// Any movement should take this value into account,
			// otherwise faster machines which can update themselves more accurately will have an advantage
			var speedFactor = delta / ( this.targetDelta );
			if (speedFactor <= 0) speedFactor = 1;

			this.lastFrameDelta = delta;
			this.speedFactor = speedFactor;
		},

/**
 * User Interaction
 */
		mouseMove: function(e) {

			if(!this.isDragging) return;

			var mouseX = e.clientX - this.director.canvas.offsetLeft;
			var mouseY = e.clientY - this.director.canvas.offsetTop;

			this.mousePosition.set(mouseX, mouseY);
		},

		mouseUp: function(e)
		{
			this.isDragging = false;

			if(this.currentChain) {

				// GHETO TEMPORARY MOTION TEST -
				var linkCount = this.currentChain.getLinks().count();

				this.timeLeft += (linkCount*2) * 2000;
				this.destroyChain(this.currentChain);
				this.currentChain = null;
			}
		},

		mouseDown: function(e) {
			var mouseX = e.clientX - this.director.canvas.offsetLeft;
			var mouseY = e.clientY - this.director.canvas.offsetTop;
			this.mousePosition.set(mouseX, mouseY);

			// Store old one to compare if new
			var newDraggedCircle = this.packedCircleManager.getCircleAt(mouseX, mouseY, 0);

			// Nothing to see here
			if(!newDraggedCircle)
				return;

			// Create a new Chain - we'll let the chain decide if it is valid or not (for example cannot drag
			var possibleChainStart = new GRAVEDANGER.Chain();

			// Looks weird but the "PackedCircle's CircleActor's Circle"!!
			possibleChainStart.shouldAddLink(newDraggedCircle.delegate.delegate);

			// Add the chain if it was considered valid
			if( possibleChainStart.getHead() ) {
				this.currentChain = possibleChainStart;
				this.isDragging = true;
			} else { // Link was considered invalid by the chain, ignore chain instance
				this.destroyChain(possibleChainStart);
			}
		},

		/**
		 * Called whenever a valid link is created, animates the circle to bring attention to it
		 * @param {GRAVEDANGER.Circle} aCircle A circle instance
		 */
		onLinkAdded: function(aCircle) {
			var duration = 200,
				scaleBy = 3;

			// Scale up
			GRAVEDANGER.CAATHelper.animateScale(aCircle.actor, this.director.time, duration, aCircle.defaultScale, aCircle.defaultScale*scaleBy);
			GRAVEDANGER.CAATHelper.animateScale(aCircle.actor, this.director.time+duration, duration, aCircle.defaultScale*scaleBy, aCircle.defaultScale);
		},

		destroyChain: function(aChain) {

			aChain.releaseAll();
			aChain.dealloc();
		},

		/**
		 * Stops then resumes the director loop for X time
		 * @param {Number} duration A pause duration in ms
		 */
		stutterDirector: function(duration)
		{
			clearTimeout(this.stutterTimeout);
			this.director.stop();
			var that = this;
			this.stutterTimeout = setTimeout(function(director, delta){
				that.start();
			}, duration);
		},

/**
 * Memory Management
 */		dealloc: function() {
			this.packedCircleManager.dealloc();

			this.packedCircleManager = null, delete this.mousePosition;
			this.mousePosition = null, delete this.mousePosition;

		}
	}
})();
