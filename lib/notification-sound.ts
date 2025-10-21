export class NotificationSound {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private stopSound: (() => void) | null = null;

  constructor() {
    // Initialize AudioContext only when needed
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  // Generate a pleasant notification sound using Web Audio API
  private generateNotificationTone(frequency: number = 800, duration: number = 0.3) {
    if (!this.audioContext) return null;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    // Create envelope for smoother sound
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    return { oscillator, gainNode };
  }

  // Play notification sound for specified duration
  public playNotificationSound(durationSeconds: number = 10) {
    if (this.isPlaying) {
      this.stopNotificationSound();
    }

    if (!this.audioContext) {
      console.warn('AudioContext not available');
      return;
    }

    // Resume AudioContext if suspended (required by some browsers)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    // Play a pleasant notification pattern
    const playTone = () => {
      if (!this.isPlaying) return;

      // Play two-tone pattern (high-low)
      const highTone = this.generateNotificationTone(880, 0.2);
      const lowTone = this.generateNotificationTone(660, 0.2);

      if (highTone && lowTone && this.audioContext) {
        // High tone
        highTone.oscillator.start(this.audioContext.currentTime);
        highTone.oscillator.stop(this.audioContext.currentTime + 0.2);

        // Low tone (slightly after high tone)
        lowTone.oscillator.start(this.audioContext.currentTime + 0.25);
        lowTone.oscillator.stop(this.audioContext.currentTime + 0.45);
      }
    };

    // Play initial tone
    playTone();

    // Repeat every 2 seconds
    intervalId = setInterval(playTone, 2000);

    // Stop after specified duration
    timeoutId = setTimeout(() => {
      this.isPlaying = false;
      clearInterval(intervalId);
    }, durationSeconds * 1000);

    // Store cleanup function
    this.stopSound = () => {
      this.isPlaying = false;
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }

  // Stop the notification sound
  public stopNotificationSound() {
    if (this.stopSound) {
      this.stopSound();
      this.stopSound = null;
    }
    this.isPlaying = false;
  }

  // Check if sound is currently playing
  public isPlaying_() {
    return this.isPlaying;
  }
}

// Create singleton instance
export const notificationSound = new NotificationSound();