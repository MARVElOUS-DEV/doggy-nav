import router from 'next/router';
import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const content = document.getElementById('doggy-content-area');
    if (!content) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setProgress(
          Math.min(1, content.scrollTop / Math.max(1, content.scrollHeight - content.clientHeight))
        );
      });
    };
    const reset = () => {
      content.scrollTop = 0;
      update();
    };
    const observer = new ResizeObserver(update);

    update();
    content.addEventListener('scroll', update, { passive: true });
    router.events.on('routeChangeComplete', reset);
    observer.observe(content);
    if (content.firstElementChild) observer.observe(content.firstElementChild);

    return () => {
      cancelAnimationFrame(frame);
      content.removeEventListener('scroll', update);
      router.events.off('routeChangeComplete', reset);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      className="h-1 w-full overflow-hidden bg-theme-border"
    >
      <div
        className="h-full origin-left bg-theme-primary"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
