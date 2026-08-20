/**
 * @typedef DialogContentOnlyParams
 * @type {object}
 * @property {string | undefined} className
 * @property {HTMLElement | undefined} content 
 */

/**
 * @typedef DialogShowResult
 * @type {object}
 * @property {Promise<any>} promise
 * @property {(result: any) => void} close
 * @property {HTMLDialogElement} element
 */

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
}

const DialogContentOnly = {
  show,
}

export default show;
