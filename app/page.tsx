import Act from "@/components/Act";
import Stage from "@/components/Stage";
import SmoothScroll from "@/components/SmoothScroll";
import Nav from "@/components/hud/Nav";
import Readout from "@/components/hud/Readout";

import Hero from "@/components/sections/Hero";
import Lift from "@/components/sections/Lift";
import Uncoil from "@/components/sections/Uncoil";
import Slit from "@/components/sections/Slit";
import India from "@/components/sections/India";
import Dispatch from "@/components/sections/Dispatch";
import Footer from "@/components/sections/Footer";

import { ACTS } from "@/lib/site";

const vh = (id: string) => ACTS.find((a) => a.id === id)!.vh;

/**
 * One take, six states. The WebGL film is fixed behind everything; each act
 * is a tall scroll span with a sticky stage of copy over it.
 *
 * The left margin is reserved for the state ladder from `lg` up.
 */
export default function Page() {
  return (
    <>
      <span id="top" />
      <SmoothScroll />
      <Stage />
      <Nav />
      <Readout />

      <div className="grain" aria-hidden />
      <div className="vignette" aria-hidden />

      <main className="relative z-10 lg:pl-[188px]">
        <Act id="manifest" vh={vh("manifest")} entry={0}>
          <Hero />
        </Act>

        <Act id="lift" vh={vh("lift")}>
          <Lift />
        </Act>

        <Act id="uncoil" vh={vh("uncoil")}>
          <Uncoil />
        </Act>

        <Act id="slit" vh={vh("slit")}>
          <Slit />
        </Act>

        <Act id="india" vh={vh("india")} place="left">
          <India />
        </Act>

        <Act id="dispatch" vh={vh("dispatch")}>
          <Dispatch />
        </Act>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </>
  );
}
