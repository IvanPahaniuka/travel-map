import showWithContentOnly from "./dialog-content-only.js";

/**
 * @typedef DialogShowResult
 * @type {import("./dialog-content-only.js").DialogShowResult}
 */

/**
 * @typedef DialogButtonParams
 * @type {object}
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
		createButtonsElement(params.buttons),
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
	function createButtonsElement(/** @type {DialogButtonParams[] | undefined} */ buttons) {
		buttons = Array.isArray(buttons)
			? buttons.filter(b => typeof b === 'object')
			: [];

		if (buttons.length > 0) {
			const groupElement = document.createElement('div');
			groupElement.className = 'dialog-buttons-group';
			buttons.forEach(b => {
				const buttonElement = document.createElement('button');
				buttonElement.className = 'dialog-button';
				buttonElement.textContent = b.content;
				if (typeof b.onClick === 'function') {
					buttonElement.onclick = () => b.onClick(close);
				}
				groupElement.appendChild(buttonElement);
			});
			return groupElement;
		} else {
			return null;
		}
	}
}

const Dialog = {
	show,
}

export default Dialog;