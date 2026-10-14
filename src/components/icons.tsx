import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

function Bungkus({ children, ...props }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IkonDashboard = (p: Props) => (
  <Bungkus {...p}>
    <rect width="7" height="9" x="3" y="3" rx="1.5" />
    <rect width="7" height="5" x="14" y="3" rx="1.5" />
    <rect width="7" height="9" x="14" y="12" rx="1.5" />
    <rect width="7" height="5" x="3" y="16" rx="1.5" />
  </Bungkus>
);

export const IkonKemeja = (p: Props) => (
  <Bungkus {...p}>
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23Z" />
  </Bungkus>
);

export const IkonKeranjang = (p: Props) => (
  <Bungkus {...p}>
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M2 3h2.2l2.6 12.1a2 2 0 0 0 2 1.6h9.2a2 2 0 0 0 2-1.6L21.6 7H5.2" />
  </Bungkus>
);

export const IkonStruk = (p: Props) => (
  <Bungkus {...p}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4M9 12h6M9 16h6" />
  </Bungkus>
);

export const IkonGrafik = (p: Props) => (
  <Bungkus {...p}>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="M7 15v-3M12 15V8M17 15v-6" />
  </Bungkus>
);

export const IkonKeluar = (p: Props) => (
  <Bungkus {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </Bungkus>
);

export const IkonCari = (p: Props) => (
  <Bungkus {...p}>
    <circle cx="11" cy="11" r="7.5" />
    <path d="m21 21-4.3-4.3" />
  </Bungkus>
);

export const IkonTambah = (p: Props) => (
  <Bungkus {...p}>
    <path d="M5 12h14M12 5v14" />
  </Bungkus>
);

export const IkonHapus = (p: Props) => (
  <Bungkus {...p}>
    <path d="M3 6h18M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6M18.5 6 18 19.5A1.5 1.5 0 0 1 16.5 21h-9A1.5 1.5 0 0 1 6 19.5L5.5 6" />
    <path d="M10 11v5M14 11v5" />
  </Bungkus>
);

export const IkonTutup = (p: Props) => (
  <Bungkus {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Bungkus>
);

export const IkonMenu = (p: Props) => (
  <Bungkus {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Bungkus>
);

export const IkonUbah = (p: Props) => (
  <Bungkus {...p}>
    <path d="M21.2 6.8a2 2 0 0 0-3-3L3.8 16.2a2 2 0 0 0-.5.8l-1.3 4.4a.5.5 0 0 0 .6.6l4.4-1.3a2 2 0 0 0 .8-.5Z" />
    <path d="m15 5 4 4" />
  </Bungkus>
);

export const IkonCek = (p: Props) => (
  <Bungkus {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Bungkus>
);

export const IkonPeringatan = (p: Props) => (
  <Bungkus {...p}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </Bungkus>
);

export const IkonKotak = (p: Props) => (
  <Bungkus {...p}>
    <path d="m7.5 4.3 9 5.1M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
  </Bungkus>
);

export const IkonOrang = (p: Props) => (
  <Bungkus {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Bungkus>
);

export const IkonPanahKanan = (p: Props) => (
  <Bungkus {...p}>
    <path d="m9 6 6 6-6 6" />
  </Bungkus>
);

export const IkonKalender = (p: Props) => (
  <Bungkus {...p}>
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Bungkus>
);