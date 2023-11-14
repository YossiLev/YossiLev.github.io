import Foundation
import SwiftUI

func lifeNext(lWidth: Int, lHeight: Int, plife: Binding<[[Int]]> ) {
    var life = plife.wrappedValue
    var help = [[Int]](
        repeating: [Int](repeating: 0, count: lWidth),
        count: lHeight
       )
    // inside
    for i in 1...(lHeight - 2) {
        for j in 1...(lWidth - 2) {
            var sum = 0
            sum += life[i][j - 1] + life[i][j + 1]
            sum = sum + life[i - 1][j - 1] + life[i - 1][j] + life[i - 1][j + 1]
            sum = sum + life[i + 1][j - 1] + life[i + 1][j] + life[i + 1][j + 1]
            if (sum == 3) {
                help[i][j] = 1
            }
            if (sum == 2 && life[i][j] == 1) {
                help[i][j] = 1
            }
        }
    }
    // top bottom
    for j in 1...(lWidth - 2) {
        var sum = 0
        sum = sum + life[0][j - 1] + life[0][j + 1]
        sum = sum + life[lHeight - 1][j - 1] + life[lHeight - 1][j] + life[lHeight - 1][j + 1]
        sum = sum + life[1][j - 1] + life[1][j] + life[1][j + 1]
        if (sum == 3) {
            help[0][j] = 1
        }
        if (sum == 2 && life[0][j] == 1) {
            help[0][j] = 1
        }
        sum = 0
        sum = sum + life[lHeight - 1][j - 1] + life[lHeight - 1][j + 1]
        sum = sum + life[lHeight - 2][j - 1] + life[lHeight - 2][j] + life[lHeight - 2][j + 1]
        sum = sum + life[0][j - 1] + life[0][j] + life[0][j + 1]
        if (sum == 3) {
            help[lHeight - 1][j] = 1
        }
        if (sum == 2 && life[lHeight - 1][j] == 1) {
            help[lHeight - 1][j] = 1
        }
    }
    // left right
    for i in 1...(lHeight - 2) {
        var sum = 0
        sum = sum + life[i][lWidth - 1] + life[i][1]
        sum = sum + life[i - 1][lWidth - 1] + life[i - 1][0] + life[i - 1][1]
        sum = sum + life[i + 1][lWidth - 1] + life[i + 1][0] + life[i + 1][1]
        if (sum == 3) {
            help[i][0] = 1
        }
        if (sum == 2 && life[i][0] == 1) {
            help[i][0] = 1
        }
        sum = 0
        sum = sum + life[i][lWidth - 2] + life[i][0]
        sum = sum + life[i - 1][lWidth - 2] + life[i - 1][lWidth - 1] + life[i - 1][0]
        sum = sum + life[i + 1][lWidth - 2] + life[i + 1][lWidth - 1] + life[i + 1][0]
        if (sum == 3) {
            help[i][lWidth - 1] = 1
        }
        if (sum == 2 && life[i][lWidth - 1] == 1) {
            help[i][0] = 1
        }
    }
    
    for i in 0...(lHeight - 1) {
        for j in 0...(lWidth - 1) {
            life[i][j] = help[i][j]
        }
    }
    plife.wrappedValue = life
}
func lifeInit(lWidth: Int, lHeight: Int, plife: Binding<[[Int]]> ) {
    var life = plife.wrappedValue
    for i in 0...(lHeight - 1) {
        for j in 0...(lWidth - 1) {
            if (Bool.random()) {
                life[i][j] = 0
            } else {
                life[i][j] = 1
            }
        }
    }
    plife.wrappedValue = life
}

