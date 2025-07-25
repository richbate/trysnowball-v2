import SwiftUI

struct DebtRow: View {
    let debt: Debt
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(debt.name)
                    .font(.headline)
                Spacer()
                Text(debt.formattedBalance)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.red)
            }
            
            HStack {
                Text("\(debt.formattedInterestRate) APR")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text("Min: \(debt.formattedMinimumPayment)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

struct AddDebtToListView: View {
    @EnvironmentObject var debtViewModel: DebtViewModel
    @Environment(\.presentationMode) var presentationMode
    
    @State private var name = ""
    @State private var balance = ""
    @State private var interestRate = ""
    @State private var minimumPayment = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Debt Information")) {
                    TextField("Debt Name", text: $name)
                    TextField("Current Balance", text: $balance)
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
        
        let debt = Debt(
            name: name,
            balance: balanceValue,
            interestRate: rateValue,
            minimumPayment: paymentValue
        )
        
        debtViewModel.addDebt(debt)
        presentationMode.wrappedValue.dismiss()
    }
}
