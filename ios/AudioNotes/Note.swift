import Foundation

struct Note: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var createdAt: Date
    var duration: TimeInterval
    var fileName: String
    var transcript: String?
    var isTranscribing: Bool

    init(id: UUID = UUID(),
         title: String,
         createdAt: Date = Date(),
         duration: TimeInterval,
         fileName: String,
         transcript: String? = nil,
         isTranscribing: Bool = false) {
        self.id = id
        self.title = title
        self.createdAt = createdAt
        self.duration = duration
        self.fileName = fileName
        self.transcript = transcript
        self.isTranscribing = isTranscribing
    }

    var fileURL: URL {
        NotesStore.recordingsDirectory.appendingPathComponent(fileName)
    }
}
