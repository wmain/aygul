import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GripVertical, X, Pin, ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import { cn } from '@/lib/cn';
import {
  LessonSegment,
  LessonSegmentType,
  LessonFormat,
  SEGMENT_DISPLAY_INFO,
  QuizConfig,
  QUIZ_CARD_TYPES,
} from '@/lib/types';

interface LessonBuilderProps {
  format: LessonFormat;
  segments: LessonSegment[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove?: (index: number) => void;
  onAdd?: (type: LessonSegmentType) => void;
  quizConfig?: QuizConfig;
  onToggleQuizCard?: (key: keyof QuizConfig) => void;
}

interface SegmentPillProps {
  segment: LessonSegment;
  index: number;
  isCustom: boolean;
  onRemove?: () => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  totalCount: number;
  isPositionLocked?: boolean;
}

function SegmentPill({
  segment,
  index,
  isCustom,
  onRemove,
  onReorder,
  totalCount,
  isPositionLocked = false,
}: SegmentPillProps) {
  const info = SEGMENT_DISPLAY_INFO[segment.type];
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);

  // Check if this is a position-locked segment type (welcome or quiz)
  const isLockedType = segment.type === 'welcome' || segment.type === 'quiz';
  const canDrag = isCustom && !isLockedType;

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleReorder = useCallback(
    (from: number, to: number) => {
      if (onReorder) {
        onReorder(from, to);
      }
    },
    [onReorder]
  );

  const panGesture = Gesture.Pan()
    .enabled(canDrag)
    .onStart(() => {
      scale.value = withSpring(1.05);
      zIndex.value = 100;
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      const ITEM_HEIGHT = 44;
      const moveBy = Math.round(translateY.value / ITEM_HEIGHT);
      const newIndex = Math.max(0, Math.min(totalCount - 1, index + moveBy));

      if (newIndex !== index) {
        runOnJS(handleReorder)(index, newIndex);
      }

      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle} className="mb-2">
        <View
          className="flex-row items-center rounded-full px-3 py-2"
          style={{
            backgroundColor: isLockedType ? info.color : info.color + '20',
          }}
        >
          {/* Show pin icon for locked segments, drag grip for others */}
          {isCustom && isLockedType && (
            <View className="mr-2 opacity-80">
              <Pin size={14} color="white" />
            </View>
          )}
          {canDrag && (
            <View className="mr-2 opacity-60">
              <GripVertical size={16} color={info.color} />
            </View>
          )}
          <View
            className="w-2.5 h-2.5 rounded-full mr-2"
            style={{ backgroundColor: isLockedType ? 'white' : info.color }}
          />
          <Text
            className="text-sm font-medium flex-1"
            style={{ color: isLockedType ? 'white' : info.color }}
          >
            {info.label}
          </Text>
          {isCustom && onRemove && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRemove();
              }}
              className="ml-2 p-1"
              hitSlop={8}
            >
              <X size={14} color={isLockedType ? 'white' : info.color} />
            </Pressable>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// Regular segments that can be added multiple times and reordered
const AVAILABLE_SEGMENT_TYPES: LessonSegmentType[] = [
  'vocabulary',
  'slow_dialogue',
  'breakdown',
  'natural_speed',
  'cultural_note',
];

// Special segments that are position-locked (welcome at start, quiz at end)
const SPECIAL_SEGMENT_TYPES: LessonSegmentType[] = ['welcome', 'quiz'];

export default function LessonBuilder({
  format,
  segments,
  onReorder,
  onRemove,
  onAdd,
  quizConfig,
  onToggleQuizCard,
}: LessonBuilderProps) {
  const isCustom = format === 'custom';
  const [isQuizExpanded, setIsQuizExpanded] = useState(false);

  // Separate welcome, quiz, and middle segments
  const welcomeSegment = segments.find((s) => s.type === 'welcome');
  const quizSegment = segments.find((s) => s.type === 'quiz');
  const middleSegments = segments.filter(
    (s) => s.type !== 'welcome' && s.type !== 'quiz'
  );

  // Get indices for removal
  const welcomeIndex = segments.findIndex((s) => s.type === 'welcome');
  const quizIndex = segments.findIndex((s) => s.type === 'quiz');

  // Check if welcome/quiz already exist (for showing/hiding add buttons)
  const hasWelcome = !!welcomeSegment;
  const hasQuiz = !!quizSegment;

  const handleAddSegment = (type: LessonSegmentType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd?.(type);
  };

  const handleToggleQuizExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsQuizExpanded(!isQuizExpanded);
  };

  const quizInfo = SEGMENT_DISPLAY_INFO.quiz;

