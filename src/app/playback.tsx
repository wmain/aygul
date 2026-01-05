import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeInUp,
  FadeInDown,
  interpolate,
} from 'react-native-reanimated';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  BookOpen,
  MessageSquare,
  Lightbulb,
  HelpCircle,
  Globe,
  Volume2,
  ChevronDown,
  ChevronUp,
  LayoutList,
  Mic,
  Locate,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { useDialogueStore } from '@/lib/dialogue-store';
import { generateConversation, generateMockConversation, generateInstantMockConversation } from '@/lib/dialogue-service';
import type { DialogueLine, GeneratedDialogue } from '@/lib/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Map segment type strings to display info
// STRUCTURAL ARCHITECTURE: The lesson has ONE continuous audio script (foundation script).
// Every section corresponds to a portion of this foundation script.
//
// DECISION LOGIC:
// - hasAlternateView: true = Default view is restructured (flashcards, phrase cards, etc.) → needs mic icon to reveal script
// - hasAlternateView: false = Default view IS the literal script (dialogue bubbles) → no icon needed
//
// VOCABULARY: Default shows flashcards (word bold, definition). Speakers actually say explanatory text. NEEDS mic icon.
// BREAKDOWN: Default shows phrase cards with explanations. Speakers explain phrases conversationally. NEEDS mic icon.
// QUIZ: Shows quiz cards. Speakers ask questions and give answers conversationally. NEEDS mic icon.
// CULTURAL: Shows note card. Speaker narrates cultural info conversationally. NEEDS mic icon.
// CONVERSATION/SLOW/WELCOME: Default shows dialogue bubbles = literal speech. NO icon needed.
const SEGMENT_TYPE_MAP: Record<string, { label: string; color: string; icon: React.ReactNode | null; hasAlternateView: boolean }> = {
  WELCOME: { label: 'Welcome', color: '#06B6D4', icon: <MessageSquare size={14} color="#06B6D4" />, hasAlternateView: false },
  VOCAB: { label: 'Vocabulary', color: '#8B5CF6', icon: <BookOpen size={14} color="#8B5CF6" />, hasAlternateView: true },
  SLOW: { label: 'Slow Dialogue', color: '#0EA5E9', icon: <Volume2 size={14} color="#0EA5E9" />, hasAlternateView: false },
  BREAKDOWN: { label: 'Breakdown', color: '#F59E0B', icon: <Lightbulb size={14} color="#F59E0B" />, hasAlternateView: true },
  NATURAL: { label: 'Conversation', color: '#10B981', icon: <MessageSquare size={14} color="#10B981" />, hasAlternateView: false },
  // Handle alternate naming for natural speed conversation
  NATURAL_SPEED: { label: 'Conversation', color: '#10B981', icon: <MessageSquare size={14} color="#10B981" />, hasAlternateView: false },
  QUIZ: { label: 'Quiz', color: '#EF4444', icon: <HelpCircle size={14} color="#EF4444" />, hasAlternateView: true },
  CULTURAL: { label: 'Cultural Note', color: '#EC4899', icon: <Globe size={14} color="#EC4899" />, hasAlternateView: true },
};

// Section intro transcripts - REMOVED, using actual generated content instead

interface SectionHeaderProps {
  segmentType: string;
  viewMode: 'content' | 'transcript';
  onViewModeChange: (mode: 'content' | 'transcript') => void;
}

function SectionHeader({ segmentType, viewMode, onViewModeChange }: SectionHeaderProps) {
  const info = SEGMENT_TYPE_MAP[segmentType] || { label: segmentType, color: '#64748B', icon: null, hasAlternateView: false };

  // Only sections with alternate views (like Vocabulary with flashcards) show toggle icons
  // The left icon shows the alternate view (default), right icon reveals the underlying script
  const hasToggle = info.hasAlternateView;

  const handleContentPress = () => {
    if (!hasToggle) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewModeChange('content');
  };

  const handleTranscriptPress = () => {
    if (!hasToggle) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewModeChange('transcript');
  };

  // For sections with alternate views (Vocabulary):
  // - Content icon (left) shows the pedagogical view (flashcards) - default
  // - Script icon (right) reveals what's actually being spoken
  // For sections where script IS the content (Slow Dialogue, Conversation, etc.):
  // - No icons needed, just the section label

  return (
    <View className="flex-row items-center justify-center my-4 px-4">
      <View className="flex-1 h-px bg-white/20" />

      {/* Left side: Content View Toggle (only for sections with alternate views) */}
      {hasToggle ? (
        <Pressable
          onPress={handleContentPress}
          className="p-2 rounded-full ml-2"
          style={{ backgroundColor: viewMode === 'content' ? info.color + '40' : info.color + '15' }}
        >
          <LayoutList size={16} color={info.color} />
        </Pressable>
      ) : (
        <View className="w-2 ml-2" />
      )}

      {/* Section Label */}
      <View
        className="flex-row items-center mx-3 px-4 py-2 rounded-full"
        style={{ backgroundColor: info.color + '20' }}
      >
        {info.icon !== null && info.icon !== undefined ? info.icon : null}
        <Text className={cn('text-sm font-semibold', info.icon !== null && info.icon !== undefined ? 'ml-2' : '')} style={{ color: info.color }}>
          {info.label}
        </Text>
      </View>

      {/* Right side: Script View Toggle (only for sections with alternate views) */}
      {hasToggle ? (
        <Pressable
          onPress={handleTranscriptPress}
          className="p-2 rounded-full mr-2"
          style={{ backgroundColor: viewMode === 'transcript' ? info.color + '40' : info.color + '15' }}
        >
          <Mic size={16} color={info.color} />
        </Pressable>
      ) : (
        <View className="w-2 mr-2" />
      )}

      <View className="flex-1 h-px bg-white/20" />
    </View>
  );
}

// Segment info for progress bar
interface SegmentInfo {
  type: string;
  startIndex: number;
  endIndex: number;
  color: string;
  label: string;
}

interface SegmentedProgressBarProps {
  segments: SegmentInfo[];
  currentIndex: number;
  totalLines: number;
  audioProgress: number;
  onSeek: (index: number) => void;
}

