import SwiftUI

struct ContentView: View {
    @StateObject private var debtViewModel = DebtViewModel()
    @StateObject private var babyStepsProgress = BabyStepsProgress()
    @StateObject private var workbookService = WorkbookService()
    
    var body: some View {
        Group {
            if workbookService.isOnboardingComplete {
                MainTabView()
                    .environmentObject(debtViewModel)
                    .environmentObject(babyStepsProgress)
                    .environmentObject(workbookService)
            } else {
                OnboardingView()
                    .environmentObject(debtViewModel)
                    .environmentObject(workbookService)
            }
        }
    }
}

struct MainTabView: View {
    @EnvironmentObject var debtViewModel: DebtViewModel
    @EnvironmentObject var workbookService: WorkbookService
    
    var body: some View {
        TabView {
            MyPlanView()
                .tabItem {
                    Label("Plan", systemImage: "chart.line.uptrend.xyaxis")
                }
            
            DebtListView()
                .tabItem {
                    Label("My Debts", systemImage: "creditcard.fill")
                }
            
            WorkbookView()
                .tabItem {
                    Label("Workbook", systemImage: "folder.fill")
                }
            
            LearnView()
                .tabItem {
                    Label("Learn", systemImage: "book.fill")
                }
        }
        .accentColor(.blue)
    }
}
