import { EsensiChapterLogo } from "../svg/esensi-chapter-logo";

export const EarlyFooter = () => {
  return (
    <footer className="flex justify-center w-full text-white bg-(--esensi-color) py-15">
      <div className="esensi-container flex flex-col lg:flex-row items-center gap-20">
        <div className="flex-1 flex justify-center lg:justify-end">
          <EsensiChapterLogo
            className="h-25"
            style={
              {
                "--esensi-color": "var(--esensi-color-i)",
                "--esensi-color-alt": "var(--esensi-color-i)",
              } as React.CSSProperties
            }
          />
        </div>
        <div className="flex-1 flex flex-col text-sm items-center lg:items-start text-center lg:text-left gap-4">
          <p className="max-w-80">
            In every mind there exists an Ocean Door, a hidden gateway to one’s
            subconscious.
          </p>

          <p>©2025 Esensi Chapter by PT Meraih Ilmu Semesta</p>
        </div>
      </div>
    </footer>
  );
};
