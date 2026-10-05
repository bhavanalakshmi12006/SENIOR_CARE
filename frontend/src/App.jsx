import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { SocketProvider, useSocket } from "./context/SocketContext";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import FloatingChatbot from "./components/FloatingChatbot";
import EmergencyBanner from "./components/EmergencyBanner";

import LoginView from "./views/LoginView";
import RegisterView from "./views/RegisterView";
import DashboardView from "./views/DashboardView";
import SeniorsView from "./views/SeniorsView";
import SafetyView from "./views/SafetyView";
import EmergenciesView from "./views/EmergenciesView";
import AppointmentsView from "./views/AppointmentsView";
import AssistanceView from "./views/AssistanceView";
import FeesView from "./views/FeesView";
import ReportsView from "./views/ReportsView";
import RecentlyAccessedView from "./views/RecentlyAccessedView";
import SettingsView from "./views/SettingsView";
import UsersView from "./views/UsersView";
import ReviewsView from "./views/ReviewsView";
import VideosManagementView from "./views/VideosManagementView";

import EmergencyModal from "./components/Modals/EmergencyModal";
import CheckinModal from "./components/Modals/CheckinModal";
import AddSeniorModal from "./components/Modals/AddSeniorModal";
import AppointmentModal from "./components/Modals/AppointmentModal";
import AssistanceModal from "./components/Modals/AssistanceModal";
import PaymentModal from "./components/Modals/PaymentModal";

function MainAppShell() {
  const { isAuthenticated } = useAuth();
  const { activeEmergencyAlert, triggerRefresh } = useSocket();

  // Navigation & Layout State
  const [authScreen, setAuthScreen] = useState("login"); // 'login' | 'register'
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [navTargetId, setNavTargetId] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [addSeniorModalOpen, setAddSeniorModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [assistanceModalOpen, setAssistanceModalOpen] = useState(false);
  const [paymentModalFee, setPaymentModalFee] = useState(null);

  const handleNavigate = (tab, targetId = null) => {
    setCurrentTab(tab);
    setNavTargetId(targetId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isAuthenticated) {
    if (authScreen === "register") {
      return <RegisterView onSwitchToLogin={() => setAuthScreen("login")} />;
    }
    return <LoginView onSwitchToRegister={() => setAuthScreen("register")} />;
  }

  return (
    <div className="app-layout-shell">
      {/* Top Navigation */}
      <Navbar
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onNavigate={handleNavigate}
      />

      <div className="app-body-container">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className={`app-main-viewport ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          {/* Active Emergency Alert Banner (if any) */}
          {activeEmergencyAlert && (
            <EmergencyBanner
              emergency={activeEmergencyAlert}
              onNavigate={handleNavigate}
              onResolved={triggerRefresh}
            />
          )}

          {/* Active View */}
          {currentTab === "dashboard" && (
            <DashboardView
              onNavigate={handleNavigate}
              onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
              onOpenCheckinModal={() => setCheckinModalOpen(true)}
              onOpenAddSeniorModal={() => setAddSeniorModalOpen(true)}
              onOpenAppointmentModal={() => setAppointmentModalOpen(true)}
              onOpenAssistanceModal={() => setAssistanceModalOpen(true)}
              onOpenPaymentModal={(fee) => setPaymentModalFee(fee)}
            />
          )}

          {currentTab === "seniors" && (
            <SeniorsView
              initialSelectedId={navTargetId}
              onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
            />
          )}

          {currentTab === "safety" && (
            <SafetyView
              onOpenCheckinModal={() => setCheckinModalOpen(true)}
            />
          )}

          {currentTab === "emergency" && (
            <EmergenciesView
              onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
            />
          )}

          {currentTab === "appointments" && (
            <AppointmentsView
              onOpenAppointmentModal={() => setAppointmentModalOpen(true)}
            />
          )}

          {currentTab === "assistance" && (
            <AssistanceView
              onOpenAssistanceModal={() => setAssistanceModalOpen(true)}
            />
          )}

          {currentTab === "fees" && (
            <FeesView
              onOpenPaymentModal={(fee) => setPaymentModalFee(fee)}
            />
          )}

          {currentTab === "reviews" && <ReviewsView />}

          {currentTab === "videos" && <VideosManagementView />}

          {currentTab === "reports" && <ReportsView />}

          {currentTab === "recentlyAccessed" && (
            <RecentlyAccessedView onNavigate={handleNavigate} />
          )}

          {currentTab === "usersManagement" && <UsersView />}

          {currentTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot
        onTriggerEmergency={() => setEmergencyModalOpen(true)}
        onQuickCheckin={() => setCheckinModalOpen(true)}
        onOpenAssistance={() => setAssistanceModalOpen(true)}
        onOpenAppointment={() => setAppointmentModalOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Global Modals */}
      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        onEmergencyTriggered={triggerRefresh}
      />

      <CheckinModal
        isOpen={checkinModalOpen}
        onClose={() => setCheckinModalOpen(false)}
        onCheckinRecorded={triggerRefresh}
      />

      <AddSeniorModal
        isOpen={addSeniorModalOpen}
        onClose={() => setAddSeniorModalOpen(false)}
        onSeniorAdded={triggerRefresh}
      />

      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        onAppointmentCreated={triggerRefresh}
      />

      <AssistanceModal
        isOpen={assistanceModalOpen}
        onClose={() => setAssistanceModalOpen(false)}
        onAssistanceCreated={triggerRefresh}
      />

      <PaymentModal
        isOpen={!!paymentModalFee}
        fee={paymentModalFee}
        onClose={() => setPaymentModalFee(null)}
        onPaymentRecorded={triggerRefresh}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SocketProvider>
          <MainAppShell />
        </SocketProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