function SegmentedProgressBar({
  segments,
  currentIndex,
  totalLines,
  audioProgress,
  onSeek,
}: SegmentedProgressBarProps) {
  const [tooltipSegment, setTooltipSegment] = useState<SegmentInfo | null>(null);
  const [barWidth, setBarWidth] = useState(0);

  // Handle tap/press on the bar to seek to that position
  const handleBarPress = useCallback((event: { nativeEvent: { locationX: number; pageX?: number } }) => {
    if (barWidth <= 0 || totalLines <= 0) return;

    const tapX = event.nativeEvent.locationX;

    // locationX can be 0 which is valid, so check explicitly for undefined/null
    if (tapX === undefined || tapX === null) {
      return;
    }

    const percentage = Math.max(0, Math.min(1, tapX / barWidth));
    const targetIndex = Math.floor(percentage * totalLines);
    const clampedIndex = Math.max(0, Math.min(totalLines - 1, targetIndex));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTooltipSegment(null);
    onSeek(clampedIndex);
  }, [barWidth, totalLines, onSeek]);

  const handleLongPress = useCallback((event: { nativeEvent: { locationX: number } }) => {
    if (barWidth <= 0 || totalLines <= 0) return;

    const tapX = event.nativeEvent.locationX;
    if (tapX === undefined || tapX === null) return;

    const percentage = Math.max(0, Math.min(1, tapX / barWidth));
    const targetIndex = Math.floor(percentage * totalLines);

    // Find which segment this index belongs to
    for (const segment of segments) {
      if (targetIndex >= segment.startIndex && targetIndex <= segment.endIndex) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTooltipSegment(segment);
        // Auto-hide tooltip after 2 seconds
        setTimeout(() => setTooltipSegment(null), 2000);
        return;
      }
    }
  }, [barWidth, totalLines, segments]);

  // Calculate progress position
  const progressPosition = totalLines > 0
    ? ((currentIndex + audioProgress) / totalLines) * 100
    : 0;

  // Get segment color at a specific position for the playhead
  const getSegmentAtIndex = (index: number) => {
    for (const segment of segments) {
      if (index >= segment.startIndex && index <= segment.endIndex) {
        return segment;
      }
    }
    return segments[0];
  };

  const currentSegment = getSegmentAtIndex(currentIndex);

  return (
    <View className="relative">
      {/* Tooltip */}
      {tooltipSegment && (
        <Animated.View
          entering={FadeIn.duration(150)}
          className="absolute -top-10 left-0 right-0 items-center z-10"
        >
          <View
            className="px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: tooltipSegment.color }}
          >
            <Text className="text-white text-xs font-medium">{tooltipSegment.label}</Text>
          </View>
          <View
            className="w-0 h-0"
            style={{
              borderLeftWidth: 6,
              borderRightWidth: 6,
              borderTopWidth: 6,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: tooltipSegment.color,
            }}
          />
        </Animated.View>
      )}

      {/* Segmented bar - single pressable wrapper */}
      <Pressable
        onPress={handleBarPress}
        onLongPress={handleLongPress}
        delayLongPress={400}
        onLayout={(e) => {
          setBarWidth(e.nativeEvent.layout.width);
        }}
      >
        <View className="flex-row h-4 rounded-full overflow-hidden bg-white/10">
          {segments.map((segment, idx) => {
            const segmentEnd = totalLines > 0 ? ((segment.endIndex + 1) / totalLines) * 100 : 0;
            const segmentStart = totalLines > 0 ? (segment.startIndex / totalLines) * 100 : 0;
            const segmentWidth = Math.max(0, segmentEnd - segmentStart);

            // Check if current progress is in this segment
            const isActive = currentIndex >= segment.startIndex && currentIndex <= segment.endIndex;

            return (
              <View
                key={`${segment.type}-${idx}`}
                style={{
                  width: `${segmentWidth}%`,
                  backgroundColor: segment.color + (isActive ? 'FF' : '80'),
                  marginRight: idx < segments.length - 1 ? 1 : 0,
                }}
                className="h-full"
              />
            );
          })}
        </View>
      </Pressable>

      {/* Progress indicator / playhead */}
      <View
        className="absolute top-0 h-4 w-1.5 rounded-full"
        style={{
          left: `${Math.min(progressPosition, 99)}%`,
          backgroundColor: currentSegment?.color || '#FFF',
          borderWidth: 1,
          borderColor: '#FFF',
          shadowColor: '#FFF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 4,
        }}
        pointerEvents="none"
      />
    </View>
  );
}

interface VocabularyCardProps {
  line: DialogueLine;
  isActive: boolean;
  isPast: boolean;
  onPlayPress: () => void;
}

