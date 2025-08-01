import { EsensiChapterLayout } from "@/components/esensi/chapter/layout/layout";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { SVGbatasWaktu } from "@/components/esensi/chapter/svg/early/batas-waktu";
import { SVGfooter } from "@/components/esensi/chapter/svg/early/footer";
import { SVGhero } from "@/components/esensi/chapter/svg/early/hero";
import { SVGiconBadge } from "@/components/esensi/chapter/svg/early/icon-badge";
import { SVGiconCopyright } from "@/components/esensi/chapter/svg/early/icon-copyright";
import { SVGiconRocket } from "@/components/esensi/chapter/svg/early/icon-rocket";
import { SVGpenulisPionir } from "@/components/esensi/chapter/svg/early/penulis-pionir";
import { SVGpenulisReguler } from "@/components/esensi/chapter/svg/early/penulis-reguler";
import { SVGtreasureChest } from "@/components/esensi/chapter/svg/early/treasure-chest";
import { EsensiChapterLogo } from "@/components/esensi/chapter/svg/esensi-chapter-logo";
import { ArrowRight } from "lucide-react";
import { SVGarrowDown } from "@/components/esensi/chapter/svg/early/arrow-down";
import { EarlyFooter } from "@/components/esensi/chapter/layout/layout-early-footer";
import { SVGcalendar } from "@/components/esensi/chapter/svg/early/calendar";
import { SVGpionirText } from "@/components/esensi/chapter/svg/early/pionir-text";

