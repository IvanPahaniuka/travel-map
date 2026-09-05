import { FC, useCallback, useRef } from 'react';
import './settings-button.css';

import { SettingsDialog } from './settings-dialog';
import Icons from '../../common/icons';

export const SettingsButton: FC = () => {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const onClick = useCallback(() => {
        dialogRef.current?.showModal();
    }, []);

    return (
        <>
            <button
                className='settings-button'
                type='button'
                aria-label='Settings'
                title='Settings'
                onClick={onClick}
                children={<Icons.Settings />}
            />
            <SettingsDialog ref={dialogRef} />
        </>
    );
}