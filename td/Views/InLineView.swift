import SwiftUI

struct InLineView: View {
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    @State var index = 0
    var body: some View {
        VStack {
            Text("\(index)")
        }.onReceive(timer, perform: { _ in
            print("updating")
            index += 1
        })
    }
}

#Preview {
    InLineView()
}
