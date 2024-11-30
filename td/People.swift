//
//  People.swift
//  td
//
//  Created by Yossi Lev on 30/10/2023.
//

import Foundation
import SwiftUI

struct Person {
    var id: Int
    var name: String
    var imageName: String
    var image: Image {
        Image(imageName)
    }
}

let persons = [
    Person(id: 1, name: "Michal", imageName: "pexels-aa-dil-2598024"),
    Person(id: 2, name: "Reut", imageName: "pexels-kalyn-kostov-3460478"),
    Person(id: 3, name: "Noga", imageName: "pexels-kamiz-ferreira-2218786"),
]
