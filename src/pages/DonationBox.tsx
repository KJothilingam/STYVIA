import { Navigate } from 'react-router-dom';

/** Empty-box UI lives on the main Donations hub (Pickups | Empty boxes tabs). */
export default function DonationBox() {
  return <Navigate to="/donations?tab=boxes" replace />;
}