  return (
    <View className="p-4 bg-slate-50 rounded-2xl">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-semibold text-slate-700">
          Lesson Builder
        </Text>
        {isCustom && (
          <Text className="text-xs text-slate-400">Drag to reorder</Text>
        )}
      </View>

      {/* Segments List - Welcome always first, Quiz always last */}
      <View className="mb-3">
        {/* Welcome segment (position-locked at top) */}
        {welcomeSegment && (
          <SegmentPill
            key={welcomeSegment.id}
            segment={welcomeSegment}
            index={welcomeIndex}
            isCustom={isCustom}
            onRemove={onRemove ? () => onRemove(welcomeIndex) : undefined}
            onReorder={onReorder}
            totalCount={segments.length}
            isPositionLocked
          />
        )}

        {/* Middle segments (reorderable) */}
        {middleSegments.map((segment) => {
          const originalIndex = segments.findIndex((s) => s.id === segment.id);
          return (
            <SegmentPill
              key={segment.id}
              segment={segment}
              index={originalIndex}
              isCustom={isCustom}
              onRemove={onRemove ? () => onRemove(originalIndex) : undefined}
              onReorder={onReorder}
              totalCount={segments.length}
            />
          );
        })}

        {/* Quiz segment (position-locked at bottom) with expandable config */}
        {quizSegment && (
          <View className="mb-2">
            {/* Quiz pill row */}
            <Pressable onPress={handleToggleQuizExpand}>
              <View
                className="flex-row items-center rounded-full px-3 py-2"
                style={{ backgroundColor: quizInfo.color }}
              >
                {isCustom && (
                  <View className="mr-2 opacity-80">
                    <Pin size={14} color="white" />
                  </View>
                )}
                <View
                  className="w-2.5 h-2.5 rounded-full mr-2"
                  style={{ backgroundColor: 'white' }}
                />
                <Text className="text-sm font-medium flex-1 text-white">
                  {quizInfo.label}
                </Text>
                {/* Expand/collapse chevron */}
                <View className="mr-2">
                  {isQuizExpanded ? (
                    <ChevronUp size={16} color="white" />
                  ) : (
                    <ChevronDown size={16} color="white" />
                  )}
                </View>
                {isCustom && onRemove && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onRemove(quizIndex);
                    }}
                    className="p-1"
                    hitSlop={8}
                  >
                    <X size={14} color="white" />
                  </Pressable>
                )}
              </View>
            </Pressable>

            {/* Expanded quiz options */}
            {isQuizExpanded && quizConfig && onToggleQuizCard && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                className="mt-2 ml-4 gap-1.5"
              >
                {QUIZ_CARD_TYPES.map((cardType) => (
                  <Pressable
                    key={cardType.key}
                    onPress={() => onToggleQuizCard(cardType.key)}
                    className={cn(
                      'flex-row items-center p-2.5 rounded-lg border',
                      quizConfig[cardType.key]
                        ? 'bg-red-50 border-red-200'
                        : 'bg-white border-slate-200'
                    )}
                  >
                    <View
                      className={cn(
                        'w-4 h-4 rounded-full items-center justify-center mr-2.5',
                        quizConfig[cardType.key] ? 'bg-red-500' : 'bg-slate-300'
                      )}
                    >
                      {quizConfig[cardType.key] && <Check size={10} color="white" />}
                    </View>
                    <Text
                      className={cn(
                        'font-medium text-xs',
                        quizConfig[cardType.key] ? 'text-red-700' : 'text-slate-600'
                      )}
                    >
                      {cardType.label}
                    </Text>
                  </Pressable>
                ))}
              </Animated.View>
            )}
          </View>
        )}
      </View>

      {/* Add Segment Options (Custom mode only) */}
      {isCustom && onAdd && (
        <View>
          <Text className="text-xs text-slate-500 mb-2">Add section:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
          >
            <View className="flex-row gap-2">
              {/* Special segments (Welcome/Quiz) - only show if not already added */}
              {!hasWelcome && (
                <Pressable
                  onPress={() => handleAddSegment('welcome')}
                  className="px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: SEGMENT_DISPLAY_INFO.welcome.color,
                  }}
                >
                  <Text className="text-xs font-medium text-white">
                    + {SEGMENT_DISPLAY_INFO.welcome.label}
                  </Text>
                </Pressable>
              )}
              {!hasQuiz && (
                <Pressable
                  onPress={() => handleAddSegment('quiz')}
                  className="px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: SEGMENT_DISPLAY_INFO.quiz.color,
                  }}
                >
                  <Text className="text-xs font-medium text-white">
                    + {SEGMENT_DISPLAY_INFO.quiz.label}
                  </Text>
                </Pressable>
              )}
              {/* Regular segments */}
              {AVAILABLE_SEGMENT_TYPES.map((type) => {
                const info = SEGMENT_DISPLAY_INFO[type];
                return (
                  <Pressable
                    key={type}
                    onPress={() => handleAddSegment(type)}
                    className="px-3 py-1.5 rounded-full border"
                    style={{
                      borderColor: info.color + '40',
                      backgroundColor: info.color + '10',
                    }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: info.color }}
                    >
                      + {info.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}
