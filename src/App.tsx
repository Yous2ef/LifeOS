import React, { Suspense, lazy } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./context/AppContext";
import { Layout } from "./components/layout/Layout";

// Lazy load all page components for code splitting
const Dashboard = lazy(() =>
    import("./pages/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const University = lazy(() =>
    import("./pages/University").then((m) => ({ default: m.University }))
);
const SubjectDetails = lazy(() =>
    import("./pages/SubjectDetails").then((m) => ({
        default: m.SubjectDetails,
    }))
);
const Freelancing = lazy(() =>
    import("./pages/Freelancing").then((m) => ({ default: m.Freelancing }))
);
const FreelancingProjectDetail = lazy(() =>
    import("./pages/FreelancingProjectDetail").then((m) => ({
        default: m.FreelancingProjectDetail,
    }))
);
const Programming = lazy(() =>
    import("./pages/Programming").then((m) => ({ default: m.Programming }))
);
const ProgrammingProjectDetail = lazy(() =>
    import("./pages/ProgrammingProjectDetail").then((m) => ({
        default: m.ProgrammingProjectDetail,
    }))
);
const Home = lazy(() =>
    import("./pages/Home").then((m) => ({ default: m.Home }))
);
const Misc = lazy(() =>
    import("./pages/Misc").then((m) => ({ default: m.Misc }))
);
const Settings = lazy(() =>
    import("./pages/Settings").then((m) => ({ default: m.Settings }))
);

// Loading fallback component
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
    </div>
);

const App: React.FC = () => {
    return (
        <AppProvider>
            <HashRouter>
                <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route
                                path="/university"
                                element={<University />}
                            />
                            <Route
                                path="/university/subject/:subjectId"
                                element={<SubjectDetails />}
                            />
                            <Route
                                path="/freelancing"
                                element={<Freelancing />}
                            />
                            <Route
                                path="/freelancing/project/:projectId"
                                element={<FreelancingProjectDetail />}
                            />
                            <Route
                                path="/programming"
                                element={<Programming />}
                            />
                            <Route
                                path="/programming/project/:projectId"
                                element={<ProgrammingProjectDetail />}
                            />
                            <Route path="/home" element={<Home />} />
                            <Route path="/misc" element={<Misc />} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </Suspense>
                </Layout>
            </HashRouter>
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
