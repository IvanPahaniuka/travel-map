const translations = {
	'default': {
		'spotify-auth-dialog-title': 'Spotify Playback',
		'spotify-auth-dialog-message': 'Login to Spotify to enable music playback',
		'spotify-auth-dialog-button-authorize': 'Log in to Spotify',
		'spotify-auth-dialog-button-close': 'Skip for now',

		'settings-dialog-title': 'Settings',
		'settings-spotify-button-authorize': 'Log in',
		'settings-spotify-button-logout': 'Log out',

		'player-widget-track-name-empty': 'No active playback',
		'player-widget-track-name-unknown': 'Unknown track',
	},
	'es': {
		'spotify-auth-dialog-title': 'Reproducción de Spotify',
		'spotify-auth-dialog-message': 'Inicia sesión en Spotify para activar la reproducción de música',
		'spotify-auth-dialog-button-authorize': 'Iniciar sesión en Spotify',
		'spotify-auth-dialog-button-close': 'Omitir por ahora',

		'settings-dialog-title': 'Configuración',
		'settings-spotify-button-authorize': 'Iniciar sesión',
		'settings-spotify-button-logout': 'Cerrar sesión',

		'player-widget-track-name-empty': 'No hay reproducción activa',
		'player-widget-track-name-unknown': 'Pista desconocida',
	},
	'it': {
		'spotify-auth-dialog-title': 'Riproduzione Spotify',
		'spotify-auth-dialog-message': 'Accedi a Spotify per abilitare la riproduzione musicale',
		'spotify-auth-dialog-button-authorize': 'Accedi a Spotify',
		'spotify-auth-dialog-button-close': 'Salta per ora',

		'settings-dialog-title': 'Impostazioni',
		'settings-spotify-button-authorize': 'Accedi',
		'settings-spotify-button-logout': 'Esci',

		'player-widget-track-name-empty': 'Nessuna riproduzione attiva',
		'player-widget-track-name-unknown': 'Brano sconosciuto',
	},
	'ru': {
		'spotify-auth-dialog-title': 'Spotify Музыка',
		'spotify-auth-dialog-message': 'Войдите в Spotify, чтобы включить воспроизведение музыки',
		'spotify-auth-dialog-button-authorize': 'Войти в Spotify',
		'spotify-auth-dialog-button-close': 'Пропустить',

		'settings-dialog-title': 'Настройки',
		'settings-spotify-button-authorize': 'Войти',
		'settings-spotify-button-logout': 'Выйти',

		'player-widget-track-name-empty': 'Нет активного трека',
		'player-widget-track-name-unknown': 'Неизвестный трек',
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

function addPlaces(places = undefined) {

	places?.forEach((place) => {
		add(`place-${place.id}-title`, place.title);
	});

}

const Translations = {
	addPlaces,
	add,
	get,
};


export default Translations;