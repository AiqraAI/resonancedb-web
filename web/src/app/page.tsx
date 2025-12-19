import { MarketingLayout } from "@/components/templates/marketing-layout"

import { HeroSection } from "@/components/organisms/hero-section"

export default function Home() {
  return (
    <MarketingLayout>
      <HeroSection />

      <div className="flex min-h-[30vh] flex-col items-center justify-center p-24 relative z-10">

        <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left mt-32 gap-6">
          {[
            { title: "Identify", desc: "Recognize materials by their unique acoustic signature." },
            { title: "Detect", desc: "Find structural defects before they become failures." },
            { title: "Contribute", desc: "Join thousands of devices mapping the physical world." }
          ].map((item, i) => (
            <div key={i} className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-neutral-700 hover:bg-neutral-800/30">
              <h2 className="mb-3 text-2xl font-semibold">
                {item.title}{" "}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                  -&gt;
                </span>
              </h2>
              <p className="m-0 max-w-[30ch] text-sm opacity-50">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </MarketingLayout>
  )
}
