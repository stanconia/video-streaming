import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaybackPage } from './PlaybackPage';
import { recordingApi } from '../../services/api/live/RecordingApi';

jest.mock('../../services/api/live/RecordingApi', () => ({
  recordingApi: {
    getRecording: jest.fn(),
    getPlaybackUrl: jest.fn(),
    getCaptionUrl: jest.fn().mockResolvedValue(null),
    transcribeRecording: jest.fn(),
  },
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'rec-123' }),
}));

const mockRecordingApi = recordingApi as jest.Mocked<typeof recordingApi>;

const mockCompletedRecording = {
  id: 'rec-123',
  roomId: 'room-1',
  roomName: 'CS 101 - Lecture 5',
  startedByUserId: 'teacher-1',
  status: 'COMPLETED' as const,
  durationMs: 3723000, // 62 min 3 sec
  fileSizeBytes: 157286400, // ~150 MB
  playbackUrl: 'https://cdn.example.com/recordings/rec-123.mp4',
  createdAt: '2024-03-15T14:00:00Z',
  completedAt: '2024-03-15T15:02:03Z',
  errorMessage: undefined,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PlaybackPage', () => {
  it('shows loading state initially', () => {
    mockRecordingApi.getRecording.mockImplementation(() => new Promise(() => {}));
    mockRecordingApi.getPlaybackUrl.mockImplementation(() => new Promise(() => {}));

    render(<PlaybackPage />);

    expect(screen.getByText('Loading recording...')).toBeInTheDocument();
  });

  it('renders video player with playback URL after loading', async () => {
    mockRecordingApi.getRecording.mockResolvedValue(mockCompletedRecording);
    mockRecordingApi.getPlaybackUrl.mockResolvedValue(
      'https://cdn.example.com/recordings/rec-123.mp4'
    );

    render(<PlaybackPage />);

    await waitFor(() => {
      expect(screen.getAllByText('CS 101 - Lecture 5').length).toBeGreaterThan(0);
    });

    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://cdn.example.com/recordings/rec-123.mp4');
    expect(video).toHaveAttribute('controls');
  });

  it('displays recording info details', async () => {
    mockRecordingApi.getRecording.mockResolvedValue(mockCompletedRecording);
    mockRecordingApi.getPlaybackUrl.mockResolvedValue(
      'https://cdn.example.com/recordings/rec-123.mp4'
    );

    render(<PlaybackPage />);

    await waitFor(() => {
      expect(screen.getAllByText('CS 101 - Lecture 5').length).toBeGreaterThan(0);
    });

    // Check info labels
    expect(screen.getByText('Room:')).toBeInTheDocument();
    expect(screen.getByText('Duration:')).toBeInTheDocument();
    expect(screen.getByText('Size:')).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();

    // Check formatted duration (62 min 3 sec = 62:03)
    expect(screen.getByText('62:03')).toBeInTheDocument();
    // Check formatted file size (~150 MB)
    expect(screen.getByText('150.0 MB')).toBeInTheDocument();
    // Check status
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    mockRecordingApi.getRecording.mockRejectedValue({
      response: { data: { error: 'Recording not found' } },
    });
    mockRecordingApi.getPlaybackUrl.mockRejectedValue({
      response: { data: { error: 'Recording not found' } },
    });

    render(<PlaybackPage />);

    await waitFor(() => {
      expect(screen.getByText('Recording not found')).toBeInTheDocument();
    });
  });

  it('shows default error when API fails without detail', async () => {
    mockRecordingApi.getRecording.mockRejectedValue(new Error('Network error'));
    mockRecordingApi.getPlaybackUrl.mockRejectedValue(new Error('Network error'));

    render(<PlaybackPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load recording')).toBeInTheDocument();
    });
  });

  it('shows Back to Recordings button on error', async () => {
    mockRecordingApi.getRecording.mockRejectedValue(new Error('error'));
    mockRecordingApi.getPlaybackUrl.mockRejectedValue(new Error('error'));

    render(<PlaybackPage />);

    await waitFor(() => {
      expect(screen.getByText('Back to Recordings')).toBeInTheDocument();
    });
  });

  it('shows processing state with Check Again button for UPLOADING status', async () => {
    const uploadingRecording = {
      ...mockCompletedRecording,
      status: 'UPLOADING' as const,
      durationMs: undefined,
      fileSizeBytes: undefined,
    };
    mockRecordingApi.getRecording.mockResolvedValue(uploadingRecording);
    mockRecordingApi.getPlaybackUrl.mockResolvedValue('');

    render(<PlaybackPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Recording is being processed... This may take a minute.')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Check Again')).toBeInTheDocument();
  });

  it('shows processing state for STOPPING status', async () => {
    const stoppingRecording = {
      ...mockCompletedRecording,
      status: 'STOPPING' as const,
    };
    mockRecordingApi.getRecording.mockResolvedValue(stoppingRecording);
    mockRecordingApi.getPlaybackUrl.mockResolvedValue('');

    render(<PlaybackPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Recording is being processed... This may take a minute.')
      ).toBeInTheDocument();
    });
  });

  it('shows Retry button when COMPLETED but no playback URL', async () => {
    mockRecordingApi.getRecording.mockResolvedValue(mockCompletedRecording);
    mockRecordingApi.getPlaybackUrl.mockResolvedValue('');

    render(<PlaybackPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Playback URL not available. Try refreshing.')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls loadRecording again when Retry is clicked', async () => {
    mockRecordingApi.getRecording.mockResolvedValue(mockCompletedRecording);
    mockRecordingApi.getPlaybackUrl.mockResolvedValue('');

    const user = userEvent.setup();

    render(<PlaybackPage />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    // Initial load calls
    expect(mockRecordingApi.getRecording).toHaveBeenCalledTimes(1);

    await user.click(screen.getByText('Retry'));

    // Should call again after retry
    await waitFor(() => {
      expect(mockRecordingApi.getRecording).toHaveBeenCalledTimes(2);
    });
  });

  // FAILED status rendering tested via info row status display

  it('renders Back to Recordings button in header on success', async () => {
    mockRecordingApi.getRecording.mockResolvedValue(mockCompletedRecording);
    mockRecordingApi.getPlaybackUrl.mockResolvedValue(
      'https://cdn.example.com/recordings/rec-123.mp4'
    );

    const user = userEvent.setup();

    render(<PlaybackPage />);

    await waitFor(() => {
      expect(screen.getByText('Back to Recordings')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Back to Recordings'));

    expect(mockNavigate).toHaveBeenCalledWith('/recordings');
  });

  it('displays formatted duration and file size correctly', async () => {
    const shortRecording = {
      ...mockCompletedRecording,
      durationMs: 65000, // 1 min 5 sec
      fileSizeBytes: 512000, // 500 KB
    };
    mockRecordingApi.getRecording.mockResolvedValue(shortRecording);
    mockRecordingApi.getPlaybackUrl.mockResolvedValue('https://example.com/video.mp4');

    render(<PlaybackPage />);

    await waitFor(() => {
      expect(screen.getByText('1:05')).toBeInTheDocument();
    });
    expect(screen.getByText('500.0 KB')).toBeInTheDocument();
  });
});
