import SwiftUI

struct yButton: View {
    let title: String
    let action: () -> Void
    
    init(title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .padding(8)
                .font(/*@START_MENU_TOKEN@*/.title/*@END_MENU_TOKEN@*/)
                .background(Color.green)
                .foregroundColor(.white)
                .cornerRadius(10).shadow(radius: 2)
        }
    }
}

#Preview {
    yButton(title: "IPX") {
        print("dfhsgldfg")
    }
}
