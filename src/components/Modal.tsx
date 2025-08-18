import React, { Fragment, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string; // tailwind max-w-* class
  dataId?: string; // diagnostic hook for querying in DOM
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidthClass = 'max-w-lg',
  dataId,
}) => {
  // Diagnostics to trace modal lifecycle
  useEffect(() => {
    console.log('[Modal] state change', { isOpen, title });
  }, [isOpen, title]);
  useEffect(() => {
    console.log('[Modal] mounted', { title });
    return () => console.log('[Modal] unmounted', { title });
  }, [title]);
  const portalContainer = useMemo(() => {
    if (typeof document === 'undefined') return null;
    let node = document.getElementById('srt-modal-root');
    if (!node) {
      node = document.createElement('div');
      node.setAttribute('id', 'srt-modal-root');
      document.body.appendChild(node);
    }
    return node;
  }, []);

  const content = (
  <Transition show={isOpen} as={Fragment}>
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-[9999] overflow-y-auto" data-modal-id={dataId} data-modal-title={title || ''}>
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95 translate-y-4"
          enterTo="opacity-100 scale-100 translate-y-0"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100 translate-y-0"
          leaveTo="opacity-0 scale-95 translate-y-4"
        >
          <Dialog.Panel className={`relative w-full ${maxWidthClass} transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-gray-100`}>
            {/* Enhanced Header */}
            {title && (
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  {title}
                </Dialog.Title>
              </div>
            )}
            
            {/* Enhanced Close Button */}
            <button
              className="absolute right-4 top-4 z-10 rounded-xl p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              onClick={onClose}
            >
              <X size={20} />
            </button>
            
            {/* Content Area */}
            <div className="px-6 py-6">
              {/* Scrollable body constrained to viewport */}
              <div className="max-h-[75vh] overflow-y-auto">
                {children}
              </div>
              {footer && (
                // Sticky footer that remains visible while body scrolls
                <div className="sticky bottom-0 left-0 right-0 bg-white pt-4 mt-4 border-t border-gray-100">
                  {footer}
                </div>
              )}
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </Dialog>
  </Transition>
  );

  if (!portalContainer) return content;
  return createPortal(content, portalContainer);
};

export default Modal;
