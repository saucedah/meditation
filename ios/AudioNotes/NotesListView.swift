import SwiftUI

struct NotesListView: View {
    @EnvironmentObject private var store: NotesStore
    @State private var showRecorder = false

    var body: some View {
        NavigationStack {
            Group {
                if store.notes.isEmpty {
                    ContentUnavailableView(
                        "No audio notes yet",
                        systemImage: "mic.slash",
                        description: Text("Tap the record button to create your first note.")
                    )
                } else {
                    List {
                        ForEach(store.notes) { note in
                            NavigationLink(value: note) {
                                NoteRow(note: note)
                            }
                        }
                        .onDelete(perform: deleteNotes)
                    }
                }
            }
            .navigationTitle("Audio Notes")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showRecorder = true
                    } label: {
                        Image(systemName: "mic.circle.fill")
                            .font(.title)
                    }
                }
            }
            .navigationDestination(for: Note.self) { note in
                NoteDetailView(note: note)
            }
            .sheet(isPresented: $showRecorder) {
                RecorderView()
                    .environmentObject(store)
            }
        }
    }

    private func deleteNotes(at offsets: IndexSet) {
        for idx in offsets {
            store.delete(store.notes[idx])
        }
    }
}

private struct NoteRow: View {
    let note: Note

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(note.title)
                .font(.headline)
                .lineLimit(1)
            HStack(spacing: 8) {
                Image(systemName: "clock")
                Text(formatDuration(note.duration))
                if note.isTranscribing {
                    Image(systemName: "text.bubble")
                    Text("Transcribing…")
                } else if note.transcript?.isEmpty == false {
                    Image(systemName: "text.bubble.fill")
                    Text(note.transcript!)
                        .lineLimit(1)
                }
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
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
