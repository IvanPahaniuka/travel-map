
/**
 * @typedef ButtonParams
 * @type {object}
 * @property {string | undefined} className
 * @property {'primary' | 'secondary' | undefined} color
 * @property {'contained' | 'outlined'} variant
 * @property {boolean | undefined} autofocus
 * @property {string | undefined} text
 * @property {HTMLElement | undefined} content
 * @property {(() => void) | undefined} onClick
 */

/**
 * @param {ButtonParams} params 
 * @returns {HTMLButtonElement}
 */
function createElement(params) {
    const buttonElement = document.createElement('button');

    const colorClassName = ({
        'primary': 'button-primary',
        'secondary': 'button-secondary',
    })[params.color ?? 'primary'];

    const variantClassName = ({
        'contained': 'button-contained',
        'outlined': 'button-outlined',
    })[params.variant ?? 'contained'];

    buttonElement.className = ['button', colorClassName, params.className].filter(cn => typeof cn === 'string' && cn.length > 0).join(' ');

    if (params.autofocus === true) {
        buttonElement.autofocus = true;
    }
    
    if (typeof params.onClick === 'function') {
        buttonElement.onclick = () => params.onClick();
    }
    
    if (params.content) {
        buttonElement.appendChild(params.content);
    } else if (params.text) {
        buttonElement.textContent = params.text;
    }

    return buttonElement;
}

const Button = {
    createElement
}

export default Button;