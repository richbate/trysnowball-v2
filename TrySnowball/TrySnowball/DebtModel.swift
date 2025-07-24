import Foundation

struct Debt: Identifiable, Codable {
    let id: UUID
    var name: String
    var balance: Double
    var interestRate: Double
    var minimumPayment: Double
    var isDemo: Bool = false
    
    init(name: String, balance: Double, interestRate: Double, minimumPayment: Double, isDemo: Bool = false) {
        self.id = UUID()
        self.name = name
        self.balance = balance
        self.interestRate = interestRate
        self.minimumPayment = minimumPayment
        self.isDemo = isDemo
    }
    
    // Format balance as currency
    var formattedBalance: String {
        return String(format: "£%.0f", balance)
    }
    
    // Format minimum payment as currency
    var formattedMinimumPayment: String {
        return String(format: "£%.2f", minimumPayment)
    }
    
    // Format interest rate as percentage
    var formattedInterestRate: String {
        return String(format: "%.1f%%", interestRate)
    }
    
    // Demo data
    static let demoDebts: [Debt] = [
        Debt(name: "Barclaycard", balance: 3450, interestRate: 23.9, minimumPayment: 86.25, isDemo: true),
        Debt(name: "Halifax Credit Card", balance: 5670, interestRate: 19.9, minimumPayment: 113.40, isDemo: true),
        Debt(name: "Personal Loan", balance: 12500, interestRate: 8.5, minimumPayment: 285.50, isDemo: true),
        Debt(name: "Store Card", balance: 890, interestRate: 29.9, minimumPayment: 35.60, isDemo: true)
    ]
}

// MARK: - DebtViewModel
class DebtViewModel: ObservableObject {
    @Published var debts: [Debt] = []
    @Published var extraPayment: Double = 100
    
    private let userDefaultsKey = "SavedDebts"
    
    init() {
        loadDebts()
    }
    
    func addDebt(_ debt: Debt) {
        debts.append(debt)
        saveDebts()
    }
    
    func updateDebt(_ debt: Debt) {
        if let index = debts.firstIndex(where: { $0.id == debt.id }) {
            debts[index] = debt
            saveDebts()
        }
    }
    
    func deleteDebt(_ debt: Debt) {
        debts.removeAll { $0.id == debt.id }
        saveDebts()
    }
    
    private func saveDebts() {
        if let encoded = try? JSONEncoder().encode(debts) {
            UserDefaults.standard.set(encoded, forKey: userDefaultsKey)
        }
    }
    
    private func loadDebts() {
        if let data = UserDefaults.standard.data(forKey: userDefaultsKey),
           let savedDebts = try? JSONDecoder().decode([Debt].self, from: data) {
            debts = savedDebts
        } else {
            // Load demo data for first-time users
            debts = Debt.demoDebts
        }
    }
    
    var totalDebt: Double {
        return debts.reduce(0) { $0 + $1.balance }
    }
    
    var totalMinimumPayments: Double {
        return debts.reduce(0) { $0 + $1.minimumPayment }
    }
    
    func formatCurrency(_ amount: Double) -> String {
        return String(format: "£%.0f", amount)
    }
}