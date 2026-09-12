import './spotify-auth-dialog.css';

import Translations from '../../translations';
import { Dialog } from '../../common/dialog';
import Spotify from '..';
import { FC, useCallback, useEffect, useEffectEvent, useRef } from 'react';
import SpotifyIcons from './spotify-icons';
import { Button } from '../../common/button';
import SpotifyAuthStorage from '../spotify-auth-storage';

export const SpotifyAuthDialog: FC = () => {
	const dialogRef = useRef<HTMLDialogElement>(null);

	const showDialog = useEffectEvent((checkShownAt: boolean) => {
		if (checkShownAt) {
			const shownAt = SpotifyAuthStorage.getAuthDialogShownAt();
			SpotifyAuthStorage.setAuthDialogShownAt(Date.now());
			if (typeof shownAt === 'number' && Date.now() - shownAt < 30 * 60 * 1000) {
				return;
			}
		}

		dialogRef.current?.showModal();
	});

	useEffect(() => {
		Spotify.init().then(r => !r.isAuthorized && showDialog(true));
	}, []);

	const onAuthorizeClick = useCallback(() => {
		Spotify.authorize();
	}, []);

	const onCloseClick = useCallback(() => {
		dialogRef.current?.close();
	}, []);

	return (
		<Dialog
			ref={dialogRef}
			className='spotify-auth-dialog'
			header={<img className='spotify-auth-dialog-logo' alt='Spotify' src={SpotifyIcons.FullLogoGreen} />}
			message={Translations.get('spotify-auth-dialog-message')}
			showCloseButton={false}
			buttons={(
				<>
					<Button
						className='spotify-auth-dialog-button-authorize'
						color='primary'
						variant='contained'
						onClick={onAuthorizeClick}
						children={Translations.get('spotify-auth-dialog-button-authorize')}
					/>

					<Button
						color='secondary'
						variant='outlined'
						onClick={onCloseClick}
						children={Translations.get('spotify-auth-dialog-button-close')}
					/>
				</>
			)}
		/>
	);
};