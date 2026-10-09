import { Landing } from "@/components/landing/landing";

/**
 * Landing de México. Es el mismo componente (el mercado se detecta en cliente
 * desde la ruta /mx) — crea la página real para que el dev server sirva /mx y
 * el export estático genere out/mx/. El build sigue copiando además el alias
 * plano out/mx.html para Cloudflare Pages (URL sin slash final).
 */
export default function MexicoPage() {
  return <Landing />;
}
