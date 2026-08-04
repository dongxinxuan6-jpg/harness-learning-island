import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoadingPage } from "./components/PageHeader";
import { Shell } from "./components/Shell";

const ContentDetailPage = lazy(() => import("./pages/ContentDetailPage").then((module) => ({ default: module.ContentDetailPage })));
const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const LearningPage = lazy(() => import("./pages/LearningPage").then((module) => ({ default: module.LearningPage })));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage").then((module) => ({ default: module.ProductDetailPage })));
const ProductsPage = lazy(() => import("./pages/ProductsPage").then((module) => ({ default: module.ProductsPage })));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage").then((module) => ({ default: module.ProjectDetailPage })));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage").then((module) => ({ default: module.ProjectsPage })));
const RadarPage = lazy(() => import("./pages/RadarPage").then((module) => ({ default: module.RadarPage })));
const RankingsPage = lazy(() => import("./pages/RankingsPage").then((module) => ({ default: module.RankingsPage })));
const SearchPage = lazy(() => import("./pages/SearchPage").then((module) => ({ default: module.SearchPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const WeeklyPage = lazy(() => import("./pages/WeeklyPage").then((module) => ({ default: module.WeeklyPage })));

export function App() {
  return (
    <Suspense fallback={<LoadingPage />}><Routes>
      <Route element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="rankings" element={<RankingsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:slug" element={<ProjectDetailPage />} />
        <Route path="radar" element={<RadarPage />} />
        <Route path="learning" element={<LearningPage />} />
        <Route path="weekly" element={<WeeklyPage />} />
        <Route path="content/:slug" element={<ContentDetailPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes></Suspense>
  );
}
