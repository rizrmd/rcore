import { useLocal } from "@/lib/hooks/use-local";
import type CSS from "csstype";

export const BannerSlider = ({ data: any }) => {
  const local = useLocal(
    {
      loading: false as boolean,
      list: [
        {
          img: "https://placehold.co/800x400/FF5733/FFFFFF?text=Slide+1",
          title: "Welcome to Our Showcase!",
          content:
            "Discover amazing products and services tailored just for you.",
          btn_label: "Explore Now",
          btn_url: "#explore1",
        },
        {
          img: "https://placehold.co/800x400/33FF57/000000?text=Slide+2",
          title: "Limited Time Offer!",
          content:
            "Don't miss out on our exclusive deals, available for a short period.",
          btn_label: "Shop Today",
          btn_url: "#shop2",
        },
        {
          img: "https://placehold.co/800x400/3357FF/FFFFFF?text=Slide+3",
          title: "Join Our Community",
          content:
            "Become a part of our growing family and enjoy special perks.",
          btn_label: "Sign Up",
          btn_url: "#signup3",
        },
        {
          img: "https://placehold.co/800x400/FF33E9/000000?text=Slide+4",
          title: "Innovate with Us",
          content: "We're constantly pushing boundaries. See what's new!",
          btn_label: "Learn More",
          btn_url: "#learn4",
        },
      ] as any,
      enableNavigation: true as boolean,
      enableDots: true as boolean,
      enableTransition: true as boolean,
      currentIndex: 0 as number,
      translateX: 0 as number,
      transitionDuration: 500 as number,
    },
    async () => {
      local.enableNavigation = local.list.length > 1 ? true : false;
      local.render();
    }
  );

  const slideCSS: CSS.Properties = {
      transform: `translateX(-${local.translateX}%)` as string,
    };

  const displaySlides =
    local.list.length > 1
      ? local.list
      : [local.list[local.list.length - 1], ...local.list, local.list[0]];

  const changeTranslate = () => {
    local.translateX = local.currentIndex * 100;
    local.render();
    alert(local.currentIndex);
    alert(local.translateX);
    handleTransitionEnd();
  };
  const nextSlide = (e:any) => {
    e.preventDefault();
    local.currentIndex = local.currentIndex + 1;
    local.render();
    changeTranslate();
  };
  const prevSlide = (e:any) => {
    e.preventDefault();
    local.currentIndex = local.currentIndex - 1;
    local.render();
    changeTranslate();
  };
  const goToSlide = (index: number) => {
    local.currentIndex = index;
    local.render();
    changeTranslate();
  };

  const handleTransitionEnd = () => {
    if (local.currentIndex === 0) {
      // If we've transitioned to the cloned last slide (at the beginning)
      local.transitionDuration = 0; // Turn off animation
      local.render();
      local.currentIndex = local.list.length; // Jump to the real last slide
      local.render();

      // Force a re-render and then re-enable the transition
      setTimeout(() => (local.currentIndex = 0.5), 50);
    }

    if (local.currentIndex === displaySlides.length - 1) {
      // If we've transitioned to the cloned first slide (at the end)
      local.transitionDuration = 0; // Turn off animation
      local.render(); // Turn off animation
      local.currentIndex = 1; // Jump to the real first slide
      local.render();
      setTimeout(() => (local.currentIndex = 0.5), 50);
    }
  };

  const renderSlidesItem = displaySlides.map((slide, index) => (
    <div className="slide w-full h-full" key={index}>
      <img className="w-full h-full" src={slide.img} alt={slide.title} />
    </div>
  ));

  const renderNavigation = local.enableNavigation && (
    <div className="flex px-6 gap-6">
      <button className="nav-button prev cursor-pointer" onClick={prevSlide}>
        Prev
      </button>
      <button className="nav-button next cursor-pointer" onClick={nextSlide}>
        Next
      </button>
    </div>
  );

  const renderSlides = (
    <div
      className={`slideshow-inner relative flex transition-transform duration-500 ease-in-out [&>div]:min-w-full [&>div]:relative`}
      onTransitionEnd={handleTransitionEnd}
      style={slideCSS}
    >
      {renderSlidesItem}
    </div>
  );

  return (
    <div className="slideshow-container flex flex-col w-[800px] h-auto relative overflow-hidden">
      {renderSlides}
      {renderNavigation}
    </div>
  );
};

export default BannerSlider;
