"use client";

/**
 * Marcas de plataformas del ecosistema del cliente — redibujadas como SVG
 * con solo el elemento gráfico (sin wordmark): la llama de Hotmart, el rayo
 * de Mastershop y la carita de Dropi. Se usan flotando en la sección de
 * integraciones y en la grilla de ecosistema.
 */

export function HotmartFlame({ className }: { className?: string }) {
  // Llama de tres lenguas con el círculo interior al aire (fill-rule evenodd).
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#FF4E23"
        fillRule="evenodd"
        d="M8.5 29 C8.5 22.5 11 19.5 13 17 C13.8 12.8 14.5 10.6 14.9 8.6 C15.05 6.6 16.35 6.4 16.75 7.4 C17.45 9.8 18.6 12 20 13.6 C20.9 10.2 22.3 6 23.4 3.4 C23.8 2.2 25 2.3 25.2 3.5 C26.4 7 27.5 10.6 28.2 13.8 C29.5 11.9 30.8 9.8 31.9 8.3 C32.4 7.4 33.7 7.8 33.85 8.9 C34.3 11.4 36.2 14.4 37.6 17.6 C39 20.6 39.5 24 39.5 28.5 C39.5 37 32.5 43.5 24 43.5 C15.5 43.5 8.5 37 8.5 29 Z M24 23.4 A6.1 6.1 0 1 0 24 35.6 A6.1 6.1 0 1 0 24 23.4 Z"
      />
    </svg>
  );
}

export function MastershopBolt({ className }: { className?: string }) {
  // Rayo angular con esquinas redondeadas (generado geométricamente).
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#00D64B"
        d="M12.79 3.69 Q13 2 11.91 3.31 L4.09 12.69 Q3 14 4.7 14 L8.3 14 Q10 14 9.79 15.69 L9.21 20.31 Q9 22 10.09 20.69 L17.91 11.31 Q19 10 17.3 10 L13.7 10 Q12 10 12.21 8.31 Z"
      />
    </svg>
  );
}

export function DropiFace({ className }: { className?: string }) {
  // Carita con antena: la marca de Dropi sobre su naranja.
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="13" r="9.4" fill="#FF6A00" />
      <path
        d="M12 4.6 V2.4"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="1.7" r="1.1" fill="#fff" />
      <rect x="7.6" y="9.2" width="2.2" height="4.4" rx="1.1" fill="#fff" />
      <rect x="14.2" y="9.2" width="2.2" height="4.4" rx="1.1" fill="#fff" />
      <path
        d="M8 16.4 Q12 19.4 16 16.4"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
