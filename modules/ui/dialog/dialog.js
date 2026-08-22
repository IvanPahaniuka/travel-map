import DialogContentOnly from "./dialog-content-only.js";
import Button from "../buttons/button.js";

/**
 * @typedef DialogShowResult
 * @type {import("./dialog-content-only.js").DialogShowResult}
 */

/**
 * @typedef ButtonParams
 * @type {import("../buttons/button.js").ButtonParams}
 */

/**
 * @typedef {object} DialogButtonParamsProperties
 * @property {((close: (result: any) => void) => void) | undefined} onClick
 * @typedef {Omit<ButtonParams, keyof DialogButtonParamsProperties> & DialogButtonParamsProperties} DialogButtonParams
 */

/**
 * @typedef {object} DialogParams
 * @property {string | undefined} className
 * @property {HTMLElement | string | undefined} title
 * @property {HTMLElement | string | undefined} message 
 * @property {DialogButtonParams[] | undefined} buttons 
 * @property {boolean | undefined} showCloseButton
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

	const result = DialogContentOnly.show({
		className: params.className,
		showCloseButton: params.showCloseButton,
		content: contentElement,
	});

	close = result.close;

	return result;

	function createTitleElement(/** @type {DialogParams['title']} */ title) {
		if (typeof title === 'string') {
			const element = document.createElement('h2');
			element.className = 'dialog-title';
			element.innerText = title;
			return element;
		} else if (typeof title === 'object') {
			return title;
		} else {
			return null;
		}
	}
	function createMessageElement(/** @type {DialogParams['message']} */ message) {
		if (typeof message === 'string') {
			const element = document.createElement('p');
			element.className = 'dialog-message';
			element.innerText = message;
			return element;
		} else if (typeof message === 'object') {
			return message;
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
		const onClick = params.onClick;
		return Button.createElement({ 
			...params, 
			onClick: typeof onClick === 'function' ? () => onClick(close) : undefined,
		});
	}
}

const Dialog = {
	show,
}

export default Dialog;