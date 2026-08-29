import SettingsStorage from '../settings/settings-storage.js';

const SHARE_ICON = `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
<path d="M15.2141 7.39294L8.68387 10.6581M8.68387 10.6581C8.19134 9.67492 7.17449 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15C7.17449 15 8.19134 14.3251 8.68387 13.3419M8.68387 10.6581C8.88616 11.0619 9 11.5176 9 12C9 12.4824 8.88616 12.9381 8.68387 13.3419M15.2141 16.6071L8.68387 13.3419M21 6C21 7.65685 19.6569 9 18 9C16.3431 9 15 7.65685 15 6C15 4.34315 16.3431 3 18 3C19.6569 3 21 4.34315 21 6ZM21 18C21 19.6569 19.6569 21 18 21C16.3431 21 15 19.6569 15 18C15 16.3431 16.3431 15 18 15C19.6569 15 21 16.3431 21 18Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

function appendValuesToUrl(/** @type {URL} */ url, /** @type {string} */ paramName, /** @type {string[] | string | null} */ values) {
    const normalizedValues = Array.isArray(values)
        ? values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim())
        : typeof values === 'string' && values.trim()
            ? [values.trim()]
            : [];

    url.searchParams.delete(paramName);
    normalizedValues.forEach((value) => {
        url.searchParams.append(paramName, value);
    });

    return url;
}

function createShareUrl() {
    const shareUrl = new URL(window.location.href);
    const settings = SettingsStorage.getSettings();
    const dataUrls = settings.data.map((entry) => entry.url);
    const encryptionKeys = settings.data.map((entry) => entry.encryption_key);

    appendValuesToUrl(shareUrl, 'data_urls', dataUrls);
    appendValuesToUrl(shareUrl, 'encryption_keys', encryptionKeys);

    return shareUrl.toString();
}

function init() {
    const buttonElement = document.createElement('button');
    buttonElement.className = 'share-button';
    buttonElement.type = 'button';
    buttonElement.setAttribute('aria-label', 'Share');
    buttonElement.title = 'Share';
    buttonElement.innerHTML = SHARE_ICON;
    buttonElement.addEventListener('click', async () => {
        const shareUrl = createShareUrl();

        try {
            if (typeof navigator.share === 'function') {
                await navigator.share({ url: shareUrl });
            } else {
                await navigator.clipboard.writeText(shareUrl);
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }

            console.error('Unable to copy share URL:', error);
            window.prompt('Copy the page link:', shareUrl);
        }
    });

    return buttonElement;
}
const ShareButton = {
    init,
};

export default ShareButton;