import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  Laugh,
  Layers,
  UserRoundSearch,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface HelperBoostProps {
  submitQuery?: (query: string) => void;
  setInput?: (value: string) => void;
  hasReachedLimit?: boolean;
}

const questions = {
  Me: "Who are you? I want to know more about you.",
  Projects: "What are your projects? What are you working on right now?",
  Skills: "What are your skills? Give me a list of your soft and hard skills.",
  Contact:
    'How can I reach you? What kind of project would make you say "yes" immediately?',
};

const questionConfig = [
  { key: "Me", color: "#329696", icon: Laugh },
  { key: "Projects", color: "#3E9858", icon: BriefcaseBusiness },
  { key: "Skills", color: "#856ED9", icon: Layers },
  { key: "Contact", color: "#C19433", icon: UserRoundSearch },
];

// Animated Chevron component - Simplified to prevent infinite loops
// const AnimatedChevron = () => {
//   return (
//     <div className="text-primary mb-1.5">
//       <ChevronUp size={16} />
//     </div>
//   );
// };

export default React.memo(function HelperBoost({
  submitQuery,
  setInput,
  hasReachedLimit = false,
}: HelperBoostProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [open, setOpen] = useState(false);
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
      if (
        submitQuery &&
        !hasReachedLimit &&
        !disabledQuestions.has(questionKey)
      ) {
        const now = Date.now();
        // Prevent rapid clicking of the same question
        if (lastClickedQuestion === questionKey && now - lastClickTime < 1000) {
          console.log(
            "[HelperBoost] Rapid click blocked for question:",
            questionKey
          );
          return;
        }

        // Temporarily disable the button
        setDisabledQuestions((prev) => new Set(prev).add(questionKey));

        setLastClickedQuestion(questionKey);
        setLastClickTime(now);
        submitQuery(questions[questionKey as keyof typeof questions]);

        // Re-enable the button after 1 second
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
    [
      submitQuery,
      hasReachedLimit,
      lastClickedQuestion,
      lastClickTime,
      disabledQuestions,
    ]
  );

  const toggleVisibility = useCallback(() => {
    setIsVisible(!isVisible);
  }, [isVisible]);

  return (
    <div className="w-full">
      <div
        className={
          isVisible ? "mb-3 flex justify-center" : "mb-0 flex justify-center"
        }
      >
        <button
          onClick={toggleVisibility}
          className="text-muted-foreground hover:text-foreground hover:bg-accent/60 flex items-center gap-2 md:gap-3 rounded-2xl px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm transition-all duration-300 active:scale-95 hover:shadow-md backdrop-blur-sm border border-border/30 hover:border-border/60"
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
          <div className="flex w-full flex-wrap gap-3 md:gap-4 justify-center">
            {questionConfig.map(({ key, color, icon: Icon }) => (
              <Button
                key={key}
                onClick={() => handleQuestionClick(key)}
                variant="outline"
                className={`group h-auto min-w-[100px] md:min-w-[120px] flex-shrink-0 rounded-2xl border-2 px-4 md:px-6 py-3 md:py-4 shadow-md backdrop-blur-md transition-all duration-300 hover:shadow-xl ${
                  hasReachedLimit || disabledQuestions.has(key)
                    ? "border-border/40 bg-muted/40 cursor-not-allowed opacity-50"
                    : "border-border/60 hover:border-border bg-card/80 hover:bg-card cursor-pointer hover:scale-105 active:scale-95"
                }`}
                disabled={hasReachedLimit || disabledQuestions.has(key)}
              >
                <div className="text-foreground flex items-center gap-2 md:gap-3">
                  <div
                    className="p-1 rounded-lg transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon
                      size={16}
                      className="md:w-5 md:h-5"
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
