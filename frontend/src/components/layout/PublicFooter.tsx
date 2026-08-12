export function PublicFooter() {
  return (
    <footer className="border-t border-[#e2e8f0] bg-[#edeeef]">
      <div className="mx-auto flex w-full max-w-7xl items-start justify-center gap-6 px-8 pt-[49px] pb-12">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <span className="text-xl font-bold text-primary">MotoServe</span>
          <p className="text-sm leading-5 text-muted-foreground">
            Professional vehicle servicing
            <br />
            management for modern workshops.
          </p>
          <p className="pt-2 text-sm text-muted-foreground">© 2026 MotoServe Systems. All rights reserved.</p>
        </div>

        {[
          {
            title: "Legal",
            items: ["Privacy Policy", "Terms of Service"],
          },
          {
            title: "Resources",
            items: ["Vehicle Database", "API Docs"],
          },
          {
            title: "Contact",
            items: ["Contact Support", "Mon-Fri: 8AM - 6PM"],
          },
        ].map((col) => (
          <div key={col.title} className="flex min-w-0 flex-1 flex-col gap-4 pb-17">
            <h4 className="text-xs font-semibold tracking-[0.24px] text-foreground">{col.title}</h4>
            <ul className="flex flex-col gap-2">
              {col.items.map((item, i) => (
                <li key={item} className={i === 0 ? "text-sm text-muted-foreground underline underline-offset-2" : "text-sm text-muted-foreground"}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
