import './index.css';

import { Button } from "../button";
import { DetailedHTMLProps, DialogHTMLAttributes, FC, ReactNode, useCallback, useRef } from 'react';
import Icons from '../icons';
import Utils from '../utils';

export type DialogProps = DetailedHTMLProps<DialogHTMLAttributes<HTMLDialogElement>, HTMLDialogElement> & {
	header?: ReactNode;
	message?: ReactNode;
	buttons?: ReactNode;
	showCloseButton?: boolean;
}

type DialogBaseProps = DetailedHTMLProps<DialogHTMLAttributes<HTMLDialogElement>, HTMLDialogElement> & {
	showCloseButton?: boolean;
} 

const DialogBase: FC<DialogBaseProps> = ({ ref, showCloseButton, className, children, ...props }) => {

	const dialogRef = useRef<HTMLDialogElement>(null);
	const mergedDialogRef = Utils.useMergedRef<HTMLDialogElement>(dialogRef, ref);

	const classNameExtended = ['dialog-content', className]
		.filter(cn => typeof cn === 'string' && cn.length > 0)
		.join(' ');

	const closeDialog = useCallback(() => {
		dialogRef.current?.close();
	}, []);

	return (
		<dialog
			{...props}
			ref={mergedDialogRef}
			className={classNameExtended}
			closedby={props.closedby ?? 'any'}
		>
			{children}

			{showCloseButton === true ? (
				<Button
					className='dialog-content-close-button'
					aria-label='Close dialog'
					onClick={closeDialog}
					children={<Icons.Close />}
				/>
			) : null}
		</dialog>
	);
}

export const Dialog: FC<DialogProps> = ({ header, message, buttons, children, ...props }) => {
	return (
		<DialogBase {...props}>
			<div className='dialog-content-group'>
				{typeof header === 'string' 
					? <h2 className='dialog-header' children={header} />
					: typeof header === 'object'
					? header
					: null
				}
				
				{typeof message === 'string'
					? <p className='dialog-message' children={message} />
					: typeof message === 'object'
					? message
					: null
				}

				{children}

				{buttons 
					? <div className='dialog-buttons-group' children={buttons}/>
					: null
				}
			</div>
		</DialogBase>
	);
}