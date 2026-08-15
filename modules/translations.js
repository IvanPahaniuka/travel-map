import Place from './place/place.js';

const translations = {
	'default': {
		'spotify-dialog-title': 'Spotify Playback',
		'spotify-dialog-message': 'Login to Spotify to enable music playback',
		'spotify-dialog-button': 'Login to Spotify',

		'player-widget-track-title-empty': 'No active playback',
		'player-widget-track-title-unknown': 'Unknown track',
	},
	'ru': {
		'spotify-dialog-title': 'Spotify Музыка',
		'spotify-dialog-message': 'Войдите в Spotify, чтобы включить воспроизведение музыки',
		'spotify-dialog-button': 'Войти в Spotify',

		'player-widget-track-title-empty': 'Нет активного трека',
		'player-widget-track-title-unknown': 'Неизвестный трек',
	},
};

function getPreferredLanguage() {
	const lang = navigator.language || navigator.userLanguage || 'default';
	const short = lang.split('-')[0];
	return translations[short] ? short : 'default';
}

function get(key, language = undefined) {
	language = language || getPreferredLanguage();
	return (translations[language] ?? translations['default'])[key] ?? translations['default'][key] ?? '';
}

function apply() {
	const language = getPreferredLanguage();

	Object.keys(translations['default']).forEach((key) => {
		const translation = get(key, language);
		const elements = document.getElementsByClassName(key);
		if (elements) {
			for (let i = 0; i < elements.length; i++) {
				elements[i].textContent = translation;
			}
		}
	});
}

function add(key, value, language = undefined) {
	if (typeof value === 'string') {
		language = language || 'default';
		translations[language] = translations[language] ?? {};
		translations[language][key] = value;
	} else if (typeof value === 'object') {
		Object.keys(value).forEach((lang) => {
			if (language !== undefined && language !== lang) return;
			translations[lang] = translations[lang] ?? {};
			translations[lang][key] = value[lang];
		});
	}
}

function init(places = undefined) {

	places?.forEach((place) => {
		add(Place.getTitleClassName(place.id), place.title);
	});

	try {
		window.removeEventListener('languagechange', apply);
	} catch (e) { /* ignore */ }

	if ('onlanguagechange' in window) {
		window.addEventListener('languagechange', apply);
	}

	apply();
}

const Translations = {
	init,
	apply,
	add,
	get,
};


export default Translations;