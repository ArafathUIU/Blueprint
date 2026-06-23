"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, type ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [active, setActive] = useState(pathname);
  const [visible, setVisible] = useState(true);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setVisible(false);
      const t = setTimeout(() => {
        setActive(pathname);
        setVisible(true);
      }, 150);
      prevPathname.current = pathname;
      return () => clearTimeout(t);
    }
  }, [pathname]);

  return (
    <div
      className="transition-opacity duration-150 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
      key={active}
    >
      {children}
    </div>
  );
}
