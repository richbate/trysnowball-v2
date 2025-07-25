import SwiftUI

struct DebtEntryStep: View {
    @Binding var workbook: DebtWorkbook
    @Binding var showingAddDebt: Bool
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Add Your Debts")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("List all your debts to create your elimination plan")
                .font(.body)
                .foregroundColor(.secondary)
            
            if workbook.debts.isEmpty {
                VStack {
                    Image(systemName: "plus.circle.dashed")
                        .font(.system(size: 50))
                        .foregroundColor(.blue)
                    Text("No debts added yet")
                        .font(.headline)
                }
            } else {
                List(workbook.debts) { debt in
                    VStack(alignment: .leading) {
                        Text(debt.name)
                            .font(.headline)
                        Text("\(debt.balance.formatAsCurrency()) at \(String(format: "%.1f", debt.interestRate))%")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .frame(maxHeight: 200)
            }
            
            Button("Add Debt") {
                showingAddDebt = true
            }
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(8)
        }
    }
}


struct AddDebtView: View {
    @Binding var workbook: DebtWorkbook
    @Environment(\.presentationMode) var presentationMode
    
    @State private var name = ""
    @State private var balance = ""
    @State private var interestRate = ""
    @State private var minimumPayment = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Debt Details")) {
                    TextField("Name", text: $name)
                    TextField("Balance", text: $balance)
#if os(iOS)
                        .keyboardType(.decimalPad)
#endif
                    TextField("Interest Rate (%)", text: $interestRate)
#if os(iOS)
                        .keyboardType(.decimalPad)
#endif
                    TextField("Minimum Payment", text: $minimumPayment)
#if os(iOS)
                        .keyboardType(.decimalPad)
#endif
                }
            }
            .navigationTitle("Add Debt")
            .debtToolbar(
                isValid: isValid,
                cancelAction: { presentationMode.wrappedValue.dismiss() },
                saveAction: { saveDebt() }
            )
        }
    }
    
    private var isValid: Bool {
        !name.isEmpty &&
        Double(balance) != nil &&
        Double(interestRate) != nil &&
        Double(minimumPayment) != nil
    }
    
    private func saveDebt() {
        guard let balanceValue = Double(balance),
              let rateValue = Double(interestRate),
              let paymentValue = Double(minimumPayment) else { return }
        
        let debt = WorkbookDebt(
            name: name,
            balance: balanceValue,
            interestRate: rateValue,
            minimumPayment: paymentValue
        )
        
        workbook.debts.append(debt)
        presentationMode.wrappedValue.dismiss()
    }
}
