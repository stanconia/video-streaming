import React from 'react';
import { render, screen } from '@testing-library/react';
import { VideoGrid, RemoteParticipant } from './VideoGrid';

// Mock HTMLMediaElement.prototype.play to avoid jsdom errors
beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
});

function makeParticipant(overrides: Partial<RemoteParticipant> = {}): RemoteParticipant {
  return {
    stream: null,
    userId: 'user-1',
    displayName: 'Test User',
    role: 'viewer',
    hasVideo: false,
    isMuted: false,
    ...overrides,
  };
}

describe('VideoGrid', () => {
  it('renders empty state when no participants', () => {
    render(<VideoGrid streams={new Map()} />);
    expect(screen.getByText(/waiting for participants/i)).toBeInTheDocument();
  });

  it('renders local tile when showLocalPlaceholder is true', () => {
    render(
      <VideoGrid
        streams={new Map()}
        localUserId="me"
        localDisplayName="Teacher"
        showLocalPlaceholder={true}
        isLocalMuted={false}
      />
    );
    expect(screen.getByText(/Teacher/)).toBeInTheDocument();
    expect(screen.getByText(/\(You\)/)).toBeInTheDocument();
  });

  it('renders remote participant tiles', () => {
    const streams = new Map<string, RemoteParticipant>();
    streams.set('user-1', makeParticipant({ displayName: 'Alice' }));
    streams.set('user-2', makeParticipant({ userId: 'user-2', displayName: 'Bob' }));

    render(<VideoGrid streams={streams} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows local and remote in same grid (unified view)', () => {
    const streams = new Map<string, RemoteParticipant>();
    streams.set('user-2', makeParticipant({ userId: 'user-2', displayName: 'Student' }));

    const { container } = render(
      <VideoGrid
        streams={streams}
        localUserId="teacher-1"
        localDisplayName="Teacher"
        showLocalPlaceholder={true}
      />
    );

    // Both should render in the same grid parent
    expect(screen.getByText(/Teacher/)).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();

    // The grid container should exist with grid display
    const gridEl = container.firstChild as HTMLElement;
    expect(gridEl.style.display).toBe('grid');
  });

  it('renders broadcaster star badge', () => {
    const streams = new Map<string, RemoteParticipant>();
    streams.set('teacher-1', makeParticipant({
      userId: 'teacher-1',
      displayName: 'Host',
      role: 'broadcaster',
    }));

    render(<VideoGrid streams={streams} />);

    // Star character (★) should appear for broadcaster
    expect(screen.getByText('★')).toBeInTheDocument();
  });

  it('shows avatar initial when camera is off', () => {
    const streams = new Map<string, RemoteParticipant>();
    streams.set('user-1', makeParticipant({
      displayName: 'Diana',
      hasVideo: false,
    }));

    render(<VideoGrid streams={streams} />);

    // Avatar should show first letter
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('renders muted indicator for muted participants', () => {
    const streams = new Map<string, RemoteParticipant>();
    streams.set('user-1', makeParticipant({ displayName: 'Muted User', isMuted: true }));

    const { container } = render(<VideoGrid streams={streams} />);

    // Should have the muted indicator (red circle with mic-off SVG)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('applies speaking style to active speaker', () => {
    const streams = new Map<string, RemoteParticipant>();
    streams.set('user-1', makeParticipant({ displayName: 'Speaker' }));

    const { container } = render(
      <VideoGrid streams={streams} activeSpeakerId="user-1" />
    );

    // Active speaker tile should have blue border
    const tile = container.querySelector('[style*="border"]') as HTMLElement;
    expect(tile).toBeTruthy();
  });

  it('renders filmstrip mode with compact layout', () => {
    const streams = new Map<string, RemoteParticipant>();
    streams.set('user-1', makeParticipant({ displayName: 'Alice' }));
    streams.set('user-2', makeParticipant({ userId: 'user-2', displayName: 'Bob' }));

    const { container } = render(
      <VideoGrid
        streams={streams}
        localUserId="me"
        localDisplayName="Me"
        showLocalPlaceholder={true}
        mode="filmstrip"
      />
    );

    // Filmstrip mode should use flex layout for horizontal scrolling
    const gridEl = container.firstChild as HTMLElement;
    expect(gridEl.style.display).toBe('flex');
    // Should still render all participants
    expect(screen.getByText(/Me/)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('handles isLocalVideoOff prop correctly', () => {
    // When isLocalVideoOff=true, the tile should show the avatar even if showLocalPlaceholder is set
    render(
      <VideoGrid
        streams={new Map()}
        localUserId="me"
        localDisplayName="Teacher"
        showLocalPlaceholder={true}
        isLocalVideoOff={true}
      />
    );

    // Should show avatar initial since video is off
    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
