import { Button } from "@/components/ui/button";
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  Laugh,
  Layers,
  UserRoundSearch,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface HelperBoostProps {
  submitQuery?: (query: string) => void;
  setInput?: (value: string) => void;
}

const questions = {
  Me: "Who are you? I want to know more about you.",
  Projects: "What are your projects? What are you working on right now?",
  Skills: "What are your skills? Give me a list of your soft and hard skills.",
  Contact: "How can I reach you?",
};

const questionConfig = [
  { key: "Me", color: "#329696", icon: Laugh },
  { key: "Projects", color: "#3E9858", icon: BriefcaseBusiness },
  { key: "Skills", color: "#856ED9", icon: Layers },
  { key: "Contact", color: "#C19433", icon: UserRoundSearch },
];

export default React.memo(function HelperBoost({
  submitQuery,
}: HelperBoostProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [lastClickedQuestion, setLastClickedQuestion] = useState<string>("");
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [disabledQuestions, setDisabledQuestions] = useState<Set<string>>(
    new Set()
  );
  const timeoutIds = useRef<Set<NodeJS.Timeout>>(new Set());

  useEffect(() => {
    return () => {
      timeoutIds.current.forEach(clearTimeout);
    };
  }, []);

  const handleQuestionClick = useCallback(
    (questionKey: string) => {
      if (submitQuery && !disabledQuestions.has(questionKey)) {
        const now = Date.now();
        if (lastClickedQuestion === questionKey && now - lastClickTime < 1000) {
          return;
        }

        setDisabledQuestions((prev) => new Set(prev).add(questionKey));

        setLastClickedQuestion(questionKey);
        setLastClickTime(now);
        submitQuery(questions[questionKey as keyof typeof questions]);

        const timeoutId = setTimeout(() => {
          setDisabledQuestions((prev) => {
            const newSet = new Set(prev);
            newSet.delete(questionKey);
            return newSet;
          });
          timeoutIds.current.delete(timeoutId);
        }, 1000);
        timeoutIds.current.add(timeoutId);
      }
    },
    [submitQuery, lastClickedQuestion, lastClickTime, disabledQuestions]
  );

  const toggleVisibility = useCallback(() => {
    setIsVisible(!isVisible);
  }, [isVisible]);

  return (
    <div className="w-full transition-all duration-300 ease-in-out">
      <div
        className={
          isVisible ? "mb-3 flex justify-center" : "mb-0 flex justify-center"
        }
      >
        <button
          onClick={toggleVisibility}
          className="text-muted-foreground hover:text-foreground hover:bg-card/10 flex items-center gap-1.5 md:gap-2 rounded-xl px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm transition-all duration-300 active:scale-95 hover:shadow-md backdrop-blur-xl border border-border/10 hover:border-border/30 bg-card/2"
        >
          {isVisible ? (
            <>
              <ChevronDown
                size={14}
                className="md:w-4 md:h-4"
                strokeWidth={2.5}
              />
              <span className="font-semibold leading-relaxed">
                Hide suggestions
              </span>
            </>
          ) : (
            <>
              <ChevronUp
                size={14}
                className="md:w-4 md:h-4"
                strokeWidth={2.5}
              />
              <span className="font-semibold leading-relaxed">
                Show suggestions
              </span>
            </>
          )}
        </button>
      </div>

      {isVisible && (
        <div className="w-full">
          <div className="flex w-full flex-wrap gap-2 md:gap-3 justify-center">
            {questionConfig.map(({ key, color, icon: Icon }) => (
              <Button
                key={key}
                onClick={() => handleQuestionClick(key)}
                variant="outline"
                className={`group h-auto min-w-[90px] md:min-w-[110px] flex-shrink-0 rounded-xl border-2 px-3 md:px-4 py-2.5 md:py-3 shadow-md backdrop-blur-xl transition-all duration-300 hover:shadow-xl ${
                  disabledQuestions.has(key)
                    ? "border-border/20 bg-muted/5 cursor-not-allowed opacity-50"
                    : "border-border/30 hover:border-border bg-card/5 hover:bg-card/15 cursor-pointer hover:scale-105 active:scale-95"
                }`}
                disabled={disabledQuestions.has(key)}
              >
                <div className="text-foreground flex items-center gap-1.5 md:gap-2">
                  <div
                    className="p-0.5 rounded-md transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon
                      size={14}
                      className="md:w-4 md:h-4"
                      strokeWidth={2.5}
                      color={color}
                    />
                  </div>
                  <span className="text-xs md:text-sm font-bold tracking-wide leading-relaxed">
                    {key}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
