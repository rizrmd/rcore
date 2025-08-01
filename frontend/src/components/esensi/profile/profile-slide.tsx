import { ProfileNavigation } from "./profile-navigation";

export const ProfileSlide = ({
    loading = false as boolean,
    open = false as boolean,
    profile = null as any,
    action,
}) => {
    return(
        <>
        <div className={`${open? "flex":"hidden"} w-full h-full fixed top-0 left-0 right-0 bottom-0 bg-black opacity-40 z-59`} onClick={action}></div>
        <div className={`flex flex-col fixed gap-4 py-6 px-8 top-0 right-0 bottom-0 w-[300px] h-full bg-white z-60 transition-transform duration-300 ${open ? "translate-x-0 shadow-[-4px_0_30px_1px_rgba(0,0,0,0.15)]" : "translate-x-full"}`}>
            <ProfileNavigation loading={loading} user={profile?.user} loyality={profile?.loyality} />
        </div>
        </>
    );
};

export default ProfileSlide;
