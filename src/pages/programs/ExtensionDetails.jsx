// Extension package details are now fully backend-driven.
// The shared TourDetails component resolves the slug from the route, fetches
// the tour from the API/dashboard, and renders all details + suggested trip cards.
import TourDetails from '../tours/TourDetails';

export default function ExtensionDetails() {
  return <TourDetails />;
}
