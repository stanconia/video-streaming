export class MediaDevicesService {
  async getUserMedia(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got user media:', stream.getTracks().map((t) => `${t.kind}: ${t.label}`));
      return stream;
    } catch (error: any) {
      console.error('Error getting user media:', error);
      throw new Error(`Failed to access camera/microphone: ${error.message}`);
    }
  }

  async enumerateDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices;
    } catch (error: any) {
      console.error('Error enumerating devices:', error);
      throw new Error(`Failed to enumerate devices: ${error.message}`);
    }
  }

  async getCameras(): Promise<MediaDeviceInfo[]> {
    const devices = await this.enumerateDevices();
    return devices.filter((device) => device.kind === 'videoinput');
  }

  async getMicrophones(): Promise<MediaDeviceInfo[]> {
    const devices = await this.enumerateDevices();
    return devices.filter((device) => device.kind === 'audioinput');
  }

  stopStream(stream: MediaStream): void {
    stream.getTracks().forEach((track) => {
      track.stop();
      console.log(`Stopped track: ${track.kind}`);
    });
  }

  async checkPermissions(): Promise<{ video: boolean; audio: boolean }> {
    const result = { video: false, audio: false };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      result.video = stream.getVideoTracks().length > 0;
      result.audio = stream.getAudioTracks().length > 0;
      this.stopStream(stream);
    } catch (error) {
      console.warn('Permission check failed:', error);
    }

    return result;
  }
}

export const mediaDevicesService = new MediaDevicesService();
