import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authState: AuthState
    @StateObject private var vm = DashboardViewModel()
    @State private var showingAddSheet = false
    @State private var selectedApp: Application?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                StatsView(stats: vm.stats)
                    .padding(.vertical, 12)

                List {
                    if vm.isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .listRowSeparator(.hidden)
                    } else {
                        ForEach(vm.filtered) { app in
                            ApplicationRow(application: app)
                                .contentShape(Rectangle())
                                .onTapGesture { selectedApp = app }
                                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                    Button(role: .destructive) {
                                        Task { await vm.delete(app) }
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }
                                }
                                .swipeActions(edge: .leading) {
                                    Button {
                                        Task { await vm.updateStatus(id: app.id, status: .rejected) }
                                    } label: {
                                        Label("Reject", systemImage: "xmark.circle")
                                    }
                                    .tint(.orange)
                                }
                        }
                    }
                }
                .listStyle(.plain)
                .searchable(text: $vm.searchText, prompt: "Search company or title")
                .refreshable { await vm.load() }
            }
            .navigationTitle("Applications")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Menu {
                        Button("All") { vm.statusFilter = nil }
                        Divider()
                        ForEach(ApplicationStatus.allCases) { status in
                            Button(status.displayName) { vm.statusFilter = status }
                        }
                    } label: {
                        Label(
                            vm.statusFilter?.displayName ?? "Filter",
                            systemImage: "line.3.horizontal.decrease.circle"
                        )
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack {
                        Button {
                            Task { await vm.load() }
                        } label: {
                            Image(systemName: "arrow.clockwise")
                        }
                        Button {
                            showingAddSheet = true
                        } label: {
                            Image(systemName: "plus")
                        }
                        Button {
                            Task { try? await authState.signOut() }
                        } label: {
                            Image(systemName: "person.crop.circle.badge.minus")
                        }
                    }
                }
            }
            .sheet(isPresented: $showingAddSheet) {
                AddApplicationView { newApp in
                    vm.applications.insert(newApp, at: 0)
                }
            }
            .sheet(item: $selectedApp) { app in
                ApplicationDetailView(application: app) { updated in
                    if let i = vm.applications.firstIndex(where: { $0.id == updated.id }) {
                        vm.applications[i] = updated
                    }
                }
            }
            .alert("Error", isPresented: .constant(vm.error != nil)) {
                Button("OK") { vm.error = nil }
            } message: {
                Text(vm.error ?? "")
            }
        }
        .task { await vm.load() }
    }
}
