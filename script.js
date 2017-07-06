HandlebarsIntl.registerWith(Handlebars);

$(function() {
	switch (location.hash) {
	case '#blocks':
		window.homeTab = false;
		break;
	default:
		window.homeTab = true;
	}
	var userLang = (navigator.language || navigator.userLanguage) || 'en-US';
	window.intlData = { locales: userLang };

	Notification.requestPermission();

	var statsSource = $("#stats-template").html();
	var statsTemplate = Handlebars.compile(statsSource);
	var blocksSource = $("#blocks-template").html();
	var blocksTemplate = Handlebars.compile(blocksSource);
	refreshStats(statsTemplate, blocksTemplate);

	$('#homeTab').on('click', function() {
		window.homeTab = true;
		refreshStats(statsTemplate, blocksTemplate);
	});
	$('#blocksTab').on('click', function() {
		window.homeTab = false;
		refreshStats(statsTemplate, blocksTemplate);
	});
	setInterval(function() {
		refreshStats(statsTemplate, blocksTemplate);
	}, 5000)
});

function refreshStats(statsTemplate, blocksTemplate) {
	$.getJSON("/stats", function(stats) {
		$("#alert").addClass('hide');

		// Sort miners by ID
		if (stats.miners) {
			stats.miners = stats.miners.sort(compareMiners);
		}
		// Reverse sort blocks by height
		if (stats.blocks) {
			stats.blocks = stats.blocks.sort(compareBlocks);
		}

		var html = null;
		$('.nav-pills > li').removeClass('active');

		if (window.homeTab) {
			html = statsTemplate(stats, { data: { intl: window.intlData } });
			$('.nav-pills > li > #homeTab').parent().addClass('active');
		} else {
			html = blocksTemplate(stats, { data: { intl: window.intlData } });
			$('.nav-pills > li > #blocksTab').parent().addClass('active');
		}
		$('#stats').html(html);

		processNotifications(stats);
	}).fail(function() {
		$("#alert").removeClass('hide');
	});
}

function compareMiners(a, b) {
	if (a.name < b.name)
		return -1;
	if (a.name > b.name)
		return 1;
	return 0;
}

function compareBlocks(a, b) {
	if (a.height > b.height)
		return -1;
	if (a.height < b.height)
		return 1;
	return 0;
}

function processNotifications(stats) {
	if (!window.statsCache) {
		window.statsCache = stats;
		return;
	}

	if (stats.current.accepts > window.statsCache.current.accepts) {
		spawnNotification('New Block', 'New block found');
	}

	if (stats.current.rejects > window.statsCache.current.rejects) {
		spawnNotification('Block Reject', 'Block rejected by daemon');
	}

	if (stats.timedOut > window.statsCache.timedOut) {
		spawnNotification('Worker Offline Alert', 'Worker(s) timed out. Total offline: ' + stats.timedOut);
	}
	window.statsCache = stats;
}

function spawnNotification(title, body) {
	var n = new Notification(title, {
		body: body,
		icon: 'zcash-logo.png'
	});
}
