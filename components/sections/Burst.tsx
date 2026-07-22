/**
 * The burst act carries almost no copy on purpose. The visual is the whole
 * statement, and putting a spec panel over it would be arguing with it.
 */
export default function Burst() {
  return (
    <div className="w-full max-w-[1380px]">
      <p className="label mb-7 flex items-center gap-3 text-ash">
        <span className="h-px w-9 bg-signal" />
        Twenty-four tonnes, released
      </p>
      <h2 className="display max-w-[16ch] text-[9vw] leading-[0.96] text-white md:text-[7.4vw] lg:text-[5.6vw]">
        Nothing about it
        <br />
        was ever the steel.
      </h2>
    </div>
  );
}
