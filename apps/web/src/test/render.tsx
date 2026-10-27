import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider, useLocation, type RouteObject } from "react-router-dom";
import AuthProvider from "@/auth/AuthProvider";
import ToastProvider from "@/toast/ToastProvider";

// Shows the router's current URL so tests can assert on it through the DOM.
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
};

// Renders routes with the app's real providers, a fresh query cache (no
// retries, so errors show at once) and an in-memory router. The current URL
// is always shown in the "location" test id.
export const renderRoutes = (routes: RouteObject[], initialEntry: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const layout: RouteObject = {
    element: (
      <>
        <Outlet />
        <LocationDisplay />
      </>
    ),
    children: routes,
  };
  const router = createMemoryRouter([layout], { initialEntries: [initialEntry] });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { ...view, router, queryClient };
};
