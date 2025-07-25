import SwiftUI

struct WelcomeStep: View {
    @Binding var name: String
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Welcome to TrySnowball! 👋")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("Let's create your debt elimination plan")
                .font(.body)
                .foregroundColor(.secondary)
            
            TextField("Your name (optional)", text: $name)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding(.horizontal)
        }
    }
}

struct ReviewStep: View {
    let workbook: DebtWorkbook
    let name: String
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Review Your Setup")
                .font(.title2)
                .fontWeight(.bold)
            
            if !name.isEmpty {
                Text("Name: \(name)")
            }
            
            Text("Total Debts: \(workbook.debts.count)")
            
            if !workbook.debts.isEmpty {
                Text("Total Amount: \(workbook.debts.reduce(0) { $0 + $1.balance }.formatAsCurrency())")
                    .foregroundColor(.red)
            }
            
            Text("Ready to start your debt-free journey!")
                .font(.headline)
                .foregroundColor(.green)
        }
    }
}
