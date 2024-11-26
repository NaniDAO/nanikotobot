import Header from "@/components/header";
import Footer from "@/components/footer";
import LiveActivityFeed from "@/components/live-activity-feed";
import SocialIntegration from "@/components/social-integration";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <LiveActivityFeed />
        <SocialIntegration />
      </main>
      <Footer />
    </>
  );
}
