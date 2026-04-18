import Foundation
import Speech

enum TranscriberError: LocalizedError {
    case notAuthorized
    case recognizerUnavailable
    case failed(String)

    var errorDescription: String? {
        switch self {
        case .notAuthorized: return "Speech recognition permission was not granted."
        case .recognizerUnavailable: return "Speech recognizer is not available on this device/locale."
        case .failed(let msg): return msg
        }
    }
}

struct Transcriber {
    /// Requests Speech framework authorization.
    static func requestAuthorization() async -> SFSpeechRecognizerAuthorizationStatus {
        await withCheckedContinuation { cont in
            SFSpeechRecognizer.requestAuthorization { status in
                cont.resume(returning: status)
            }
        }
    }

    /// Transcribes an audio file on-device (when supported) and returns the full text.
    static func transcribe(fileURL: URL, locale: Locale = .current) async throws -> String {
        let status = await requestAuthorization()
        guard status == .authorized else { throw TranscriberError.notAuthorized }

        let recognizer = SFSpeechRecognizer(locale: locale) ?? SFSpeechRecognizer()
        guard let recognizer, recognizer.isAvailable else {
            throw TranscriberError.recognizerUnavailable
        }

        let request = SFSpeechURLRecognitionRequest(url: fileURL)
        request.shouldReportPartialResults = false
        if recognizer.supportsOnDeviceRecognition {
            request.requiresOnDeviceRecognition = true
        }

        return try await withCheckedThrowingContinuation { cont in
            recognizer.recognitionTask(with: request) { result, error in
                if let error = error {
                    cont.resume(throwing: TranscriberError.failed(error.localizedDescription))
                    return
                }
                guard let result = result, result.isFinal else { return }
                cont.resume(returning: result.bestTranscription.formattedString)
            }
        }
    }
}
