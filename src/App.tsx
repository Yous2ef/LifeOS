import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./context/AppContext";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { University } from "./pages/University";
import { SubjectDetails } from "./pages/SubjectDetails";
import { Freelancing } from "./pages/Freelancing";
import { FreelancingProjectDetail } from "./pages/FreelancingProjectDetail";
import { Programming } from "./pages/Programming";
import { ProgrammingProjectDetail } from "./pages/ProgrammingProjectDetail";
import { Home } from "./pages/Home";
import { Misc } from "./pages/Misc";
import { Settings } from "./pages/Settings";

const App: React.FC = () => {
    return (
        <AppProvider>
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/university" element={<University />} />
                        <Route
                            path="/university/subject/:subjectId"
                            element={<SubjectDetails />}
                        />
                        <Route path="/freelancing" element={<Freelancing />} />
                        <Route
                            path="/freelancing/project/:projectId"
                            element={<FreelancingProjectDetail />}
                        />
                        <Route path="/programming" element={<Programming />} />
                        <Route
                            path="/programming/project/:projectId"
                            element={<ProgrammingProjectDetail />}
                        />
                        <Route path="/home" element={<Home />} />
                        <Route path="/misc" element={<Misc />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </Layout>
            </BrowserRouter>
            <Toaster
                position="bottom-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: "var(--card)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                    },
                }}
            />
        </AppProvider>
    );
};

export default App;
