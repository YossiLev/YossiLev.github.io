import SwiftUI

struct CustomCameraView: View {
    let cameraService = CameraService()
    @Binding var capturedImages: [UIImage]
    @State var capturedImage: UIImage?
    @Binding var isCustomCameraViewPresented: Bool
    @Environment(\.presentationMode) private var presentationMode
    
    
    var body: some View {
        ZStack {
            CameraView(cameraService: cameraService) { result in
                switch result {
                case .success(let photo):
                    if let data = photo.fileDataRepresentation() {
                        capturedImage = UIImage(data: data)
                        capturedImages.append(capturedImage!)
                        isCustomCameraViewPresented = false
                        //presentationMode.wrappedValue.dismiss()
                    }
                case .failure(_):
                    print("Error: no image data found")
                }
            }
            VStack {
                Spacer()
                Button(action: {
                    cameraService.capturePhoto()
                }, label: {Image(systemName: "circle")
                    .font(.system(size: 72))
                    .foregroundColor(.white)
                })
                .padding(.bottom)
            }
        }
    }
}

