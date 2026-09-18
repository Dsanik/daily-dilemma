import { useState, useEffect } from "react";
import type { Dilemma, PlayMode } from "../types";
import { useDilemma } from "../hooks/useDilemma";
import { SliderChoice } from "./SliderChoice";
import { 
  WeightedChoice, 
  ThoughtFog, 
  InnerEcho, 
  BreathingChoice, 
  MentalMirror 
} from "./contemplative";
import { Typography, Card, Spacing } from "./ui";

interface DilemmaPlayerProps {
  dilemma: Dilemma;
  mode?: PlayMode;
  onComplete: (finalOption: string, mode: PlayMode) => void;
  onClose?: () => void;
}

export function DilemmaPlayer({
  dilemma,
  mode = "normal",
  onComplete,
  onClose,
}: DilemmaPlayerProps) {
  const { session, currentNode, chooseOption, advanceText } = useDilemma(dilemma, mode);
  
  const [showingEcho, setShowingEcho] = useState(false);
  const [echoData, setEchoData] = useState<{ choice: string; outcome: string } | null>(null);
  const [textVisible, setTextVisible] = useState(false);

  // Show text with contemplative delay
  useEffect(() => {
    setTextVisible(false)
    const timer = setTimeout(() => {
      setTextVisible(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [currentNode])

  // Handle choice completion with contemplative reflection
  const handleChoiceComplete = (optionId: string, nextNodeId: string) => {
    chooseOption(optionId, nextNodeId)
    
    const nextNode = dilemma.scenario.nodes[nextNodeId]
    if (nextNode?.type === "ending") {
      // Show inner echo before completing
      const choiceLabel = currentNode.type === "choice" 
        ? currentNode.options.find(opt => opt.id === optionId)?.text || optionId
        : optionId
      
      setEchoData({
        choice: choiceLabel,
        outcome: nextNode.outcome
      })
      setShowingEcho(true)
    }
  }

  const handleEchoContinue = () => {
    setShowingEcho(false)
    if (session.finished && session.finalOption) {
      onComplete(session.finalOption, mode)
    }
  }

  if (!currentNode) {
    return (
      <Card className="text-center">
        <Typography variant="body" color="muted">
          Ошибка: узел не найден
        </Typography>
        <Spacing size="sm" />
        <Typography variant="small" color="muted">
          Попробуйте перезагрузить страницу
        </Typography>
      </Card>
    );
  }

  if (showingEcho && echoData) {
    return mode === "contemplative" ? (
      <MentalMirror 
        choice={echoData.choice}
        outcome={echoData.outcome}
        onComplete={handleEchoContinue}
      />
    ) : (
      <InnerEcho 
        choice={echoData.choice}
        outcome={echoData.outcome}
        onContinue={handleEchoContinue}
      />
    )
  }

  // Contemplative interface rendering
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Close button for contemplative mode */}
      {onClose && (
        <div className="flex justify-start">
          <button
            onClick={onClose}
            className="text-sm opacity-60 calm-transition hover:opacity-100"
            style={{ color: 'var(--tg-theme-hint-color, #a0aec0)' }}
          >
            ← Назад к размышлениям
          </button>
        </div>
      )}

      {/* Contemplative mode indicator */}
      {mode === "contemplative" && (
        <Card variant="subtle" className="text-center">
          <Typography variant="caption" color="accent">
            🧘 Режим созерцания
          </Typography>
          <Spacing size="xs" />
          <Typography variant="small" color="muted">
            Нет спешки. Каждое решение имеет вес.
          </Typography>
        </Card>
      )}

      {/* Main content with thought fog effect */}
      <ThoughtFog delay={200} duration={1500}>
        <div className="space-y-6">
          {/* Text nodes */}
          {currentNode.type === "text" && textVisible && (
            <Card>
              <Typography variant="body" color="primary">
                {currentNode.text}
              </Typography>
              <Spacing size="lg" />
              <WeightedChoice onConfirm={() => advanceText()}>
                Продолжить размышление
              </WeightedChoice>
            </Card>
          )}

          {/* Choice nodes */}
          {currentNode.type === "choice" && textVisible && (
            <div className="space-y-6">
              <Card>
                <Typography variant="h3" color="primary">
                  {currentNode.text}
                </Typography>
              </Card>

              <div className="space-y-4">
                {currentNode.options.map((option) => 
                  mode === "contemplative" ? (
                    <BreathingChoice
                      key={option.id}
                      onConfirm={() => handleChoiceComplete(option.id, option.next)}
                      variant="secondary"
                      breathCycles={2}
                    >
                      <Typography variant="body">
                        {option.text}
                      </Typography>
                    </BreathingChoice>
                  ) : (
                    <WeightedChoice
                      key={option.id}
                      onConfirm={() => handleChoiceComplete(option.id, option.next)}
                      variant="secondary"
                      holdDuration={3000}
                    >
                      <Typography variant="body">
                        {option.text}
                      </Typography>
                    </WeightedChoice>
                  )
                )}
              </div>
            </div>
          )}

          {/* Slider nodes */}
          {currentNode.type === "slider" && textVisible && (
            <div className="space-y-6">
              <Card>
                <Typography variant="h3" color="primary">
                  {currentNode.text}
                </Typography>
              </Card>
              
              <SliderChoice 
                node={currentNode}
                onConfirm={(value, nodeId) => handleChoiceComplete(`slider_${value}`, nodeId)}
              />
            </div>
          )}

          {/* Dialogue nodes */}  
          {currentNode.type === "dialogue" && textVisible && (
            <Card>
              <div className="space-y-4">
                {currentNode.speaker && (
                  <Typography 
                    variant="caption" 
                    style={{ color: currentNode.speakerColor || 'var(--tg-theme-button-color, #667eea)' }}
                    className="font-semibold"
                  >
                    {currentNode.speaker}
                  </Typography>
                )}
                
                <Typography variant="body" color="primary">
                  {currentNode.text}
                </Typography>
                
                <Spacing size="md" />
                <WeightedChoice onConfirm={() => chooseOption("continue", currentNode.next)}>
                  Выслушать дальше
                </WeightedChoice>
              </div>
            </Card>
          )}
        </div>
      </ThoughtFog>
    </div>
  )
}
