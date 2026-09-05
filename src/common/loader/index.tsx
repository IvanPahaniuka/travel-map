import './index.css';

import { DetailedHTMLProps, FC, HTMLAttributes } from 'react';

export const Loader: FC<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>> = (props) => {
    const className = ['loader', props.className].filter(cn => typeof cn === 'string' && cn).join(' ');
    return <div 
        {...props}
        className={className} 
        aria-label={props['aria-label'] ?? 'Loading'} 
    />;
}