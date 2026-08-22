/**
 * @typedef DialogContentOnlyParams
 * @type {object}
 * @property {string | undefined} className
 * @property {boolean | undefined} showCloseButton
 * @property {HTMLElement | undefined} content 
 */

/**
 * @typedef DialogShowResult
 * @type {object}
 * @property {Promise<any>} promise
 * @property {(result: any) => void} close
 * @property {HTMLDialogElement} element
 */

const CLOSE_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L18 18M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>`;

/**
 * @function
 * @param {DialogContentOnlyParams} params 
 * @returns {DialogShowResult}
 */
function show(params) {
  const removeElementTimeout = 5 * 1000;

  const dialogElement = document.createElement('dialog');
  dialogElement.className = ['dialog-content', params.className].filter(cn => typeof cn === 'string' && cn.length > 0).join(' ');
  dialogElement.closedBy = 'any';
  if (params.content) {
    dialogElement.appendChild(params.content);
  }
  if (params.showCloseButton !== false) {
    const closeButtonElement = createCloseButtonElement();
    dialogElement.appendChild(closeButtonElement);
  }

  document.body.appendChild(dialogElement);

  let close;
  let resultObj;
  const promise = new Promise((resolve, reject) => {
    close = (result) => {
      resultObj = result;
      dialogElement.close();
      setTimeout(() => {
        document.body.removeChild(dialogElement);
      }, removeElementTimeout);
    };
    dialogElement.onclose = () => {
      resolve(resultObj); 
    };
  });

  /** @type {DialogShowResult} */
  const result = {
    promise,
    close,
    element: dialogElement
  };

  dialogElement.showModal();

  return result;

  function createCloseButtonElement() {
    const closeButtonElement = document.createElement('button');
    closeButtonElement.className = 'dialog-content-close-button';
    closeButtonElement.setAttribute('aria-label', 'Close dialog');
    closeButtonElement.innerHTML = CLOSE_ICON;
    closeButtonElement.addEventListener('click', () => close());

    return closeButtonElement;
  }
}

const DialogContentOnly = {
  show,
};

export default DialogContentOnly;
