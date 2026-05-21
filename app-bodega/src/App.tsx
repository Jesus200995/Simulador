import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import UpdateToast from './components/UpdateToast';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <UpdateToast />
    </>
  );
}
