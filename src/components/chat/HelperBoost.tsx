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

// Helper drawer data
const specialQuestions = [
  "Mountain Bike you said?? Show me!",
  "Who are you?",
  "Can I see your resume?",
  "What projects are you most proud of?",
  "What are your skills?",
  "How can I reach you?",
  "What's the craziest thing you've ever done?",
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

  const handleDrawerQuestionClick = useCallback(
    (questionText: string) => {
      if (
        submitQuery &&
        !hasReachedLimit &&
        !disabledQuestions.has(questionText)
      ) {
        const now = Date.now();
        // Prevent rapid clicking of the same question
        if (
          lastClickedQuestion === questionText &&
          now - lastClickTime < 1000
        ) {
          console.log(
            "[HelperBoost] Rapid click blocked for drawer question:",
            questionText
          );
          return;
        }

        // Temporarily disable the button
        setDisabledQuestions((prev) => new Set(prev).add(questionText));

        setLastClickedQuestion(questionText);
        setLastClickTime(now);
        submitQuery(questionText);

        // Re-enable the button after 1 second
        const timeoutId = setTimeout(() => {
          setDisabledQuestions((prev) => {
            const newSet = new Set(prev);
            newSet.delete(questionText);
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
      {/* Toggle Button */}
      <div
        className={
          isVisible ? "mb-2 flex justify-center" : "mb-0 flex justify-center"
        }
      >
        <button
          onClick={toggleVisibility}
          className="text-muted-foreground hover:text-foreground hover:bg-accent/50 flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all duration-200 active:scale-95"
        >
          {isVisible ? (
            <>
              <ChevronDown size={16} strokeWidth={2} />
              <span className="font-medium">Hide suggestions</span>
            </>
          ) : (
            <>
              <ChevronUp size={16} strokeWidth={2} />
              <span className="font-medium">Show suggestions</span>
            </>
          )}
        </button>
      </div>

      {/* HelperBoost Content */}
      {isVisible && (
        <div className="w-full">
          <div
            className="flex w-full flex-wrap gap-2 md:gap-4"
            style={{ justifyContent: "safe center" }}
          >
            {questionConfig.map(({ key, color, icon: Icon }) => (
              <Button
                key={key}
                onClick={() => handleQuestionClick(key)}
                variant="outline"
                className={`h-auto min-w-[110px] flex-shrink-0 rounded-2xl border-2 px-5 py-4 shadow-sm backdrop-blur-md transition-all duration-200 hover:shadow-md ${
                  hasReachedLimit || disabledQuestions.has(key)
                    ? "border-border/50 bg-muted/50 cursor-not-allowed opacity-60"
                    : "border-border/80 hover:border-border hover:bg-accent/90 bg-background/90 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                }`}
                disabled={hasReachedLimit || disabledQuestions.has(key)}
              >
                <div className="text-foreground flex items-center gap-3">
                  <Icon size={20} strokeWidth={2.5} color={color} />
                  <span className="text-sm font-semibold tracking-wide">
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
