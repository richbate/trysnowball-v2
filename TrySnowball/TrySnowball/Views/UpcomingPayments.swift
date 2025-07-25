import SwiftUI

struct UpcomingPayments: View {
    @EnvironmentObject var workbookService: WorkbookService
    
    private var upcomingPayments: [PaymentReminder] {
        let calendar = Calendar.current
        let today = Date()
        
        return workbookService.workbook.debts.compactMap { debt in
            guard let nextDue = debt.nextDueDate else { return nil }
            
            let daysUntilDue = calendar.dateComponents([.day], from: today, to: nextDue).day ?? 0
            let status = PaymentStatus.from(daysUntilDue: daysUntilDue, lastPaid: debt.lastPaymentDate)
            
            return PaymentReminder(
                debt: debt,
                daysUntilDue: daysUntilDue,
                status: status
            )
        }
        .sorted { $0.daysUntilDue < $1.daysUntilDue }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            headerView
            
            if upcomingPayments.isEmpty {
                emptyState
            } else {
                paymentsList
            }
        }
    }
    
    private var headerView: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Upcoming Payments")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Text("Stay on track with your payments")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 40))
                .foregroundColor(.gray)
            
            Text("No upcoming payments")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Text("Add due dates to your debts to track payments")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
    }
    
    private var paymentsList: some View {
        VStack(spacing: 12) {
            ForEach(upcomingPayments, id: \.debt.id) { payment in
                PaymentReminderCard(
                    payment: payment,
                    onMarkPaid: { markAsPaid(payment.debt) }
                )
            }
        }
    }
    
    private func markAsPaid(_ debt: WorkbookDebt) {
        if let index = workbookService.workbook.debts.firstIndex(where: { $0.id == debt.id }) {
            workbookService.workbook.debts[index].lastPaymentDate = Date()
            
            // Calculate next due date based on frequency
            if let currentDue = debt.nextDueDate {
                let calendar = Calendar.current
                let nextDue = calendar.date(byAdding: .day, value: debt.paymentFrequency.daysInterval, to: currentDue)
                workbookService.workbook.debts[index].nextDueDate = nextDue
            }
            
            workbookService.saveWorkbook()
        }
    }
}

struct PaymentReminderCard: View {
    let payment: PaymentReminder
    let onMarkPaid: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            // Status indicator
            statusIndicator
            
            // Payment info
            VStack(alignment: .leading, spacing: 4) {
                Text(payment.debt.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(payment.reminderText)
                    .font(.caption)
                    .foregroundColor(payment.status.color)
                
                Text("\(payment.debt.minimumPayment.formatAsCurrency()) minimum")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Action button
            if payment.status.showPayButton {
                Button("Mark Paid") {
                    onMarkPaid()
                }
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.green)
                .foregroundColor(.white)
                .cornerRadius(8)
            }
        }
        .padding()
        .background(Color("AppBackground"))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
    }
    
    private var statusIndicator: some View {
        Circle()
            .fill(payment.status.color)
            .frame(width: 12, height: 12)
    }
}

struct PaymentReminder {
    let debt: WorkbookDebt
    let daysUntilDue: Int
    let status: PaymentStatus
    
    var reminderText: String {
        switch daysUntilDue {
        case ...0:
            return "Payment is overdue!"
        case 1:
            return "Payment due tomorrow"
        case 2...7:
            return "Payment due in \(daysUntilDue) days"
        default:
            return "Next payment due in \(daysUntilDue) days"
        }
    }
}

enum PaymentStatus {
    case overdue
    case dueSoon    // Within 3 days
    case upcoming   // Within 7 days  
    case scheduled  // More than 7 days
    
    static func from(daysUntilDue: Int, lastPaid: Date?) -> PaymentStatus {
        switch daysUntilDue {
        case ...0:
            return .overdue
        case 1...3:
            return .dueSoon
        case 4...7:
            return .upcoming
        default:
            return .scheduled
        }
    }
    
    var color: Color {
        switch self {
        case .overdue:
            return .red
        case .dueSoon:
            return .orange
        case .upcoming:
            return .blue
        case .scheduled:
            return .secondary
        }
    }
    
    var showPayButton: Bool {
        switch self {
        case .overdue, .dueSoon:
            return true
        default:
            return false
        }
    }
}

#Preview {
    let sampleService = WorkbookService()
    sampleService.workbook.debts = [
        WorkbookDebt(
            name: "Barclaycard", 
            balance: 2500, 
            interestRate: 19.9, 
            minimumPayment: 75,
            nextDueDate: Calendar.current.date(byAdding: .day, value: 2, to: Date())
        ),
        WorkbookDebt(
            name: "Personal Loan",
            balance: 5000,
            interestRate: 8.5, 
            minimumPayment: 150,
            nextDueDate: Calendar.current.date(byAdding: .day, value: 15, to: Date())
        )
    ]
    
    return UpcomingPayments()
        .environmentObject(sampleService)
        .padding()
}
