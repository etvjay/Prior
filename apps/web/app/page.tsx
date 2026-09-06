import Link from "next/link";
import { LandingScenes } from "./LandingScenes";

export default function LandingPage() {
  return (
    <>
      <header className="landing-topbar">
        <Link className="wordmark" href="/" aria-label="PRIOR home">PRIOR</Link>
        <span>MEASURE → LEARN → ALLOCATE TRUST → ACT → MEASURE AGAIN</span>
      </header>
      <main id="main"><LandingScenes /></main>
    </>
  );
}
