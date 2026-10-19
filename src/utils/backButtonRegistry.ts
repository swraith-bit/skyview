// F5.3: Donanım (Android) geri tuşu, uygulama navigasyonuna düşmeden önce
// açılmış en üstteki modalı kapatır. Modal overlay'ler açıkken kaydolur;
// App.tsx artık kapat düğmelerini DOM'dan (`document.getElementById`) sorgulamaz.
// Yalnızca istemci yolu: worker'a giren bir modül değil.
export type ModalCloseHandler = () => void;

const modalStack: ModalCloseHandler[] = [];

/**
 * Açık bir modalı geri tuşu yığınına kaydeder. Dönen işlev kaydı kaldırır;
 * StandardModal/için `useModalBackHandler` bunu effect-clean yapar.
 */
export function registerModalForBack(close: ModalCloseHandler): () => void {
  modalStack.push(close);
  return () => {
    const index = modalStack.lastIndexOf(close);
    if (index !== -1) modalStack.splice(index, 1);
  };
}

/**
 * Yığının tepesini alır (pop) ve kapatır; ele alınan modal varsa `true`, yoksa
 * `false` döndürür (App.tsx bu durumda sekmeler/uygulama-çıkış akışına devam eder).
 * Pop semantiği, ikinci bir geri tuşunun aynı modalı tekrar kapatmasını ve
 * kapanmayan kayıtların yığını kilitlemesini engeller.
 */
export function consumeBackButtonModal(): boolean {
  const close = modalStack.pop();
  if (!close) return false;
  close();
  return true;
}

/** Yalnızca test/diagnostik amaçlı yığın uzunluğu. */
export function modalBackStackSize(): number {
  return modalStack.length;
}
