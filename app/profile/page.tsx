'use client'

import { useEffect, useState, useCallback, useLayoutEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useRouter, usePathname } from 'next/navigation'
import UserTestResults from '@/components/evaluation/UserTestResults'
import EvaluationDataTest from '@/components/evaluation/EvaluationDataTest'
import { MessageSquare, Heart, Clock, User, UserCheck, Trophy, Target, TrendingUp, Calendar, BookOpen, Headphones, PenTool, Mic, Award, ChevronRight, BarChart3, Star, Zap, Activity, Settings } from 'lucide-react'

// Auth and UI imports
import { useSession } from "@/lib/auth-client";
import { supabase } from '@/lib/supabase'
import Loading from './loading'



const sidebarItems = [
  {
    id: 'overview',
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: <Activity className="w-5 h-5" />
  },
  {
    id: 'profile',
    label: 'Account Settings',
    shortLabel: 'Profile',
    icon: <Settings className="w-5 h-5" />
  },
  {
    id: 'progress',
    label: 'Test History',
    shortLabel: 'History',
    icon: <BarChart3 className="w-5 h-5" />
  },
  {
    id: 'evaluation-test',
    label: 'Evaluation Test',
    shortLabel: 'Eval Test',
    icon: <Zap className="w-5 h-5" />
  }
]

// Database types matching Prisma schema
interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  gender: string | null;
  createdAt: string; // Serialized as string from API
  updatedAt: string; // Serialized as string from API
}

interface TestScore {
  id: string;
  userId: string | null;
  book: string;
  module: string;
  testNumber: number;
  score: number;
  totalQuestions?: number | null; // Made optional since it might not exist
  percentage: number | null;
  ieltsBandScore: number | null;
  timeTaken: number | null;
  createdAt: string; // Serialized as string from API
  updatedAt: string; // Serialized as string from API
}

interface SpeakingEvaluationData {
  id: string; // Converted from BigInt to string for serialization
  userId: string | null;
  topic: string;
  questions: string;
  userAnswer: string;
  evaluationResponse: string;
  recordingDuration: number;
  urlLink: string | null;
  createdAt: string; // Serialized as string from API
}

interface WritingEvaluationData {
  id: string; // Converted from BigInt to string for serialization
  userId: string | null;
  taskType: string;
  question: string;
  userAnswer: string;
  evaluationResponse: string;
  wordCount: number | null;
  urlLink: string | null;
  createdAt: string; // Serialized as string from API
}

// View types for database views
interface UserTestAttempts {
  userId: string;
  book: string;
  module: string;
  testNumber: number;
  attemptCount: number;
  bestScore: number;
  bestPercentage: number | null;
  bestIeltsScore: number | null;
  latestAttempt: Date;
}

interface UserOverallStats {
  userId: string;
  email: string;
  name: string;
  gender: string | null;
  userSince: Date;
  totalTestsTaken: number | null;
  avgIeltsScore: number | null;
  bestIeltsScore: number | null;
  uniqueTestsAttempted: number | null;
  firstTestDate: Date | null;
  latestTestDate: Date | null;
}

// Computed interface for modules
interface ModuleData {
  score: number;
  level: string;
  color: string;
  attempts: number;
  bestScore: number;
  recentScores: number[];
  averageScore: number;
  improvement: string;
}

interface SpeakingData {
  total_sessions: number;
  total_likes: number;
  avg_session_duration: number;
  total_minutes: number;
  color: string;
  level: string;
  partner_history: ConversationPartner[];
  total_evaluations?: number;
  evaluations?: SpeakingEvaluationData[];
}

interface ConversationPartner {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  gender: string;
  total_sessions: number;
  total_duration: number;
  avg_session_duration: number;
  likes_received: number;
  last_conversation: string;
}

// New interfaces for speaking room data
interface SpeakingRoomData {
  id: string;
  room_code: string;
  creator_id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  participants: SpeakingRoomParticipant[];
  room_likes: SpeakingRoomLike[];
  // User's specific participation data
  user_joined_at: string;
  user_left_at: string | null;
  user_duration_minutes: number;
}

interface SpeakingRoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  left_at: string | null;
  is_online: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    gender: string | null;
  };
}

interface SpeakingRoomLike {
  id: string;
  room_id: string;
  liker_id: string;
  liked_user_id: string;
  created_at: string;
}

type ModuleScores = {
  listening: ModuleData;
  reading: ModuleData;
  speaking: SpeakingData;
  writing: WritingData;
}

interface WritingData {
  total_evaluations: number;
  task1_count: number;
  task2_count: number;
  avg_word_count: number;
  latest_evaluation: string | null;
  evaluations: WritingEvaluationData[];
  color: string;
  level: string;
}

// Helper functions for calculating band scores and levels
const calculateIeltsBandLevel = (score: number): string => {
  if (score >= 8.5) return 'Expert'
  if (score >= 7.5) return 'Very Good'
  if (score >= 6.5) return 'Good'
  if (score >= 5.5) return 'Competent'
  if (score >= 4.5) return 'Modest'
  return 'Limited'
}

const getModuleColor = (module: string): string => {
  const colors = {
    reading: 'bg-[#1A3A6E]',
    listening: 'bg-[#ff8c42]',
    speaking: 'bg-[#4f5bd5]',
    writing: 'bg-[#ffc107]'
  }
  return colors[module as keyof typeof colors] || 'bg-gray-500'
}

