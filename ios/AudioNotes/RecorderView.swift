import SwiftUI

struct RecorderView: View {
    @EnvironmentObject private var store: NotesStore
    @StateObject private var recorder = AudioRecorder()
    @Environment(\.dismiss) private var dismiss

    @State private var permissionDenied = false
    @State private var errorText: String?

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            VStack(spacing: 12) {
                WaveformView(levels: recorder.levels,
                             color: recorder.isRecording ? .red : .gray,
                             capacity: recorder.levelBufferSize)
                    .frame(height: 160)
                    .padding(.horizontal)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.gray.opacity(0.08))
                    )

                HStack(spacing: 8) {
                    Circle()
                        .fill(recorder.isRecording ? Color.red : Color.gray.opacity(0.4))
                        .frame(width: 8, height: 8)
                        .opacity(recorder.isRecording && recorder.level > 0.1 ? 1 : 0.4)
                    Text(recorder.isRecording
                         ? (recorder.level > 0.1 ? "Picking up sound" : "Listening (silent)")
                         : "Idle")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal)

            Text(formatElapsed(recorder.elapsed))
                .font(.system(size: 56, weight: .thin, design: .monospaced))
                .monospacedDigit()

            if recorder.isRecording {
                Text("Recording… tap stop when done.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            } else {
                Text("Tap the mic to start an audio note.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            HStack(spacing: 40) {
                Button(role: .cancel) {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.title2)
                        .frame(width: 64, height: 64)
                        .background(Circle().fill(Color.gray.opacity(0.2)))
                }
                .disabled(recorder.isRecording)
                .opacity(recorder.isRecording ? 0.3 : 1)

                Button {
                    recorder.isRecording ? finishRecording() : startRecording()
                } label: {
                    Image(systemName: recorder.isRecording ? "stop.fill" : "mic.fill")
                        .font(.system(size: 36))
                        .foregroundStyle(.white)
                        .frame(width: 96, height: 96)
                        .background(Circle().fill(recorder.isRecording ? Color.red : Color.accentColor))
                        .shadow(radius: 8)
                }
            }
            .padding(.bottom, 40)
        }
        .padding()
        .alert("Microphone access denied",
               isPresented: $permissionDenied) {
            Button("OK", role: .cancel) { dismiss() }
        } message: {
            Text("Enable microphone access for AudioNotes in Settings to record.")
        }
        .alert("Recording error",
               isPresented: .constant(errorText != nil),
               actions: {
                   Button("OK", role: .cancel) { errorText = nil }
               },
               message: {
                   Text(errorText ?? "")
               })
    }

    private func startRecording() {
        recorder.requestPermission { granted in
            guard granted else {
                permissionDenied = true
                return
            }
            do {
                _ = try recorder.start()
            } catch {
                errorText = error.localizedDescription
            }
        }
    }

    private func finishRecording() {
        guard let (url, duration) = recorder.stop() else { return }
        let title = defaultTitle()
        var note = Note(title: title,
                        duration: duration,
                        fileName: url.lastPathComponent,
                        isTranscribing: true)
        store.add(note)
        dismiss()

        Task {
            do {
                let text = try await Transcriber.transcribe(fileURL: url)
                note.transcript = text
                note.isTranscribing = false
                await MainActor.run { store.update(note) }
            } catch {
                note.transcript = "[Transcription failed: \(error.localizedDescription)]"
                note.isTranscribing = false
                await MainActor.run { store.update(note) }
            }
        }
    }

    private func defaultTitle() -> String {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        return f.string(from: Date())
    }

    private func formatElapsed(_ t: TimeInterval) -> String {
        let total = Int(t)
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        if h > 0 {
            return String(format: "%d:%02d:%02d", h, m, s)
        }
        return String(format: "%02d:%02d", m, s)
    }
}
