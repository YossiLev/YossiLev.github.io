//import SwiftUI
//import SwiftData
//
//struct ExpenseView: View {
//    @Environment(\.modelContext) var context
//    @State private var isShowingItemSheet = false
//    @Query(sort: \Expense.date) var expenses: [Expense]
//    @State private var expenseToEdit: Expense?
//    
//    var body: some View {
//        List {
//            ForEach(expenses) { expense in
//                ExpenseCell(expense: expense)
//                    .onTapGesture {
//                        expenseToEdit = expense
//                    }
//            }
//            .onDelete(perform: { indexSet in
//                for index in indexSet {
//                    context.delete(expenses[index])
//                }
//            })
//        }
//        .sheet(isPresented: $isShowingItemSheet) {
//            AddExpenseSheet()
//        }
//        .sheet(item: $expenseToEdit) { expense in
//            UpdateExpenseSheet(expense: expense)
//        }
//        .toolbar {
//            if !expenses.isEmpty {
//                Button("Add Expense", systemImage: "plus") {
//                    isShowingItemSheet = true
//                }
//            }
//        }
//        .overlay {
//            if expenses.isEmpty {
//                ContentUnavailableView(label: {
//                    Label("No Expences", systemImage: "list.bullet.rectangle.portrait")
//                }, description: {
//                    Text("Start adding expences to see your list")
//                }, actions: {
//                    Button("Add Expences") {isShowingItemSheet = true}
//                })
//                .offset(y: -60)
//            }
//        }
//    }
//}
//
//#Preview {
//    ExpenseView()
//}
//
//struct ExpenseCell: View {
//    let expense: Expense
//    
//    var body: some View {
//        HStack {
//            Text(expense.date, format: .dateTime.month(.abbreviated).day())
//                .frame(width: 70, alignment: .leading)
//            Text(expense.name)
//            Spacer()
//            Text(expense.value, format: .currency(code: "USD"))
//        }
//    }
//}
//struct AddExpenseSheet: View {
//    @Environment(\.modelContext) var context
//    @Environment(\.dismiss) private var dismiss
//
//    @State private var name: String = ""
//    @State private var date: Date = .now
//    @State private var value: Double = 0
//
//    var body: some View {
//        NavigationStack {
//            Form {
//                TextField("Expense Name", text: $name)
//                DatePicker("Date", selection: $date, displayedComponents: .date)
//                TextField("value", value: $value, format: .currency(code: "USD"))
//                    .keyboardType(.decimalPad)
//            }
//            .navigationTitle("New Expense")
//            .navigationBarTitleDisplayMode(.large)
//            .toolbar {
//                ToolbarItemGroup(placement: .topBarLeading) {
//                    Button("Cancel") {dismiss()}
//                }
//                ToolbarItemGroup(placement: .topBarTrailing) {
//                    Button("Save") {
//                        let expence = Expense(name: name, date: date, value: value)
//                        context.insert(expence)
//                        dismiss()
//                        
//                    }
//                }
//            }
//        }
//    }
//}
//
//struct UpdateExpenseSheet: View {
//    @Environment(\.dismiss) private var dismiss
//    @Bindable var expense: Expense
//    
//    var body: some View {
//        NavigationStack {
//            Form {
//                TextField("Expense Name", text: $expense.name)
//                DatePicker("Date", selection: $expense.date, displayedComponents: .date)
//                TextField("value", value: $expense.value, format: .currency(code: "USD"))
//                    .keyboardType(.decimalPad)
//            }
//            .navigationTitle("Update Expense")
//            .navigationBarTitleDisplayMode(.large)
//            .toolbar {
//                ToolbarItemGroup(placement: .topBarTrailing) {
//                    Button("Done") {
//                        dismiss()
//                        
//                    }
//                }
//            }
//        }
//    }
//}
