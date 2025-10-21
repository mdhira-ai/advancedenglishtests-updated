'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Clock } from 'lucide-react';

interface LocalAudioPlayerProps {
  audioSrc: string;
  onTestStart?: () => void;
  isTestStarted?: boolean;
  disabled?: boolean;
  testDuration?: number; // in minutes
  title?: string;
}

const LocalAudioPlayer: React.FC<LocalAudioPlayerProps> = ({ 
  audioSrc,
  onTestStart, 
  isTestStarted = false,
  disabled = false,
  testDuration = 30, // default 30 minutes
  title = "IELTS Listening Test"
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(testDuration * 60); // Convert to seconds
  const [timerActive, setTimerActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setTimerActive(false);
            // Stop audio when time runs out
            if (audioRef.current) {
              audioRef.current.pause();
              setIsPlaying(false);
            }
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Audio time update effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setTimerActive(false);
    });

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    if (!hasStarted) {
      if (!audioRef.current) {
        console.error('Audio element not found');
        return;
      }
      if (!audioRef.current.src) {
        console.error('Audio source not set:', audioSrc);
        return;
      }

      setHasStarted(true);
      setIsPlaying(true);
      setTimerActive(true); // Start timer when test starts
      onTestStart?.();
      
      // Try to load the audio file first
      audioRef.current.load();
      
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        // Reset states if audio fails to play
        setHasStarted(false);
        setIsPlaying(false);
        setTimerActive(false);
        // Alert the user
        alert('Unable to play audio. Please check if the audio file exists and try again.');
      });
    } else {
      togglePlayPause();
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = newVolume;
    }
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
      // Reset timer when restarting
      setTimeLeft(testDuration * 60);
      setTimerActive(true);
    }
  };

  const seekAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const seekTime = (parseFloat(e.target.value) / 100) * duration;
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              {title}
            </h3>
            <div className="flex items-center justify-center space-x-4 text-sm text-blue-600">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>Time Left: <strong className={timeLeft <= 300 ? 'text-red-600' : 'text-blue-800'}>
                  {formatTime(timeLeft)}
                </strong></span>
              </div>
              <div>
                Duration: <strong>{formatTime(duration)}</strong>
              </div>
            </div>
          </div>

          {/* Audio Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={seekAudio}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
              }}
              disabled={!hasStarted || disabled}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={handleStartTest}
              disabled={disabled}
              size="lg"
              className={`px-6 ${!hasStarted ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              {!hasStarted ? (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Test
                </>
              ) : (
                <>
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </>
              )}
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMute}
                disabled={disabled}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              
              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  disabled={disabled}
                />
                <span className="text-xs text-gray-600 w-8">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={restartAudio}
                disabled={disabled}
                title="Restart from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">
                Audio Status: <strong className={isPlaying ? 'text-green-600' : 'text-gray-600'}>
                  {isPlaying ? 'Playing' : 'Paused'}
                </strong>
              </span>
              <span className="text-blue-700">
                Volume: <strong className={isMuted ? 'text-red-600' : 'text-green-600'}>
                  {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
                </strong>
              </span>
            </div>
          </div>

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={audioSrc}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              console.error('Audio error:', e);
              const audio = e.currentTarget;
              const errorDetails = {
                message: audio.error?.message,
                code: audio.error?.code,
                src: audio.src
              };
              console.error('Error loading audio:', errorDetails);
              
              // Show more specific error message
              let errorMessage = 'Error loading audio file: ';
              switch (audio.error?.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                  errorMessage += 'The loading was aborted.';
                  break;
                case MediaError.MEDIA_ERR_NETWORK:
                  errorMessage += 'Network error occurred while loading.';
                  break;
                case MediaError.MEDIA_ERR_DECODE:
                  errorMessage += 'Audio file is corrupted or unsupported format.';
                  break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  errorMessage += 'Audio file not found or format not supported.';
                  break;
                default:
                  errorMessage += 'Please check if the file exists and try again.';
              }
              alert(errorMessage + '\nPath: ' + audio.src);
            }}
          />

          {/* Instructions */}
          <div className="text-xs text-blue-600 text-center">
            <p className="mb-1">
              <strong>Instructions:</strong> Click "Start Test" to begin the audio and timer.
            </p>
            <p>
              You have {testDuration} minutes to complete the test. Use the controls to play, pause, and adjust volume.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocalAudioPlayer;
