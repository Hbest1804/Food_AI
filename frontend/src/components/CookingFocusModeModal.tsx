import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Bell,
  ChefHat,
  Flame,
  Award,
  Sparkles,
  Leaf,
} from 'lucide-react';

export const CookingFocusModeModal: React.FC = () => {
  const { cookingDish, setCookingDish, recordCookedMeal } = useApp();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerAlert, setTimerAlert] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('Trưa');

  const steps = cookingDish?.steps || [];
  const currentStep = steps[currentStepIndex];
  const initialDuration = (currentStep?.durationMinutes || 5) * 60;

  // Set timer when step changes
  useEffect(() => {
    if (currentStep?.durationMinutes) {
      setSecondsRemaining(currentStep.durationMinutes * 60);
    } else {
      setSecondsRemaining(300); // 5 mins default
    }
    setIsTimerRunning(false);
    setTimerAlert(false);
  }, [currentStepIndex, currentStep]);

  // Timer countdown loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setTimerAlert(true);
      // Play web audio chime if supported
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
      } catch (e) {
        console.log('AudioContext notification');
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsRemaining]);

  if (!cookingDish || !currentStep) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = initialDuration > 0
    ? Math.max(0, Math.min(100, Math.round(((initialDuration - secondsRemaining) / initialDuration) * 100)))
    : 0;

  const handleFinishCooking = () => {
    recordCookedMeal(cookingDish, selectedMealType);
    setIsCompleted(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl text-white flex flex-col justify-between overflow-y-auto animate-in fade-in">
      {/* Top Bar with serene teal accents */}
      <div className="p-4 sm:p-6 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-800 text-emerald-300 flex items-center justify-center shadow-md">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Chế Độ Nấu Ăn Tập Trung
            </span>
            <h2 className="text-base sm:text-xl font-bold font-serif text-white truncate max-w-xs sm:max-w-md">
              {cookingDish.name}
            </h2>
          </div>
        </div>

        <button
          onClick={() => {
            setCookingDish(null);
            setIsCompleted(false);
          }}
          className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800 cursor-pointer"
          title="Thoát chế độ nấu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        {isCompleted ? (
          /* Celebratory Completion Screen with Calm Sage Styling */
          <div className="bg-slate-900/90 border border-teal-500/30 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
            {/* Ambient glows */}
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-800 text-emerald-300 flex items-center justify-center mb-6 shadow-lg shadow-teal-950/30">
              <Award className="w-10 h-10" />
            </div>

            <div className="text-xs uppercase tracking-widest font-bold text-emerald-300 mb-2 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Nấu nướng hoàn tất trọn vẹn</span>
            </div>

            <h3 className="font-serif font-bold text-2xl sm:text-4xl text-white mb-3">
              Chúc mừng bạn đã hoàn thành món ăn! 🍲
            </h3>

            <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed font-normal">
              Món <strong>{cookingDish.name}</strong> (+{cookingDish.calories} kcal) đã được lưu vào <span className="text-emerald-300 font-semibold">Nhật ký ẩm thực</span> để theo dõi dinh dưỡng trong ngày.
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  setCookingDish(null);
                  setIsCompleted(false);
                }}
                className="px-8 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm transition-all shadow-md cursor-pointer"
              >
                Trở về khám phá món ăn
              </button>
            </div>
          </div>
        ) : (
          /* Step-by-Step Cooking View */
          <div className="space-y-6">
            {/* Step indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="font-bold uppercase tracking-wider text-emerald-400">
                Bước {currentStep.stepNumber} / {steps.length}
              </span>
              <div className="flex gap-2">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentStepIndex
                        ? 'w-10 bg-teal-500'
                        : i < currentStepIndex
                        ? 'w-3.5 bg-emerald-700'
                        : 'w-3.5 bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step Instruction Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl backdrop-blur-md">
              <p className="text-xl sm:text-2xl font-serif text-slate-100 leading-relaxed font-semibold">
                {currentStep.instruction}
              </p>

              {currentStep.tip && (
                <div className="mt-8 p-4 rounded-2xl bg-teal-950/40 border border-teal-800/40 text-emerald-200 text-xs sm:text-sm flex items-start gap-3">
                  <span className="text-lg">💡</span>
                  <div>
                    <strong className="text-emerald-300">Lời khuyên của Bếp trưởng:</strong> {currentStep.tip}
                  </div>
                </div>
              )}
            </div>

            {/* Countdown Timer Widget with serene styling */}
            <div className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 ${
              timerAlert
                ? 'bg-rose-950/80 border-rose-500 shadow-xl'
                : 'bg-slate-900/90 border-slate-800 shadow-lg'
            }`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${
                    timerAlert
                      ? 'bg-rose-600 text-white'
                      : isTimerRunning
                      ? 'bg-teal-700 text-white animate-pulse'
                      : 'bg-slate-800 text-teal-400'
                  }`}>
                    <Bell className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Bộ hẹn giờ công đoạn ({currentStep.durationMinutes || 5} phút)
                    </div>
                    <div className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-white mt-1">
                      {formattedTime}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                      isTimerRunning
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-teal-700 hover:bg-teal-800 text-white'
                    }`}
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isTimerRunning ? 'Tạm dừng' : 'Bắt đầu đếm giờ'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsTimerRunning(false);
                      setTimerAlert(false);
                      setSecondsRemaining(initialDuration);
                    }}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
                    title="Đặt lại giờ"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar below timer */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-6">
                <div
                  className="h-full bg-teal-600 transition-all duration-1000 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {timerAlert && (
                <div className="mt-4 text-center text-xs sm:text-sm text-rose-300 font-bold">
                  🔔 Hết giờ công đoạn! Hãy kiểm tra món ăn trên bếp.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Step Navigation Bar */}
      {!isCompleted && (
        <div className="p-4 sm:p-6 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-4 max-w-3xl w-full mx-auto">
          <button
            onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentStepIndex === 0}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              currentStepIndex === 0
                ? 'opacity-30 cursor-not-allowed text-slate-600'
                : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Bước trước</span>
          </button>

          {currentStepIndex === steps.length - 1 ? (
            <div className="flex items-center gap-3">
              <select
                value={selectedMealType}
                onChange={(e) => setSelectedMealType(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs rounded-2xl px-3 py-3 text-slate-200 focus:outline-hidden font-medium"
              >
                <option value="Sáng">Bữa Sáng</option>
                <option value="Trưa">Bữa Trưa</option>
                <option value="Tối">Bữa Tối</option>
                <option value="Bữa phụ">Bữa Phụ</option>
              </select>

              <button
                onClick={handleFinishCooking}
                className="px-6 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Hoàn thành & Lưu nhật ký!</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
              className="px-6 py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Bước tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
