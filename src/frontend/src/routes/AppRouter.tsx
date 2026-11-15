import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { routePaths } from '@/routes/paths'

const router = createBrowserRouter([
  {
    path: routePaths.home,
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: routePaths.notFound, element: <NotFoundPage /> },
    ],
  },
])

/** Route table entry point; feature routes are added to the layout's children. */
export function AppRouter() {
  return <RouterProvider router={router} />
}
