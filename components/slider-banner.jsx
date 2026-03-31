"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SliderBanner({ images = [], interval = 3500, alt = "hero image" }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!images.length) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images, interval]);

  if (!images.length) {
    return null;
  }

  return (
    <div className="relative h-[220px] sm:h-[280px] md:h-[350px] lg:h-[500px] rounded-xl overflow-hidden">
      <Image
        key={images[current]}
        src={`/${images[current]}`}
        alt={`${alt} ${current + 1}`}
        fill
        priority={current === 0}
        className="object-cover transition-opacity duration-700"
      />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, idx) => (
          <span
            key={idx}
            className={`h-2 w-2 rounded-full ${idx === current ? "bg-white" : "bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
