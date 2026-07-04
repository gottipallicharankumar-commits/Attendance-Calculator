"use client";
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

type ClassEntry = {
  name: string;
  attended: number;
};

type Timetable = {
  [key: string]: ClassEntry[];
};

type UserData = {
  username: string;
  password: string;
  timetable: Timetable;
  hasHolidays: boolean | null;
  weeklyHolidays: string;
  startDate: string;
  endDate: string;
  subjectWeeklyCounts?: { [subject: string]: number };
  holidays?: string[];
};

type Step = "auth" | "timetable" | "holidays" | "results" | "menu" | "edit-attendance";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function AttendanceCalculator() {
  const [step, setStep] = useState<Step>("auth");
  const [authMode, setAuthMode] = useState<"signup" | "login">("login");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string>("");

  const [timetable, setTimetable] = useState<Timetable>({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  });
  const [subjectWeeklyCounts, setSubjectWeeklyCounts] = useState<{ [subject: string]: number }>({});
  const [currentDay, setCurrentDay] = useState<string>("Monday");
  const [currentInput, setCurrentInput] = useState<string>("");
  const [holidays, setHolidays] = useState<string[]>([]);
  const [hasHolidays, setHasHolidays] = useState<boolean | null>(null);
  const [weeklyHolidays, setWeeklyHolidays] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Load all users from localStorage
  const getAllUsers = (): { [key: string]: UserData } => {
    if (typeof window === "undefined") return {};
    const users = localStorage.getItem("attendanceUsers");
    return users ? JSON.parse(users) : {};
  };

  // Save user data
  const saveUserData = (user: UserData) => {
    const users = getAllUsers();
    users[user.username] = user;
    localStorage.setItem("attendanceUsers", JSON.stringify(users));
  };

  // Handle signup
  const handleSignup = () => {
    setAuthError("");
    if (!username.trim() || !password.trim()) {
      setAuthError("Username and password are required");
      return;
    }
    if (username.length < 3) {
      setAuthError("Username must be at least 3 characters");
      return;
    }
    if (password.length < 4) {
      setAuthError("Password must be at least 4 characters");
      return;
    }

    const users = getAllUsers();
    if (users[username]) {
      setAuthError("Username already exists");
      return;
    }

    saveUserData({
      username,
      password,
      timetable: {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
      },
      hasHolidays: null,
      weeklyHolidays: "",
      startDate: "",
      endDate: "",
      holidays: [],
    });

    setLoggedInUser(username);
    setStep("menu");
    setUsername("");
    setPassword("");
  };

  // Handle login
  const handleLogin = () => {
    setAuthError("");
    if (!username.trim() || !password.trim()) {
      setAuthError("Username and password are required");
      return;
    }

    const users = getAllUsers();
    const user = users[username];

    if (!user || user.password !== password) {
      setAuthError("Invalid username or password");
      return;
    }

    setLoggedInUser(username);
    setTimetable(user.timetable);
    setHasHolidays(user.hasHolidays);
    setWeeklyHolidays(user.weeklyHolidays);
    setStartDate(user.startDate);
    setEndDate(user.endDate);
    setSubjectWeeklyCounts(user.subjectWeeklyCounts || {});
    setHolidays(user.holidays || []);
    setStep("menu");
    setUsername("");
    setPassword("");
  };

  // Save current state for logged-in user
  useEffect(() => {
    if (loggedInUser && (step === "timetable" || step === "holidays" || step === "results")) {
      const users = getAllUsers();
      if (users[loggedInUser]) {
        users[loggedInUser] = {
          ...users[loggedInUser],
          timetable,
          hasHolidays,
          weeklyHolidays,
          startDate,
          endDate,
          subjectWeeklyCounts,
          holidays,
        };
        localStorage.setItem("attendanceUsers", JSON.stringify(users));
      }
    }
  }, [loggedInUser, timetable, hasHolidays, weeklyHolidays, startDate, endDate, step, subjectWeeklyCounts, holidays]);

  // Handle logout
  const handleLogout = () => {
    setLoggedInUser(null);
    setStep("auth");
    setAuthMode("login");
    setUsername("");
    setPassword("");
    setAuthError("");
    setTimetable({
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
    });
    setHasHolidays(null);
    setWeeklyHolidays("");
    setStartDate("");
    setEndDate("");
  };

  // Continue from menu to edit/view
  const continueWithTimetable = () => {
    if (startDate && endDate && Object.values(timetable).some(day => day.length > 0)) {
      // Has saved timetable, go to results
      setStep("results");
    } else {
      // No saved timetable, create new
      setStep("timetable");
    }
  };

  const currentDayIndex = DAYS.indexOf(currentDay);

  const addClassToDay = (className: string) => {
    if (!className.trim()) return;
    
    setTimetable((prev) => ({
      ...prev,
      [currentDay]: [
        ...prev[currentDay],
        { name: className.trim(), attended: 0 },
      ],
    }));
    setCurrentInput("");
  };

  const removeClassFromDay = (dayName: string, index: number) => {
    setTimetable((prev) => ({
      ...prev,
      [dayName]: prev[dayName].filter((_, i) => i !== index),
    }));
  };

  const updateAttendance = (dayName: string, index: number, attended: number) => {
    setTimetable((prev) => ({
      ...prev,
      [dayName]: prev[dayName].map((cls, i) =>
        i === index ? { ...cls, attended } : cls
      ),
    }));
  };

  const updateSubjectWeeklyCount = (subject: string, count: number) => {
    setSubjectWeeklyCounts((prev) => ({ ...prev, [subject]: count }));
  };

  const goToNextDay = () => {
    if (currentDayIndex < DAYS.length - 1) {
      setCurrentDay(DAYS[currentDayIndex + 1]);
      setCurrentInput("");
    } else {
      setStep("holidays");
    }
  };

  const goToPreviousDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDay(DAYS[currentDayIndex - 1]);
      setCurrentInput("");
    }
  };

  const handleHolidayAnswer = (answer: boolean) => {
    setHasHolidays(answer);
    if (!answer) {
      setStep("results");
    }
  };

  const proceedToResults = () => {
    if (hasHolidays && !weeklyHolidays) return;
    setStep("results");
  };

  const countWorkingDays = (from: Date, to: Date, holidaysList: string[] = []) => {
    const dayCount = new Date(from);
    let workingDays = 0;
    const holidaySet = new Set(holidaysList.map(d => new Date(d).toDateString()));

    while (dayCount <= to) {
      const day = dayCount.getDay();
      const isWeekend = day === 0 || day === 6;
      const isHoliday = holidaySet.has(dayCount.toDateString());
      if (!isWeekend && !isHoliday) {
        workingDays += 1;
      }
      dayCount.setDate(dayCount.getDate() + 1);
    }

    return workingDays;
  };

  const subjectResults = useMemo(() => {
    const subjectMap = new Map<
      string,
      { attended: number; total: number; days: Set<string> }
    >();

    // Aggregate class data by subject name
    Object.entries(timetable).forEach(([day, classes]) => {
      classes.forEach((cls) => {
        if (!subjectMap.has(cls.name)) {
          subjectMap.set(cls.name, { attended: 0, total: 0, days: new Set() });
        }
        const data = subjectMap.get(cls.name)!;
        data.attended += cls.attended;
        data.total += 1;
        data.days.add(day);
      });
    });

    // Get today's date automatically
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate working days up to today
    let workingDaysUntilToday = 5;
    let remainingWorkingDays = 0;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      workingDaysUntilToday = countWorkingDays(start, today, holidays) / 7;
      remainingWorkingDays = countWorkingDays(today, end, holidays) / 7;
    }

    const adjustedHolidays = hasHolidays ? Number(weeklyHolidays) || 0 : 0;
    const weeklyWorkingDays = 5 - adjustedHolidays;

    return Array.from(subjectMap.entries()).map(([name, data]) => {
      const classesPerWeek = subjectWeeklyCounts[name] ?? data.days.size;
      const totalClassesUntilToday = Math.round(
        data.total * workingDaysUntilToday * (weeklyWorkingDays / classesPerWeek)
      );
      const totalClassesUntilEnd = Math.round(
        data.total * (workingDaysUntilToday + remainingWorkingDays) * (weeklyWorkingDays / classesPerWeek)
      );

      const attendance = totalClassesUntilToday > 0
        ? Number(((data.attended / totalClassesUntilToday) * 100).toFixed(2))
        : 0;

      let guidance = "";
      if (attendance < 75) {
        const classesNeeded = Math.ceil(totalClassesUntilEnd * 0.75) - data.attended;
        guidance = `Attend ${Math.max(
          classesNeeded,
          0
        )} more class${classesNeeded === 1 ? "" : "es"} by end of semester to reach 75%.`;
      } else {
        const classesToSkip = Math.max(
          0,
          data.attended - Math.ceil(totalClassesUntilToday * 0.75)
        );
        guidance = `You can skip ${classesToSkip} class${
          classesToSkip === 1 ? "" : "es"
        } and still stay above 75%. (${remainingWorkingDays > 0 ? Math.round(remainingWorkingDays) : 0} weeks remaining)`;
      }

      return {
        name,
        attended: data.attended,
        total: totalClassesUntilToday,
        attendance,
        guidance,
      };
    });
  }, [timetable, startDate, endDate, hasHolidays, weeklyHolidays, subjectWeeklyCounts, holidays]);

  const overallAttendance = useMemo(() => {
    if (!subjectResults.length) return null;

    const totalAttended = subjectResults.reduce((sum, s) => sum + s.attended, 0);
    const totalClasses = subjectResults.reduce((sum, s) => sum + s.total, 0);

    return totalClasses > 0
      ? Number(((totalAttended / totalClasses) * 100).toFixed(2))
      : null;
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

  const handleReset = () => {
    setStep("menu");
    setCurrentDay("Monday");
    setCurrentInput("");
  };

  return (
    <motion.section
      className="py-20 px-4 md:px-8"
      initial="hidden"
      whileInView="visible"
      variants={containerVariants}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <motion.div className="text-center flex-1" variants={itemVariants}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Attendance Calculator
            </h2>
            <p className="text-lg text-slate-300">
              Create your weekly timetable and track your attendance.
            </p>
          </motion.div>
          {loggedInUser && step !== "auth" && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600/20 border border-red-400 text-red-300 rounded-lg hover:bg-red-600/30 transition-all duration-300 flex items-center gap-2 text-sm"
            >
              <span className="w-4 h-4 inline-block">⤴</span>
              Logout
            </button>
          )}
        </div>

        <motion.div
          className="bg-black/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-slate-800/70"
          variants={itemVariants}
        >
          {step === "auth" && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-slate-100">
                  {authMode === "login" ? "Login" : "Sign Up"}
                </h3>
                <p className="text-slate-400">
                  {authMode === "login"
                    ? "Access your attendance data"
                    : "Create a new account"}
                </p>
              </div>

              {authError && (
                <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                  {authError}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-300">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        authMode === "login" ? handleLogin() : handleSignup();
                      }
                    }}
                    placeholder="Enter username"
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-950 text-slate-100 shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-500 focus:outline-none transition-colors duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-300">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        authMode === "login" ? handleLogin() : handleSignup();
                      }
                    }}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-950 text-slate-100 shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-500 focus:outline-none transition-colors duration-300"
                  />
                </div>
              </div>

              <button
                onClick={authMode === "login" ? handleLogin : handleSignup}
                className="w-full px-6 py-3 rounded-lg bg-slate-600 text-slate-100 font-semibold hover:bg-slate-500 transition-all duration-300"
              >
                {authMode === "login" ? "Login" : "Sign Up"}
              </button>

              <div className="text-center">
                <button
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "signup" : "login");
                    setAuthError("");
                    setUsername("");
                    setPassword("");
                  }}
                  className="text-sm text-slate-300 hover:text-slate-100 font-semibold"
                >
                  {authMode === "login"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Login"}
                </button>
              </div>
            </div>
          )}

          {step === "menu" && loggedInUser && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-slate-100">
                  Welcome, {loggedInUser}!
                </h3>
                <div className="rounded-2xl bg-slate-900/80 border border-slate-700/60 p-4">
                  <p className="text-sm text-slate-400">
                    {Object.values(timetable).some((day) => day.length > 0)
                      ? "You have a saved timetable. You can view your attendance or create a new one."
                      : "Create a new timetable to start tracking your attendance."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={continueWithTimetable}
                  className="w-full px-6 py-3 rounded-lg bg-slate-600 text-slate-100 font-semibold hover:bg-slate-500 transition-all duration-300"
                >
                  {Object.values(timetable).some((day) => day.length > 0)
                    ? "View/Edit Attendance"
                    : "Create New Timetable"}
                </button>

                {Object.values(timetable).some((day) => day.length > 0) && (
                  <button
                    onClick={() => {
                      setTimetable({
                        Monday: [],
                        Tuesday: [],
                        Wednesday: [],
                        Thursday: [],
                        Friday: [],
                      });
                      setHasHolidays(null);
                      setWeeklyHolidays("");
                      setStartDate("");
                      setEndDate("");
                      setStep("timetable");
                    }}
                    className="w-full px-6 py-3 rounded-lg border border-slate-600 text-slate-200 font-semibold hover:bg-slate-800 transition-all duration-300"
                  >
                    Create New Timetable
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full px-6 py-3 rounded-lg border border-red-600/60 text-red-300 font-semibold hover:bg-slate-900 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span className="w-4 h-4 inline-block">⤴</span>
                  Logout
                </button>
              </div>
            </div>
          )}

          {step === "timetable" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-300">
                      First working day
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-950 text-slate-100 shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-500 focus:outline-none transition-colors duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-300">
                      Last working day
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-950 text-slate-100 shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-500 focus:outline-none transition-colors duration-300"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/80 border border-slate-700/60 p-4 text-sm text-slate-400">
                <h3 className="font-semibold text-slate-100 mb-2">Your Weekly Timetable</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="px-4 py-2 font-semibold text-slate-100">
                          Week
                        </th>
                        {DAYS.map((day) => (
                          <th
                            key={day}
                            className={`px-4 py-2 font-semibold ${
                              currentDay === day
                                ? "bg-slate-700 text-slate-100"
                                : "text-slate-100"
                            }`}
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 font-semibold text-slate-100">
                          Classes
                        </td>
                        {DAYS.map((day) => (
                          <td
                            key={day}
                            className={`px-4 py-2 ${
                              currentDay === day ? "bg-slate-900" : ""
                            }`}
                          >
                            <div className="space-y-2">
                              {timetable[day].map((cls, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded border border-slate-700"
                                >
                                  <div className="flex-1 text-xs">
                                    <p className="font-medium text-slate-100">
                                      {cls.name}
                                    </p>
                                    <p className="text-slate-400">
                                      Attended: {cls.attended}
                                    </p>
                                  </div>
                                  {currentDay === day && (
                                    <button
                                      onClick={() =>
                                        removeClassFromDay(day, idx)
                                      }
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <span className="w-4 h-4 inline-block">×</span>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4 p-6 bg-slate-950/90 rounded-2xl border border-slate-700/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-100">
                    {currentDay}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {currentDayIndex + 1} of {DAYS.length}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          addClassToDay(currentInput);
                        }
                      }}
                      placeholder="Enter class name"
                      className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-950 text-slate-100 shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-500 focus:outline-none transition-colors duration-300"
                    />
                    <button
                      onClick={() => addClassToDay(currentInput)}
                      className="px-4 py-3 bg-slate-700 text-slate-100 rounded-lg hover:bg-slate-600 transition-colors duration-300 flex items-center gap-2"
                    >
                      <span className="w-5 h-5 inline-block text-white text-lg font-bold">+</span>
                      Add
                    </button>
                  </div>

                  {timetable[currentDay].length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-100">
                        Classes added:
                      </p>
                      {timetable[currentDay].map((cls, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg border border-slate-700"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-slate-100">
                              {cls.name}
                            </p>
                            <p className="text-sm text-slate-400">
                              Attended: {cls.attended}
                            </p>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={cls.attended}
                            onChange={(e) =>
                              updateAttendance(
                                currentDay,
                                idx,
                                Number(e.target.value)
                              )
                            }
                            placeholder="Attended"
                            className="w-16 px-2 py-1 rounded border border-slate-600 text-sm text-slate-100 bg-slate-900"
                          />
                          <button
                            onClick={() =>
                              removeClassFromDay(currentDay, idx)
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <span className="w-5 h-5 inline-block">×</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={goToPreviousDay}
                    disabled={currentDayIndex === 0}
                    className="flex-1 px-6 py-3 rounded-lg border border-slate-600 text-slate-200 font-semibold hover:bg-slate-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={goToNextDay}
                    className="flex-1 px-6 py-3 rounded-lg bg-slate-700 text-slate-100 font-semibold hover:bg-slate-600 transition-all duration-300"
                  >
                    {currentDayIndex < DAYS.length - 1 ? "Next Day" : "Done"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "holidays" && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-slate-100">
                  Do you have weekly holidays?
                </h3>
                <p className="text-slate-600">
                  (Other than Saturday and Sunday)
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleHolidayAnswer(false)}
                  className="flex-1 px-6 py-4 rounded-lg border-2 border-slate-600 text-slate-200 font-semibold hover:bg-slate-800 transition-all duration-300"
                >
                  No
                </button>
                <button
                  onClick={() => handleHolidayAnswer(true)}
                  className="flex-1 px-6 py-4 rounded-lg bg-slate-700 text-slate-100 font-semibold hover:bg-slate-600 transition-all duration-300"
                >
                  Yes
                </button>
              </div>

              {hasHolidays === true && (
                <div className="space-y-4 p-6 bg-slate-950/90 rounded-2xl border border-slate-700/60">
                  <label className="block text-sm font-semibold text-slate-300">
                    Number of weekly holidays (excluding weekends)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={weeklyHolidays}
                    onChange={(e) => setWeeklyHolidays(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-950 text-slate-100 shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-500 focus:outline-none transition-colors duration-300"
                  />
                  <button
                    onClick={proceedToResults}
                    disabled={!weeklyHolidays}
                    className="w-full px-6 py-3 rounded-lg bg-slate-700 text-slate-100 font-semibold hover:bg-slate-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              )}

              <div className="space-y-4 p-6 bg-slate-950/90 rounded-2xl border border-slate-700/60">
                <label className="block text-sm font-semibold text-slate-300">
                  Semester-specific holidays (optional)
                </label>
                <p className="text-sm text-slate-400 mb-2">Add dates when there is a holiday during the semester; these days will be excluded from class totals.</p>
                <div className="flex gap-2">
                  <input
                    id="holiday-input"
                    type="date"
                    className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-950 text-slate-100 shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-500 focus:outline-none transition-colors duration-300"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value;
                        if (val && !holidays.includes(val)) setHolidays((prev) => [...prev, val]);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById("holiday-input") as HTMLInputElement | null;
                      if (!el) return;
                      const val = el.value;
                      if (val && !holidays.includes(val)) {
                        setHolidays((prev) => [...prev, val]);
                        el.value = "";
                      }
                    }}
                    className="px-4 py-3 bg-slate-700 text-slate-100 rounded-lg hover:bg-slate-600 transition-colors duration-300"
                  >
                    Add
                  </button>
                </div>
                {holidays.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {holidays.map((h, i) => (
                      <div key={h} className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-700">
                        <div className="text-sm text-slate-100">{new Date(h).toLocaleDateString()}</div>
                        <button
                          onClick={() => setHolidays((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "results" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-slate-300" />
                <h3 className="text-2xl font-bold text-slate-100">
                  Attendance Analysis
                </h3>
              </div>

              <div className="rounded-2xl bg-slate-950/95 border border-slate-700 p-6 text-slate-100">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Overall attendance
                </p>
                <div className="mt-2 text-4xl font-bold">
                  {overallAttendance !== null ? `${overallAttendance}%` : "—"}
                </div>
                <p className="mt-2 text-sm text-white/80">
                  {overallAttendance === null
                    ? "Add your timetable details to see the overall summary."
                    : overallAttendance >= 75
                      ? "Great job — your overall attendance is on track."
                      : "You need a bit more attendance to reach the 75% mark."}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950/90 border border-slate-700/60 p-4 text-sm text-slate-400">
                <p className="font-semibold text-slate-100 mb-2">📅 Calculation Info:</p>
                <p>Semester: {startDate ? new Date(startDate).toLocaleDateString() : "—"} to {endDate ? new Date(endDate).toLocaleDateString() : "—"}</p>
                <p>Calculated until today: {new Date().toLocaleDateString()}</p>
              </div>

              <div className="space-y-3">
                {subjectResults.map((subject, index) => (
                  <div
                    key={`${subject.name}-${index}`}
                    className="rounded-2xl border border-slate-700/60 p-4 shadow-sm bg-slate-950/90"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-100">
                          {subject.name}
                        </h4>
                        <p className="text-sm text-slate-400">
                          Attended {subject.attended} of {subject.total} classes
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {subject.attendance >= 75 ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-orange-500" />
                        )}
                        <span
                          className={`text-lg font-bold ${
                            subject.attendance >= 75
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}
                        >
                          {subject.attendance}%
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      {subject.guidance}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("edit-attendance")}
                  className="flex-1 px-6 py-3 rounded-lg bg-slate-700 text-slate-100 font-semibold hover:bg-slate-600 transition-all duration-300"
                >
                  Edit Attendance
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 rounded-lg border border-slate-600 text-slate-200 font-semibold hover:bg-slate-800 transition-all duration-300"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          )}

          {step === "edit-attendance" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-2xl font-bold text-slate-100">
                  Edit Attendance
                </h3>
                <button
                  onClick={() => setStep("results")}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-slate-100 font-semibold"
                >
                  Back to Results
                </button>
              </div>

              <div className="space-y-4">
                {DAYS.map((day) => (
                  <div key={day} className="rounded-2xl border border-slate-700/60 p-4 bg-slate-950/90">
                    <h4 className="font-semibold text-slate-100 mb-3">{day}</h4>
                    <div className="space-y-2">
                      {timetable[day].length > 0 ? (
                        timetable[day].map((cls, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-4 p-3 bg-slate-950 rounded-lg border border-slate-700"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-slate-100">{cls.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-slate-600">Attended:</label>
                              <input
                                type="number"
                                min="0"
                                value={cls.attended}
                                onChange={(e) =>
                                  updateAttendance(day, idx, Number(e.target.value))
                                }
                                className="w-20 px-3 py-2 rounded border border-slate-700 text-sm text-slate-100 bg-slate-900"
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 italic">No classes added</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-700/60 p-4 bg-slate-950/90">
                <h4 className="font-semibold text-slate-100 mb-3">Override classes per week</h4>
                <p className="text-sm text-slate-400 mb-3">Set how many times a subject occurs per week (optional).</p>
                <div className="space-y-3">
                  {Array.from(new Set(Object.values(timetable).flat().map((c) => c.name))).map((subject) => {
                    const daysSet = new Set<string>();
                    Object.entries(timetable).forEach(([day, classes]) => {
                      if (classes.some((c) => c.name === subject)) daysSet.add(day);
                    });
                    const defaultCount = daysSet.size || 1;
                    return (
                      <div key={subject} className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-slate-100">{subject}</p>
                        </div>
                        <div className="w-40">
                          <label className="text-xs text-slate-600">Classes / week</label>
                          <input
                            type="number"
                            min={1}
                            value={subjectWeeklyCounts[subject] ?? defaultCount}
                            onChange={(e) => updateSubjectWeeklyCount(subject, Math.max(1, Number(e.target.value) || defaultCount))}
                            className="w-full px-3 py-2 rounded border border-slate-600 text-sm text-slate-100 bg-slate-900"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setStep("results")}
                className="w-full px-6 py-3 rounded-lg bg-slate-700 text-slate-100 font-semibold hover:bg-slate-600 transition-all duration-300"
              >
                Save Changes
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
