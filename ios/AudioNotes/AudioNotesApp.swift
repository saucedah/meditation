import SwiftUI

@main
struct AudioNotesApp: App {
    @StateObject private var store = NotesStore()

    var body: some Scene {
        WindowGroup {
            NotesListView()
                .environmentObject(store)
        }
    }
}
