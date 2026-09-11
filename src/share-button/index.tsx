import './index.css';

import { FC, useCallback } from 'react';
import SettingsStorage, { createShareUrl } from '../settings';
import { ShareOutlinedIcon } from '../common/icons';

export const ShareButton: FC = () => {

    const onClick = useCallback(async () => {
        const shareUrl = createShareUrl(SettingsStorage.getSettings());

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
            children={<ShareOutlinedIcon />}
        />
    );
}