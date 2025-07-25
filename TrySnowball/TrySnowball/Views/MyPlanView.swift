import SwiftUI

struct MyPlanView: View {
    @EnvironmentObject var debtViewModel: DebtViewModel
    @EnvironmentObject var babyStepsProgress: BabyStepsProgress
    @EnvironmentObject var workbookService: WorkbookService
    
    
    private var effectiveDebts: [WorkbookDebt] {
        // Use workbook debts if available, otherwise convert from debt view model
        if !workbookService.workbook.debts.isEmpty {
            return workbookService.workbook.debts
        } else if !debtViewModel.debts.isEmpty {
            return debtViewModel.debts.map { WorkbookDebt(from: $0) }
        } else {
            return []
        }
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    headerView
                    
                    if effectiveDebts.isEmpty {
                        emptyStateView
                    } else {
                        // Enhanced Burndown Graph
                        graphSection
                        
                        // Quick Stats Cards
                        quickStatsSection
                        
                        // Upcoming Payments
                        upcomingPaymentsSection
                        
                        // Current Focus
                        currentFocusSection
                    }
                    
                    Spacer(minLength: 20)
                }
                .padding(.horizontal)
            }
            .navigationTitle("My Plan")
            .navigationBarBackButtonHidden(true)
        }
    }
    
    private var headerView: some View {
        VStack(spacing: 8) {
            Text("Your Debt-Free Journey")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.primary)
            
            if !effectiveDebts.isEmpty {
                Text("Track your progress and stay motivated")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.top)
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "chart.line.uptrend.xyaxis.circle")
                .font(.system(size: 60))
                .foregroundColor(.blue.opacity(0.6))
            
            Text("Ready to Start Your Journey?")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Add your debts to see your personalized burndown chart and payment plan.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            NavigationLink("Add Your First Debt") {
                // This would navigate to debt entry
                Text("Add Debt View") // Placeholder
            }
            .font(.headline)
            .foregroundColor(.white)
            .padding()
            .background(Color.blue)
            .cornerRadius(12)
        }
        .padding(.vertical, 40)
    }
    
    private var graphSection: some View {
        VStack(spacing: 16) {
            // Enhanced Burndown Graph
            BurndownGraph(
                debts: effectiveDebts,
                extraPayment: debtViewModel.extraPayment
            )
        }
    }
    
    private var quickStatsSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Quick Stats")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                StatCard(
                    title: "Total Debt",
                    value: effectiveDebts.reduce(0) { $0 + $1.balance }.formatAsCurrency(),
                    color: .red,
                    icon: "creditcard.fill",
                    trend: .stable
                )
                
                StatCard(
                    title: "Monthly Payment",
                    value: (effectiveDebts.reduce(0) { $0 + $1.minimumPayment } + debtViewModel.extraPayment).formatAsCurrency(),
                    color: .blue,
                    icon: "calendar",
                    trend: .positive
                )
                
                StatCard(
                    title: "Progress",
                    value: "\(babyStepsProgress.completedSteps)/7",
                    color: .mint,
                    icon: "figure.walk.circle",
                    trend: .positive
                )
                
                StatCard(
                    title: "Next Milestone",
                    value: payoffTimeText,
                    color: .orange,
                    icon: "target",
                    trend: .stable
                )
            }
        }
    }
    
    private var upcomingPaymentsSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("This Week")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
            }
            
            UpcomingPayments()
        }
    }
    
    private var currentFocusSection: some View {
        Group {
            if let currentStep = babyStepsProgress.currentStep {
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Text("Current Focus")
                            .font(.headline)
                            .fontWeight(.semibold)
                        Spacer()
                    }
                    
                    HStack(spacing: 16) {
                        // Step indicator circle
                        ZStack {
                            Circle()
                                .fill(Color.blue.opacity(0.1))
                                .frame(width: 50, height: 50)
                            
                            Text("\(currentStep.id)")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.blue)
                        }
                        
                        // Step content
                        VStack(alignment: .leading, spacing: 4) {
                            Text(currentStep.title)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.primary)
                            
                            Text(currentStep.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                        }
                        
                        Spacer()
                        
                        // Action button
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color("AppBackground"))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
                }
            }
        }
    }
    
    private var payoffTimeText: String {
        // Simple calculation for display
        let totalDebt = effectiveDebts.reduce(0) { $0 + $1.balance }
        let totalPayment = effectiveDebts.reduce(0) { $0 + $1.minimumPayment } + debtViewModel.extraPayment
        
        if totalPayment > 0 && totalDebt > 0 {
            let months = Int(totalDebt / totalPayment)
            return "\(months)mo"
        }
        return "---"
    }
}

// MARK: - Enhanced Stat Card
struct StatCard: View {
    let title: String
    let value: String
    let color: Color
    let icon: String
    let trend: TrendDirection
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
                
                Spacer()
                
                // Trend indicator
                Image(systemName: trend.iconName)
                    .font(.caption)
                    .foregroundColor(trend.color)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(color)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(Color("AppBackground"))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
    }
}


enum TrendDirection {
    case positive
    case negative  
    case stable
    
    var iconName: String {
        switch self {
        case .positive: return "arrow.up.right"
        case .negative: return "arrow.down.right"
        case .stable: return "minus"
        }
    }
    
    var color: Color {
        switch self {
        case .positive: return .mint
        case .negative: return .red
        case .stable: return .gray
        }
    }
}

#Preview {
    let sampleService = WorkbookService()
    sampleService.workbook.debts = [
        WorkbookDebt(name: "Credit Card", balance: 2500, interestRate: 19.9, minimumPayment: 75),
        WorkbookDebt(name: "Personal Loan", balance: 5000, interestRate: 8.5, minimumPayment: 150)
    ]
    
    let sampleDebtModel = DebtViewModel()
    let sampleBabySteps = BabyStepsProgress()
    
    return MyPlanView()
        .environmentObject(sampleDebtModel)
        .environmentObject(sampleBabySteps)
        .environmentObject(sampleService)
}