export default () => {
  const headingClasses = "text-center text-3xl lg:text-4xl font-bold mb-3";
  const separator = (
    <hr className="esensi-container border-[#8D93CE] opacity-50" />
  );
  const squareWithSvgClasses =
    "relative overflow-visible flex-1 w-full h-auto [&>div]:grow-1 [&>div]:w-full [&>div]:rounded-md [&>div]:border-(--esensi-color-alt) lg:[&>div]:p-6 [&>svg]:absolute [&>svg]:right-0 [&>svg]:bottom-0 [&>svg]:w-auto [&>svg]:h-35 lg:[&>svg]:h-40 lg:[&>svg]:-bottom-2";
  const squareIconBoxClasses =
    "flex-1 flex flex-col justify-start items-center gap-3 w-full h-auto lg:aspect-4/3 border-3 border-(--esensi-color-alt) lg:hover:scale-105 cursor-default transition-all rounded-md p-6 text-center [&>svg]:h-10 lg:[&>svg]:h-13 [&>svg]:w-auto [&>svg]:fill-(--esensi-color-alt) [&>strong]:text-sm [&>p]:text-sm";

  const langkahContents = [
    {
      title: "Daftar & Buat Profil",
      description:
        "Klik tombol daftar dan buat profil seunik karaktermu. Ini seperti menciptakan karakter dalam game!",
    },
    {
      title: "Kirim Naskah Ajaibmu",
      description:
        "Kirim karya terbaikmu. Tim kami sudah siap jatuh cinta dengan ceritamu.",
    },
    {
      title: "Terima Panggilan!",
      description:
        "Jika terpilih, kamu akan menerima surat panggilan eksklusif. Siap-siap memulai babak baru yang luar biasa!",
    },
  ];

  const langkahBoxes = langkahContents.map((langkah, index) => (
    <div
      key={index}
      className="flex-1 flex gap-3 cursor-default [&:hover>.langkah-index]:animate-bounce"
    >
      <div className="langkah-index shrink-0 flex items-center justify-center w-6 h-6 text-white bg-(--esensi-color-alt) rounded-full font-bold">
        {index + 1}
      </div>
      <div className="grow-1 flex flex-col gap-2">
        <h3 className="font-semibold">{langkah.title}</h3>
        <p className="text-sm">{langkah.description}</p>
      </div>
    </div>
  ));

  const socialList = [
    {
      icon: "",
      url: "",
    },
    {
      icon: "",
      url: "",
    },
  ];

  return (
    <EsensiChapterLayout
      enableHeader={false}
      enableFooter={false}
      enableProfileDrawer={false}
    >
      <div className="flex flex-col gap-12 items-center w-full min-h-screen text-(--esensi-color)">
        {/* Header with Logo and Button */}
        <nav className="fixed top-0 left-0 bg-white z-99 lg:relative lg:top-none lg:left-none lg:shadow-none w-full shadow-xs flex justify-center">
          <div className="esensi-container flex justify-between items-center gap-10 h-20">
            <EsensiChapterLogo className="h-10" link={true} />
            <Button variant={"ghost"} asChild>
              <Link href="/penulis-pionir-register" className="esensi-button">
                Gabung Sekarang!
              </Link>
            </Button>
          </div>
        </nav>

        <main className="w-full flex flex-col items-center gap-12 -mb-12 overflow-x-hidden overflow-y-visible">
          {/* Hero Section */}
          <header className="esensi-container z-1 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-0 mt-20 lg:mt-0 lg:-mb-12">
            <div className="w-full flex flex-col items-center lg:items-start space-y-6 lg:w-[50%] lg:shrink-0">
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-center lg:text-left">
                Misi Terbatas:
                <br />
                Jadilah Penulis Pionir
                <br />
                Di{" "}
                <span className="text-(--esensi-color-alt)">
                  Esensi Chapter!
                </span>
              </h1>
              <p>
                Ini adalah panggilan bagi para penjelajah kata yang berani. Para
                penulis dengan mimpi besar dan semangat luar biasa.
              </p>
              <p>
                Bersiaplah meluncurkan karya pertamamu dan nikmati berbagai
                keuntungan eksklusif!
              </p>
              <Button variant={"ghost"} asChild size={"lg"}>
                <Link
                  href="/penulis-pionir-register"
                  className="esensi-button flex"
                >
                  <span>Daftar Sekarang!</span>{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="lg:w-auto lg:grow-1 flex justify-center items-end">
              <SVGhero className="w-full h-auto lg:w-auto h-full" />
            </div>
          </header>

          {separator}

          {/* Mission Section */}
          <div className="esensi-container">
            <div className="w-full lg:max-w-4xl mx-auto text-center">
              <h2 className={headingClasses}>
                Panggilan untuk Para Petualang Kata!
              </h2>
              <p className="mb-8">
                Program "<strong>Penulis Pionir</strong>" adalah
                <br className="lg:hidden" />{" "}
                <strong className="text-(--esensi-color-alt)">
                  misi sekali seumur hidup
                </strong>
                .<br />
                Kami mencari penulis pertama yang siap menjadi fondasi dan wajah
                dari Esensi Chapter.
              </p>

              {/* Mission Timeline */}
              <div className="">
                <h3 className="text-xl font-semibold mb-2 lg:-mt-4">
                  Batas Waktu Misi
                </h3>
                <div className="flex flex-col lg:flex-row lg:items-end">
                  <SVGbatasWaktu className="h-25 w-auto lg:h-auto lg:w-auto lg:max-w-70" />
                  <div className="relative overflow-visible text-left border-3 lg:border-l-0 border-(--esensi-color-alt) rounded-sm py-4 px-6 h-auto">
                    <div className="flex justify-start items-center w-full gap-4">
                      <div className="text-2xl font-extrabold mb-2">
                        PERTENGAHAN AGUSTUS 2025
                      </div>
                    </div>
                    <p>
                      Atau{" "}
                      <span className="underline underline-offset-3">
                        bisa ditutup lebih cepat
                      </span>{" "}
                      jika kuota penulis pionir telah terpenuhi.
                      <br />
                      Jangan menunda, karena kapal petualang tidak akan
                      menunggu!
                    </p>
                    <SVGcalendar className="absolute right-0 top-0 w-15 h-auto translate-x-[50%] -translate-y-[60%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {separator}

          {/* Pricing Comparison */}
          <div className="esensi-container">
            <div className="flex w-full gap-4 lg:gap-8 justify-center items-center">
              <SVGtreasureChest className="h-10 w-auto lg:h-auto lg:w-20 mx-auto lg:mx-0 mb-4" />
              <h2 className={headingClasses}>
                Harta Karun Eksklusif
                <br />
                untuk Para Pionir
              </h2>
              <SVGtreasureChest className="h-10 w-auto lg:h-auto lg:w-20 mx-auto lg:mx-0 mb-4 rotate-y-180" />
            </div>

            <p className="text-xl text-center mb-12">
              Hanya yang bergabung sekarang yang bisa menikmati keuntungan
              paling maksimal!
            </p>

            <div className="flex flex-col lg:flex-row gap-6 justify-stretch lg:justify-between lg:justify-between items-center max-w-3xl mx-auto">
              <div
                className={`${squareWithSvgClasses} relative max-w-lg mx-auto`}
                style={
                  { "--esensi-color-alt": "#b0b0b0" } as React.CSSProperties
                }
              >
                <div className="flex flex-col gap-2 border-2 text-lg text-[#555] p-3">
                  <span className="font-bold">Penulis Regular</span>
                  <ul>
                    <li>60% dari bab terbuka</li>
                    <li>80% dari gift penggemar</li>
                  </ul>
                </div>
                <SVGpenulisReguler />
              </div>
            </div>
          </div>

          {/* Feature Boxes */}

          <div className="esensi-container ">
            <div className={`${squareWithSvgClasses} max-w-3xl mx-auto mb-4 lg:min-h-40`}>
              <div className="flex flex-col lg:flex-row lg:h-40 gap-2 justify-center items-center border-4 pr-3 pl-25">
                <span className="text-6xl font-bold text-(--esensi-color-alt)">
                  90%
                </span>
                <div className="flex flex-col justify-start items-center gap-3">
                  <strong className="text-md lg:text-lg leading-5 font-bold">
                    dari semua gift, dan 80% dari bab.
                    <br />
                    Untukmu Selama Setahun Penuh
                  </strong>
                </div>
                <SVGpionirText className="absolute top-0 left-[50%] -translate-x-[50%] -translate-y-[50%] lg:-translate-x-[80%] w-auto h-8 lg:h-10" />
              </div>
              <SVGpenulisPionir className="left-0 scale-120" />
            </div>
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-6 justify-center max-w-3xl mx-auto">
              <div className={squareIconBoxClasses}>
                <SVGiconRocket />
                <strong>Rocket Promosi</strong>
                <p>
                  Kami bantu promosikan karyamu langsung ke TikTok, Meta,
                  YouTube, dan Google. Siap-siap viral!
                  <br />
                  Plus prioritas seleksi adaptasi novel cetak.
                </p>
              </div>

              <div className={squareIconBoxClasses}>
                <SVGiconBadge />
                <strong>Badge Spesial</strong>
                <p>
                  Tampilkan badge spesial "Pioneer" eksklusif di profilmu—dan
                  karyamu akan jadi sorotan utama.
                </p>
              </div>

              <div className={squareIconBoxClasses}>
                <SVGiconCopyright />
                <strong>Hak Cipta 100% Milikmu</strong>
                <p>
                  Yes, kamu tetap pemilik sah dari seluruh karyamu. Selamanya.
                </p>
              </div>
            </div>
          </div>

          {separator}

          {/* Mission Steps */}
          <div className="esensi-container">
            <h2 className={headingClasses}>Misi Pertamamu: 3 Langkah Mudah!</h2>

            <div className="flex flex-col lg:flex-row gap-7 justify-center max-w-3xl mx-auto mt-12">
              {langkahBoxes}
            </div>
          </div>

          {/* Final CTA */}
          <div className="esensi-container">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto px-6">
              <h2 className={headingClasses}>
                Kapal Petualangan Hampir Berangkat!
              </h2>
              <p className="text-xl mb-8">
                Waktu terbatas. Kursi terbatas. Tapi peluangnya tak terbatas.
                <br />
                Kalau kamu memang penulis yang ditakdirkan untuk jadi pionir,
                ini saatnya!
              </p>
              <Button variant={"ghost"} asChild size={"lg"}>
                <Link
                  href="/penulis-pionir-register"
                  className="esensi-button flex"
                >
                  <span>Amankan kursirmu sekarang</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-sm mt-4">
                Batas Akhir: Pertengahan Agustus (atau lebih cepat!)
              </p>
            </div>
          </div>

          <SVGfooter className="mx-auto w-[80%] h-auto lg:max-w-xl" />
        </main>
        {/* Footer */}

        <EarlyFooter />
      </div>
    </EsensiChapterLayout>
  );
};