function VocabularyCard({ line, isActive, isPast, onPlayPress }: VocabularyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const opacity = useSharedValue(isPast ? 0.4 : isActive ? 1 : 0.6);
  const scale = useSharedValue(isActive ? 1.02 : 1);

  useEffect(() => {
    opacity.value = withTiming(isPast ? 0.35 : isActive ? 1 : 0.6, { duration: 300 });
    scale.value = withSpring(isActive ? 1.02 : 1, { damping: 15, stiffness: 150 });
  }, [isActive, isPast, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Safety check: render nothing if line text is empty or just punctuation
  if (!line.text || line.text.trim() === '' || /^[.\s]+$/.test(line.text)) {
    return null;
  }

  // Parse vocabulary text - handles formats like:
  // "to go" - definition
  // 'espresso' - definition
  // word - definition
  // Key word: "phrase" - definition
  const parseVocab = (text: string) => {
    // Helper to clean punctuation from vocabulary words
    const cleanWord = (w: string) => w.trim().replace(/^[.?!,;:]+|[.?!,;:]+$/g, '');

    // First try to match quoted phrases: "word/phrase" - definition
    const quotedMatch = text.match(/(?:Key word:\s*)?["']([^"']+)["']\s*[-–]\s*(.+)/i);
    if (quotedMatch) {
      return { word: cleanWord(quotedMatch[1]), definition: quotedMatch[2].trim() };
    }
    // Fallback: unquoted word - definition (word cannot contain hyphens)
    const unquotedMatch = text.match(/(?:Key word:\s*)?([^-–]+)\s*[-–]\s*(.+)/i);
    if (unquotedMatch) {
      return { word: cleanWord(unquotedMatch[1]), definition: unquotedMatch[2].trim() };
    }
    return { word: cleanWord(text), definition: '' };
  };

  const { word, definition } = parseVocab(line.text);

  // In content mode, only show actual vocabulary entries (those with definitions)
  // Skip transition dialogue, teacher explanations, etc.
  if (!definition) {
    return null;
  }

  // Generate mock expanded data (in real app, this would come from the API)
  const expandedData = {
    pronunciation: `/${word.toLowerCase().replace(/\s+/g, '-')}/`,
    literal: definition,
    example: `"I would like to ${word.toLowerCase()}."`,
  };

  const handleCardPress = () => {
    // Tap on card jumps to this position in audio
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlayPress();
  };

  const handleExpandPress = () => {
    // Tap on "see more" expands/collapses
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  return (
    <Pressable onPress={handleCardPress}>
      <Animated.View
        style={animatedStyle}
        className={cn(
          'mx-4 mb-3 rounded-2xl border overflow-hidden',
          isActive ? 'border-violet-400 bg-violet-500/20' : 'border-white/10 bg-white/5'
        )}
      >
        {/* Main Content */}
        <View className="p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text
                className={cn(
                  'text-xl font-bold mb-1',
                  isActive ? 'text-violet-300' : 'text-white/80'
                )}
              >
                {word}
              </Text>
              {definition && (
                <Text className={cn('text-base', isActive ? 'text-white/90' : 'text-white/60')}>
                  {definition}
                </Text>
              )}
            </View>
            <Pressable onPress={handleExpandPress} hitSlop={8}>
              {isExpanded ? (
                <ChevronUp size={20} color={isActive ? '#A78BFA' : '#FFFFFF50'} />
              ) : (
                <ChevronDown size={20} color={isActive ? '#A78BFA' : '#FFFFFF50'} />
              )}
            </Pressable>
          </View>

          {/* Tap hint */}
          {!isExpanded && (
            <Pressable onPress={handleExpandPress}>
              <Text className="text-xs text-violet-400/50 mt-2">Tap to see more</Text>
            </Pressable>
          )}
        </View>

        {/* Expanded Content */}
        {isExpanded && (
          <Animated.View
            entering={FadeInDown.duration(200)}
            className="px-4 pb-4 pt-2 border-t border-violet-500/20"
          >
            <View className="space-y-3">
              <View className="flex-row items-center">
                <Text className="text-violet-400 text-xs font-semibold w-24">Pronunciation</Text>
                <Text className="text-white/70 text-sm italic">{expandedData.pronunciation}</Text>
              </View>
              <View className="flex-row items-start mt-2">
                <Text className="text-violet-400 text-xs font-semibold w-24">Translation</Text>
                <Text className="text-white/70 text-sm flex-1">{expandedData.literal}</Text>
              </View>
              <View className="flex-row items-start mt-2">
                <Text className="text-violet-400 text-xs font-semibold w-24">Example</Text>
                <Text className="text-white/70 text-sm italic flex-1">{expandedData.example}</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

interface DialogueBubbleProps {
  line: DialogueLine;
  isActive: boolean;
  isPast: boolean;
  speakerName: string;
  onPlayPress: () => void;
  isSlow?: boolean;
  allowExpand?: boolean;
}

function DialogueBubble({ line, isActive, isPast, speakerName, onPlayPress, isSlow, allowExpand = true }: DialogueBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const opacity = useSharedValue(isPast ? 0.4 : isActive ? 1 : 0.5);
  const scale = useSharedValue(isActive ? 1.02 : 1);

  useEffect(() => {
    opacity.value = withTiming(isPast ? 0.35 : isActive ? 1 : 0.5, { duration: 300 });
    scale.value = withSpring(isActive ? 1.02 : 1, { damping: 15, stiffness: 150 });
  }, [isActive, isPast, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Safety check: render nothing if line text is empty or just punctuation
  if (!line.text || line.text.trim() === '' || /^[.\s]+$/.test(line.text)) {
    return null;
  }

  const isSpeaker1 = line.speakerId === 1;
  const accentColor = isSlow ? '#0EA5E9' : (isSpeaker1 ? '#22D3EE' : '#A855F7');

  // Generate mock breakdown data (only used if allowExpand is true)
  const words = line.text.split(' ').slice(0, 5);
  const wordBreakdown = words.map((w) => ({
    word: w.replace(/[.,!?]/g, ''),
    meaning: `(${w.toLowerCase().replace(/[.,!?]/g, '')})`,
  }));

  const handleCardPress = () => {
    // Tap on card jumps to this position in audio
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlayPress();
  };

  const handleExpandPress = () => {
    if (!allowExpand) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  return (
    <Pressable onPress={handleCardPress}>
      <Animated.View
        style={animatedStyle}
        className={cn(
          'rounded-2xl mx-4 mb-3 overflow-hidden',
          isActive
            ? isSpeaker1
              ? (isSlow ? 'bg-sky-500/20' : 'bg-cyan-500/20')
              : 'bg-purple-500/20'
            : 'bg-white/5'
        )}
      >
        <View className="px-5 py-3">
          <View className="flex-row items-center mb-1">
            <View
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: accentColor }}
            />
            <Text
              className={cn(
                'text-sm font-medium flex-1',
                isActive ? 'text-white/90' : 'text-white/50'
              )}
              style={isActive ? { color: accentColor } : undefined}
            >
              {speakerName}
            </Text>
            {isSlow && (
              <View className="ml-2 px-2 py-0.5 rounded bg-sky-500/30">
                <Text className="text-xs text-sky-300">SLOW</Text>
              </View>
            )}
            {allowExpand && (
              <Pressable onPress={handleExpandPress} hitSlop={8}>
                {isExpanded ? (
                  <ChevronUp size={16} color={accentColor} />
                ) : (
                  <ChevronDown size={16} color={isActive ? accentColor : '#FFFFFF30'} />
                )}
              </Pressable>
            )}
          </View>
          <Text
            className={cn(
              'text-lg leading-7',
              isActive ? 'text-white font-semibold' : 'text-white/70'
            )}
          >
            {line.text}
          </Text>

          {allowExpand && !isExpanded && isActive && (
            <Pressable onPress={handleExpandPress}>
              <Text className="text-xs mt-1" style={{ color: accentColor + '60' }}>
                Tap to see breakdown
              </Text>
            </Pressable>
          )}
        </View>

        {/* Expanded Content - only if allowExpand is true */}
        {allowExpand && isExpanded && (
          <Animated.View
            entering={FadeInDown.duration(200)}
            className="px-5 pb-4 pt-2 border-t"
            style={{ borderTopColor: accentColor + '30' }}
          >
            {/* Word-by-word breakdown */}
            <Text className="text-xs font-semibold mb-2" style={{ color: accentColor }}>
              Word Breakdown
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {wordBreakdown.map((item, idx) => (
                <View key={idx} className="bg-white/5 rounded-lg px-2 py-1">
                  <Text className="text-white/90 text-sm font-medium">{item.word}</Text>
                  <Text className="text-white/50 text-xs">{item.meaning}</Text>
                </View>
              ))}
            </View>

            {/* Translation */}
            <View className="bg-white/5 rounded-lg p-3">
              <Text className="text-xs font-semibold mb-1" style={{ color: accentColor }}>
                Literal Translation
              </Text>
              <Text className="text-white/70 text-sm italic">{line.text}</Text>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

interface BreakdownCardProps {
  line: DialogueLine;
  isActive: boolean;
  isPast: boolean;
  onPlayPress: () => void;
}

function BreakdownCard({ line, isActive, isPast, onPlayPress }: BreakdownCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const opacity = useSharedValue(isPast ? 0.4 : isActive ? 1 : 0.6);
  const scale = useSharedValue(isActive ? 1.02 : 1);

  useEffect(() => {
    opacity.value = withTiming(isPast ? 0.35 : isActive ? 1 : 0.6, { duration: 300 });
    scale.value = withSpring(isActive ? 1.02 : 1, { damping: 15, stiffness: 150 });
  }, [isActive, isPast, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Safety check: render nothing if line text is empty or just punctuation
  if (!line.text || line.text.trim() === '' || /^[.\s]+$/.test(line.text)) {
    return null;
  }

  const parseBreakdown = (text: string) => {
    const quoteMatch = text.match(/["']([^"']+)["']\s*[-–]?\s*(.+)/);
    if (quoteMatch) {
      return { phrase: quoteMatch[1], explanation: quoteMatch[2] };
    }
    return { phrase: '', explanation: text };
  };

  const { phrase, explanation } = parseBreakdown(line.text);

  // In content mode, only show lines with a proper phrase structure
  // Skip transition dialogue lines that don't have "phrase - explanation" format
  if (!phrase) {
    return null;
  }

  // Mock alternative phrases
  const alternatives = phrase ? [
    `Another way: "Could you ${phrase.toLowerCase().split(' ')[0]}..."`,
    `Formal: "Would you mind ${phrase.toLowerCase().split(' ')[0]}..."`,
  ] : [];

  const commonMistakes = phrase ? [
    `Don't confuse with similar sounding words`,
    `Pay attention to the tone/formality level`,
  ] : [];

  const handleCardPress = () => {
    // Tap on card jumps to this position in audio
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlayPress();
  };

  const handleExpandPress = () => {
    // Tap on expand area toggles expanded content
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  return (
    <Pressable onPress={handleCardPress}>
      <Animated.View
        style={[
          animatedStyle,
          { borderLeftColor: isActive ? '#F59E0B' : '#F59E0B50', borderLeftWidth: 4 }
        ]}
        className={cn(
          'mx-4 mb-3 rounded-2xl overflow-hidden',
          isActive ? 'bg-amber-500/15' : 'bg-white/5'
        )}
      >
        <View className="p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              {phrase && (
                <Text
                  className={cn(
                    'text-lg font-semibold mb-1',
                    isActive ? 'text-amber-300' : 'text-amber-400/70'
                  )}
                >
                  {`"${phrase}"`}
                </Text>
              )}
              <Text className={cn('text-base', isActive ? 'text-white/90' : 'text-white/60')}>
                {explanation}
              </Text>
            </View>
            <Pressable onPress={handleExpandPress} hitSlop={8}>
              {isExpanded ? (
                <ChevronUp size={20} color={isActive ? '#FBBF24' : '#FBBF2450'} />
              ) : (
                <ChevronDown size={20} color={isActive ? '#FBBF24' : '#FBBF2450'} />
              )}
            </Pressable>
          </View>

          {!isExpanded && (
            <Pressable onPress={handleExpandPress}>
              <Text className="text-xs text-amber-400/50 mt-2">Tap for alternatives</Text>
            </Pressable>
          )}
        </View>

        {/* Expanded Content */}
        {isExpanded && (
          <Animated.View
            entering={FadeInDown.duration(200)}
            className="px-4 pb-4 pt-2 border-t border-amber-500/20"
          >
            {/* Alternative ways */}
            <Text className="text-xs font-semibold text-amber-400 mb-2">
              Alternative Expressions
            </Text>
            {alternatives.map((alt, idx) => (
              <View key={idx} className="bg-amber-500/10 rounded-lg p-2 mb-2">
                <Text className="text-white/70 text-sm">{alt}</Text>
              </View>
            ))}

            {/* Common mistakes */}
            <Text className="text-xs font-semibold text-red-400 mt-3 mb-2">
              Common Mistakes to Avoid
            </Text>
            {commonMistakes.map((mistake, idx) => (
              <View key={idx} className="flex-row items-start mb-1">
                <Text className="text-red-400 mr-2">•</Text>
                <Text className="text-white/60 text-sm flex-1">{mistake}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

interface QuizFlashcardProps {
  question: string;
  answer: string;
  isActive: boolean;
  isPast: boolean;
  onPlayPress: () => void;
}

function QuizFlashcard({ question, answer, isActive, isPast, onPlayPress }: QuizFlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipRotation = useSharedValue(0);
  const opacity = useSharedValue(isPast ? 0.4 : isActive ? 1 : 0.6);
  const scale = useSharedValue(isActive ? 1.02 : 1);

  useEffect(() => {
    opacity.value = withTiming(isPast ? 0.35 : isActive ? 1 : 0.6, { duration: 300 });
    scale.value = withSpring(isActive ? 1.02 : 1, { damping: 15, stiffness: 150 });
  }, [isActive, isPast, opacity, scale]);

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newFlipped = !isFlipped;
    setIsFlipped(newFlipped);
    flipRotation.value = withSpring(newFlipped ? 180 : 0, {
      damping: 15,
      stiffness: 100,
    });
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [0, 180]);
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      backfaceVisibility: 'hidden' as const,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [180, 360]);
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      backfaceVisibility: 'hidden' as const,
    };
  });

  const cardHeight = 180;

  return (
    <Pressable onPress={handleFlip} onLongPress={onPlayPress}>
      <View className="mx-4 mb-4" style={{ height: cardHeight }}>
        {/* Front of card - Question */}
        <Animated.View
          style={[frontAnimatedStyle, { position: 'absolute', width: '100%', height: '100%' }]}
          className={cn(
            'rounded-3xl p-6 justify-center items-center',
            'border-2',
            isActive
              ? 'bg-red-500/20 border-red-400/60'
              : 'bg-slate-800/80 border-slate-600/40'
          )}
        >
          {/* Card texture/pattern for physical feel */}
          <View className="absolute top-3 left-3">
            <HelpCircle size={20} color={isActive ? '#F87171' : '#F8717160'} />
          </View>
          <View className="absolute bottom-3 right-3">
            <Text className="text-slate-500 text-xs">Tap to flip</Text>
          </View>

          <Text
            className={cn(
              'text-center text-xl font-semibold px-4',
              isActive ? 'text-white' : 'text-white/80'
            )}
            numberOfLines={4}
          >
            {question}
          </Text>
        </Animated.View>

        {/* Back of card - Answer */}
        <Animated.View
          style={[backAnimatedStyle, { position: 'absolute', width: '100%', height: '100%' }]}
          className={cn(
            'rounded-3xl p-6 justify-center items-center',
            'border-2',
            isActive
              ? 'bg-emerald-500/20 border-emerald-400/60'
              : 'bg-slate-800/80 border-slate-600/40'
          )}
        >
          {/* Card texture/pattern for physical feel */}
          <View className="absolute top-3 left-3">
            <View className="px-2 py-1 rounded bg-emerald-500/30">
              <Text className="text-xs font-semibold text-emerald-300">ANSWER</Text>
            </View>
          </View>
          <View className="absolute bottom-3 right-3">
            <Text className="text-slate-500 text-xs">Tap to flip back</Text>
          </View>

          <Text
            className={cn(
              'text-center text-lg font-medium px-4',
              isActive ? 'text-white' : 'text-white/80'
            )}
            numberOfLines={5}
          >
            {answer}
          </Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

interface QuizCardProps {
  line: DialogueLine;
  isActive: boolean;
  isPast: boolean;
  onPlayPress: () => void;
}

function QuizCard({ line, isActive, isPast, onPlayPress }: QuizCardProps) {
  const opacity = useSharedValue(isPast ? 0.4 : isActive ? 1 : 0.6);
  const scale = useSharedValue(isActive ? 1.02 : 1);

  useEffect(() => {
    opacity.value = withTiming(isPast ? 0.35 : isActive ? 1 : 0.6, { duration: 300 });
    scale.value = withSpring(isActive ? 1.02 : 1, { damping: 15, stiffness: 150 });
  }, [isActive, isPast, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Safety check: render nothing if line text is empty or just punctuation
  if (!line.text || line.text.trim() === '' || /^[.\s]+$/.test(line.text)) {
    return null;
  }

  const handleCardPress = () => {
    // Tap on card jumps to this position in audio
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlayPress();
  };

  // QuizCard is used for standalone/unpaired quiz items - just display the text
  return (
    <Pressable onPress={handleCardPress}>
      <Animated.View
        style={animatedStyle}
        className={cn(
          'mx-4 mb-3 p-4 rounded-2xl',
          isActive ? 'bg-red-500/20 border border-red-400/50' : 'bg-red-500/10 border border-red-500/20'
        )}
      >
        <View className="flex-row items-center mb-2">
          <View className="px-2 py-1 rounded bg-red-500/30 mr-2">
            <Text className="text-xs font-semibold text-red-300">QUIZ</Text>
          </View>
          <HelpCircle size={16} color={isActive ? '#F87171' : '#F8717180'} />
        </View>
        <Text
          className={cn(
            'text-base',
            isActive ? 'text-white font-medium' : 'text-white/70'
          )}
        >
          {line.text}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

interface CulturalNoteProps {
  line: DialogueLine;
  isActive: boolean;
  isPast: boolean;
  onPlayPress: () => void;
}

function CulturalNote({ line, isActive, isPast, onPlayPress }: CulturalNoteProps) {
  const opacity = useSharedValue(isPast ? 0.4 : isActive ? 1 : 0.6);
  const scale = useSharedValue(isActive ? 1.02 : 1);

  useEffect(() => {
    opacity.value = withTiming(isPast ? 0.35 : isActive ? 1 : 0.6, { duration: 300 });
    scale.value = withSpring(isActive ? 1.02 : 1, { damping: 15, stiffness: 150 });
  }, [isActive, isPast, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Safety check: render nothing if line text is empty or just punctuation
  if (!line.text || line.text.trim() === '' || /^[.\s]+$/.test(line.text)) {
    return null;
  }

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlayPress();
  };

  return (
    <Pressable onPress={handlePlay}>
      <Animated.View
        style={animatedStyle}
        className={cn(
          'mx-4 mb-3 p-4 rounded-2xl',
          isActive ? 'bg-pink-500/20 border border-pink-400/50' : 'bg-pink-500/10 border border-pink-500/20'
        )}
      >
        <View className="flex-row items-center mb-2">
          <Globe size={16} color={isActive ? '#EC4899' : '#EC489980'} />
          <Text
            className={cn(
              'ml-2 text-sm font-semibold',
              isActive ? 'text-pink-300' : 'text-pink-400/70'
            )}
          >
            Cultural Insight
          </Text>
        </View>
        <Text className={cn('text-base', isActive ? 'text-white/90' : 'text-white/60')}>
          {line.text.replace(/^Cultural Tip:\s*/i, '')}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function PlaybackScreen() {
  const router = useRouter();
  const { mock } = useLocalSearchParams<{ mock?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  // Audio player using expo-audio hook
  const audioPlayer = useAudioPlayer(null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  const lastPlayedIndexRef = useRef(-1);

  const config = useDialogueStore((s) => s.config);
  const dialogue = useDialogueStore((s) => s.dialogue);
  const setDialogue = useDialogueStore((s) => s.setDialogue);
  const setCachedLesson = useDialogueStore((s) => s.setCachedLesson);
  const currentLineIndex = useDialogueStore((s) => s.currentLineIndex);
  const setCurrentLineIndex = useDialogueStore((s) => s.setCurrentLineIndex);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(-1);
  const [audioProgress, setAudioProgress] = useState(0);
  const [visibleTranscripts, setVisibleTranscripts] = useState<Set<string>>(new Set());
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const PLAYBACK_SPEEDS = [1, 0.75, 0.5];

  const isPlayingRef = useRef(false);
  const currentAudioIndexRef = useRef(-1);
  const playbackSpeedRef = useRef(1);
  const lastEffectiveIndexRef = useRef(-1);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentAudioIndexRef.current = currentAudioIndex;
  }, [currentAudioIndex]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
    // Update audio player's playback rate if available
    if (audioPlayer) {
      audioPlayer.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, audioPlayer]);

  useEffect(() => {
    // Handle instant mock mode (dev menu)
    if (mock === 'instant') {
      const result = generateInstantMockConversation(config);
      setDialogue(result);
      setCachedLesson(result);
      setCurrentLineIndex(0);
      setCurrentAudioIndex(-1);
    } else if (!dialogue) {
      generateDialogue();
    }

    setAudioModeAsync({
      playsInSilentModeIOS: true,
    });
  }, []);

  const generateDialogue = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Starting...');

    try {
      const hasOpenAI = !!process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

      let result: GeneratedDialogue;

      if (hasOpenAI) {
        result = await generateConversation(config, (progress, status) => {
          setGenerationProgress(progress);
          setGenerationStatus(status);
        });
      } else {
        console.log('Using mock dialogue (OpenAI API key not configured)');
        result = await generateMockConversation(config, (progress, status) => {
          setGenerationProgress(progress);
          setGenerationStatus(status);
        });
      }

      setDialogue(result);
      setCachedLesson(result); // Cache for dev menu replay
      setCurrentLineIndex(0);
      setCurrentAudioIndex(-1);
    } catch (error) {
      console.error('Failed to generate dialogue:', error);
      const result = await generateMockConversation(config, (progress, status) => {
        setGenerationProgress(progress);
        setGenerationStatus(status);
      });
      setDialogue(result);
      setCachedLesson(result); // Cache even on error fallback
      setCurrentLineIndex(0);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle manual scroll detection
  const handleScrollBeginDrag = () => {
    // User started dragging - disable auto-scroll
    setAutoScrollEnabled(false);
  };

  const playNextLine = useCallback(async () => {
    if (!dialogue) return;

    const nextIndex = currentAudioIndexRef.current + 1;
    if (nextIndex < dialogue.lines.length && isPlayingRef.current) {
      setCurrentAudioIndex(nextIndex);
      setCurrentLineIndex(nextIndex);
      await playLineAudio(nextIndex);
    } else {
      setIsPlaying(false);
      setCurrentAudioIndex(-1);
    }
  }, [dialogue]);

  const playLineAudio = async (index: number) => {
    if (!dialogue || index < 0 || index >= dialogue.lines.length) return;

    const line = dialogue.lines[index];
    if (!line) return;

    if (audioPlayerRef.current) {
      audioPlayerRef.current.remove();
      audioPlayerRef.current = null;
    }

    if (line.audioUri) {
      try {
        const player = createAudioPlayer({ uri: line.audioUri });
        audioPlayerRef.current = player;

        // Set playback rate
        player.playbackRate = playbackSpeedRef.current;

        // Start playing
        player.play();

        // Listen for playback events
        const subscription = player.addListener('playbackStatusUpdate', (status) => {
          if (status.playing === false && status.currentTime >= status.duration && status.duration > 0) {
            // Playback finished
            playNextLine();
          }
          if (status.duration > 0) {
            setAudioProgress(status.currentTime / status.duration);
          }
        });

        // Store subscription for cleanup
        player.subscription = subscription;
      } catch (error) {
        console.error('Error playing audio:', error);
        setTimeout(() => {
          if (isPlayingRef.current) {
            playNextLine();
          }
        }, line.duration || 2000);
      }
    } else {
      setTimeout(() => {
        if (isPlayingRef.current) {
          playNextLine();
        }
      }, line.duration || 2000);
    }
  };

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isPlaying) {
      setIsPlaying(false);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    } else {
      setIsPlaying(true);
      if (currentAudioIndex < 0) {
        setCurrentAudioIndex(0);
        setCurrentLineIndex(0);
        await playLineAudio(0);
      } else if (audioPlayerRef.current && audioPlayerRef.current.paused) {
        audioPlayerRef.current.play();
      } else {
        await playLineAudio(currentAudioIndex);
      }
    }
  };

  const handleReplay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // User explicitly replayed - re-enable auto-scroll
    setAutoScrollEnabled(true);

    setIsPlaying(false);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.remove();
      audioPlayerRef.current = null;
    }
    setCurrentLineIndex(0);
    setCurrentAudioIndex(-1);
    setAudioProgress(0);

    setTimeout(async () => {
      setIsPlaying(true);
      setCurrentAudioIndex(0);
      setCurrentLineIndex(0);
      await playLineAudio(0);
    }, 100);
  };

  const handleSpeedToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentIdx = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIdx = (currentIdx + 1) % PLAYBACK_SPEEDS.length;
    setPlaybackSpeed(PLAYBACK_SPEEDS[nextIdx]);
  };

  const handleAutoScrollToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newEnabled = !autoScrollEnabled;
    setAutoScrollEnabled(newEnabled);

    // If re-enabling, immediately scroll to current position
    if (newEnabled && scrollViewRef.current && effectiveActiveIndex >= 0) {
      const yOffset = Math.max(0, effectiveActiveIndex * 120 - SCREEN_HEIGHT / 2 + 60);
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
      lastEffectiveIndexRef.current = effectiveActiveIndex;
    }
  };

  const handleLinePress = async (index: number) => {
    // User tapped a specific line - do NOT re-enable auto-scroll
    // They navigated intentionally, so don't force scroll position

    if (audioPlayerRef.current) {
      audioPlayerRef.current.remove();
      audioPlayerRef.current = null;
    }

    setCurrentLineIndex(index);
    setCurrentAudioIndex(index);
    currentAudioIndexRef.current = index;

    setIsPlaying(true);
    isPlayingRef.current = true;
    await playLineAudio(index);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDialogue(null);
    router.back();
  };

  const overallProgress = dialogue
    ? (currentLineIndex + audioProgress) / dialogue.lines.length
    : 0;

  // Compute segments for the progress bar
  const progressSegments = useMemo<SegmentInfo[]>(() => {
    if (!dialogue) return [];

    const segments: SegmentInfo[] = [];
    let currentSegmentType: string | undefined;
    let segmentStartIndex = 0;

    dialogue.lines.forEach((line, index) => {
      const lineSegmentType = line.segmentType?.toUpperCase() || 'NATURAL';

      if (lineSegmentType !== currentSegmentType) {
        if (currentSegmentType !== undefined) {
          const info = SEGMENT_TYPE_MAP[currentSegmentType] || { label: currentSegmentType, color: '#64748B' };
          segments.push({
            type: currentSegmentType,
            startIndex: segmentStartIndex,
            endIndex: index - 1,
            color: info.color,
            label: info.label,
          });
        }
        currentSegmentType = lineSegmentType;
        segmentStartIndex = index;
      }
    });

    // Push the last segment
    if (currentSegmentType !== undefined) {
      const info = SEGMENT_TYPE_MAP[currentSegmentType] || { label: currentSegmentType, color: '#64748B' };
      segments.push({
        type: currentSegmentType,
        startIndex: segmentStartIndex,
        endIndex: dialogue.lines.length - 1,
        color: info.color,
        label: info.label,
      });
    }

    return segments;
  }, [dialogue]);

  // Helper to check if a line would render as a visible card in content mode
  const lineRendersInContentMode = useCallback((line: DialogueLine): boolean => {
    if (!line.text || line.text.trim() === '' || /^[.\s]+$/.test(line.text)) {
      return false;
    }
    const segmentType = line.segmentType?.toUpperCase() || 'NATURAL';

    switch (segmentType) {
      case 'VOCAB': {
        // Check if it parses as vocabulary (word - definition)
        // Try quoted format first, then unquoted
        const quotedMatch = line.text.match(/(?:Key word:\s*)?["']([^"']+)["']\s*[-–]\s*(.+)/i);
        if (quotedMatch && quotedMatch[2]?.trim()) return true;
        const unquotedMatch = line.text.match(/(?:Key word:\s*)?([^-–]+)\s*[-–]\s*(.+)/i);
        return unquotedMatch !== null && unquotedMatch[2]?.trim() !== '';
      }
      case 'BREAKDOWN': {
        // Check if it parses as breakdown ("phrase" - explanation)
        const match = line.text.match(/["']([^"']+)["']\s*[-–]?\s*(.+)/);
        return match !== null;
      }
      case 'QUIZ': {
        // In flashcard mode, questions render as visible cards (even indices in quiz section)
        // Answers are part of the question's flashcard (flip side) and don't render separately (odd indices)
        // We need to check if this line is a question (even position) or answer (odd position) within quiz lines
        // For simplicity, assume all quiz lines render and let the render function handle pairing
        return true;
      }
      case 'CULTURAL':
      case 'WELCOME':
      case 'SLOW':
      case 'NATURAL':
      case 'NATURAL_SPEED':
      default:
        // These always render
        return true;
    }
  }, []);

  // Compute effective active index - the nearest visible card to highlight
  // When teacher is speaking transition dialogue that doesn't render,
  // we highlight the nearest upcoming content card
  const getEffectiveActiveIndex = useCallback((audioIndex: number): number => {
    if (!dialogue || audioIndex < 0) return audioIndex;

    const currentLine = dialogue.lines[audioIndex];
    if (!currentLine) return audioIndex;

    const currentSegmentType = currentLine.segmentType?.toUpperCase() || 'NATURAL';

    // If in transcript mode for this segment, use exact index
    if (visibleTranscripts.has(currentSegmentType)) {
      return audioIndex;
    }

    // If current line renders, use it
    if (lineRendersInContentMode(currentLine)) {
      return audioIndex;
    }

    // Find the nearest renderable card in the same segment (look ahead first, then back)
    // Look ahead for the next card the teacher is introducing
    for (let i = audioIndex + 1; i < dialogue.lines.length; i++) {
      const line = dialogue.lines[i];
      const lineSegmentType = line.segmentType?.toUpperCase() || 'NATURAL';

      // Stop if we hit a different segment
      if (lineSegmentType !== currentSegmentType) break;

      if (lineRendersInContentMode(line)) {
        return i;
      }
    }

    // If no card ahead, look back for the most recent card
    for (let i = audioIndex - 1; i >= 0; i--) {
      const line = dialogue.lines[i];
      const lineSegmentType = line.segmentType?.toUpperCase() || 'NATURAL';

      // Stop if we hit a different segment
      if (lineSegmentType !== currentSegmentType) break;

      if (lineRendersInContentMode(line)) {
        return i;
      }
    }

    // Fallback to current index
    return audioIndex;
  }, [dialogue, visibleTranscripts, lineRendersInContentMode]);

  const handleSegmentJump = async (startIndex: number) => {
    if (!dialogue || startIndex < 0 || startIndex >= dialogue.lines.length) return;

    // User tapped progress bar - do NOT re-enable auto-scroll
    // They navigated intentionally, so don't force scroll position

    if (audioPlayerRef.current) {
      audioPlayerRef.current.remove();
      audioPlayerRef.current = null;
    }

    setCurrentLineIndex(startIndex);
    setCurrentAudioIndex(startIndex);
    currentAudioIndexRef.current = startIndex;
    setAudioProgress(0);

    // Start playing from this position
    setIsPlaying(true);
    isPlayingRef.current = true;
    await playLineAudio(startIndex);
  };

  // Compute the effective active index once for the current playback position
  const effectiveActiveIndex = useMemo(() => {
    return getEffectiveActiveIndex(currentLineIndex);
  }, [currentLineIndex, getEffectiveActiveIndex]);

  // Pre-compute quiz question/answer pairs for flashcard mode
  // Quiz lines alternate: question, answer, question, answer...
  // Maps question line index -> { question, answer, answerIndex }
  const quizPairs = useMemo(() => {
    if (!dialogue) return new Map<number, { question: string; answer: string; answerIndex: number }>();

    const pairs = new Map<number, { question: string; answer: string; answerIndex: number }>();
    const quizLines = dialogue.lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.segmentType?.toUpperCase() === 'QUIZ');

    // Quiz lines alternate: odd indices (0, 2, 4...) are questions, even indices (1, 3, 5...) are answers
    for (let i = 0; i < quizLines.length - 1; i += 2) {
      const qItem = quizLines[i];
      const aItem = quizLines[i + 1];
      if (qItem && aItem) {
        pairs.set(qItem.index, {
          question: qItem.line.text,
          answer: aItem.line.text,
          answerIndex: aItem.index
        });
      }
    }

    return pairs;
  }, [dialogue]);

  // Auto-scroll effect - only scrolls when the VISIBLE highlighted card changes
  useEffect(() => {
    if (!scrollViewRef.current || !dialogue || effectiveActiveIndex < 0 || !autoScrollEnabled) {
      return;
    }

    // Only scroll if the effective (visible) highlighted index changed
    if (effectiveActiveIndex !== lastEffectiveIndexRef.current) {
      const yOffset = Math.max(0, effectiveActiveIndex * 120 - SCREEN_HEIGHT / 2 + 60);
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
      lastEffectiveIndexRef.current = effectiveActiveIndex;
    }
  }, [effectiveActiveIndex, dialogue, autoScrollEnabled]);

  // Render line item based on segment type
  const renderLineItem = (line: DialogueLine, index: number) => {
    // Safety check: skip lines with no meaningful text
    if (!line.text || line.text.trim() === '' || /^[.\s]+$/.test(line.text)) {
      return null;
    }

    // Use effective active index for highlighting - this ensures something is always
    // highlighted even when audio is on a transition line that doesn't render
    const isActive = index === effectiveActiveIndex;
    const isPast = index < currentLineIndex;
    const segmentType = line.segmentType?.toUpperCase() || 'NATURAL';
    const speakerName = line.speakerId === 1 ? config.speaker1.name : config.speaker2.name;

    switch (segmentType) {
      case 'WELCOME':
        // Welcome section uses clean dialogue bubbles like conversation
        return (
          <DialogueBubble
            key={line.id}
            line={line}
            isActive={isActive}
            isPast={isPast}
            speakerName={speakerName}
            onPlayPress={() => handleLinePress(index)}
            allowExpand={false}
          />
        );
      case 'VOCAB':
        // Content mode: ONLY show VocabularyCard components
        // Lines that don't parse as vocabulary (word - definition) simply don't render
        // This creates a clean dictionary-like experience
        return (
          <VocabularyCard
            key={line.id}
            line={line}
            isActive={isActive}
            isPast={isPast}
            onPlayPress={() => handleLinePress(index)}
          />
        );
      case 'BREAKDOWN':
        // Content mode: ONLY show BreakdownCard components
        return (
          <BreakdownCard
            key={line.id}
            line={line}
            isActive={isActive}
            isPast={isPast}
            onPlayPress={() => handleLinePress(index)}
          />
        );
      case 'QUIZ': {
        // Flashcard mode: Pair questions with answers into flip cards
        const pair = quizPairs.get(index);

        if (pair) {
          // This is a question line with a paired answer - render as flashcard
          // Card is active if either the question or answer line is current
          const isFlashcardActive = index === effectiveActiveIndex || pair.answerIndex === effectiveActiveIndex;
          return (
            <QuizFlashcard
              key={line.id}
              question={pair.question}
              answer={pair.answer}
              isActive={isFlashcardActive}
              isPast={isPast}
              onPlayPress={() => handleLinePress(index)}
            />
          );
        }

        // Check if this is an answer line that's part of a pair (skip it - already rendered with question)
        const isAnswerInPair = Array.from(quizPairs.values()).some(p => p.answerIndex === index);
        if (isAnswerInPair) {
          return null; // Skip - this answer is rendered as part of its question's flashcard
        }

        // Render as regular QuizCard for unpaired items (transition text or standalone items)
        return (
          <QuizCard
            key={line.id}
            line={line}
            isActive={isActive}
            isPast={isPast}
            onPlayPress={() => handleLinePress(index)}
          />
        );
      }
      case 'CULTURAL':
        // Content mode: ONLY show CulturalNote components
        return (
          <CulturalNote
            key={line.id}
            line={line}
            isActive={isActive}
            isPast={isPast}
            onPlayPress={() => handleLinePress(index)}
          />
        );
      case 'SLOW':
        return (
          <DialogueBubble
            key={line.id}
            line={line}
            isActive={isActive}
            isPast={isPast}
            speakerName={speakerName}
            onPlayPress={() => handleLinePress(index)}
            isSlow
          />
        );
      default:
        // NATURAL and other types - no expansion, just clean dialogue
        return (
          <DialogueBubble
            key={line.id}
            line={line}
            isActive={isActive}
            isPast={isPast}
            speakerName={speakerName}
            onPlayPress={() => handleLinePress(index)}
            allowExpand={false}
          />
        );
    }
  };

  const setViewMode = (segmentType: string, mode: 'content' | 'transcript') => {
    setVisibleTranscripts(prev => {
      const next = new Set(prev);
      if (mode === 'transcript') {
        next.add(segmentType);
      } else {
        next.delete(segmentType);
      }
      return next;
    });
  };

  const renderLinesWithHeaders = () => {
    if (!dialogue) return null;

    const elements: React.ReactNode[] = [];
    let lastSegmentType: string | undefined;

    dialogue.lines.forEach((line, index) => {
      // Skip any lines with empty or punctuation-only text to prevent render errors
      if (!line.text || line.text.trim() === '' || /^[.\s]+$/.test(line.text)) {
        return;
      }

      const currentSegmentType = line.segmentType?.toUpperCase() || 'NATURAL';

      // Add section header when segment type changes
      if (currentSegmentType !== lastSegmentType) {
        const viewMode = visibleTranscripts.has(currentSegmentType) ? 'transcript' : 'content';
        elements.push(
          <SectionHeader
            key={`header-${index}`}
            segmentType={currentSegmentType}
            viewMode={viewMode}
            onViewModeChange={(mode) => setViewMode(currentSegmentType, mode)}
          />
        );
        lastSegmentType = currentSegmentType;
      }

      // Determine view mode for this line
      const lineViewMode = visibleTranscripts.has(currentSegmentType) ? 'transcript' : 'content';

      if (lineViewMode === 'transcript') {
        // TRANSCRIPT MODE: Render as DialogueBubble (same as Welcome/Conversation)
        // Use spokenText when available for sections like Vocabulary
        const isSpeaker1 = line.speakerId === 1;
        const speakerName = isSpeaker1 ? config.speaker1.name : config.speaker2.name;
        const isActive = index === currentLineIndex;
        const isPast = index < currentLineIndex;

        // Create line with spokenText for display if available
        const lineForDisplay: DialogueLine = {
          ...line,
          text: line.spokenText || line.text,
        };

        elements.push(
          <DialogueBubble
            key={`dialogue-${line.id}`}
            line={lineForDisplay}
            isActive={isActive}
            isPast={isPast}
            speakerName={speakerName}
            onPlayPress={() => handleLinePress(index)}
            allowExpand={false}
          />
        );
      } else {
        // CONTENT MODE: Render using the section-specific card format
        elements.push(renderLineItem(line, index));
      }
    });

    return elements;
  };

  if (isGenerating) {
    return (
      <View className="flex-1 bg-slate-900">
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#0F172A']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <Animated.View entering={FadeIn.duration(500)} className="items-center">
            <ActivityIndicator size="large" color="#22D3EE" />
            <Text className="text-white text-xl font-semibold mt-6 mb-2">
              {generationStatus}
            </Text>
            <View className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mt-4">
              <View
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${generationProgress * 100}%` }}
              />
            </View>
            <Text className="text-white/50 text-sm mt-2">
              {Math.round(generationProgress * 100)}%
            </Text>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#0F172A']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        <Animated.View
          entering={FadeInUp.duration(400)}
          className="flex-row items-center justify-between px-4 py-2"
        >
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <ChevronLeft size={24} color="white" />
          </Pressable>

          <View className="flex-1 mx-4">
            <Text className="text-white/60 text-xs text-center uppercase tracking-wider">
              Language Lesson
            </Text>
            <Text className="text-white font-semibold text-center" numberOfLines={1}>
              {config.situation}
            </Text>
          </View>

          <View className="w-10 h-10" />
        </Animated.View>

        <ScrollView
          ref={scrollViewRef}
          className="flex-1 mt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 200 }}
          onScrollBeginDrag={handleScrollBeginDrag}
        >
          {renderLinesWithHeaders()}
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 pb-8">
          <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.95)', '#0F172A']}
            style={{ position: 'absolute', top: -60, left: 0, right: 0, bottom: 0 }}
            pointerEvents="none"
          />

          {/* Segmented Progress Bar */}
          {progressSegments.length > 0 && (
            <View className="mx-4 mb-4 pt-8">
              <SegmentedProgressBar
                segments={progressSegments}
                currentIndex={currentLineIndex}
                totalLines={dialogue?.lines.length || 0}
                audioProgress={audioProgress}
                onSeek={handleSegmentJump}
              />
            </View>
          )}

          <View className="flex-row items-center justify-center gap-4">
            <Pressable
              onPress={handleReplay}
              className="w-12 h-12 rounded-full bg-white/10 items-center justify-center"
            >
              <RotateCcw size={20} color="white" />
            </Pressable>

            <Pressable
              onPress={handleAutoScrollToggle}
              className={cn(
                'w-12 h-12 rounded-full items-center justify-center',
                autoScrollEnabled ? 'bg-cyan-500/30' : 'bg-white/10'
              )}
            >
              <Locate size={20} color={autoScrollEnabled ? '#22D3EE' : '#FFFFFF60'} />
            </Pressable>

            <Pressable
              onPress={handlePlayPause}
              className="w-20 h-20 rounded-full bg-cyan-500 items-center justify-center shadow-lg"
              style={{
                shadowColor: '#22D3EE',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
              }}
            >
              {isPlaying ? (
                <Pause size={32} color="white" fill="white" />
              ) : (
                <Play size={32} color="white" fill="white" style={{ marginLeft: 4 }} />
              )}
            </Pressable>

            <Pressable
              onPress={handleSpeedToggle}
              className="w-12 h-12 rounded-full bg-white/10 items-center justify-center"
            >
              <Text className="text-white font-bold text-xs">
                {playbackSpeed === 1 ? '1x' : playbackSpeed === 0.75 ? '.75x' : '.5x'}
              </Text>
            </Pressable>

            <View className="w-12 h-12" />
          </View>

          <View className="flex-row items-center justify-center gap-6 mt-4">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-cyan-400 mr-2" />
              <Text className="text-white/60 text-sm">{config.speaker1.name} (You)</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-purple-400 mr-2" />
              <Text className="text-white/60 text-sm">{config.speaker2.name}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
