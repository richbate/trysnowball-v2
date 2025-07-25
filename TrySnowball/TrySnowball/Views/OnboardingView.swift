import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var debtViewModel: DebtViewModel
    @EnvironmentObject var workbookService: WorkbookService
    @State private var currentStep = 0
    @State private var name = ""
    @State private var showingAddDebt = false
    
    private let totalSteps = 3

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                SwiftUI.ProgressView(value: Double(currentStep + 1), total: Double(totalSteps))
                    .padding()

                Text("Setup Your Debt Workbook")
                    .font(.title)
                    .fontWeight(.bold)

                Text("Step \(currentStep + 1) of \(totalSteps)")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Group {
                    switch currentStep {
                    case 0:
                        WelcomeStep(name: $name)
                    case 1:
                        DebtEntryStep(workbook: $workbookService.workbook, showingAddDebt: $showingAddDebt)
                    case 2:
                        ReviewStep(workbook: workbookService.workbook, name: name)
                    default:
                        EmptyView()
                    }
                }

                Spacer()

                HStack {
                    if currentStep > 0 {
                        Button("Back") {
                            currentStep -= 1
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.gray.opacity(0.2))
                        .cornerRadius(8)
                    }

                    Button(currentStep == totalSteps - 1 ? "Complete" : "Next") {
                        if currentStep == totalSteps - 1 {
                            completeOnboarding()
                        } else {
                            currentStep += 1
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                    .disabled(!canProceed)
                }
                .padding()
            }
            .navigationBarBackButtonHidden(true)
            .sheet(isPresented: $showingAddDebt) {
                AddDebtView(workbook: $workbookService.workbook)
            }
        }
    }

    private var canProceed: Bool {
        switch currentStep {
        case 1: return !workbookService.workbook.debts.isEmpty
        default: return true
        }
    }

    private func completeOnboarding() {
        workbookService.workbook.profile.name = name.isEmpty ? nil : name
        workbookService.completeOnboarding()
        debtViewModel.debts = workbookService.workbook.debts.map { debt in
            Debt(name: debt.name, balance: debt.balance, interestRate: debt.interestRate, minimumPayment: debt.minimumPayment)
        }
    }
}
