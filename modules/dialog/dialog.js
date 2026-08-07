let dialogInstance = null;

function createOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  overlay.classList.add('dialog-hidden');
  document.body.appendChild(overlay);
  return overlay;
}

function createDialog({
  title,
  titleClassName = undefined,
  message,
  messageClassName = undefined,
  buttonClassName = undefined,
  buttonLabel,
  buttonLabelClassName = undefined,
  onButtonClick,
  onClose = undefined,
}) {
  if (dialogInstance) {
    throw new Error('A dialog is already open. Close it before creating a new one.');
  }

  const overlay = createOverlay();
  const dialog = document.createElement('div');
  dialog.className = 'dialog-content';
  dialog.innerHTML = `
    <h2${ titleClassName ? ` class="${titleClassName}"` : '' }>${title}</h2>
    <p${ messageClassName ? ` class="${messageClassName}"` : '' }>${message}</p>
    <button type="button" class="dialog-button${ buttonClassName ? ` ${buttonClassName}` : '' }">
        <span ${ buttonLabelClassName ? ` class="${buttonLabelClassName}"` : '' }>${buttonLabel}</span>
    </button>
  `;

  const button = dialog.querySelector('.dialog-button');
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    if (typeof onButtonClick === 'function') {
      onButtonClick();
    }
  });

  overlay.addEventListener('click', (event) => {
    if (event.target !== overlay) return;
    if (typeof onClose === 'function') {
      onClose();
    }
    closeDialog();
  });

  overlay.appendChild(dialog);

  function openDialog() {
    overlay.classList.remove('dialog-hidden');
  }

  function closeDialog() {
    overlay.classList.add('dialog-hidden');
  }

  dialogInstance = { element: overlay, open: openDialog, close: closeDialog };
  return dialogInstance;
}

const Dialog = {
  create: createDialog,
}

export default Dialog;
