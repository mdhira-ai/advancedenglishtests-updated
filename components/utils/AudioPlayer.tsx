'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Clock } from 'lucide-react';

interface AudioPlayerProps {
  onTestStart?: () => void;
  isTestStarted?: boolean;
  disabled?: boolean;
  soundCloudUrl?: string;
  testDuration?: number; // in minutes
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  onTestStart, 
  isTestStarted = false,
  disabled = false,
  soundCloudUrl = "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1239836971&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&buying=false&liking=false&download=false&sharing=false&show_artwork=true",
  testDuration = 30 // default 30 minutes
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(testDuration * 60); // Convert to seconds
  const [timerActive, setTimerActive] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setTimerActive(false);
            // Stop audio when time runs out
            if (iframeRef.current?.contentWindow) {
              try {
                iframeRef.current.contentWindow.postMessage('{"method":"pause"}', '*');
                setIsPlaying(false);
              } catch (error) {
                console.log('Could not control SoundCloud widget');
              }
            }
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    if (!hasStarted) {
      setHasStarted(true);
      setIsPlaying(true);
      setTimerActive(true); // Start timer when test starts
      onTestStart?.();
      
      // Multiple attempts to start audio to ensure it works
      const tryToPlayAudio = () => {
        if (iframeRef.current?.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage('{"method":"play"}', '*');
          } catch (error) {
            console.log('Could not control SoundCloud widget');
          }
        }
      };

      // Try immediately, then try again after delays
      tryToPlayAudio();
      setTimeout(tryToPlayAudio, 1000);
      setTimeout(tryToPlayAudio, 2000);
    } else {
      togglePlayPause();
    }
  };

  const togglePlayPause = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        if (isPlaying) {
          iframeRef.current.contentWindow.postMessage('{"method":"pause"}', '*');
          setIsPlaying(false);
        } else {
          iframeRef.current.contentWindow.postMessage('{"method":"play"}', '*');
          setIsPlaying(true);
        }
      } catch (error) {
        console.log('Could not control SoundCloud widget');
      }
    }
  };

  const toggleMute = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        if (isMuted) {
          iframeRef.current.contentWindow.postMessage('{"method":"setVolume","value":100}', '*');
          setIsMuted(false);
        } else {
          iframeRef.current.contentWindow.postMessage('{"method":"setVolume","value":0}', '*');
          setIsMuted(true);
        }
      } catch (error) {
        console.log('Could not control SoundCloud widget');
      }
    }
  };

  const restartAudio = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage('{"method":"seekTo","value":0}', '*');
        iframeRef.current.contentWindow.postMessage('{"method":"play"}', '*');
        setIsPlaying(true);
        // Reset timer when restarting
        setTimeLeft(testDuration * 60);
        setTimerActive(true);
      } catch (error) {
        console.log('Could not control SoundCloud widget');
      }
    }
  };

  // Listen for messages from SoundCloud widget
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === 'https://w.soundcloud.com') {
        try {
          const data = JSON.parse(event.data);
          if (data.method === 'ready') {
            console.log('SoundCloud widget is ready');
            // If we started the test but haven't played yet, play now
            if (hasStarted && !isPlaying) {
              setTimeout(() => {
                if (iframeRef.current?.contentWindow) {
                  try {
                    iframeRef.current.contentWindow.postMessage('{"method":"play"}', '*');
                    setIsPlaying(true);
                  } catch (error) {
                    console.log('Could not control SoundCloud widget');
                  }
                }
              }, 500);
            }
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [hasStarted, isPlaying]);

  if (!hasStarted && !isTestStarted) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Audio Instructions</h3>
              <ul className="text-left text-blue-700 space-y-1 text-sm">
                <li>• The audio will start automatically when you begin the test</li>
                <li>• You can pause, resume, and restart the audio during the test</li>
                <li>• Make sure your volume is at a comfortable level</li>
                <li>• The audio contains all 4 sections of the listening test</li>
                <li>• A {testDuration}-minute timer will start when you begin</li>
              </ul>
            </div>
            <Button 
              onClick={handleStartTest}
              size="lg" 
              className="bg-green-600 hover:bg-green-700"
              disabled={disabled}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Audio & Test
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Timer Display */}
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 font-medium flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Test Timer:
              </span>
              <span className={`font-mono text-lg font-bold ${
                timeLeft <= 300 ? 'text-red-600' : timeLeft <= 600 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    timeLeft <= 300 ? 'bg-red-500' : timeLeft <= 600 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(timeLeft / (testDuration * 60)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-blue-800">Cambridge IELTS 8 - Listening Test 1</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlayPause}
                disabled={disabled}
                className="flex items-center space-x-1"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMute}
                disabled={disabled}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              
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

          {/* Hidden SoundCloud iframe for audio control */}
          <div className="hidden">
            <iframe
              ref={iframeRef}
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={`${soundCloudUrl}&auto_play=false`}
              title="Cambridge IELTS 8 Listening Test 1"
              onLoad={() => {
                console.log('SoundCloud iframe loaded');
                // Enable widget API
                if (iframeRef.current?.contentWindow) {
                  try {
                    iframeRef.current.contentWindow.postMessage('{"method":"addEventListener","value":"ready"}', '*');
                  } catch (error) {
                    console.log('Could not initialize SoundCloud widget API');
                  }
                }
              }}
            />
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">
                Audio Status: <strong className={isPlaying ? 'text-green-600' : 'text-gray-600'}>
                  {isPlaying ? 'Playing' : 'Paused'}
                </strong>
              </span>
              <span className="text-blue-700">
                Volume: <strong className={isMuted ? 'text-red-600' : 'text-green-600'}>
                  {isMuted ? 'Muted' : 'On'}
                </strong>
              </span>
            </div>
          </div>

          <div className="text-xs text-blue-600 text-center">
            <p>Audio provided by: 
              <a 
                href="https://soundcloud.com/kitti-chaiyawan/sets/academic-cambridge-ielts-8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                Kitti Chaiyawan - Cambridge IELTS 8 Listening Test 1
              </a>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioPlayer;
