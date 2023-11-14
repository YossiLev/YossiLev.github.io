import SwiftUI
import SwiftData

@main
struct tdApp: App {
    
//    let container: ModelContainer = {
//        let schema = Schema([Expense.self])
//        let container = try! ModelContainer(for: schema)
//        return container
//    }()

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
//        .modelContainer(container)
    }
}
