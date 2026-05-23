import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import UpdateToast from './components/UpdateToast';
import { ToastProvider } from './components/Toast';

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
      <UpdateToast />
    </ToastProvider>
  );
}
