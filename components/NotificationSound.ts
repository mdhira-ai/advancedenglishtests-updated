export class NotificationSound {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private intervalId: NodeJS.Timeout | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio() {
    try {
      this.audio = new Audio('/new-ringtone.mp3');
      this.audio.preload = 'auto';
      this.audio.volume = 0.5; // Adjust volume as needed
    } catch (error) {
      console.warn('Audio not supported:', error);
    }
  }

  // Play notification sound for specified duration with repeats
  public playNotificationSound(durationSeconds: number = 10) {
    if (this.isPlaying) {
      this.stopNotificationSound();
    }

    if (!this.audio) {
      console.warn('Audio not available');
      return;
    }

    this.isPlaying = true;

    // Play sound immediately
    this.playSound();

    // Repeat every 3 seconds
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.playSound();
      }
    }, 3000);

    // Stop after specified duration
    this.timeoutId = setTimeout(() => {
      this.stopNotificationSound();
    }, durationSeconds * 1000);
  }

  private playSound() {
    if (this.audio) {
      this.audio.currentTime = 0; // Reset to beginning
      this.audio.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    }
  }

  // Stop the notification sound
  public stopNotificationSound() {
    this.isPlaying = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  // Check if sound is currently playing
  public isPlaying_() {
    return this.isPlaying;
  }
}

// Create singleton instance
export const notificationSound = new NotificationSound();