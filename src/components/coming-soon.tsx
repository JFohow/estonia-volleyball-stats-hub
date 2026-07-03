export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <div className="inline-block rounded-full bg-estonia-blue/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-estonia-blue">
        Coming soon
      </div>
      <h1 className="mt-6 font-display text-5xl uppercase italic text-estonia-dark">{title}</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </section>
  );
}
