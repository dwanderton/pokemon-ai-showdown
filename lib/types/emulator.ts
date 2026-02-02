export type GBAButton = 
  | 'A' 
  | 'B' 
  | 'START' 
  | 'SELECT' 
  | 'UP' 
  | 'DOWN' 
  | 'LEFT' 
  | 'RIGHT' 
  | 'L' 
  | 'R'
  | 'WAIT'; // No button press - just observe

export type EmulatorStatus = 
  | 'initializing' 
  | 'loading' 
  | 'ready' 
  | 'running' 
  | 'paused' 
  | 'error';

// Messages sent TO the emulator iframe
export type EmulatorCommand = 
  | { type: 'INPUT'; button: GBAButton; action: 'press' | 'release' }
  | { type: 'CAPTURE_FRAME' }
  | { type: 'SAVE_STATE' }
  | { type: 'LOAD_STATE'; state: string }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'PRESS_AND_RELEASE'; button: GBAButton; duration?: number };

// Messages received FROM the emulator iframe
export type EmulatorEvent = 
  | { type: 'IFRAME_READY' }
  | { type: 'READY' }
  | { type: 'GAME_STARTED' }
  | { type: 'FRAME_DATA'; frame: string; timestamp: number }
  | { type: 'STATE_SAVED'; state: string }
  | { type: 'STATE_LOADED' }
  | { type: 'ERROR'; message: string };

// Config message sent TO iframe after IFRAME_READY
export interface EmulatorConfigMessage {
  type: 'CONFIG';
  romUrl: string;
  volume: number;
  agentId: string;
}

export interface EmulatorConfig {
  romUrl: string;
  biosUrl?: string;
  volume?: number;
  muted?: boolean;
}

export interface EmulatorInstance {
  id: string;
  status: EmulatorStatus;
  config: EmulatorConfig;
  lastFrame?: string;
  lastFrameTimestamp?: number;
}
