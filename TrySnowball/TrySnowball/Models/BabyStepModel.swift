import Foundation

struct BabyStep: Identifiable, Codable {
    let id: Int
    let title: String
    let description: String
    let detailedDescription: String
    var isCompleted: Bool = false
    
    init(id: Int, title: String, description: String, detailedDescription: String, isCompleted: Bool = false) {
        self.id = id
        self.title = title
        self.description = description
        self.detailedDescription = detailedDescription
        self.isCompleted = isCompleted
    }
}

// MARK: - Dave Ramsey's 7 Baby Steps
extension BabyStep {
    static let allSteps: [BabyStep] = [
        BabyStep(
            id: 1,
            title: "£1,000 Emergency Fund",
            description: "Save £1,000 as fast as possible",
            detailedDescription: "This starter emergency fund is designed to catch those little emergencies that pop up. It's not meant to replace income, but to cover unexpected expenses like car repairs or medical bills so you don't go into more debt."
        ),
        BabyStep(
            id: 2,
            title: "Pay Off All Debt",
            description: "Use the debt snowball method",
            detailedDescription: "List all your debts (except your house) from smallest to largest balance. Pay minimums on all debts except the smallest. Attack the smallest with everything you've got. When it's paid off, take what you were paying on it and add it to the next smallest debt."
        ),
        BabyStep(
            id: 3,
            title: "3-6 Months Emergency Fund",
            description: "Save 3-6 months of expenses",
            detailedDescription: "Now you'll build a full emergency fund that covers 3-6 months of your household expenses. This fund is for major emergencies like job loss, major medical expenses, or major home/car repairs. Keep it in a separate savings account."
        ),
        BabyStep(
            id: 4,
            title: "Invest 15% for Retirement",
            description: "Invest 15% of income into retirement",
            detailedDescription: "Start investing 15% of your household income into retirement savings. In the UK, this includes workplace pensions, SIPPs (Self-Invested Personal Pensions), and ISAs. Make sure to get any employer pension matching first."
        ),
        BabyStep(
            id: 5,
            title: "Children's University Fund",
            description: "Save for children's education",
            detailedDescription: "If you have children, start saving for their university education. In the UK, consider Junior ISAs, education savings accounts, or other tax-advantaged savings vehicles. Don't sacrifice your retirement for their education though."
        ),
        BabyStep(
            id: 6,
            title: "Pay Off Your Mortgage",
            description: "Pay off your home mortgage early",
            detailedDescription: "Make extra payments on your mortgage to pay it off early. Even an extra £50-100 per month can save you years of payments and thousands in interest. You're building wealth and eliminating one of your biggest expenses."
        ),
        BabyStep(
            id: 7,
            title: "Build Wealth & Give",
            description: "Build wealth and give generously",
            detailedDescription: "Congratulations! You're debt-free with no house payment. Now you can build wealth through investments, real estate, and business ventures. Continue living below your means and give generously to causes you care about."
        )
    ]
}

// MARK: - Progress Tracking
class BabyStepsProgress: ObservableObject {
    @Published var steps: [BabyStep]
    @Published var currentStepID: Int = 1
    
    init() {
        // Load from UserDefaults or use default steps
        if let data = UserDefaults.standard.data(forKey: "BabyStepsProgress"),
           let savedSteps = try? JSONDecoder().decode([BabyStep].self, from: data) {
            self.steps = savedSteps
        } else {
            self.steps = BabyStep.allSteps
        }
        
        // Load current step ID
        self.currentStepID = UserDefaults.standard.integer(forKey: "CurrentStepID")
        if self.currentStepID == 0 { // Default if not set
            self.currentStepID = 1
        }
    }
    
    func toggleStep(_ step: BabyStep) {
        if let index = steps.firstIndex(where: { $0.id == step.id }) {
            steps[index].isCompleted.toggle()
            saveProgress()
        }
    }
    
    func updateCurrentStep(_ stepID: Int) {
        currentStepID = stepID
        saveProgress()
    }
    
    private func saveProgress() {
        if let data = try? JSONEncoder().encode(steps) {
            UserDefaults.standard.set(data, forKey: "BabyStepsProgress")
        }
        UserDefaults.standard.set(currentStepID, forKey: "CurrentStepID")
    }
    
    var completedSteps: Int {
        return steps.filter { $0.isCompleted }.count
    }
    
    var progressPercentage: Double {
        return Double(completedSteps) / Double(steps.count)
    }
    
    var currentStep: BabyStep? {
        return steps.first { !$0.isCompleted }
    }
}