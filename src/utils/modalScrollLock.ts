// F5.4: Modal portal'ı uygulamanın `overflow-hidden` kabının dışında (document.body)
// durduğu için teker/touch kaydırma zincirleme modalın arkasındaki sayfayı kaydırabildi.
// Sayılı kilit: iç içe modallarda son kilit bırakıldığında gönderim geri alınır.

let lockCount = 0;

/** Bir modal açıkken gövde kaydırmasını kilitler; dönen işlev kilitleri bırakır. */
export function acquireModalScrollLock(): () => void {
  lockCount += 1;
  if (typeof document !== 'undefined' && lockCount === 1) {
    document.documentElement.style.overflow = 'hidden';
  }
  return () => {
    if (lockCount === 0) return;
    lockCount -= 1;
    if (lockCount === 0 && typeof document !== 'undefined') {
      document.documentElement.style.overflow = '';
    }
  };
}

/** Yalnızca test/diagnostik amaçlı aktif kilit sayısı. */
export function modalScrollLockCount(): number {
  return lockCount;
}
