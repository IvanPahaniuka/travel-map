import Utils from '../utils';
import './index.css';

import { DetailedHTMLProps, FC, HTMLAttributes } from 'react';

export const Loader: FC<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>> = (props) => {
    return <div 
        {...props}
        className={Utils.joinClassNames('loader', props.className)} 
        aria-label={props['aria-label'] ?? 'Loading'} 
    />;
}