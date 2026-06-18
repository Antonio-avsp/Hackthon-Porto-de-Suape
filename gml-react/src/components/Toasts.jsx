import React from 'react';
import { useStore } from '../store.jsx';

export default function Toasts() {
  const { toasts } = useStore();
  return (
    <>
      {toasts.map((t, i) => (
        <div className="toast" key={t.id} style={{ bottom: 22 + i * 50 }}>{t.msg}</div>
      ))}
    </>
  );
}
