"use client";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, BookOpen, CheckCircle2, TrendingUp } from "lucide-react";

type SubjectEntry = {
  name: string;
  attended: string;
  total: string;
  perWeek: string;
};

type Step = "setup" | "subjects" | "results";

export function AttendanceCalculator() {
  const [step, setStep] = useState<Step>("setup");
  const [subjectCount, setSubjectCount] = useState("");
  const [firstDay, setFirstDay] = useState("");
  const [lastDay, setLastDay] = useState("");
  const [subjects, setSubjects] = useState<SubjectEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const presentDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = `${today.getMonth() + 1}`.padStart(2, "0");
    const day = `${today.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const getEstimatedClassCount = (weeklyClasses: string, startDate: string, endDate: string, presentDate: string) => {
    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const lastWorkingDay = new Date(endDate);
    const currentDate = presentDate ? new Date(presentDate) : lastWorkingDay;

    if (!Number.isFinite(start.getTime()) || !Number.isFinite(lastWorkingDay.getTime()) || !Number.isFinite(currentDate.getTime())) {
      return null;
    }

    const effectiveEnd = currentDate < start ? start : currentDate > lastWorkingDay ? lastWorkingDay : currentDate;

    const countWorkingDays = (from: Date, to: Date) => {
      const dayCount = new Date(from);
      let workingDays = 0;

      while (dayCount <= to) {
        const day = dayCount.getDay();
        if (day !== 0 && day !== 6) {
          workingDays += 1;
        }
        dayCount.setDate(dayCount.getDate() + 1);
      }

      return workingDays;
    };

    const workingDays = countWorkingDays(start, effectiveEnd);
    const weeklyCount = Number(weeklyClasses);

    if (!Number.isFinite(weeklyCount) || weeklyCount <= 0 || workingDays <= 0) return null;

    const classesPerWeekday = weeklyCount / 5;
    return Math.max(1, Math.round(classesPerWeekday * workingDays));
  };

  const currentSubject = subjects[activeIndex] ?? { name: "", attended: "", total: "", perWeek: "" };
  const currentSubjectReady = Boolean(currentSubject.name.trim() && currentSubject.attended && currentSubject.perWeek);

  const startPlanning = () => {
    const count = Number(subjectCount);
    if (!Number.isInteger(count) || count <= 0) return;

    setSubjects(
      Array.from({ length: count }, () => ({
        name: "",
        attended: "",
        total: "",
        perWeek: "",
      }))
    );
    setActiveIndex(0);
    setStep("subjects");
  };

  const updateSubject = (index: number, field: keyof SubjectEntry, value: string) => {
    setSubjects((prev) =>
      prev.map((subject, subjectIndex) => {
        if (subjectIndex !== index) return subject;

        const updatedSubject = { ...subject, [field]: value };

        if (field === "perWeek" && value !== "") {
          const total = getEstimatedClassCount(value, firstDay, lastDay, presentDate);
          updatedSubject.total = total?.toString() ?? "";
        }

        return updatedSubject;
      })
    );
  };

  const goToNextSubject = () => {
    if (activeIndex < subjects.length - 1) {
      setActiveIndex((prev) => prev + 1);
      return;
    }

    setStep("results");
  };

  const goBack = () => {
    if (step === "results") {
      setStep("subjects");
      return;
    }

    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
      return;
    }

    setStep("setup");
  };

  const handleReset = () => {
    setStep("setup");
    setSubjectCount("");
    setFirstDay("");
    setLastDay("");
    setSubjects([]);
    setActiveIndex(0);
  };

  const subjectResults = useMemo(() => {
    return subjects.map((subject) => {
      const attended = Number(subject.attended);
      const total = Number(subject.total);
      const isValid = Number.isFinite(attended) && Number.isFinite(total) && total > 0;

      if (!isValid) {
        return {
          ...subject,
          attendance: null,
          isValid: false,
          guidance: "Enter the attended classes and your total classes will be filled automatically.",
        };
      }

      const attendance = Number(((attended / total) * 100).toFixed(2));
      if (attendance < 75) {
        const classesNeeded = Math.ceil(total * 0.75) - attended;
        return {
          ...subject,
          attendance,
          isValid: true,
          guidance: `Attend ${Math.max(classesNeeded, 0)} more class${classesNeeded === 1 ? "" : "es"} to reach 75%.`,
        };
      }

      const classesToSkip = Math.max(0, attended - Math.ceil(total * 0.75));
      return {
        ...subject,
        attendance,
        isValid: true,
        guidance: `You can skip ${classesToSkip} class${classesToSkip === 1 ? "" : "es"} and still stay above 75%.`,
      };
    });
  }, [subjects]);

  const overallAttendance = useMemo(() => {
    const validSubjects = subjectResults.filter((subject) => subject.isValid);
    if (!validSubjects.length) return null;

    const totalAttended = validSubjects.reduce((sum, subject) => sum + Number(subject.attended), 0);
    const totalClasses = validSubjects.reduce((sum, subject) => sum + Number(subject.total), 0);

    if (totalClasses <= 0) return null;
    return Number(((totalAttended / totalClasses) * 100).toFixed(2));
  }, [subjectResults]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.section
      className="py-20 px-4 md:px-8"
      initial="hidden"
      whileInView="visible"
      variants={containerVariants}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Attendance Calculator
          </h2>
          <p className="text-lg text-slate-300">
            Start with your college schedule, then enter each subject and your attended classes.
          </p>
        </motion.div>

        <motion.div
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-light-blue/30"
          variants={itemVariants}
        >
          {step === "setup" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-black" />
                <h3 className="text-2xl font-bold text-slate-800">College schedule</h3>
              </div>
              <p className="text-slate-600">
                Enter the college date range and the number of subjects. The total classes for each subject will be calculated up to today’s date automatically.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">First working day</label>
                  <input
                    type="date"
                    value={firstDay}
                    onChange={(e) => setFirstDay(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-300 focus:outline-none transition-colors duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Last working day</label>
                  <input
                    type="date"
                    value={lastDay}
                    onChange={(e) => setLastDay(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-300 focus:outline-none transition-colors duration-300"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">How many subjects?</label>
                  <input
                    type="number"
                    min="1"
                    value={subjectCount}
                    onChange={(e) => setSubjectCount(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-300 focus:outline-none transition-colors duration-300"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
                Fill in the date range and the number of subjects. The weekly class count for each subject will be added in the next step.
              </div>

              <button
                onClick={startPlanning}
                disabled={!firstDay || !lastDay || !subjectCount}
                className="w-full px-6 py-3 bg-black text-white font-semibold rounded-lg border border-black hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {step === "subjects" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                    Subject {activeIndex + 1} of {subjects.length}
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800">Fill in this subject</h3>
                </div>
                <div className="text-sm text-slate-500">
                  {Math.round(((activeIndex + 1) / subjects.length) * 100)}% done
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Subject Name</label>
                  <input
                    type="text"
                    value={currentSubject.name}
                    onChange={(e) => updateSubject(activeIndex, "name", e.target.value)}
                    placeholder="e.g. Mathematics"
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-300 focus:outline-none transition-colors duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Classes Attended</label>
                  <input
                    type="number"
                    min="0"
                    value={currentSubject.attended}
                    onChange={(e) => updateSubject(activeIndex, "attended", e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-300 focus:outline-none transition-colors duration-300"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Classes per week for this subject (Mon–Fri only)</label>
                  <input
                    type="number"
                    min="1"
                    value={currentSubject.perWeek}
                    onChange={(e) => updateSubject(activeIndex, "perWeek", e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 bg-white text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-300 focus:outline-none transition-colors duration-300"
                  />
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span>Total classes for this subject</span>
                    <strong>{currentSubject.total || "—"}</strong>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">This is estimated from your college schedule, present date, and weekly class count.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={goBack}
                  className="flex-1 px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-all duration-300"
                >
                  {activeIndex > 0 ? "Previous subject" : "Back"}
                </button>
                <button
                  onClick={goToNextSubject}
                  disabled={!currentSubjectReady}
                  className="flex-1 px-6 py-3 rounded-lg bg-black text-white font-semibold border border-black hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activeIndex < subjects.length - 1 ? "Next subject" : "View analysis"}
                </button>
              </div>
            </div>
          )}

          {step === "results" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-bold text-slate-800">Attendance Analysis</h3>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 text-white">
                <p className="text-sm uppercase tracking-[0.2em] text-white/80">Overall attendance</p>
                <div className="mt-2 text-4xl font-bold">
                  {overallAttendance !== null ? `${overallAttendance}%` : "—"}
                </div>
                <p className="mt-2 text-sm text-white/80">
                  {overallAttendance === null
                    ? "Add your subject details to see the overall summary."
                    : overallAttendance >= 75
                      ? "Great job — your overall attendance is on track."
                      : "You need a bit more attendance to reach the 75% mark."}
                </p>
              </div>

              <div className="space-y-3">
                {subjectResults.map((subject, index) => (
                  <div key={`${subject.name}-${index}`} className="rounded-2xl border border-slate-200 p-4 shadow-sm bg-slate-50">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-800">
                          {subject.name || `Subject ${index + 1}`}
                        </h4>
                        <p className="text-sm text-slate-500">
                          Attended {subject.attended || 0} of {subject.total || 0} classes
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {subject.attendance !== null && subject.attendance >= 75 ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : subject.attendance !== null ? (
                          <AlertCircle className="w-5 h-5 text-orange-500" />
                        ) : null}
                        <span
                          className={`text-lg font-bold ${
                            subject.attendance === null
                              ? "text-slate-500"
                              : subject.attendance >= 75
                                ? "text-green-600"
                                : "text-orange-600"
                          }`}
                        >
                          {subject.attendance === null ? "Pending" : `${subject.attendance}%`}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{subject.guidance}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleReset}
                className="w-full px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-all duration-300"
              >
                Calculate again
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}

