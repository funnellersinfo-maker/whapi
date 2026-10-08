export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-white/6 bg-[#040607]">
      <div className="mx-auto max-w-md px-4 pb-28 pt-9 text-center sm:max-w-2xl">
        <p className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-ink/75">
          Julián Alejandro
        </p>
        <p className="mt-1.5 text-[12px] text-dim">
          Automatización comercial con IA · Colombia
        </p>
        <p className="mt-4 text-[11px] text-dim/60">
          © {year}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
