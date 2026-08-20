import showWithContentOnly from "./dialog-content-only.js";

/**
 * @typedef DialogShowResult
 * @type {import("./dialog-content-only.js").DialogShowResult}
 */

/**
 * @typedef DialogButtonParams
 * @type {object}
 * @property {string | undefined} className
 * @property {'primary' | 'secondary' | undefined} type
 * @property {boolean | undefined} autofocus
 * @property {string | undefined} content
 * @property {((close: (result: any) => void) => void) | undefined} onClick
 */

/**
 * @typedef DialogParams
 * @type {object}
 * @property {string | undefined} className
 * @property {string | undefined} title
 * @property {string | undefined} message 
 * @property {DialogButtonParams[] | undefined} buttons 
 * @property {HTMLElement | undefined} content
 */

/**
 * @function
 * @param {DialogParams} params 
 * @returns {DialogShowResult}
 */
function show(params) {

	let close;

	const elements = [
		createTitleElement(params.title),
		createMessageElement(params.message),
		params.content,
		createButtonsGroupElement(params.buttons),
	].filter(e => e);

	let contentElement;
	if (elements.length === 1 && params.content) {
		contentElement = params.content;
	} else {
		const contentGroupElement = document.createElement('div');
		contentGroupElement.className = 'dialog-content-group';
		contentGroupElement.append(...elements);
		contentElement = contentGroupElement;
	}

	const result = showWithContentOnly({
		className: params.className,
		content: contentElement,
	});

	close = result.close;

	return result;

	function createTitleElement(title) {
		if (typeof title === 'string') {
			const element = document.createElement('h2');
			element.className = 'dialog-title';
			element.innerText = title;
			return element;
		} else {
			return null;
		}
	}
	function createMessageElement(message) {
		if (typeof message === 'string') {
			const element = document.createElement('p');
			element.className = 'dialog-message';
			element.innerText = message;
			return element;
		} else {
			return null;
		}
	}
	function createButtonsGroupElement(/** @type {DialogButtonParams[] | undefined} */ buttons) {
		buttons = Array.isArray(buttons)
			? buttons.filter(b => typeof b === 'object')
			: [];

		if (buttons.length > 0) {
			const groupElement = document.createElement('div');
			groupElement.className = 'dialog-buttons-group';

			const autofocusButtonParams = 
				buttons.find(b => b.autofocus === true)
				|| buttons.find(b => b.type === 'primary' && b.autofocus !== false)
				|| buttons.find(b => b.autofocus !== false);
			
			buttons.forEach(b => {
				const buttonElement = createButtonElement({ ...b, autofocus: autofocusButtonParams === b });
				groupElement.appendChild(buttonElement);
			});
			return groupElement;
		} else {
			return null;
		}
	}
	function createButtonElement(/** @type {DialogButtonParams} */ params) {
		const buttonElement = document.createElement('button');

		const typeClassName = ({
			'primary': 'dialog-button-primary',
			'secondary': 'dialog-button-secondary',
		})[params.type];

		buttonElement.className = ['dialog-button', typeClassName, params.className].filter(cn => typeof cn === 'string' && cn.length > 0).join(' ');
		buttonElement.textContent = params.content;

		if (params.autofocus === true) {
			buttonElement.autofocus = true;
		}
		
		if (typeof params.onClick === 'function') {
			buttonElement.onclick = () => params.onClick(close);
		}

		return buttonElement;
	}
}

const Dialog = {
	show,
}

export default Dialog;