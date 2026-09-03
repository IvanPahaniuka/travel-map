import './index.css';

import { FC, useCallback } from 'react';
import Icons from '../common/icons';
import SettingsStorage from '../settings/settings-storage';

function appendValuesToUrl(url: URL, paramName: string, values: string[] | string | null) {
    const normalizedValues = Array.isArray(values)
        ? values.filter((value) => typeof value === 'string').map((value) => value)
        : typeof values === 'string'
        ? [values]
        : [];

    url.searchParams.delete(paramName);

    normalizedValues.forEach((value) => {
        url.searchParams.append(paramName, value);
    });
}

function createShareUrl(): string {
    const shareUrl = new URL(window.location.href);
    const settings = SettingsStorage.getSettings();
    const dataUrls = settings.data.map((entry) => entry.url);
    const encryptionKeys = settings.data.map((entry) => entry.encryptionKey);

    appendValuesToUrl(shareUrl, 'data_urls', dataUrls);
    appendValuesToUrl(shareUrl, 'encryption_keys', encryptionKeys);

    return shareUrl.toString();
}

export const ShareButton: FC = () => {

    const onClick = useCallback(async () => {
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
    }, []);

    return (
        <button
            className='share-button'
            type='button'
            aria-label='Share'
            title='Share'
            onClick={onClick}
            children={<Icons.Share/>}
        />
    );
}