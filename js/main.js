/**
 * Entry point for the game
 */
(function ()
{
	function onDocumentReady()
	{
		// Always be a good neighbor, remove event listeners, even when superflous
		window.removeEventListener('load', onDocumentReady, false);

//		initConsoleRouter();

//		initStats();
		preloadImages();
	}

	/**
	* Stats
	* Create stats module, and attach to top left
	*/
	function initStats()
	{
		var stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.left = '0px';
		stats.domElement.style.top = '0px';
		document.body.appendChild( stats.domElement );
		setInterval( function () {
			stats.update();
		}, 1000 / 30 );
	}

	/**
	 * Loads all game assets
	 * TODO: Move to own class
	 */
	function preloadImages()
	{
		var base = './images/game/';
		var imagesToLoad = [];

		// HEADS
		imagesToLoad.push({id: "heads" + GRAVEDANGER.Circle.prototype.GROUPS.RED, url: base + "heads_red.png"});
		imagesToLoad.push({id: "heads" + GRAVEDANGER.Circle.prototype.GROUPS.GREEN, url: base + "heads_yellow.png"});
		imagesToLoad.push({id: "heads" + GRAVEDANGER.Circle.prototype.GROUPS.BLUE, url: base + "heads_blue.png"});
		// ISLANDS (left)
		imagesToLoad.push({id: "island" + GRAVEDANGER.Circle.prototype.GROUPS.RED + '0', url: base + "island_red_0.png"});
		imagesToLoad.push({id: "island" + GRAVEDANGER.Circle.prototype.GROUPS.GREEN + '0', url: base + "island_yellow_0.png"});
		imagesToLoad.push({id: "island" + GRAVEDANGER.Circle.prototype.GROUPS.BLUE + '0', url: base + "island_blue_0.png"});
		//ISLANDS (right)
		imagesToLoad.push({id: "island" + GRAVEDANGER.Circle.prototype.GROUPS.RED + '1', url: base + "island_red_1.png"});
		imagesToLoad.push({id: "island" + GRAVEDANGER.Circle.prototype.GROUPS.GREEN + '1', url: base + "island_yellow_1.png"});
		imagesToLoad.push({id: "island" + GRAVEDANGER.Circle.prototype.GROUPS.BLUE + '1', url: base + "island_blue_1.png"});
		// Chains
		imagesToLoad.push({id: "chain" + GRAVEDANGER.Circle.prototype.GROUPS.RED, url: base + "chain_blue.png"});
		imagesToLoad.push({id: "chain" + GRAVEDANGER.Circle.prototype.GROUPS.GREEN, url: base + "chain_blue.png"});
		imagesToLoad.push({id: "chain" + GRAVEDANGER.Circle.prototype.GROUPS.BLUE, url: base + "chain_blue.png"});
		// HUD
		imagesToLoad.push({id: "hud", url: base + "hud/hud.png"});
		imagesToLoad.push({id: "hud_timeleftMasker", url: base + "hud/timeleft_masker.png"});
		// Miscellaneous objects
		imagesToLoad.push({id: "gameBackground", url: base + "gamebackground.png"});
		imagesToLoad.push({id: "colorMonster", url: base + "colormonster.png"});

		// Store
		GRAVEDANGER.CAATHelper.imagePreloader = new CAAT.ImagePreloader();

		// Fired when images have been preloaded
		var that = this;
		GRAVEDANGER.CAATHelper.imagePreloader.loadImages(imagesToLoad,
			function(counter, images)
			{
				// Still need to load more images
				if(counter != images.length)
					return;

				// Images ready!
				onCAATReady();
			});
	}

	function onCAATReady()
	{
		// Game size - focus on iphone
		var gameWidth = 600,
			gameHeight = 750;

		// Dont use canvas if we're on iOS or useCanvas=false has been explicitly set
		GRAVEDANGER.CAATHelper.setUseCanvas( !GRAVEDANGER.CAATHelper.getIsIOS() || window.QueryStringManager.getValue('useCanvas') === 'false' );

		// Pointer to container
		var container = document.getElementById('gameContainer');

		// Initialize CAAT
		GRAVEDANGER.CAATHelper.setContainerDiv(container);	//	Store reference to container div, used when creating events within a scenes
		GRAVEDANGER.CAATHelper.setGameDimensions(gameWidth, gameHeight);

		var director = new CAAT.Director();
		GRAVEDANGER.CAATHelper.setDirector( director );

		// If we aren't using canvas, i believe CAAT is still needs one, so create a canvas that is 1 pixel in size
		if( GRAVEDANGER.CAATHelper.getUseCanvas() ) {
			director.initialize(gameWidth, gameHeight);
			// Add it to the document
			container.appendChild( director.canvas );
		} else {
			director.initializeNoCanvas(gameWidth, gameHeight);
		}

		// Place image cache back into director
		director.imagesCache = GRAVEDANGER.CAATHelper.imagePreloader.images;
		CAAT.GlobalDisableEvents();

		GRAVEDANGER.CAATHelper.initTouchEventRouter();		//	Map touch events to mouse events

		// Create the GameScene
		var GameScene = new GRAVEDANGER.GameScene();
		GameScene.init();

		// Start it up
		GameScene.start();
	}

	/**
	 * Catches calls to console::* to prevent errors
	 */
	function initConsoleRouter()
	{
		if(window.console) return;

		var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
			"group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

		window.console = {};
		for (var i = 0; i < names.length; ++i)
			window.console[names[i]] = function() {}
	}

	// Listen for browser ready
	window.addEventListener('load', onDocumentReady, false);
})();