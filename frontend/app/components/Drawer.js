// app/components/Drawer.js
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline'; // เปลี่ยน XIcon เป็น XMarkIcon

export default function Drawer({ isOpen, onClose }) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-40 overflow-hidden" onClose={onClose}>
        <div className="absolute inset-0 bg-black opacity-30" aria-hidden="true" />
        <div className="fixed inset-y-0 left-0 flex max-w-full pr-10">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-300"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative w-screen max-w-sm bg-white">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="p-4">
                {/* เพิ่มลิงก์หรือลิสต์เมนูที่นี่ */}
                <ul>
                  <li className="py-2"><a href="#link1">Link 1</a></li>
                  <li className="py-2"><a href="#link2">Link 2</a></li>
                  <li className="py-2"><a href="#link3">Link 3</a></li>
                </ul>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
