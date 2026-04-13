import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Facebook, Instagram, Globe, Plus, Minus } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [selectedBarber, setSelectedBarber] = useState("Camilo");
  const [openCategory, setOpenCategory] = useState("Barbas");

  const barbers = [
    { name: "Camilo", img: "https://i.pravatar.cc/150?u=camilo" },
    { name: "Diego", img: "https://i.pravatar.cc/150?u=diego" },
    { name: "Jaime", img: "https://i.pravatar.cc/150?u=jaime" },
    { name: "Ángel", img: "https://i.pravatar.cc/150?u=angel" },
  ];

  const toggleCategory = (cat: string) => {
    setOpenCategory(openCategory === cat ? "" : cat);
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F5F5] font-sans text-slate-900 pb-20">
      <div className="w-full max-w-[390px] mx-auto bg-[#F5F5F5]">
        {/* Banner Hero */}
        <div className="p-4 pt-6">
          <div className="relative w-full h-[180px] rounded-[1.25rem] overflow-hidden shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80"
              alt="Barber banner"
              className="w-full h-full object-cover"
            />
            {/* Dark overlay specifically matching the image top parts */}
            <div className="absolute inset-0 bg-black/5" />

            {/* Social Icons floating bottom right */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-slate-900 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-slate-900 transition-colors">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-slate-900 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>

            {/* Barber logo overlay */}
            <div className="absolute top-4 left-4 w-28 h-28 bg-white rounded-[1.25rem] shadow-md p-1.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#1A1A1A] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm leading-tight text-center tracking-tighter">BARBER<br />SHOP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barber Selection */}
        <div className="mt-4 px-4">
          <h2 className="text-[14px] font-medium text-slate-800 mb-4 px-1">
            ¿Quieres agendar con un profesional en particular?
          </h2>
          <div className="flex overflow-x-auto gap-5 pb-4 px-1 -mx-1 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
              .snap-x::-webkit-scrollbar { display: none; }
            `}</style>
            {barbers.map((barber) => {
              const isSelected = selectedBarber === barber.name;
              return (
                <div
                  key={barber.name}
                  className="flex flex-col items-center gap-[0.35rem] cursor-pointer snap-start"
                  onClick={() => setSelectedBarber(barber.name)}
                >
                  <div className={`w-16 h-16 rounded-full overflow-hidden p-[2px] transition-all ${isSelected ? "ring-[2.5px] ring-slate-800 ring-offset-2 ring-offset-[#F5F5F5]" : ""
                    }`}>
                    <img
                      src={barber.img}
                      alt={barber.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <span className={`text-[13px] ${isSelected ? "font-semibold text-slate-900" : "font-medium text-slate-600"}`}>
                    {barber.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Catalog */}
        <div className="mt-4 px-4 pb-8">
          <h2 className="text-[14px] font-medium text-slate-800 mb-4 px-1">
            Selecciona los servicios que deseas agendar
          </h2>

          <div className="flex flex-col gap-3">
            {/* Accordion Item */}
            <div className="bg-[#F8F9FA] rounded-[0.8rem] overflow-hidden border border-slate-100">
              <button
                onClick={() => toggleCategory("Barbas")}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-200/40 transition-colors"
              >
                <span className="font-semibold text-[15px] text-slate-800">Barbas</span>
                {openCategory === "Barbas" ? (
                  <Minus className="w-5 h-5 text-slate-600" />
                ) : (
                  <Plus className="w-5 h-5 text-slate-600" />
                )}
              </button>

              {openCategory === "Barbas" && (
                <div className="p-3 bg-white">
                  {/* Service Card */}
                  <div className="relative border border-slate-200 rounded-[0.8rem] p-4 pt-10 shadow-sm bg-white overflow-hidden">
                    {/* Badge */}
                    <div className="absolute top-0 left-0 bg-[#2C3E4C] text-white text-[10.5px] px-3 py-1.5 font-medium rounded-br-[0.8rem]">
                      Descuento pagando en línea
                    </div>

                    <h3 className="font-semibold text-[16px] text-slate-900 mt-1">
                      Afeitado completo al Ras
                    </h3>
                    <p className="text-[13px] text-slate-500 mt-0.5">30 min</p>

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-bold text-[16px] text-slate-900">$18.000</span>
                      <span className="text-[13px] text-slate-400 line-through">Normal: $20.000</span>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100&h=100&fit=crop" className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-100" alt="Service pic" />
                      <img src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=100&h=100&fit=crop" className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-100" alt="Service pic" />
                      <img src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=100&h=100&fit=crop" className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-100" alt="Service pic" />
                    </div>

                    <button className="w-full mt-5 bg-[#2A3138] hover:bg-slate-800 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium text-[14px] transition-colors">
                      <Plus className="w-[18px] h-[18px] font-light" />
                      Agregar servicio
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Other collapsed categories */}
            <div className="bg-[#F8F9FA] rounded-[0.8rem] overflow-hidden border border-slate-100">
              <button
                onClick={() => toggleCategory("Cortes")}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-200/40 transition-colors"
              >
                <span className="font-semibold text-[15px] text-slate-800">Cortes de Cabello</span>
                {openCategory === "Cortes" ? (
                  <Minus className="w-5 h-5 text-slate-600" />
                ) : (
                  <Plus className="w-5 h-5 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
