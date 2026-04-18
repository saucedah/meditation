import AVFoundation
import SwiftUI

struct NoteDetailView: View {
    @EnvironmentObject private var store: NotesStore
    let note: Note

    @State private var player: AVAudioPlayer?
    @State private var isPlaying = false
    @State private var retryError: String?
    @State private var isRetranscribing = false

    private var current: Note {
        store.notes.first(where: { $0.id == note.id }) ?? note
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(current.title)
                        .font(.title2).bold()
                    Text(current.createdAt.formatted(date: .abbreviated, time: .shortened))
                        .foregroundStyle(.secondary)
                }

                HStack(spacing: 16) {
                    Button {
                        togglePlay()
                    } label: {
                        Label(isPlaying ? "Pause" : "Play",
                              systemImage: isPlaying ? "pause.fill" : "play.fill")
                            .font(.headline)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 10)
                            .background(Capsule().fill(Color.accentColor.opacity(0.15)))
                    }

                    Text(formatDuration(current.duration))
                        .monospacedDigit()
                        .foregroundStyle(.secondary)
                }

                Divider()

                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Transcript")
                            .font(.headline)
                        Spacer()
                        if current.isTranscribing || isRetranscribing {
                            ProgressView()
                        } else {
                            Button {
                                retranscribe()
                            } label: {
                                Label("Retry", systemImage: "arrow.clockwise")
                                    .labelStyle(.iconOnly)
                            }
                        }
                    }

                    if current.isTranscribing || isRetranscribing {
                        Text("Transcribing audio…")
                            .foregroundStyle(.secondary)
                    } else if let t = current.transcript, !t.isEmpty {
                        Text(t)
                            .textSelection(.enabled)
                    } else {
                        Text("No transcript available.")
                            .foregroundStyle(.secondary)
                    }

                    if let retryError {
                        Text(retryError)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Note")
        .navigationBarTitleDisplayMode(.inline)
        .onDisappear {
            player?.stop()
            player = nil
            isPlaying = false
        }
    }

    private func togglePlay() {
        if isPlaying {
            player?.pause()
            isPlaying = false
            return
        }
        if player == nil {
            do {
                try AVAudioSession.sharedInstance().setCategory(.playback)
                try AVAudioSession.sharedInstance().setActive(true)
                player = try AVAudioPlayer(contentsOf: current.fileURL)
                player?.prepareToPlay()
            } catch {
                retryError = "Playback failed: \(error.localizedDescription)"
                return
            }
        }
        player?.play()
        isPlaying = true
    }

    private func retranscribe() {
        isRetranscribing = true
        retryError = nil
        var updated = current
        updated.isTranscribing = true
        store.update(updated)

        Task {
            do {
                let text = try await Transcriber.transcribe(fileURL: updated.fileURL)
                updated.transcript = text
                updated.isTranscribing = false
                await MainActor.run {
                    store.update(updated)
                    isRetranscribing = false
                }
            } catch {
                updated.isTranscribing = false
                await MainActor.run {
                    store.update(updated)
                    retryError = error.localizedDescription
                    isRetranscribing = false
                }
            }
        }
    }

    private func formatDuration(_ t: TimeInterval) -> String {
        let total = Int(t)
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        return h > 0
            ? String(format: "%d:%02d:%02d", h, m, s)
            : String(format: "%d:%02d", m, s)
    }
}
