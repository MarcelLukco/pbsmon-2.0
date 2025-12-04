import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PersonalViewPage } from "@/pages/PersonalViewPage";
import { MachinesPage } from "@/pages/MachinesPage";
import { MachineDetailPage } from "@/pages/MachineDetailPage";
import { JobsPage } from "@/pages/JobsPage";
import { JobDetailPage } from "@/pages/JobDetailPage";
import { JobsQueuesPage } from "@/pages/JobsQueuesPage";
import { QueueDetailPage } from "@/pages/QueueDetailPage";
import { UsersPage } from "@/pages/UsersPage";
import { UserDetailPage } from "@/pages/UserDetailPage";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import "@/i18n";
import "@/app.css";
import { QsubAssemblerPage } from "@/pages/QsubAssemblerPage.tsx";
import { StorageSpacesPage } from "@/pages/StorageSpacesPage";
import { WaitingJobsPage } from "@/pages/WaitingJobsPage";

export default function App() {
  return (
    <ImpersonationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SidebarLayout />}>
            <Route index element={<Navigate to="/personal-view" replace />} />
            <Route path="personal-view" element={<PersonalViewPage />} />
            <Route path="qsub-assembler" element={<QsubAssemblerPage />} />
            <Route path="machines" element={<MachinesPage />} />
            <Route path="machines/:machineId" element={<MachineDetailPage />} />
            <Route path="storage-spaces" element={<StorageSpacesPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/:jobId" element={<JobDetailPage />} />
            <Route path="waiting-jobs" element={<WaitingJobsPage />} />
            <Route path="queues" element={<JobsQueuesPage />} />
            <Route path="queues/:queueId" element={<QueueDetailPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:userId" element={<UserDetailPage />} />
          </Route>
        </Routes>
      </Router>
    </ImpersonationProvider>
  );
}
