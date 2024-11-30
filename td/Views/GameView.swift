//
//  GameView.swift
//  td
//
//  Created by Yossi Lev on 05/11/2023.
//

import SwiftUI

struct GameView: View {
    var cWidth = 400
    var cHeight = 600
    var sSize = 7
    @State private var indexPerson = 1
    @State private var taskCount = 1
    @State var life = [[Int]](repeating: [Int](repeating: 0, count: 10), count: 10)
    var lWidth: Int
    var lHeight: Int
    
    init() {
        self.lWidth = cWidth / (sSize + 1)
        self.lHeight = cHeight / (sSize + 1)
        self.indexPerson = indexPerson
        let ss = [[Int]](repeating: [Int](repeating: 0, count: self.lWidth), count: self.lHeight)
        _life = State(initialValue: ss)
    }
    
    var body: some View {
        VStack {
            
            Canvas { context, size in
                // Draw background
                context.fill(Path(CGRect(origin: .zero, size: CGSize(width: cWidth, height: cHeight))),
                             with: .color(.yellow))
                for i in 0...(lHeight - 1) {
                    for j in 0...(lWidth - 1) {
                        if (life[i][j] == 1) {
                            context.fill(
                                Path(CGRect(origin: CGPoint(x: j * (sSize + 1), y: i * (sSize + 1)),
                                            size: CGSize(width: sSize, height: sSize))),
                                with: .color(.black))
                        }
                    }
                }
                
            }
            HStack {
                VStack {
                    
                    Image(persons[indexPerson].imageName)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 80, height: 80, alignment: .center)
                        .clipShape(Circle())
                        .overlay{
                            Circle().stroke(.white, lineWidth: 4)
                        }
                        .shadow(radius: 7)
                    
                    Text(persons[indexPerson].name)
                        .font(.title)
                        .foregroundColor(.gray)
                }
                VStack {
                    
                    HStack {
                        yButton(title: "RUN")  {
                            for _ in 1...10 {
                                lifeNext(lWidth: lWidth, lHeight: lHeight, plife: $life)
                                indexPerson = (indexPerson + 1) % 3
                            }
                        }
                        yButton(title: "STEP") { lifeNext(lWidth: lWidth, lHeight: lHeight, plife: $life) }
                    }
                    
                    yButton(title: "INITIALIZE") {
                        print("Initialize \(taskCount)")
                        taskCount = taskCount + 1
                        lifeInit(lWidth: lWidth, lHeight: lHeight, plife: $life)
                    }
                }
            }
            
        }.task {
            print("hello task \(taskCount)")
        }
    }

}
    
#Preview {
    GameView()
}
