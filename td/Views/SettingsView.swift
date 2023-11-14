import SwiftUI

struct SettingsView: View {
    @State private var notificationsEnabled = true
    @State private var darkModeEnabled = false
    @State private var selectedFontSizeIndex = 1
    let fontSizes = ["Small", "Medium", "Large"]

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("General Settings")) {
                    Toggle("Enable Notifications", isOn: $notificationsEnabled)
                    Toggle("Dark Mode", isOn: $darkModeEnabled)
                }
                
                Section(header: Text("Display Settings")) {
                    Picker("Text Size", selection: $selectedFontSizeIndex) {
                        ForEach(0..<fontSizes.count, id: \.self) { index in
                            Text(fontSizes[index])
                        }
                    }
                }
            }
            .navigationBarTitle("Settings")
        }
    }
}

#Preview {
    SettingsView()
}