// Helper function to generate consistent avatar colors based on name
const getAvatarColor = (firstName: string, lastName: string) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500'
  ]
  const nameString = `${firstName}${lastName}`.toLowerCase()
  const index = nameString.charCodeAt(0) % colors.length
  return colors[index]
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [selectedModule, setSelectedModule] = useState<keyof ModuleScores | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
  })
  const [updating, setUpdating] = useState(false)

  // Data states
  const [userStats, setUserStats] = useState<UserOverallStats | null>(null)
  const [testScores, setTestScores] = useState<TestScore[]>([])
  const [speakingEvaluations, setSpeakingEvaluations] = useState<SpeakingEvaluationData[]>([])
  const [writingEvaluations, setWritingEvaluations] = useState<WritingEvaluationData[]>([])
  const [speakingRooms, setSpeakingRooms] = useState<SpeakingRoomData[]>([])
  const [moduleScores, setModuleScores] = useState<ModuleScores | null>(null)
  const [loading, setLoading] = useState(true)

  // Subscription channels for realtime updates
  const [subscriptions, setSubscriptions] = useState<any[]>([])

  const router = useRouter();
  const pathname = usePathname();

  // habib
  const {
    data: session,
    isPending, //loading state
    error, //error object
  } = useSession();

  useLayoutEffect(() => {
    if (!session && !isPending) {
      const currentPath = window.location.pathname;
      const referrer = document.referrer;

      // Don't redirect if user is coming from welcome page
      if (referrer.includes('/welcome')) {
        return;
      }

      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [session, isPending, router]);


  // Data fetching functions using Supabase
  const fetchUserStats = useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }

    try {
      const userId = session.user.id;

      // Fetch user profile
      const { data: user, error: userError } = await supabase
        .from('user')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        return;
      }

      // Fetch test scores with stats
      const { data: testScoresData, error: testScoresError } = await supabase
        .from('test_scores')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(50);

      if (testScoresError) {
        console.error('Error fetching test scores:', testScoresError);
      }

      // Fetch speaking evaluations
      const { data: speakingData, error: speakingError } = await supabase
        .from('speaking_evaluation_data')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(20);

      if (speakingError) {
        console.error('Error fetching speaking evaluations:', speakingError);
      }

      // Fetch writing evaluations
      const { data: writingData, error: writingError } = await supabase
        .from('writing_evaluation_data')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(20);

      if (writingError) {
        console.error('Error fetching writing evaluations:', writingError);
      }

      // Fetch speaking rooms data where user participated
      const { data: speakingRoomsData, error: speakingRoomsError } = await supabase
        .from('speaking_room_participants')
        .select(`
          room_id,
          joined_at,
          left_at,
          role,
          room:speaking_rooms(
            id,
            room_code,
            creator_id,
            status,
            created_at,
            started_at,
            ended_at,
            duration_seconds,
            participants:speaking_room_participants(
              id,
              user_id,
              role,
              joined_at,
              left_at,
              is_online,
              user:user(
                id,
                name,
                email,
                image,
                gender
              )
            ),
            room_likes:speaking_room_likes(
              id,
              liker_id,
              liked_user_id,
              created_at
            )
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(50);

      if (speakingRoomsError) {
        console.error('Error fetching speaking rooms:', speakingRoomsError);
      }

      // Calculate user stats from test scores
      const testScoresArray = testScoresData || [];
      const speakingArray = speakingData || [];
      const writingArray = writingData || [];

      let userStats = null;
      if (user) {
        const totalTests = testScoresArray.length;
        const avgScore = totalTests > 0
          ? testScoresArray.reduce((sum, score) => sum + (score.ielts_band_score || 0), 0) / totalTests
          : 0;
        const bestScore = totalTests > 0
          ? Math.max(...testScoresArray.map(score => score.ielts_band_score || 0))
          : 0;

        // Get unique test combinations
        const uniqueTests = new Set(testScoresArray.map(score => `${score.book}-${score.module}-${score.test_number}`));

        const firstTest = testScoresArray.length > 0 ? testScoresArray[testScoresArray.length - 1] : null;
        const latestTest = testScoresArray.length > 0 ? testScoresArray[0] : null;

        userStats = {
          userId: userId,
          email: user.email,
          name: user.name,
          gender: user.gender,
          userSince: new Date(user.createdAt),
          totalTestsTaken: totalTests,
          avgIeltsScore: avgScore,
          bestIeltsScore: bestScore,
          uniqueTestsAttempted: uniqueTests.size,
          firstTestDate: firstTest ? new Date(firstTest.createdAt) : null,
          latestTestDate: latestTest ? new Date(latestTest.createdAt) : null
        };
      }

      // Convert data for state - transform database column names to interface field names
      const serializedTestScores = testScoresArray.map(item => ({
        ...item,
        testNumber: item.test_number,
        totalQuestions: item.total_questions,
        ieltsBandScore: item.ielts_band_score,
        timeTaken: item.time_taken,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString()
      }));

      const serializedSpeakingEvaluations = speakingArray.map(item => ({
        ...item,
        id: item.id.toString(),
        createdAt: new Date(item.createdAt).toISOString()
      }));

      const serializedWritingEvaluations = writingArray.map(item => ({
        ...item,
        id: item.id.toString(),
        createdAt: new Date(item.createdAt).toISOString()
      }));

      // Process speaking rooms data
      const speakingRoomsArray = speakingRoomsData || [];
      const processedSpeakingRooms = speakingRoomsArray
        .filter(item => item.room) // Ensure room data exists
        .map(item => {
          // Calculate user's duration in this room
          const userJoinedAt = new Date(item.joined_at);
          const userLeftAt = item.left_at ? new Date(item.left_at) : new Date(); // Use current time if still in room
          const userDurationMinutes = Math.max(0, (userLeftAt.getTime() - userJoinedAt.getTime()) / (1000 * 60));

          // Type assertion to ensure proper typing
          const room = item.room as any;

          return {
            ...room,
            created_at: new Date(room.created_at).toISOString(),
            started_at: room.started_at ? new Date(room.started_at).toISOString() : null,
            ended_at: room.ended_at ? new Date(room.ended_at).toISOString() : null,
            participants: room.participants || [],
            room_likes: room.room_likes || [],
            // User's specific participation data
            user_joined_at: item.joined_at,
            user_left_at: item.left_at,
            user_duration_minutes: userDurationMinutes
          };
        });

      setUserStats(userStats);
      setTestScores(serializedTestScores);
      setSpeakingEvaluations(serializedSpeakingEvaluations);
      setWritingEvaluations(serializedWritingEvaluations);
      setSpeakingRooms(processedSpeakingRooms);

    } catch (error) {
      console.error('Error in fetchUserStats:', error);
    }
  }, [session?.user?.id]);

  const fetchTestScores = useCallback(async () => {
    // This is now handled in fetchUserStats
  }, [session?.user?.id]);

  const fetchSpeakingEvaluations = useCallback(async () => {
    // This is now handled in fetchUserStats
  }, [session?.user?.id]);

  const fetchWritingEvaluations = useCallback(async () => {
    // This is now handled in fetchUserStats
  }, [session?.user?.id]);

  // Calculate module scores from test data
  const calculateModuleScores = useCallback(() => {
    if (!testScores.length && !speakingEvaluations.length && !writingEvaluations.length && !speakingRooms.length) {
      return null;
    }

    // Reading scores
    const readingScores = testScores.filter(score => score.module === 'reading');
    const readingBestScore = readingScores.length > 0
      ? Math.max(...readingScores.map(s => s.ieltsBandScore || 0))
      : 0;
    const readingAvgScore = readingScores.length > 0
      ? readingScores.reduce((sum, s) => sum + (s.ieltsBandScore || 0), 0) / readingScores.length
      : 0;

    // Listening scores
    const listeningScores = testScores.filter(score => score.module === 'listening');
    const listeningBestScore = listeningScores.length > 0
      ? Math.max(...listeningScores.map(s => s.ieltsBandScore || 0))
      : 0;
    const listeningAvgScore = listeningScores.length > 0
      ? listeningScores.reduce((sum, s) => sum + (s.ieltsBandScore || 0), 0) / listeningScores.length
      : 0;

    // Speaking data - combine evaluations and room data with actual durations
    const totalSpeakingMinutes = speakingEvaluations.reduce((sum, evaluation) => sum + (evaluation.recordingDuration || 0), 0);
    const totalRoomMinutes = speakingRooms.reduce((sum, room) => sum + (room.user_duration_minutes || 0), 0);
    const totalMinutes = totalSpeakingMinutes + totalRoomMinutes;
    const avgSpeakingDuration = (speakingEvaluations.length + speakingRooms.length) > 0
      ? totalMinutes / (speakingEvaluations.length + speakingRooms.length)
      : 0;

    // Calculate conversation partners from speaking rooms with actual durations
    const partnerMap = new Map<string, {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url: string;
      gender: string;
      total_sessions: number;
      total_duration: number;
      likes_received: number;
      last_conversation: string;
    }>();

    speakingRooms.forEach(room => {
      room.participants?.forEach(participant => {
        if (participant.user_id !== session?.user?.id && participant.user) {
          const partnerId = participant.user.id;
          const existingPartner = partnerMap.get(partnerId);

          // Calculate actual duration this partner was in the room with the user
          const partnerJoinedAt = new Date(participant.joined_at);
          const partnerLeftAt = participant.left_at ? new Date(participant.left_at) : new Date();
          const userJoinedAt = new Date(room.user_joined_at);
          const userLeftAt = room.user_left_at ? new Date(room.user_left_at) : new Date();

          // Calculate overlap duration between user and partner
          const overlapStart = new Date(Math.max(partnerJoinedAt.getTime(), userJoinedAt.getTime()));
          const overlapEnd = new Date(Math.min(partnerLeftAt.getTime(), userLeftAt.getTime()));
          const overlapDuration = Math.max(0, (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60)); // in minutes

          const likesReceived = room.room_likes?.filter(like =>
            like.liked_user_id === partnerId && like.liker_id === session?.user?.id
          ).length || 0;

          if (existingPartner) {
            existingPartner.total_sessions += 1;
            existingPartner.total_duration += overlapDuration;
            existingPartner.likes_received += likesReceived;
            if (new Date(room.created_at) > new Date(existingPartner.last_conversation)) {
              existingPartner.last_conversation = room.created_at;
            }
          } else {
            const nameParts = participant.user.name.split(' ');
            partnerMap.set(partnerId, {
              id: partnerId,
              first_name: nameParts[0] || '',
              last_name: nameParts.slice(1).join(' ') || '',
              avatar_url: participant.user.image || '',
              gender: participant.user.gender || 'unknown',
              total_sessions: 1,
              total_duration: overlapDuration,
              likes_received: likesReceived,
              last_conversation: room.created_at
            });
          }
        }
      });
    });

    // Convert partner map to array and calculate averages
    const conversationPartners = Array.from(partnerMap.values()).map(partner => ({
      ...partner,
      avg_session_duration: partner.total_sessions > 0 ? partner.total_duration / partner.total_sessions : 0
    })).sort((a, b) => new Date(b.last_conversation).getTime() - new Date(a.last_conversation).getTime());

    // Writing data
    const task1Count = writingEvaluations.filter(evaluation => evaluation.taskType === 'task1').length;
    const task2Count = writingEvaluations.filter(evaluation => evaluation.taskType === 'task2').length;
    const avgWordCount = writingEvaluations.length > 0
      ? writingEvaluations.reduce((sum, evaluation) => sum + (evaluation.wordCount || 0), 0) / writingEvaluations.length
      : 0;

    const calculatedScores: ModuleScores = {
      reading: {
        score: readingAvgScore,
        level: calculateIeltsBandLevel(readingBestScore),
        color: getModuleColor('reading'),
        attempts: readingScores.length,
        bestScore: readingBestScore,
        recentScores: readingScores.slice(0, 4).map(s => s.ieltsBandScore || 0),
        averageScore: readingAvgScore,
        improvement: readingScores.length >= 2
          ? `${readingScores[0]?.ieltsBandScore! - readingScores[1]?.ieltsBandScore! >= 0 ? '+' : ''}${(readingScores[0]?.ieltsBandScore! - readingScores[1]?.ieltsBandScore!).toFixed(1)}`
          : '0'
      },
      listening: {
        score: listeningAvgScore,
        level: calculateIeltsBandLevel(listeningBestScore),
        color: getModuleColor('listening'),
        attempts: listeningScores.length,
        bestScore: listeningBestScore,
        recentScores: listeningScores.slice(0, 4).map(s => s.ieltsBandScore || 0),
        averageScore: listeningAvgScore,
        improvement: listeningScores.length >= 2
          ? `${listeningScores[0]?.ieltsBandScore! - listeningScores[1]?.ieltsBandScore! >= 0 ? '+' : ''}${(listeningScores[0]?.ieltsBandScore! - listeningScores[1]?.ieltsBandScore!).toFixed(1)}`
          : '0'
      },
      speaking: {
        total_sessions: speakingEvaluations.length + speakingRooms.length,
        total_likes: speakingRooms.reduce((sum, room) =>
          sum + (room.room_likes?.filter(like => like.liked_user_id === session?.user?.id).length || 0), 0),
        avg_session_duration: Math.round(avgSpeakingDuration), // Already in minutes
        total_minutes: Math.round(totalMinutes),
        color: getModuleColor('speaking'),
        level: (speakingEvaluations.length + speakingRooms.length) > 10 ? 'Advanced' :
          (speakingEvaluations.length + speakingRooms.length) > 5 ? 'Intermediate' : 'Beginner',
        partner_history: conversationPartners,
        total_evaluations: speakingEvaluations.length,
        evaluations: speakingEvaluations
      },
      writing: {
        total_evaluations: writingEvaluations.length,
        task1_count: task1Count,
        task2_count: task2Count,
        avg_word_count: Math.round(avgWordCount),
        latest_evaluation: writingEvaluations.length > 0 ? writingEvaluations[0]?.createdAt : null,
        evaluations: writingEvaluations,
        color: getModuleColor('writing'),
        level: writingEvaluations.length > 10 ? 'Advanced' : writingEvaluations.length > 5 ? 'Intermediate' : 'Beginner'
      }
    };

    // Conversation partners are now calculated from real room data above

    return calculatedScores;
  }, [testScores, speakingEvaluations, writingEvaluations, speakingRooms, session?.user?.id]);

  // Initial data loading and realtime subscriptions
  useEffect(() => {
    if (session?.user?.id) {
      setLoading(true);
      fetchUserStats().finally(() => {
        setLoading(false);
      });

      // Set up realtime subscriptions
      const userId = session.user.id;
      const channels: any[] = [];

      // Subscribe to User table changes
      const userChannel = supabase.channel('user-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user', filter: `id=eq.${userId}` },
          (payload) => {
            fetchUserStats(); // Refresh data when user changes
          }
        )
        .subscribe();
      channels.push(userChannel);

      // Subscribe to test_scores table changes
      const testScoresChannel = supabase.channel('test-scores-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'test_scores', filter: `userId=eq.${userId}` },
          (payload) => {
            fetchUserStats(); // Refresh data when test scores change
          }
        )
        .subscribe();
      channels.push(testScoresChannel);

      // Subscribe to speaking_evaluation_data table changes
      const speakingChannel = supabase.channel('speaking-evaluations-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'speaking_evaluation_data', filter: `userId=eq.${userId}` },
          (payload) => {
            fetchUserStats(); // Refresh data when speaking evaluations change
          }
        )
        .subscribe();
      channels.push(speakingChannel);

      // Subscribe to writing_evaluation_data table changes
      const writingChannel = supabase.channel('writing-evaluations-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'writing_evaluation_data', filter: `userId=eq.${userId}` },
          (payload) => {
            fetchUserStats(); // Refresh data when writing evaluations change
          }
        )
        .subscribe();
      channels.push(writingChannel);

      // Subscribe to speaking room changes
      const speakingRoomsChannel = supabase.channel('speaking-rooms-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'speaking_rooms' },
          (payload) => {
            fetchUserStats(); // Refresh data when speaking rooms change
          }
        )
        .subscribe();
      channels.push(speakingRoomsChannel);

      // Subscribe to speaking room participants changes
      const speakingRoomParticipantsChannel = supabase.channel('speaking-room-participants-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'speaking_room_participants', filter: `user_id=eq.${userId}` },
          (payload) => {
            fetchUserStats(); // Refresh data when user's room participations change
          }
        )
        .subscribe();
      channels.push(speakingRoomParticipantsChannel);

      // Store subscription channels for cleanup
      setSubscriptions(channels);

      // Cleanup function
      return () => {
        channels.forEach(channel => {
          supabase.removeChannel(channel);
        });
        setSubscriptions([]);
      };
    }
  }, [session?.user?.id, fetchUserStats]);

  // Calculate module scores when data changes
  useEffect(() => {
    const scores = calculateModuleScores();
    setModuleScores(scores);
  }, [calculateModuleScores]);

  // Initialize form data with user's current name and gender
  useEffect(() => {
    if (session?.user?.name) {
      setFormData({
        name: session.user.name,
        gender: userStats?.gender || ''
      });
    }
  }, [session?.user?.name, userStats?.gender]);

  // Provide default data to prevent null errors
  const currentModuleScores = moduleScores || {
    reading: { score: 0, level: 'Beginner', color: 'bg-[#1A3A6E]', attempts: 0, bestScore: 0, recentScores: [], averageScore: 0, improvement: '0' },
    listening: { score: 0, level: 'Beginner', color: 'bg-[#ff8c42]', attempts: 0, bestScore: 0, recentScores: [], averageScore: 0, improvement: '0' },
    speaking: { total_sessions: 0, total_likes: 0, avg_session_duration: 0, total_minutes: 0, color: 'bg-[#4f5bd5]', level: 'Beginner', partner_history: [], total_evaluations: 0, evaluations: [] },
    writing: { total_evaluations: 0, task1_count: 0, task2_count: 0, avg_word_count: 0, latest_evaluation: null, evaluations: [], color: 'bg-[#ffc107]', level: 'Beginner' }
  };

  const currentUserStats = userStats || {
    userId: session?.user?.id || '',
    email: session?.user?.email || '',
    name: session?.user?.name || '',
    gender: null,
    userSince: new Date(),
    totalTestsTaken: 0,
    avgIeltsScore: 0,
    bestIeltsScore: 0,
    uniqueTestsAttempted: 0,
    firstTestDate: null,
    latestTestDate: null
  };

  const speakingData = currentModuleScores.speaking;
  const writingData = currentModuleScores.writing;

  const calculateOverallBand = () => {
    if (!currentModuleScores) return 0;
    const listeningScore = currentModuleScores.listening.bestScore || 0
    const readingScore = currentModuleScores.reading.bestScore || 0
    if (listeningScore === 0 && readingScore === 0) return 0
    return Number(((listeningScore + readingScore) / 2).toFixed(1))
  }

  const calculateStudyHours = () => {
    return currentUserStats?.totalTestsTaken || 0
  }

  const calculateStreakDays = () => {
    return currentUserStats?.latestTestDate ? 7 : 0 // Default implementation - you could enhance this with actual streak calculation
  }

  const updateProfile = async (updatedData: { name: string; gender: string }) => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user')
        .update({
          name: updatedData.name,
          gender: updatedData.gender,
          updatedAt: new Date().toISOString()
        })
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      await updateProfile({ name: formData.name, gender: formData.gender })
      setIsEditing(false)
      // Data will be automatically refreshed via realtime subscription
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 px-8 py-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[#1A3A6E] flex items-center justify-center ring-4 ring-slate-100">
                <div className="text-2xl font-bold text-white">
                  {session?.user?.name ?
                    session.user.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)
                    : 'U'
                  }
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#4f5bd5] rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {session?.user?.name || 'User'}
              </h2>
              <p className="text-gray-600">{session?.user?.email}</p>
              <div className="flex items-center mt-2">
                <Star className="w-4 h-4 text-[#ffc107] mr-1" />
                <span className="text-sm text-[#1A3A6E] font-medium">Active Learner</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                Name
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
                className="h-12 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1A3A6E]/20 focus:border-[#1A3A6E]"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-semibold text-gray-900 mb-2">
                Gender
              </label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                disabled={!isEditing}
                className="h-12 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1A3A6E]/20 focus:border-[#1A3A6E] bg-white px-3 py-2 text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={session?.user?.email || ''}
                disabled
                className="h-12 bg-gray-50 border-gray-200 rounded-lg text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Email cannot be changed for security reasons
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-100">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="h-12 px-6 border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updating}
                    className="h-12 px-6 bg-[#1A3A6E] hover:bg-[#142d57] text-white"
                  >
                    {updating ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="h-12 px-6 bg-[#1A3A6E] hover:bg-[#142d57] text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  const renderOverviewSection = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1A3A6E] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#4f5bd5]/20 via-transparent to-[#ff8c42]/20"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {session?.user?.name || 'Student'}!
              </h1>
              <p className="text-blue-200 text-lg">Track your IELTS journey and celebrate every milestone</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#ffc107]">{calculateOverallBand()}</div>
                <div className="text-sm text-gray-300">Overall Band</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#4f5bd5]">{currentUserStats.totalTestsTaken}</div>
                <div className="text-sm text-gray-300">Tests Taken</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentUserStats.bestIeltsScore ? (
          <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#1A3A6E] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{currentUserStats.bestIeltsScore}</div>
                <div className="text-sm text-gray-600">Best Score</div>
              </div>
            </div>
          </div>
        ) : null}
        {currentUserStats.avgIeltsScore ? (
          <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#4f5bd5] flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{currentUserStats.avgIeltsScore.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Average</div>
              </div>
            </div>
          </div>
        ) : null}
        {calculateStreakDays() ? (
          <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#ff8c42] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{calculateStreakDays()}</div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>
            </div>
          </div>
        ) : null}
        {calculateStudyHours() ? (
          <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#ffc107] flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{calculateStudyHours()}h</div>
                <div className="text-sm text-gray-600">Study Time</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Skills Overview - Detailed Module Scores */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Skills Overview</h2>
          <p className="text-sm text-gray-600">Click any module for detailed analysis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {Object.entries(currentModuleScores).map(([module, data]) => (
            <Card
              key={module}
              className="bg-white shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => setSelectedModule(module as keyof ModuleScores)}
            >
              <CardHeader className="pb-2 lg:pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className={`w-8 h-8 lg:w-12 lg:h-12 rounded-lg ${data.color} flex items-center justify-center text-white font-bold text-sm lg:text-lg`}>
                      {module === 'reading' ? <BookOpen className="w-4 h-4 lg:w-6 lg:h-6" /> :
                        module === 'listening' ? <Headphones className="w-4 h-4 lg:w-6 lg:h-6" /> :
                          module === 'speaking' ? <Mic className="w-4 h-4 lg:w-6 lg:h-6" /> :
                            module === 'writing' ? <PenTool className="w-4 h-4 lg:w-6 lg:h-6" /> : null}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 capitalize text-sm lg:text-base">{module}</h3>
                      <p className="text-xs lg:text-sm text-gray-600">{data.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {module === 'speaking' ? (
                      <>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900">{(data as SpeakingData).total_sessions}</p>
                        <p className="text-xs lg:text-sm text-gray-600">Sessions</p>
                      </>
                    ) : module === 'writing' ? (
                      <>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900">{(data as WritingData).total_evaluations}</p>
                        <p className="text-xs lg:text-sm text-gray-600">Essays</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900">{(data as ModuleData).bestScore}</p>
                        <p className="text-xs lg:text-sm text-gray-600">Best Score</p>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 lg:space-y-3">
                  {module === 'speaking' ? (
                    <>
                      <div className="flex justify-between text-xs lg:text-sm">
                        <span className="text-gray-600">Total Minutes</span>
                        <span className="font-medium">{(data as SpeakingData).total_minutes}m</span>
                      </div>
                      <div className="flex justify-between text-xs lg:text-sm">
                        <span className="text-gray-600">Partners</span>
                        <span className="font-medium">{(data as SpeakingData).partner_history?.length || 0}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 lg:h-2">
                        <div
                          className={`h-1.5 lg:h-2 ${data.color} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(((data as SpeakingData).total_sessions / 50) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </>
                  ) : module === 'writing' ? (
                    <>
                      <div className="flex justify-between text-xs lg:text-sm">
                        <span className="text-gray-600">Task 1</span>
                        <span className="font-medium">{(data as WritingData).task1_count}</span>
                      </div>
                      <div className="flex justify-between text-xs lg:text-sm">
                        <span className="text-gray-600">Task 2</span>
                        <span className="font-medium">{(data as WritingData).task2_count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 lg:h-2">
                        <div
                          className={`h-1.5 lg:h-2 ${data.color} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(((data as WritingData).total_evaluations / 10) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs lg:text-sm">
                        <span className="text-gray-600">Total Tests</span>
                        <span className="font-medium">{(data as ModuleData).attempts}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 lg:h-2">
                        <div
                          className={`h-1.5 lg:h-2 ${data.color} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(((data as ModuleData).bestScore / 9) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                  <div className="text-center pt-1 lg:pt-2">
                    <span className="text-xs lg:text-sm text-[#1A3A6E] hover:text-[#4f5bd5] font-medium">Tap for details →</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Show detailed module view if selected */}
        {selectedModule && (
          <div className="space-y-6">
            {/* Back Button */}
            <Button
              onClick={() => setSelectedModule(null)}
              variant="outline"
              className="mb-4 border-[#1A3A6E] text-[#1A3A6E] hover:bg-blue-50"
            >
              ← Back to Skills Overview
            </Button>

            {selectedModule === 'speaking' ? (
              /* Speaking Module Details */
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-lg ${speakingData.color} flex items-center justify-center text-white`}>
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 capitalize">Speaking</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-4 lg:mb-6">
                    <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">Speaking Rooms</p>
                      <p className="text-xl lg:text-3xl font-bold text-gray-900">{speakingRooms.length}</p>
                    </div>
                    <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">Partners</p>
                      <p className="text-xl lg:text-3xl font-bold text-gray-900">{speakingData.partner_history?.length || 0}</p>
                    </div>
                    <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">Total Minutes</p>
                      <p className="text-xl lg:text-3xl font-bold text-gray-900">{speakingData.total_minutes}m</p>
                    </div>
                    <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">Evaluations</p>
                      <p className="text-xl lg:text-3xl font-bold text-gray-900">{speakingData.total_evaluations}</p>
                    </div>
                  </div>

                  {/* Speaking Evaluations History */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Speaking Evaluations</h3>
                    <div className="space-y-3">
                      {speakingData.evaluations && speakingData.evaluations.length > 0 ? (
                        speakingData.evaluations.slice(0, 10).map((evaluation, index) => (
                          <div key={evaluation.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900 truncate flex-1 mr-4">{evaluation.topic}</h4>
                              <span className="text-sm text-gray-500 whitespace-nowrap">{new Date(evaluation.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{evaluation.questions}</p>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Duration: {Math.round(evaluation.recordingDuration / 60)}m</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#4f5bd5] hover:text-[#3d4ab3] hover:bg-blue-50 p-1 h-auto font-medium"
                                onClick={() => {
                                  if (evaluation.urlLink) {
                                    const fullUrl = `${window.location.origin}/evaluation/speaking/${evaluation.urlLink}`;
                                    window.open(fullUrl, '_blank');
                                  }
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No speaking evaluations yet</p>
                          <p className="text-sm text-gray-400">Start practicing to see your progress</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Speaking Rooms History */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Speaking Rooms History</h3>
                    <div className="space-y-3">
                      {speakingRooms && speakingRooms.length > 0 ? (
                        speakingRooms.slice(0, 10).map((room, index) => (
                          <div key={room.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-[#4f5bd5] rounded-lg flex items-center justify-center text-white font-bold">
                                  <Mic className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">Room {room.room_code}</h4>
                                  <p className="text-sm text-gray-500 capitalize">{room.status}</p>
                                </div>
                              </div>
                              <span className="text-sm text-gray-500 whitespace-nowrap">
                                {new Date(room.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div className="text-gray-600">
                                <span className="font-medium">My Duration:</span> {
                                  room.user_duration_minutes ? `${Math.round(room.user_duration_minutes)}m` : 'N/A'
                                }
                              </div>
                              <div className="text-gray-600">
                                <span className="font-medium">Participants:</span> {room.participants?.length || 0}
                              </div>
                              <div className="text-gray-600">
                                <span className="font-medium">Likes Received:</span> {
                                  room.room_likes?.filter(like => like.liked_user_id === session?.user?.id).length || 0
                                }
                              </div>
                            </div>
                            {room.participants && room.participants.length > 1 && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="mb-2">
                                  <p className="text-sm text-gray-600 mb-1">My participation:</p>
                                  <div className="text-xs text-gray-500">
                                    Joined: {new Date(room.user_joined_at).toLocaleTimeString()} •
                                    {room.user_left_at ? ` Left: ${new Date(room.user_left_at).toLocaleTimeString()}` : ' Still active'}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">Other participants:</p>
                                <div className="flex flex-wrap gap-2">
                                  {room.participants
                                    .filter(p => p.user_id !== session?.user?.id)
                                    .slice(0, 3)
                                    .map(participant => {
                                      // Calculate overlap with user
                                      const partnerJoinedAt = new Date(participant.joined_at);
                                      const partnerLeftAt = participant.left_at ? new Date(participant.left_at) : new Date();
                                      const userJoinedAt = new Date(room.user_joined_at);
                                      const userLeftAt = room.user_left_at ? new Date(room.user_left_at) : new Date();

                                      const overlapStart = new Date(Math.max(partnerJoinedAt.getTime(), userJoinedAt.getTime()));
                                      const overlapEnd = new Date(Math.min(partnerLeftAt.getTime(), userLeftAt.getTime()));
                                      const overlapDuration = Math.max(0, (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60));

                                      return (
                                        <div key={participant.id} className="inline-flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1">
                                          <div className={`w-4 h-4 rounded-full ${getAvatarColor(participant.user.name.split(' ')[0] || '', participant.user.name.split(' ')[1] || '')} flex items-center justify-center text-white text-xs font-bold`}>
                                            {participant.user.name.charAt(0)}
                                          </div>
                                          <span className="text-xs text-gray-700">
                                            {participant.user.name.split(' ')[0]} ({Math.round(overlapDuration)}m)
                                          </span>
                                        </div>
                                      );
                                    })}
                                  {room.participants.filter(p => p.user_id !== session?.user?.id).length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{room.participants.filter(p => p.user_id !== session?.user?.id).length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Mic className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No speaking rooms yet</p>
                          <p className="text-sm text-gray-400">Join speaking practice sessions to see your history</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conversation Partners History */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation Partners</h3>
                    <div className="space-y-2 lg:space-y-3">
                      {speakingData.partner_history && speakingData.partner_history.length > 0 ? (
                        speakingData.partner_history.map((partner, index) => (
                          <div key={partner.id} className="bg-white border border-gray-200 rounded-lg p-3 lg:p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3 lg:space-x-4">
                              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full ${getAvatarColor(partner.first_name, partner.last_name)} flex items-center justify-center text-white font-semibold text-sm lg:text-base`}>
                                {partner.first_name[0]}{partner.last_name[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                  <div>
                                    <h4 className="font-medium text-gray-900 truncate">{partner.first_name} {partner.last_name}</h4>
                                    <p className="text-xs lg:text-sm text-gray-500 capitalize">{partner.gender}</p>
                                  </div>
                                  <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 mt-1 lg:mt-0">
                                    <div className="flex items-center space-x-2 lg:space-x-4 text-xs lg:text-sm text-gray-600">
                                      <span>{partner.total_sessions} session{partner.total_sessions !== 1 ? 's' : ''}</span>
                                      <span>•</span>
                                      <span>{Math.round(partner.total_duration)}m together</span>
                                      <span>•</span>
                                      <span>{partner.likes_received} like{partner.likes_received !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="text-xs lg:text-sm text-gray-500 mt-1 lg:mt-0">
                                      Last: {new Date(partner.last_conversation).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No conversation partners yet</p>
                          <p className="text-sm text-gray-400">Start speaking practice to connect with others</p>
                        </div>
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>
            ) : selectedModule === 'writing' ? (
              /* Writing Module Details */
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-lg ${writingData.color} flex items-center justify-center text-white`}>
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 capitalize">Writing</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-4 lg:mb-6">
                    <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">Total Evaluations</p>
                      <p className="text-xl lg:text-3xl font-bold text-gray-900">{writingData.total_evaluations}</p>
                    </div>
                    <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">Task 1</p>
                      <p className="text-xl lg:text-3xl font-bold text-gray-900">{writingData.task1_count}</p>
                    </div>
                    <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">Task 2</p>
                      <p className="text-xl lg:text-3xl font-bold text-gray-900">{writingData.task2_count}</p>
                    </div>
                    <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">Avg Words</p>
                      <p className="text-xl lg:text-3xl font-bold text-gray-900">{writingData.avg_word_count}</p>
                    </div>
                  </div>

                  {/* Writing Evaluations History */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Writing Evaluations</h3>
                    <div className="space-y-3">
                      {writingData.evaluations && writingData.evaluations.length > 0 ? (
                        writingData.evaluations.slice(0, 10).map((evaluation, index) => (
                          <div key={evaluation.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${evaluation.taskType === 'task1' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                  {evaluation.taskType.toUpperCase()}
                                </span>
                                <span className="text-sm text-gray-500">{new Date(evaluation.createdAt).toLocaleDateString()}</span>
                              </div>
                              <span className="text-sm text-gray-600">{evaluation.wordCount} words</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{evaluation.question}</p>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Word count: {evaluation.wordCount}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#ffc107] hover:text-[#e6ad06] hover:bg-yellow-50 p-1 h-auto font-medium"
                                onClick={() => {
                                  if (evaluation.urlLink) {
                                    const fullUrl = `${window.location.origin}/evaluation/writing/${evaluation.urlLink}`;
                                    window.open(fullUrl, '_blank');
                                  }
                                }}
                              >
                                View Feedback
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <PenTool className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No writing evaluations yet</p>
                          <p className="text-sm text-gray-400">Submit your first essay to get feedback</p>
                        </div>
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>
            ) : (
              /* Reading/Listening Module Details */
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-lg ${currentModuleScores[selectedModule]?.color} flex items-center justify-center text-white`}>
                      {selectedModule === 'reading' ? <BookOpen className="w-8 h-8" /> : <Headphones className="w-8 h-8" />}
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 capitalize">{selectedModule}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 lg:gap-6 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Best Score</p>
                      <p className="text-3xl font-bold text-gray-900">{(currentModuleScores[selectedModule] as ModuleData)?.bestScore}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Tests</p>
                      <p className="text-3xl font-bold text-gray-900">{(currentModuleScores[selectedModule] as ModuleData)?.attempts}</p>
                    </div>
                  </div>

                  {/* Test History Table */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Test History</h3>
                    {/* Debug info - remove this after testing */}
                    <div className="mb-2 text-xs text-gray-500">
                      Total test scores: {testScores.length},
                      {selectedModule} tests: {testScores.filter(score => score.module === selectedModule).length}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-200 rounded-lg">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-900">Book</th>
                            <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-900">Test</th>
                            <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-900">Score</th>
                            <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-900">IELTS Band</th>
                            <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-900">Time Taken</th>
                            <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-900">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testScores
                            .filter(score => score.module === selectedModule)
                            .slice(0, 10)
                            .map((test, index) => (
                              <tr key={test.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">{test.book}</td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">Test {test.testNumber}</td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 font-semibold">{test.score}</td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 font-semibold">{test.ieltsBandScore || 'N/A'}</td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                                  {test.timeTaken ? `${Math.floor(test.timeTaken / 60)}:${(test.timeTaken % 60).toString().padStart(2, '0')}` : 'N/A'}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                                  {new Date(test.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          {testScores.filter(score => score.module === selectedModule).length === 0 && (
                            <tr>
                              <td colSpan={6} className="border border-gray-200 px-3 py-8 text-center text-gray-500">
                                <div className="flex flex-col items-center">
                                  {selectedModule === 'reading' ? <BookOpen className="h-12 w-12 text-gray-300 mb-4" /> : <Headphones className="h-12 w-12 text-gray-300 mb-4" />}
                                  <p>No {selectedModule} tests completed yet</p>
                                  <p className="text-sm text-gray-400 mt-1">Start practicing to see your test history</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Recent Activity section removed as requested */}
    </div>
  )

  const renderModuleScores = () => (
    <div className="space-y-6">
      {selectedModule ? (
        <div className="space-y-6">
          {/* Back Button */}
          <Button
            onClick={() => setSelectedModule(null)}
            variant="outline"
            className="mb-4 border-[#1A3A6E] text-[#1A3A6E] hover:bg-blue-50"
          >
            ← Back to Modules
          </Button>

          {selectedModule === 'speaking' ? (
            /* Speaking Module Details */
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-lg ${speakingData.color} flex items-center justify-center text-white`}>
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 capitalize">Speaking</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-4 lg:mb-6">
                  <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">Total Sessions</p>
                    <p className="text-xl lg:text-3xl font-bold text-gray-900">{speakingData.total_sessions}</p>
                  </div>
                  <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">Total Likes</p>
                    <p className="text-xl lg:text-3xl font-bold text-gray-900">{speakingData.total_likes}</p>
                  </div>
                  <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">Total Minutes</p>
                    <p className="text-xl lg:text-3xl font-bold text-gray-900">{speakingData.total_minutes}m</p>
                  </div>
                  <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">Evaluations</p>
                    <p className="text-xl lg:text-3xl font-bold text-gray-900">{speakingData.total_evaluations}</p>
                  </div>
                </div>

                {/* Speaking Evaluations History */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Speaking Evaluations</h3>
                  <div className="space-y-3">
                    {speakingData.evaluations && speakingData.evaluations.length > 0 ? (
                      speakingData.evaluations.slice(0, 10).map((evaluation, index) => (
                        <div key={evaluation.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  SPEAKING
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(evaluation.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                                {evaluation.topic.length > 60
                                  ? `${evaluation.topic.substring(0, 60)}...`
                                  : evaluation.topic
                                }
                              </h4>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>Duration: {Math.floor(evaluation.recordingDuration / 60)}:{(evaluation.recordingDuration % 60).toString().padStart(2, '0')}</span>
                                <span>
                                  {new Date(evaluation.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-4 bg-[#10b981] text-white border-[#10b981] hover:bg-[#059669] hover:border-[#059669]"
                              onClick={() => window.open(`/evaluation/speaking/${evaluation.urlLink}`, '_blank')}
                            >
                              View Result
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No speaking evaluations yet</p>
                        <p className="text-sm text-gray-400">Complete your first speaking evaluation to see your history</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conversation Partners History */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation Partners</h3>
                  <div className="space-y-2 lg:space-y-3">
                    {speakingData.partner_history && speakingData.partner_history.length > 0 ? (
                      speakingData.partner_history.map((partner, index) => (
                        <div key={partner.id} className="bg-white border border-gray-200 rounded-lg p-3 lg:p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 lg:space-x-4">
                            <div className="relative">
                              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full ${getAvatarColor(partner.first_name, partner.last_name)} flex items-center justify-center overflow-hidden`}>
                                <div className="text-white font-bold text-sm lg:text-lg">
                                  {(partner.first_name?.[0] || '').toUpperCase()}{(partner.last_name?.[0] || '').toUpperCase()}
                                </div>
                              </div>
                              <div className="absolute -top-1 -right-1">
                                {partner.gender?.toLowerCase() === 'female' ? (
                                  <UserCheck className="h-3 w-3 lg:h-4 lg:w-4 text-pink-500" />
                                ) : (
                                  <User className="h-3 w-3 lg:h-4 lg:w-4 text-blue-500" />
                                )}
                              </div>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm lg:text-base font-semibold text-gray-900">
                                  {partner.first_name} {partner.last_name}
                                </h4>
                                <span className="text-xs lg:text-sm text-gray-500">
                                  {new Date(partner.last_conversation).toLocaleDateString()}
                                </span>
                              </div>

                              {/* Stats Cards */}
                              <div className="mt-2 lg:mt-3 grid grid-cols-2 lg:grid-cols-3 gap-1 lg:gap-2">

                                {/* Sessions Row */}
                                <div className="flex items-center justify-between p-1.5 lg:p-2 bg-gray-50 rounded-lg border">
                                  <div className="flex items-center space-x-1">
                                    <MessageSquare className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-gray-600" />
                                    <span className="text-xs font-medium text-gray-700">Sessions</span>
                                  </div>
                                  <span className="text-xs lg:text-sm font-bold text-gray-900">
                                    {partner.total_sessions || 0}
                                  </span>
                                </div>

                                {/* Duration Row */}
                                <div className="flex items-center justify-between p-1.5 lg:p-2 bg-gray-50 rounded-lg border">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-gray-600" />
                                    <span className="text-xs font-medium text-gray-700">Time</span>
                                  </div>
                                  <span className="text-xs lg:text-sm font-bold text-gray-900">
                                    {Math.round(partner.avg_session_duration)}m
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No conversation partners yet</p>
                        <p className="text-sm text-gray-400">Start your first speaking session to see your conversation history</p>
                      </div>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          ) : selectedModule === 'writing' ? (
            /* Writing Module Details */
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-lg ${writingData.color} flex items-center justify-center text-white`}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 capitalize">Writing</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-4 lg:mb-6">
                  <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">Total Evaluations</p>
                    <p className="text-xl lg:text-3xl font-bold text-gray-900">{writingData.total_evaluations}</p>
                  </div>
                  <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">Task 1</p>
                    <p className="text-xl lg:text-3xl font-bold text-gray-900">{writingData.task1_count}</p>
                  </div>
                  <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">Task 2</p>
                    <p className="text-xl lg:text-3xl font-bold text-gray-900">{writingData.task2_count}</p>
                  </div>
                  <div className="text-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">Avg Words</p>
                    <p className="text-xl lg:text-3xl font-bold text-gray-900">{writingData.avg_word_count}</p>
                  </div>
                </div>

                {/* Writing Evaluations History */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Writing Evaluations</h3>
                  <div className="space-y-3">
                    {writingData.evaluations && writingData.evaluations.length > 0 ? (
                      writingData.evaluations.slice(0, 10).map((evaluation, index) => (
                        <div key={evaluation.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${evaluation.taskType === 'task1'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                                  }`}>
                                  {evaluation.taskType.toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(evaluation.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                                {evaluation.question.length > 80
                                  ? `${evaluation.question.substring(0, 80)}...`
                                  : evaluation.question
                                }
                              </h4>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>Words: {evaluation.wordCount}</span>
                                <span>
                                  {new Date(evaluation.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-4 bg-[#8b5cf6] text-white border-[#8b5cf6] hover:bg-[#7c3aed] hover:border-[#7c3aed]"
                              onClick={() => window.open(`/evaluation/writing/${evaluation.urlLink}`, '_blank')}
                            >
                              View Result
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <p className="text-gray-500">No writing evaluations yet</p>
                        <p className="text-sm text-gray-400">Complete your first writing task to see your evaluation history</p>
                      </div>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          ) : (
            /* Reading/Listening Module Details */
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-lg ${currentModuleScores[selectedModule]?.color} flex items-center justify-center text-white`}>
                    {selectedModule === 'reading' ? <BookOpen className="w-8 h-8" /> : <Headphones className="w-8 h-8" />}
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 capitalize">{selectedModule}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 lg:gap-6 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Best Score</p>
                    <p className="text-3xl font-bold text-gray-900">{(currentModuleScores[selectedModule] as ModuleData)?.bestScore}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Tests</p>
                    <p className="text-3xl font-bold text-gray-900">{(currentModuleScores[selectedModule] as ModuleData)?.attempts}</p>
                  </div>
                </div>

                {/* Test History Table */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Test History</h3>
                  {/* Debug info - remove this after testing */}
                  <div className="mb-2 text-xs text-gray-500">
                    Total test scores: {testScores.length},
                    {selectedModule} tests: {testScores.filter(score => score.module === selectedModule).length}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-900">Book</th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-900">Test</th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-900">Score</th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-900">IELTS Band</th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-900">Time Taken</th>
                          <th className="border border-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-900">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testScores
                          .filter(score => score.module === selectedModule)
                          .slice(0, 10)
                          .map((test, index) => (
                            <tr key={test.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">{test.book}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">Test {test.testNumber}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 font-semibold">{test.score}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900 font-semibold">{test.ieltsBandScore || 'N/A'}</td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                                {test.timeTaken ? `${Math.floor(test.timeTaken / 60)}:${(test.timeTaken % 60).toString().padStart(2, '0')}` : 'N/A'}
                              </td>
                              <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                                {new Date(test.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        {testScores.filter(score => score.module === selectedModule).length === 0 && (
                          <tr>
                            <td colSpan={6} className="border border-gray-200 px-3 py-8 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                {selectedModule === 'reading' ? <BookOpen className="h-12 w-12 text-gray-300 mb-4" /> : <Headphones className="h-12 w-12 text-gray-300 mb-4" />}
                                <p>No {selectedModule} tests completed yet</p>
                                <p className="text-sm text-gray-400 mt-1">Start practicing to see your test history</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {Object.entries(currentModuleScores).map(([module, data]) => (
            <Card
              key={module}
              className="bg-white shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => setSelectedModule(module as keyof ModuleScores)}
            >
              <CardHeader className="pb-2 lg:pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className={`w-8 h-8 lg:w-12 lg:h-12 rounded-lg ${data.color} flex items-center justify-center text-white font-bold text-sm lg:text-lg`}>
                      {module === 'speaking' ? (
                        <MessageSquare className="w-4 h-4 lg:w-6 lg:h-6" />
                      ) : module === 'writing' ? (
                        <svg className="w-4 h-4 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      ) : (
                        (data as ModuleData).score
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-sm lg:text-lg font-semibold text-gray-900 capitalize">{module}</CardTitle>
                    </div>
                  </div>
                  <div className="text-right">
                    {module === 'speaking' ? (
                      <>
                        <p className="text-xs lg:text-sm text-gray-500">Sessions</p>
                        <p className="text-sm lg:text-lg font-bold text-gray-900">{(data as SpeakingData).total_sessions}</p>
                      </>
                    ) : module === 'writing' ? (
                      <>
                        <p className="text-xs lg:text-sm text-gray-500">Evaluations</p>
                        <p className="text-sm lg:text-lg font-bold text-gray-900">{(data as WritingData).total_evaluations}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs lg:text-sm text-gray-500">Best</p>
                        <p className="text-sm lg:text-lg font-bold text-gray-900">{(data as ModuleData).bestScore}</p>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 lg:space-y-3">
                  {module === 'speaking' ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs lg:text-sm text-gray-600">Likes</span>
                        <span className="text-sm font-semibold text-gray-900">{(data as SpeakingData).total_likes}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs lg:text-sm text-gray-600">Total Minutes</span>
                        <span className="text-sm font-semibold text-gray-900">{(data as SpeakingData).total_minutes}m</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 lg:h-2">
                        <div
                          className={`h-1.5 lg:h-2 rounded-full ${data.color}`}
                          style={{ width: `${Math.min(((data as SpeakingData).total_sessions / 50) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-xs lg:text-sm">
                        <span className="text-gray-600">{(data as SpeakingData).total_sessions} sessions</span>
                        <span className="text-gray-600">{(data as SpeakingData).partner_history?.length || 0} partners</span>
                      </div>
                    </>
                  ) : module === 'writing' ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs lg:text-sm text-gray-600">Task 1</span>
                        <span className="text-sm font-semibold text-gray-900">{(data as WritingData).task1_count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs lg:text-sm text-gray-600">Task 2</span>
                        <span className="text-sm font-semibold text-gray-900">{(data as WritingData).task2_count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 lg:h-2">
                        <div
                          className={`h-1.5 lg:h-2 rounded-full ${data.color}`}
                          style={{ width: `${Math.min(((data as WritingData).total_evaluations / 10) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-xs lg:text-sm">
                        <span className="text-gray-600">{(data as WritingData).avg_word_count} avg words</span>
                        <span className="text-gray-600">{(data as WritingData).total_evaluations} evaluations</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs lg:text-sm text-gray-600">Current</span>
                        <span className="text-sm font-semibold text-gray-900">{(data as ModuleData).score}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 lg:h-2">
                        <div
                          className={`h-1.5 lg:h-2 rounded-full ${data.color}`}
                          style={{ width: `${((data as ModuleData).score / 9) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-xs lg:text-sm">
                        <span className="text-gray-600">{(data as ModuleData).attempts} attempts</span>
                        <span className="text-gray-600">{Math.round(((data as ModuleData).score / 9) * 100)}%</span>
                      </div>
                    </>
                  )}
                  <div className="text-center pt-1 lg:pt-2">
                    <span className="text-xs lg:text-sm text-[#1A3A6E] hover:text-[#4f5bd5] font-medium">Tap for details →</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderProgressHistory = () => (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#1A3A6E] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Test History</h3>
            <p className="text-sm text-gray-600">Your recent test results and progress</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <UserTestResults
          userId={session?.user?.id}
          testScores={testScores}
          userStats={currentUserStats}
        />
      </div>
    </div>
  )

  const renderEvaluationTest = () => {
    if (!session?.user?.id) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Evaluation Data Test</h3>
                <p className="text-sm text-gray-600">User ID required to test evaluation data</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-500">Please log in to test evaluation data</p>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Evaluation Data Test</h3>
              <p className="text-sm text-gray-600">Test evaluation features and data</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <EvaluationDataTest userId={session?.user?.id} />
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverviewSection()
      case 'profile':
        return renderProfileSection()
      case 'progress':
        return renderProgressHistory()
      case 'evaluation-test':
        return renderEvaluationTest()
      default:
        return renderOverviewSection()
    }
  }

  // Show loading spinner while checking authentication
  if (isPending || (!session?.user && !error)) {
    return <Loading />
  }

  // If there's an error or no session after loading, redirect will handle it
  if (!session?.user) {
    return null; // Component will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex lg:min-h-screen">
        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          <div className="border-t border-gray-200 backdrop-blur-lg bg-white/95">
            <div className="flex justify-around items-center px-4 py-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 ${activeSection === item.id
                    ? 'bg-[#1A3A6E] text-white'
                    : 'text-gray-600 hover:text-[#1A3A6E] hover:bg-slate-100'
                    }`}
                >
                  <div className="w-5 h-5 mb-1">
                    {item.icon}
                  </div>
                  <span className="text-xs font-medium">{item.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0 lg:sticky lg:top-0 lg:h-screen">
          <div className="flex flex-col w-80">
            <div className="flex flex-col h-full bg-white border-r border-gray-200">
              {/* Sidebar Header */}
              <div className="p-6 border-b border-gray-100 overflow-hidden">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-[#1A3A6E] flex items-center justify-center">
                    <div className="text-lg font-bold text-white">
                      {session?.user?.name ?
                        session.user.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)
                        : 'U'
                      }
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 truncate">
                      {session?.user?.name.slice(0, 15) || 'User'}'s Profile
                    </h2>
                    <p className="text-sm text-gray-600">Manage your IELTS journey</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${activeSection === item.id
                      ? 'bg-[#1A3A6E] text-white shadow-lg'
                      : 'text-gray-700 hover:bg-slate-50 hover:text-[#1A3A6E]'
                      }`}
                  >
                    <div className={`flex-shrink-0 ${activeSection === item.id ? 'text-white' : 'text-gray-500 group-hover:text-[#1A3A6E]'
                      }`}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                    <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${activeSection === item.id ? 'text-white rotate-90' : 'text-gray-400 group-hover:text-[#1A3A6E]'
                      }`} />
                  </button>
                ))}
              </nav>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-gray-100">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-[#ffc107] flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Your Progress</p>
                      <p className="text-xs text-gray-600">{currentUserStats.totalTestsTaken} tests completed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 lg:w-0">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 lg:pl-6">
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {sidebarItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  {activeSection === 'overview' && 'Track your IELTS preparation progress'}
                  {activeSection === 'profile' && 'Manage your account information'}
                  {activeSection === 'scores' && 'View your skill development'}
                  {activeSection === 'progress' && 'Review your test history'}
                  {activeSection === 'evaluation-test' && 'Test evaluation features'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2 bg-slate-50 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 bg-[#4f5bd5] rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Online</span>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  )
}