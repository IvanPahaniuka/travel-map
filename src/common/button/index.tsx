import Utils from '../utils';
import './index.css';

import { ButtonHTMLAttributes, DetailedHTMLProps, FC, PropsWithChildren } from 'react';

export type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    color?: 'primary' | 'secondary';
    variant?: 'contained' | 'outlined';
}

export const Button: FC<ButtonProps> = ({ color, variant, className, ...props }) => {

    const colorClassName = ({
        'primary': 'button-primary',
        'secondary': 'button-secondary',
    })[color ?? 'primary'];

    const variantClassName = ({
        'contained': 'button-contained',
        'outlined': 'button-outlined',
    })[variant ?? 'contained'];

    return (
        <button {...props} className={Utils.joinClassNames('button', colorClassName, variantClassName, className)} />
    );
}