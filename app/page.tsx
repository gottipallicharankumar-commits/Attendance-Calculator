import { AttendanceCalculator, BackgroundPaths } from "@/components";

export default function Home() {
  return (
    <main className="bg-black text-white">
      <section className="relative overflow-hidden">
        <BackgroundPaths title="Attendance Tracker" />
        <div className="relative z-10 flex min-h-[60vh] items-center justify-center px-6 py-10">
          <div className="w-full max-w-6xl rounded-3xl border border-white/20 bg-black/70 p-6 shadow-2xl shadow-white/10 backdrop-blur-md sm:p-8 lg:p-10">
            <div className="text-center lg:text-left">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-white/70">
                Attendance Tracker
              </p>
              <h1 className="text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
                Master Your <span className="block font-bold text-white">Attendance</span>
              </h1>
              <p className="mt-3 text-sm uppercase tracking-[0.3em] text-white/60">
                ~charan
              </p>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl lg:mx-0">
                Enter your college dates, subject details, and attended classes to see your current attendance instantly.
              </p>
            </div>
          </div>
        </div>
      </section>
      <AttendanceCalculator />
    </main>
  );
}
