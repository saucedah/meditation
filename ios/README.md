# AudioNotes (iOS)

A SwiftUI app that records audio notes and transcribes them with Apple's on-device `SFSpeechRecognizer` after you stop recording.

## Features

- Tap to record — keeps recording until you manually tap **Stop**.
- Recording continues in the background (background audio mode enabled).
- Live scrolling level-meter graph so you can see when real sound is being captured vs silence.
- Standard iOS recording indicator stays on the whole time (orange pill / amber dot).
- Automatic transcription when you stop. Re-run transcription from the note detail view if it fails.
- Plays back saved notes and lets you copy the transcript text.

## Setup

1. In Xcode: **File ▸ New ▸ Project… ▸ iOS ▸ App**
   - Product Name: `AudioNotes`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Minimum deployment: **iOS 17.0** (needed for `ContentUnavailableView` and `AVAudioApplication`).

2. Delete the template `ContentView.swift` and the generated `AudioNotesApp.swift`.

3. Drag every file under `ios/AudioNotes/` into the Xcode project's target:
   - `AudioNotesApp.swift`
   - `Note.swift`
   - `NotesStore.swift`
   - `AudioRecorder.swift`
   - `Transcriber.swift`
   - `WaveformView.swift`
   - `RecorderView.swift`
   - `NotesListView.swift`
   - `NoteDetailView.swift`

4. Replace the auto-generated `Info.plist` contents with `ios/AudioNotes/Info.plist`, **or** merge these keys into the target's Info settings:
   - `NSMicrophoneUsageDescription`
   - `NSSpeechRecognitionUsageDescription`
   - `UIBackgroundModes` → array containing `audio`

5. Signing & Capabilities → **+ Capability ▸ Background Modes** → tick **Audio, AirPlay, and Picture in Picture** (this matches the plist entry and lets recording continue when the screen locks).

6. Build & run on a physical device. (The simulator's mic and speech recognition both work, but a device gives you the real lock-screen / background behavior.)

## How it works

- `AudioRecorder` uses `AVAudioRecorder` into an `.m4a` (AAC) file in `Documents/Recordings/`. Metering is enabled and a 10 Hz timer pushes normalized levels into a rolling buffer that drives `WaveformView`.
- Audio session is configured as `.playAndRecord` with `.spokenAudio` mode for voice-optimized capture.
- `Transcriber` calls `SFSpeechRecognizer` with a file URL, prefers on-device recognition when the device supports it, and returns the final string.
- `NotesStore` persists a JSON index (`Documents/notes.json`) and the audio files alongside it.

## Privacy notes

- The iOS recording indicator (orange status pill / camera-mic dot in Control Center) stays on while recording — that's the OS telling everyone nearby a mic is live, and it can't be hidden by apps. Please obey local laws about recording consent.
