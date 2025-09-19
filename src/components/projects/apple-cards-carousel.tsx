"use client";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image, { type ImageProps } from "next/image";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type Card = {
  src?: string;
  title: string;
  category: string;
  description?: string;
  content: React.ReactNode;
  gradient?: string;
};

export const CarouselContext = createContext<{
  onCardClose: (index: number) => void;
  currentIndex: number;
}>({
  onCardClose: () => {},
  currentIndex: 0,
});

export const Carousel = ({
  items,
  initialScroll = 0,
}: {
  items: React.ReactNode[];
  initialScroll?: number;
}) => {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll]);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const getScrollDistance = () => {
    const cardWidth = 448; // 28rem = 448px
    const gap = 16;

    return cardWidth + gap;
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: -getScrollDistance(),
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: getScrollDistance(),
        behavior: "smooth",
      });
    }
  };

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = 448; // 28rem = 448px
      const gap = 16;
      const scrollPosition = (cardWidth + gap) * index;
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  };

  const isMobile = () => {
    return window && window.innerWidth < 768;
  };

  return (
    <CarouselContext.Provider
      value={{ onCardClose: handleCardClose, currentIndex }}
    >
      <div className="relative w-full">
        <div
          className="flex w-full overflow-x-auto overscroll-x-auto scroll-smooth py-10 scrollbar-hide"
          ref={carouselRef}
          onScroll={checkScrollability}
        >
          <div
            className={cn(
              "absolute right-0 z-[10] h-auto w-[5%] overflow-hidden bg-gradient-to-l"
            )}
          ></div>

          <div
            className={cn(
              "flex flex-row justify-start gap-4",
              "mx-auto max-w-7xl"
            )}
          >
            {items.map((item, index) => (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: 0.2 * index,
                  },
                }}
                key={"card" + index}
                className="rounded-3xl last:pr-[2%]"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 md:bottom-12 z-50">
          <button
            className="relative z-50 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-card/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm disabled:opacity-50 transition-all duration-200 hover:scale-105 border border-border/50"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-foreground dark:text-gray-300" />
          </button>
          <button
            className="relative z-50 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-card/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm disabled:opacity-50 transition-all duration-200 hover:scale-105 border border-border/50"
            onClick={scrollRight}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-foreground dark:text-gray-300" />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>
  );
};

export const Card = ({
  card,
  index,
  layout = false,
}: {
  card: Card;
  index: number;
  layout?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { onCardClose, currentIndex } = useContext(CarouselContext);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useOutsideClick(containerRef as React.RefObject<HTMLElement>, () =>
    handleClose()
  );

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    onCardClose(index);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-52 h-screen overflow-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-lg"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              ref={containerRef as any}
              layoutId={layout ? `card-${card.title}` : undefined}
              className="relative z-[60] mx-auto my-10 h-fit max-w-5xl rounded-3xl bg-white font-sans dark:bg-neutral-900"
            >
              <div className="sticky top-4 z-52 flex justify-end px-8 pt-8 md:px-14 md:pt-8">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-card/90 dark:bg-neutral-800/90 shadow-md backdrop-blur-sm hover:bg-card dark:hover:bg-neutral-700 transition-colors"
                  onClick={handleClose}
                >
                  <X className="h-5 w-5 text-foreground dark:text-neutral-100" />
                </button>
              </div>

              <div className="relative px-8 pt-2 pb-0 md:px-14">
                <div>
                  <motion.p
                    layoutId={layout ? `category-${card.title}` : undefined}
                    className="text-base font-medium text-black dark:text-white"
                  >
                    {card.category}
                  </motion.p>
                  <motion.p
                    layoutId={layout ? `title-${card.title}` : undefined}
                    className="mt-4 text-2xl font-semibold text-neutral-700 md:text-5xl dark:text-white"
                  >
                    {card.title}
                  </motion.p>
                </div>
              </div>

              <div className="px-8 pt-8 pb-20 md:px-14 md:pb-24">
                {card.content}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.button
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleOpen}
        className="relative z-10 flex w-[28rem] flex-col items-start justify-start overflow-hidden rounded-3xl bg-gray-200/90 dark:bg-neutral-900 md:w-[32rem] sm:w-[24rem] min-h-[20rem] shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <div className="absolute inset-x-0 top-0 z-30 h-full cursor-pointer bg-gradient-to-b from-black/10 hover:scale-110 via-transparent to-transparent dark:from-black/20" />

        {/* Title at the top */}
        <div className="relative z-40 p-5 pt-5">
          <motion.p
            layoutId={layout ? `category-${card.category}` : undefined}
            className="text-left font-sans text-base font-medium text-gray-800 dark:text-white/90 md:text-lg"
          >
            {card.category}
          </motion.p>
          <motion.p
            layoutId={layout ? `title-${card.title}` : undefined}
            className="max-w-xs text-left font-sans text-3xl font-bold [text-wrap:balance] text-gray-900 dark:text-white md:text-4xl mt-2"
          >
            {card.title}
          </motion.p>
        </div>

        {/* Description in the middle */}
        {card.description && (
          <div className="relative z-40 px-5 pb-5">
            <motion.p className="text-left font-sans text-base text-gray-700 dark:text-white/90 leading-relaxed font-normal max-w-full">
              {card.description}
            </motion.p>
          </div>
        )}

        {card.gradient ? (
          <div
            className={cn(
              "absolute inset-0 z-10 bg-gradient-to-br opacity-80",
              card.gradient
            )}
          />
        ) : card.src ? (
          <BlurImage
            src={card.src}
            alt={card.title}
            fill
            className="absolute inset-0 z-10 object-cover"
          />
        ) : (
          <div className="absolute inset-0 z-10 bg-gradient-to-br from-neutral-500/60 to-neutral-700/60" />
        )}
      </motion.button>
    </>
  );
};

export const BlurImage = ({
  height,
  width,
  src,
  className,
  alt,
  ...rest
}: ImageProps) => {
  const [isLoading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-full h-full">
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-3xl" />
      )}
      {hasError ? (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center rounded-3xl">
          <div className="text-neutral-400 dark:text-neutral-600 text-sm text-center p-4">
            Image not available
          </div>
        </div>
      ) : (
        <Image
          className={cn(
            "transition duration-300",
            isLoading ? "blur-sm" : "blur-0",
            className
          )}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setHasError(true);
          }}
          src={src || "/placeholder.svg"}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          blurDataURL={typeof src === "string" ? src : undefined}
          alt={alt ? alt : "Background of a beautiful view"}
          {...rest}
        />
      )}
    </div>
  );
};
