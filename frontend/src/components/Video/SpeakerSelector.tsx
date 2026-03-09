import React from 'react';

interface AudioOutputDevice {
  deviceId: string;
  label: string;
}

interface Props {
  devices: AudioOutputDevice[];
  selectedDeviceId: string;
  onSelect: (deviceId: string) => void;
}

export const SpeakerSelector: React.FC<Props> = ({ devices, selectedDeviceId, onSelect }) => {
  if (devices.length <= 1) return null;

  return (
    <div style={styles.container}>
      <label style={styles.label}>Speaker:</label>
      <select
        value={selectedDeviceId}
        onChange={(e) => onSelect(e.target.value)}
        style={styles.select}
      >
        {devices.map(device => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#f0f0f0',
    borderRadius: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#333',
    whiteSpace: 'nowrap',
  },
  select: {
    flex: 1,
    padding: '6px 8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    backgroundColor: '#fff',
    color: '#333',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  },
};
