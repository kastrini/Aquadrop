import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { FormEvent } from "react";
import { sql } from "~/db";

export const Route = createFileRoute("/")({
  component: Home,
});

/* ------------------------------------------------------------------ */
/* Server side: interest signup                                         */
/* ------------------------------------------------------------------ */

type SignupInput = {
  name: string;
  contact: string; // email or phone
  postalCode: string;
  address: string;
  bottles: number;
  note?: string;
};

const submitSignup = createServerFn({ method: "POST" })
  .validator((d: SignupInput) => d)
  .handler(async ({ data }) => {
    const name = data.name.trim();
    const contact = data.contact.trim();
    const postalCode = data.postalCode.trim();
    const address = data.address.trim();
    const note = (data.note ?? "").trim();
    const bottles = data.bottles;

    // Server-side validation — never trust the client.
    if (!name || !contact || !postalCode || !address) {
      return {
        ok: false,
        error: "Please fill in every required field.",
      };
    }
    if (!Number.isInteger(bottles) || bottles < 1 || bottles > 500) {
      return {
        ok: false,
        error: "Please tell us how many bottles you need (at least 1).",
      };
    }

    try {
      const client = sql();
      await client`
        CREATE TABLE IF NOT EXISTS interest_signups (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email_or_phone TEXT NOT NULL,
          postal_code TEXT NOT NULL,
          address TEXT NOT NULL,
          bottles INTEGER NOT NULL,
          note TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await client`
        INSERT INTO interest_signups (name, email_or_phone, postal_code, address, bottles, note)
        VALUES (${name}, ${contact}, ${postalCode}, ${address}, ${bottles}, ${note || null})
      `;
      return { ok: true };
    } catch (err) {
      // No database connected yet (or a transient failure) — fail gracefully,
      // never surface a raw error to the visitor.
      console.error("AquaDrop: failed to save interest signup", err);
      return {
        ok: false,
        error:
          "Sorry — we couldn't save that just yet. Please try again in a moment.",
      };
    }
  });

/* ------------------------------------------------------------------ */
/* Presentation bits                                                    */
/* ------------------------------------------------------------------ */

function DropletIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2.7s6.4 7.6 6.4 12a6.4 6.4 0 0 1-12.8 0c0-4.4 6.4-12 6.4-12Z" />
      <path d="M9.6 14.5a2.6 2.6 0 0 0 2.4 2.6" />
    </svg>
  );
}

const BOTTLE_OPTIONS = [24, 36, 48] as const;

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

function Home() {
  const signup = useServerFn(submitSignup);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [bottlesChoice, setBottlesChoice] = useState<"24" | "36" | "48" | "other">("24");
  const [bottlesOther, setBottlesOther] = useState("");
  const [note, setNote] = useState("");

  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting") return;

    const bottles =
      bottlesChoice === "other"
        ? Number(bottlesOther)
        : Number(bottlesChoice);

    setState("submitting");
    setMessage("");

    try {
      const res = await signup({
        data: {
          name,
          contact,
          postalCode,
          address,
          bottles: Number.isFinite(bottles) ? bottles : 0,
          note,
        },
      });
      if (res.ok) {
        setState("success");
        setMessage(
          "Thanks — you're on the list. We'll be in touch when service launches in your area."
        );
      } else {
        setState("error");
        setMessage(res.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setState("error");
      setMessage(
        "Sorry — we couldn't save that just yet. Please try again in a moment."
      );
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100";
  const labelClass =
    "mb-1.5 block text-sm font-semibold text-slate-700";

  return (
    <div className="min-h-dvh bg-white font-sans text-slate-900">
      {/* ------------------------------ Header ----------------------------- */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white">
              <DropletIcon className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Aqua<span className="text-sky-600">Drop</span>
            </span>
          </a>
          <a
            href="#request"
            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
          >
            Join the list
          </a>
        </div>
      </header>

      {/* ------------------------------ Hero ------------------------------- */}
      <section id="top" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(14,165,233,0.12),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 text-center sm:pb-24 sm:pt-24">
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-sky-700">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            Now building delivery routes near you
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Water delivered to your door —{" "}
            <span className="text-sky-600">no delivery fee, no service fee</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            AquaDrop brings 24–48 bottles of water to your doorstep, or ready
            for pickup — so you never haul another heavy pack. Made for people
            with back pain or sciatica, seniors, busy households, and the days
            when nobody wants to drive.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#request"
              className="inline-flex w-full items-center justify-center rounded-full bg-sky-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 sm:w-auto"
            >
              Request service
            </a>
            <a
              href="#how"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 sm:w-auto"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* --------------------------- No-fee promise ------------------------ */}
      <section aria-label="No-fee promise" className="border-y border-sky-900 bg-sky-700">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-5 py-4 text-center sm:flex-row sm:gap-8">
          <p className="flex items-center gap-2 text-sm font-semibold text-white sm:text-base">
            <DropletIcon className="h-4 w-4 text-sky-200" />
            No delivery fee
          </p>
          <p className="flex items-center gap-2 text-sm font-semibold text-white sm:text-base">
            <DropletIcon className="h-4 w-4 text-sky-200" />
            No service fee
          </p>
          <p className="flex items-center gap-2 text-sm font-semibold text-white sm:text-base">
            <DropletIcon className="h-4 w-4 text-sky-200" />
            No hidden costs
          </p>
        </div>
      </section>

      {/* --------------------------- How it works ------------------------- */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Three simple steps. No store trips. No lifting.
          </h2>
        </div>
        <ol className="mt-12 grid gap-6 sm:grid-cols-3 sm:gap-8">
          <li className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-600 text-lg font-bold text-white">
              1
            </span>
            <h3 className="mt-4 text-lg font-bold">Tell us where &amp; how much</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
              Share your address, postal code, and how many bottles you need —
              24, 36, 48, or more.
            </p>
          </li>
          <li className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-600 text-lg font-bold text-white">
              2
            </span>
            <h3 className="mt-4 text-lg font-bold">We deliver to your door</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
              We bring 24–48 bottles right to your doorstep — or prep them for
              a quick pickup if a delivery doesn't work that day.
            </p>
          </li>
          <li className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-600 text-lg font-bold text-white">
              3
            </span>
            <h3 className="mt-4 text-lg font-bold">Stay stocked up</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
              You're always set — no hauling heavy packs, no emergency store
              runs. Reorder in seconds.
            </p>
          </li>
        </ol>
      </section>

      {/* ----------------------------- Who it's for ----------------------- */}
      <section id="who" className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
              Who it's for
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Made for the days water shouldn't be your job
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <DropletIcon className="h-4 w-4" />
                </span>
                Back pain &amp; sciatica
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                Hauling cases of water out of a store cart and into your home
                can strain your back. We carry the load, so you don't have to.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <DropletIcon className="h-4 w-4" />
                </span>
                Seniors &amp; mobility challenges
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                Skip the store trip entirely. Fresh water shows up where you
                need it, and goes where you want it.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <DropletIcon className="h-4 w-4" />
                </span>
                Busy households
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                One less errand on the list. Keep the whole house stocked
                without the trunk full of bottles or the trip there and back.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <DropletIcon className="h-4 w-4" />
                </span>
                Emergency &amp; bad-weather days
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                Snow, storms, heat waves, or an urgent need — water arrives so
                nobody has to drive in conditions they shouldn't.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ Request form ----------------------- */}
      <section id="request" className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="grid lg:grid-cols-5">
            <div className="bg-sky-700 p-8 text-white sm:p-10 lg:col-span-2">
              <p className="text-sm font-bold uppercase tracking-widest text-sky-200">
                Join the waiting list
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
                Tell us where to start
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-sky-100">
                We're launching by area. Leave your details and we'll be in
                touch the moment service reaches your neighborhood.
              </p>
              <ul className="mt-8 space-y-3 text-sm font-medium text-sky-100">
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/40 text-white">
                    <CheckIcon />
                  </span>
                  No delivery or service fees
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/40 text-white">
                    <CheckIcon />
                  </span>
                  24–48 bottles, doorstep or pickup
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/40 text-white">
                    <CheckIcon />
                  </span>
                  No commitment to start
                </li>
              </ul>
            </div>

            <div className="p-6 sm:p-10 lg:col-span-3">
              {state === "success" ? (
                <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckIcon className="h-7 w-7" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold">You're on the list!</h3>
                  <p className="mt-2 max-w-md text-[15px] leading-relaxed text-slate-600">
                    {message}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate={false}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className={labelClass}>
                        Full name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivera"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact" className={labelClass}>
                        Email or phone
                      </label>
                      <input
                        id="contact"
                        name="contact"
                        type="text"
                        autoComplete="email"
                        required
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="you@example.com or (555) 123-4567"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="postalCode" className={labelClass}>
                        Postal code
                      </label>
                      <input
                        id="postalCode"
                        name="postalCode"
                        type="text"
                        autoComplete="postal-code"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="e.g. 90210"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="address" className={labelClass}>
                        Delivery address
                      </label>
                      <input
                        id="address"
                        name="address"
                        type="text"
                        autoComplete="street-address"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street, city, state"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <span className={labelClass}>How many bottles?</span>
                      <div className="flex gap-2">
                        {BOTTLE_OPTIONS.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setBottlesChoice(String(n) as "24" | "36" | "48")}
                            aria-pressed={bottlesChoice === String(n)}
                            className={
                              "flex-1 rounded-xl border px-3 py-3 text-sm font-semibold transition " +
                              (bottlesChoice === String(n)
                                ? "border-sky-600 bg-sky-600 text-white shadow-sm"
                                : "border-slate-300 bg-white text-slate-700 hover:border-sky-400")
                            }
                          >
                            {n}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setBottlesChoice("other")}
                          aria-pressed={bottlesChoice === "other"}
                          className={
                            "flex-1 rounded-xl border px-3 py-3 text-sm font-semibold transition " +
                            (bottlesChoice === "other"
                              ? "border-sky-600 bg-sky-600 text-white shadow-sm"
                              : "border-slate-300 bg-white text-slate-700 hover:border-sky-400")
                          }
                        >
                          Other
                        </button>
                      </div>
                      {bottlesChoice === "other" && (
                        <input
                          type="number"
                          min={1}
                          max={500}
                          required
                          value={bottlesOther}
                          onChange={(e) => setBottlesOther(e.target.value)}
                          placeholder="How many bottles?"
                          className={inputClass + " mt-2"}
                          aria-label="Number of bottles"
                        />
                      )}
                    </div>
                    <div>
                      <label htmlFor="note" className={labelClass}>
                        Anything we should know?{" "}
                        <span className="font-normal text-slate-400">(optional)</span>
                      </label>
                      <textarea
                        id="note"
                        name="note"
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. best delivery spot, times that work, questions…"
                        className={inputClass + " resize-y"}
                      />
                    </div>
                  </div>

                  {state === "error" && (
                    <div
                      role="alert"
                      className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
                    >
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={state === "submitting"}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-sky-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {state === "submitting" ? "Sending…" : "Request service"}
                  </button>
                  <p className="mt-3 text-xs text-slate-500">
                    No payment now — this just adds you to the waiting list.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ Footer ----------------------------- */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-12 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <div className="flex items-center justify-center gap-2.5 sm:justify-start">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white">
                <DropletIcon className="h-4 w-4" />
              </span>
              <span className="text-base font-extrabold tracking-tight text-white">
                Aqua<span className="text-sky-400">Drop</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed">
              Water delivered to your door — no delivery fee, no service fee,
              no hidden costs. You pay only for the water.
            </p>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            Service is launching by area.<br />
            Join the list above and we'll let you know when we reach yours.
          </p>
        </div>
      </footer>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-3.5 w-3.5"}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}