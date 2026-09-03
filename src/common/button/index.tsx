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

    const classNameExtended = ['button', colorClassName, variantClassName, className]
        .filter(cn => typeof cn === 'string' && cn.length > 0)
        .join(' ');

    return (
        <button {...props} className={classNameExtended} />
    );
}