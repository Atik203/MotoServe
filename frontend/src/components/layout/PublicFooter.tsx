export function PublicFooter() {
  return (
    <footer className="border-t border-[#e2e8f0] bg-[#edeeef]">
      <div className="mx-auto flex w-full max-w-[1280px] items-start justify-center gap-[24px] px-[32px] pt-[49px] pb-[48px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
          <span className="text-[20px] font-bold text-primary">MotoServe</span>
          <p className="text-[14px] leading-[20px] text-muted-foreground">
            Professional vehicle servicing
            <br />
            management for modern workshops.
          </p>
          <p className="pt-[8px] text-[14px] text-muted-foreground">© 2026 MotoServe Systems. All rights reserved.</p>
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
          <div key={col.title} className="flex min-w-0 flex-1 flex-col gap-[16px] pb-[68px]">
            <h4 className="text-[12px] font-semibold tracking-[0.24px] text-foreground">{col.title}</h4>
            <ul className="flex flex-col gap-[8px]">
              {col.items.map((item, i) => (
                <li key={item} className={i === 0 ? "text-[14px] text-muted-foreground underline underline-offset-2" : "text-[14px] text-muted-foreground"}>
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
