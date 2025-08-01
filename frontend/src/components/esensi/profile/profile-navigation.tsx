import {
  BadgeInfo,
  CircleUser,
  DoorOpen,
  FileText,
  LibraryBig,
  MapPinHouse,
  MessageCircleMore,
  Search,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import { ProfileButton } from "./profile-button";
import { ProfileLinks } from "./profile-links";
import { ImgThumb } from "../ui/img-thumb";

export const ProfileNavigation = ({
  user = null as any | null,
  loyality = null as any | null,
  loading = true as boolean,
}) => {
  const the_user = {
    avatar: user !== null && user?.avatar ? user.avatar : "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_K_rW_RE87Adt3mgjiLqSPiwTI5LLc8LkhAQ3Qi5xqtudHTuoutzVcloCjiptWUROIM0EWM_eyrfzV6uAx6lhU0ZJRbmbt_JfnZVG9yfRjgnOj3jEUqnQ71piFlOwKbxAibSqthY1Hvv0HyYc1nZb2Yj1Yluqla-_nSZwqzj0zpJLf4PXw9t_3Dd7mj4i/s1600/nouser.png",
    fullname: user !== null && user?.fullname ? user.fullname : "",
    email: user !== null && user?.email ? user.email : "",
  };
  const the_loyality = {
    id: loyality !== null && loyality?.id ? loyality.id : "",
    points: loyality !== null && loyality?.points ? loyality.points : 0,
  };

  const sectionProfilePicture = (
    <div className="flex w-full flex-col items-center justify-start text-[#3B2C93]">
      <ImgThumb src={the_user.avatar} alt={the_user.fullname} className="w-1/4 h-auto aspect-1/1 rounded-full object-center object-cover"/>
      <strong className="font-bold mt-3">{the_user.fullname}</strong>
      <span className="text-xs">{the_user.email}</span>
    </div>
  );

  // Temporarily hidden until loyalty program is implemented
  // const sectionButtonUser = (
  //   <>
  //     <ProfileButton
  //       label={`${the_loyality.points} poin`}
  //       sublabel={the_loyality.id || "GUEST"}
  //       url="#"
  //     ></ProfileButton>
  //   </>
  // );
  const sectionUserMenu = (
    <div className="flex flex-col">
      <ProfileLinks
        label="Profil Saya"
        url="/profile"
        newtab={false}
        icon={<User />}
      ></ProfileLinks>
      <ProfileLinks
        label="Riwayat Transaksi"
        url="/history"
        newtab={false}
        icon={<FileText />}
      ></ProfileLinks>
      <ProfileLinks
        label="Pengiriman"
        url="/shipment"
        newtab={false}
        icon={<Truck />}
      ></ProfileLinks>
      <ProfileLinks
        label="Koleksi Buku"
        url="/library"
        newtab={false}
        icon={<LibraryBig />}
      ></ProfileLinks>
      <ProfileLinks
        label="Alamat Saya"
        url="/address"
        newtab={false}
        icon={<MapPinHouse />}
      ></ProfileLinks>  
      
    </div>
  );
  const sectionSiteLinks = (
    <div className="flex flex-col gap-4">
      <hr className="border-t border-t-[#E1E5EF]" />
      <div className="flex flex-col">
        <ProfileLinks
          label="Customer Support"
          url="#"
          newtab={true}
          icon={<MessageCircleMore />}
        ></ProfileLinks>
        <ProfileLinks
          label="Tentang Esensi"
          url="/about"
          newtab={true}
          icon={<BadgeInfo />}
        ></ProfileLinks>
      </div>
    </div>
  );
  const sectionLogout = (
    <div className="flex flex-col gap-4">
      <hr className="border-t border-t-[#E1E5EF]" />
      <ProfileLinks
        label="Keluar Akun"
        url="/logout"
        newtab={false}
        className="text-[#c6011b]"
        icon={<DoorOpen />}
      ></ProfileLinks>
    </div>
  );

  const renderLoading = <>Memuat profil...</>;
  const renderGuest = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <ProfileButton label="Daftar/Masuk" url="/login"></ProfileButton>
      </div>
      <div className="flex flex-col">
        <ProfileLinks
          label="Belanja"
          url="/"
          newtab={false}
          icon={<ShoppingBag />}
        ></ProfileLinks>
        <ProfileLinks
          label="Cari Buku"
          url="/search"
          newtab={false}
          icon={<Search />}
        ></ProfileLinks>
      </div>
    </div>
  );
  const renderUser = (
    <>
      {sectionProfilePicture}
      {/* sectionButtonUser commented out until loyalty program is implemented */}
      {sectionUserMenu}
    </>
  );

  const renderPage = user !== null && user?.fullname ? renderUser : renderGuest;

  return (
    <>
      {loading ? renderLoading : renderPage}
      {loading ? renderLoading : sectionSiteLinks}
      {!loading && user !== null && user?.fullname && sectionLogout}
    </>
  );
};
export default ProfileNavigation;
