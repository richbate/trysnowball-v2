export default function ModalRoot({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}