import Foundation

// MARK: - Debt Workbook Schema
struct DebtWorkbook: Codable {
      let version: String
      let createdAt: Date
      var updatedAt: Date
      let appVersion: String

      var profile: UserProfile
      var debts: [WorkbookDebt]
      var budget: MonthlyBudget?
      var strategy: RepaymentStrategy
      var babySteps: [BabyStepProgress]

      init() {
          self.version = "1.0"
          self.createdAt = Date()
          self.updatedAt = Date()
          self.appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"

          self.profile = UserProfile()
          self.debts = []
          self.budget = nil
          self.strategy = .snowball
          self.babySteps = BabyStep.allSteps.map { BabyStepProgress(from: $0) }
      }

      mutating func updateTimestamp() {
          updatedAt = Date()
      }
  }

  // MARK: - User Profile
  struct UserProfile: Codable {
      var name: String?
      var monthlyIncome: Double?
      var hasEmergencyFund: Bool
      var currentBabyStep: Int

      init() {
          self.name = nil
          self.monthlyIncome = nil
          self.hasEmergencyFund = false
          self.currentBabyStep = 1
      }
  }

  // MARK: - Workbook Debt (Simplified for JSON)
  struct WorkbookDebt: Codable, Identifiable {
      let id: UUID
      var name: String
      var balance: Double
      var interestRate: Double
      var minimumPayment: Double
      var creditorType: CreditorType
      var accountNumber: String? // Last 4 digits only
      var nextDueDate: Date?
      var paymentFrequency: PaymentFrequency
      var lastPaymentDate: Date?

      init(name: String, balance: Double, interestRate: Double, minimumPayment: Double, creditorType: CreditorType = .creditCard, nextDueDate: Date? = nil, paymentFrequency: PaymentFrequency = .monthly) {
          self.id = UUID()
          self.name = name
          self.balance = balance
          self.interestRate = interestRate
          self.minimumPayment = minimumPayment
          self.creditorType = creditorType
          self.accountNumber = nil
          self.nextDueDate = nextDueDate
          self.paymentFrequency = paymentFrequency
          self.lastPaymentDate = nil
      }

      // Convert from app's Debt model
      init(from debt: Debt) {
          self.id = debt.id
          self.name = debt.name
          self.balance = debt.balance
          self.interestRate = debt.interestRate
          self.minimumPayment = debt.minimumPayment
          self.creditorType = .creditCard // Default, could be enhanced
          self.accountNumber = nil
          self.nextDueDate = nil
          self.paymentFrequency = .monthly
          self.lastPaymentDate = nil
      }

      // Convert to app's Debt model
      func toDebt() -> Debt {
          return Debt(
              name: name,
              balance: balance,
              interestRate: interestRate,
              minimumPayment: minimumPayment,
              isDemo: false
          )
      }
  }

// MARK: - Payment Frequency
enum PaymentFrequency: String, CaseIterable, Codable {
    case weekly = "Weekly"
    case biweekly = "Bi-weekly" 
    case monthly = "Monthly"
    case quarterly = "Quarterly"
    
    var daysInterval: Int {
        switch self {
        case .weekly: return 7
        case .biweekly: return 14
        case .monthly: return 30
        case .quarterly: return 90
        }
    }
}

