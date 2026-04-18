import AVFoundation
import Combine
import Foundation

@MainActor
final class AudioRecorder: NSObject, ObservableObject {
    @Published private(set) var isRecording = false
    @Published private(set) var elapsed: TimeInterval = 0
    @Published private(set) var level: Float = 0
    /// Rolling buffer of recent input levels (0…1), newest last. Max `levelBufferSize`.
    @Published private(set) var levels: [Float] = []
    @Published var errorMessage: String?

    let levelBufferSize = 80

    private var recorder: AVAudioRecorder?
    private var timer: Timer?
    private var currentURL: URL?
    private var startDate: Date?

    /// Requests mic permission. Completion fires on the main actor.
    func requestPermission(_ completion: @escaping (Bool) -> Void) {
        let session = AVAudioSession.sharedInstance()
        if #available(iOS 17.0, *) {
            AVAudioApplication.requestRecordPermission { granted in
                DispatchQueue.main.async { completion(granted) }
            }
        } else {
            session.requestRecordPermission { granted in
                DispatchQueue.main.async { completion(granted) }
            }
        }
    }

    func start() throws -> URL {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord,
                                mode: .spokenAudio,
                                options: [.defaultToSpeaker, .allowBluetooth])
        try session.setActive(true, options: [])

        let fileName = "note-\(Int(Date().timeIntervalSince1970)).m4a"
        let url = NotesStore.recordingsDirectory.appendingPathComponent(fileName)

        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44_100,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        let rec = try AVAudioRecorder(url: url, settings: settings)
        rec.delegate = self
        rec.isMeteringEnabled = true
        guard rec.record() else {
            throw NSError(domain: "AudioRecorder", code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "Could not start recording."])
        }

        self.recorder = rec
        self.currentURL = url
        self.startDate = Date()
        self.isRecording = true
        self.elapsed = 0
        self.levels = Array(repeating: 0, count: levelBufferSize)
        startTimer()
        return url
    }

    /// Stops and returns the finished file URL along with the duration.
    func stop() -> (url: URL, duration: TimeInterval)? {
        guard let rec = recorder, let url = currentURL else { return nil }
        let duration = Date().timeIntervalSince(startDate ?? Date())
        rec.stop()
        stopTimer()
        isRecording = false
        elapsed = 0
        level = 0
        levels = []
        currentURL = nil
        recorder = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
        return (url, duration)
    }

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self else { return }
            Task { @MainActor in
                guard let rec = self.recorder else { return }
                rec.updateMeters()
                let power = rec.averagePower(forChannel: 0)
                // Map dB (-60…0) to 0…1
                let normalized = max(0, min(1, (power + 60) / 60))
                self.level = normalized
                var buf = self.levels
                buf.append(normalized)
                if buf.count > self.levelBufferSize {
                    buf.removeFirst(buf.count - self.levelBufferSize)
                }
                self.levels = buf
                if let start = self.startDate {
                    self.elapsed = Date().timeIntervalSince(start)
                }
            }
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
}

extension AudioRecorder: AVAudioRecorderDelegate {
    nonisolated func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        Task { @MainActor in
            self.errorMessage = error?.localizedDescription ?? "Recording error."
            self.isRecording = false
            self.stopTimer()
        }
    }
}
