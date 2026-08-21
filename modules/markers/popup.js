import Translations from "../translations.js";

let glightboxInstance = null;

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function buildGallery(place, maxThumbs = 4) {
	if (!Array.isArray(place.gallery) || place.gallery.length === 0) return '';
	const visible = place.gallery.slice(0, maxThumbs);
	const hidden = place.gallery.slice(maxThumbs);

	const visibleHtml = visible
		.map((url) => {
			const href = escapeHtml(url);
			return `<a href="${href}" class="glightbox" data-gallery="place-${place.id}-gallery"><img src="${href}" alt="img"></a>`;
		})
		.join('');

	const hiddenHtml = hidden
		.map((url) => {
			const href = escapeHtml(url);
			return `<a href="${href}" class="glightbox hidden" data-gallery="place-${place.id}-gallery"></a>`;
		})
		.join('');

	return `<div class="popup-gallery">${visibleHtml}${hiddenHtml}</div>`;
}

function buildContent(place) {

	const date = new Date(place.date);
	const formattedDate = Number.isNaN(date.valueOf())
		? ''
		: new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date);

	const galleryHtml = buildGallery(place);

	return `
    <div class="popup-card">
      <div class="popup-header">
        <h2 class="popup-title">${Translations.get(`place-${place.id}-title`)}</h2>
        ${formattedDate ? `<span class="popup-date">${formattedDate}</span>` : ''}
      </div>
      <div class="popup-body">
        ${galleryHtml}
      </div>
    </div>
  `;
}

function init(map) {

	map.on('popupopen', (e) => {
		if (typeof GLightbox !== 'function') return;
		if (!glightboxInstance) {
			glightboxInstance = GLightbox({ selector: '.glightbox' });
		} else if (typeof glightboxInstance.reload === 'function') {
			glightboxInstance.reload();
		}
	});

}

const Popup = {
    init,
    buildContent,
}

export default Popup;