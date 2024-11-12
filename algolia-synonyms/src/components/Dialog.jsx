import { useEffect, useRef } from 'react';

const Dialog = ({open, onClose, children}) => {
  const ref = useRef();

  useEffect(() => {
    if (open) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={onClose}
    >
      {children}
      <button className="absolute right-2 top-2 border rounded p-1" onClick={onClose}>
        X
      </button>
    </dialog>
  );
};

export default Dialog;
