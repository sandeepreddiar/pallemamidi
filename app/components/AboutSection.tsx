import OptimizedImage from "./OptimizedImage";

export default function AboutSection() {
  return (
    <section id="about" className="py-24 px-6 lg:px-12 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8">
          <div className="flex items-center space-x-4">
            <div className="h-px w-8 bg-[#D27E1C]"></div>
            <span className="text-[#D27E1C] font-bold uppercase tracking-widest text-sm">Our Legacy</span>
          </div>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-6xl font-bold text-[#1B330F] leading-tight">
            Nurtured by Nature,<br />Perfected by Tradition
          </h2>
          <p className="text-[#3F4E34]/80 text-lg leading-relaxed">
            At Palle Mamidi, we believe that the best mangoes are those grown with patience and respect for the land. Our orchards have been in the family for generations, located in the heart of traditional mango-growing regions.
          </p>
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div>
              <p className="text-4xl font-bold text-[#1B330F] mb-1">100%</p>
              <p className="text-[#D27E1C] font-semibold text-sm">Naturally Ripened</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-[#1B330F] mb-1">0%</p>
              <p className="text-[#D27E1C] font-semibold text-sm">Carbides or Chemicals</p>
            </div>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="aspect-square rounded-3xl bg-brand-primary-green/5 overflow-hidden border border-[#1B330F]/5 p-8">
            <OptimizedImage 
              src="/mangoes/mango-6.png" 
              alt="Natural Mangoes" 
              width={600}
              quality={80}
              className="w-full h-full"
              imgClassName="object-contain hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="absolute -bottom-8 -left-8 bg-[#1B330F] text-brand-cream p-8 rounded-2xl shadow-2xl max-w-xs">
            <p className="italic text-lg">"From our village orchards straight to your dining table."</p>
          </div>
        </div>
      </div>
    </section>
  );
}
