import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { listCaptureSources, listMicrophoneDevices } from '../services/audioService';
import { useMeetingStore } from '../stores/meetingStore';
import type { AudioInputDevice, CaptureSource } from '../types';

export function AudioSourceSelector() {
  const {
    audioSource,
    selectedCaptureSourceId,
    selectedMicrophoneDeviceId,
    setSelectedCaptureSourceId,
    setSelectedMicrophoneDeviceId,
  } = useMeetingStore();

  const [captureSources, setCaptureSources] = useState<CaptureSource[]>([]);
  const [microphoneDevices, setMicrophoneDevices] = useState<AudioInputDevice[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSources = async () => {
    setLoading(true);
    try {
      const [sources, mics] = await Promise.all([
        listCaptureSources(),
        listMicrophoneDevices(),
      ]);
      setCaptureSources(sources);
      setMicrophoneDevices(mics);

      if (audioSource === 'loopback' && !selectedCaptureSourceId && sources.length > 0) {
        const screen = sources.find((s) => s.type === 'screen');
        setSelectedCaptureSourceId(screen?.id ?? sources[0].id);
      }

      if (audioSource === 'microphone' && !selectedMicrophoneDeviceId && mics.length > 0) {
        setSelectedMicrophoneDeviceId(mics[0].deviceId);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, [audioSource]);

  const screens = captureSources.filter((s) => s.type === 'screen');
  const windows = captureSources.filter((s) => s.type === 'window');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs text-zinc-400">
          {audioSource === 'loopback' ? 'Audio Output Source' : 'Microphone'}
        </label>
        <button
          type="button"
          onClick={loadSources}
          disabled={loading}
          className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {audioSource === 'loopback' ? (
        <select
          value={selectedCaptureSourceId ?? ''}
          onChange={(e) => setSelectedCaptureSourceId(e.target.value || null)}
          className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600"
        >
          <option value="" disabled>
            Select screen or window...
          </option>
          {screens.length > 0 && (
            <optgroup label="Screens">
              {screens.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </optgroup>
          )}
          {windows.length > 0 && (
            <optgroup label="Windows">
              {windows.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      ) : (
        <select
          value={selectedMicrophoneDeviceId ?? ''}
          onChange={(e) => setSelectedMicrophoneDeviceId(e.target.value || null)}
          className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600"
        >
          <option value="" disabled>
            Select microphone...
          </option>
          {microphoneDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      )}

      {audioSource === 'loopback' && (
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          Pick the screen or app window playing meeting audio (e.g. Chrome, Zoom, Teams).
        </p>
      )}
    </div>
  );
}