// MARK: - Creditor Types
  enum CreditorType: String, CaseIterable, Codable {
      case creditCard = "Credit Card"
      case personalLoan = "Personal Loan"
      case carLoan = "Car Loan"
      case studentLoan = "Student Loan"
      case mortgage = "Mortgage"
      case overdraft = "Overdraft"
      case storeCard = "Store Card"
      case other = "Other"

      var icon: String {
          switch self {
          case .creditCard: return "creditcard.fill"
          case .personalLoan: return "banknote.fill"
          case .carLoan: return "car.fill"
          case .studentLoan: return "graduationcap.fill"
          case .mortgage: return "house.fill"
          case .overdraft: return "minus.circle.fill"
          case .storeCard: return "bag.fill"
          case .other: return "questionmark.circle.fill"
          }
      }
  }

  // MARK: - Monthly Budget
  struct MonthlyBudget: Codable {
      var income: Double
      var expenses: [BudgetCategory]
      var extraPayment: Double

      init(income: Double) {
          self.income = income
          self.expenses = BudgetCategory.defaultCategories()
          self.extraPayment = 0
      }

      var totalExpenses: Double {
          expenses.reduce(0) { $0 + $1.amount }
      }

      var availableForDebt: Double {
          max(0, income - totalExpenses)
      }
  }

  // MARK: - Budget Categories
  struct BudgetCategory: Codable, Identifiable {
      let id: UUID
      var name: String
      var amount: Double
      var isEssential: Bool

      init(name: String, amount: Double, isEssential: Bool) {
        self.id = UUID()
        self.name = name
        self.amount = amount
        self.isEssential = isEssential
    }
    
    static func defaultCategories() -> [BudgetCategory] {
          return [
              BudgetCategory(name: "Housing", amount: 0, isEssential: true),
              BudgetCategory(name: "Transport", amount: 0, isEssential: true),
              BudgetCategory(name: "Food", amount: 0, isEssential: true),
              BudgetCategory(name: "Utilities", amount: 0, isEssential: true),
              BudgetCategory(name: "Insurance", amount: 0, isEssential: true),
              BudgetCategory(name: "Dining Out", amount: 0, isEssential: false),
              BudgetCategory(name: "Entertainment", amount: 0, isEssential: false),
              BudgetCategory(name: "Shopping", amount: 0, isEssential: false),
              BudgetCategory(name: "Subscriptions", amount: 0, isEssential: false)
          ]
      }
  }

  // MARK: - Repayment Strategy
  enum RepaymentStrategy: String, CaseIterable, Codable {
      case snowball = "Debt Snowball"
      case avalanche = "Debt Avalanche"
      case custom = "Custom Order"

      var description: String {
          switch self {
          case .snowball:
              return "Pay off smallest balances first for psychological wins"
          case .avalanche:
              return "Pay off highest interest rates first to minimize total interest"
          case .custom:
              return "Choose your own order based on personal priorities"
          }
      }
  }

  // MARK: - Baby Step Progress (for workbook)
  struct BabyStepProgress: Codable, Identifiable {
      let id: Int
      let title: String
      let description: String
      var isCompleted: Bool
      var completedDate: Date?
      var notes: String?

      init(from babyStep: BabyStep) {
          self.id = babyStep.id
          self.title = babyStep.title
          self.description = babyStep.description
          self.isCompleted = babyStep.isCompleted
          self.completedDate = nil
          self.notes = nil
      }
  }

  // MARK: - Workbook Service
  class WorkbookService: ObservableObject {
      @Published var workbook = DebtWorkbook()
      @Published var isOnboardingComplete = false

      private let workbookKey = "SavedWorkbook"
      private let onboardingKey = "OnboardingComplete"

      init() {
          loadWorkbook()
          isOnboardingComplete = UserDefaults.standard.bool(forKey: onboardingKey)
      }

      // MARK: - Persistence
      func saveWorkbook() {
          workbook.updateTimestamp()

          if let encoded = try? JSONEncoder().encode(workbook) {
              UserDefaults.standard.set(encoded, forKey: workbookKey)
          }
      }

      private func loadWorkbook() {
          if let data = UserDefaults.standard.data(forKey: workbookKey),
             let saved = try? JSONDecoder().decode(DebtWorkbook.self, from: data) {
              workbook = saved
          }
      }

      func completeOnboarding() {
          isOnboardingComplete = true
          UserDefaults.standard.set(true, forKey: onboardingKey)
          saveWorkbook()
      }

      // MARK: - Export/Import
      func exportWorkbook() -> Data? {
          workbook.updateTimestamp()
          return try? JSONEncoder().encode(workbook)
      }

      func importWorkbook(from data: Data) throws -> DebtWorkbook {
          let importedWorkbook = try JSONDecoder().decode(DebtWorkbook.self, from: data)
          return importedWorkbook
      }

      func replaceWorkbook(with newWorkbook: DebtWorkbook) {
          workbook = newWorkbook
          saveWorkbook()
      }

      // MARK: - Integration with existing models
      func syncToDebtViewModel(_ debtViewModel: DebtViewModel) {
          // Convert workbook debts to app debts
          let appDebts = workbook.debts.map { $0.toDebt() }
          debtViewModel.debts = appDebts

          // Set extra payment from budget
          if let budget = workbook.budget {
              debtViewModel.extraPayment = budget.extraPayment
          }
      }

      func syncFromDebtViewModel(_ debtViewModel: DebtViewModel) {
          // Convert app debts to workbook debts
          workbook.debts = debtViewModel.debts.map { WorkbookDebt(from: $0) }

          // Update budget extra payment
          if workbook.budget != nil {
              workbook.budget?.extraPayment = debtViewModel.extraPayment
          }

          saveWorkbook()
      }

      // MARK: - Helper methods
      var totalDebt: Double {
          workbook.debts.reduce(0) { $0 + $1.balance }
      }

      var totalMinimumPayments: Double {
          workbook.debts.reduce(0) { $0 + $1.minimumPayment }
      }
  }
