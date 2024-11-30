import SwiftUI

struct ContentView: View {
    
    var imagesArr = [UIImage]()
    @State private var capturedImages = [UIImage]()
    @State private var isCustomCameraViewPresented = false
    
    var body: some View {
        ZStack {
            if isCustomCameraViewPresented {
                CustomCameraView(capturedImages: $capturedImages,
                                 isCustomCameraViewPresented: $isCustomCameraViewPresented)
            }
            if !isCustomCameraViewPresented {
                VStack {
                    Button(action: {
                        isCustomCameraViewPresented.toggle()
                    }, label: {
                        Image(systemName: "camera.fill")
                            .font(.largeTitle)
                            .padding()
                            .background(Color.black)
                            .foregroundColor(.white)
                            .clipShape(Circle()) 
                    })

                    ScrollView {
                        LazyVGrid(columns: [.init(.adaptive(minimum: 100, maximum: .infinity), spacing: 5)]) {
                            ForEach(0 ..< capturedImages.count) { i in
                                Image(uiImage: capturedImages[i])
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .frame(width: 95, alignment: .center)
                                
                            }
                        }
                    }
                }
            }
        }
    }
//        NavigationView {
//            
//            VStack {
//                GameView()
//                HStack {
//                    NavigationLink(destination: GameView()) {
//                        Image(systemName: "square.and.arrow.down")
//                            .font(.system(size: 20, weight: .light))
//                    }
//                    NavigationLink(destination: SettingsView()) {
//                        Image(systemName: "wrench")
//                            .font(.system(size: 20, weight: .light))
//                    }
//                    NavigationLink(destination: InLineView()) {
//                        Image(systemName: "clock")
//                            .font(.system(size: 20, weight: .light))
//                    }
////                    NavigationLink(destination: ExpenseView()) {
////                        Image(systemName: "dollarsign.square")
////                            .font(.system(size: 20, weight: .light))
////                    }
//                }
//            }
//        }
//        .navigationBarTitle("Switch Views")
//        
//    }
}

#Preview {
    ContentView()
}
