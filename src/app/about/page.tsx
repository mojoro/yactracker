import Link from "next/link";

export const metadata = {
  title: "About | Young Artist Community",
  description:
    "Why Young Artist Community exists, what you can do here, and where it's going.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
          />
        </svg>
        Home
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
        About Young Artist Community
      </h1>
      <h3 className="mt-6 text-l font-bold tracking-tight text-slate-500">
        An open-source, free-to-use directory for Young Artist Programs
      </h3>

      <div className="mt-8 space-y-5 text-base leading-relaxed text-slate-600">
        <p>
          I remember being a freshman in Boston, thinking: how do you even find
          all the young artist programs? Someone should make a site for that.
          Then I found out someone already had. The existing tools helped, but
          they left gaps. Program details scattered across dozens of websites,
          buried in PDFs, or locked behind paywalls. And the most valuable
          information of all, what the experience was actually like for the
          people who went, lived almost entirely in private Facebook groups and
          word of mouth.
        </p>

        <p>
          It wasn&apos;t until years later, after conservatory, after a career
          change, after learning to build software, that the thought came back
          differently. Maybe I could make something that does what the others
          don&apos;t.
        </p>

        <h2 className="pt-4 text-xl font-bold text-slate-900">
          Why This Exists
        </h2>

        <p>
          Young Artist Community is a free, community-built directory of Young
          Artist Programs in classical music and opera. It exists because I
          believe this community deserves a single place to browse programs,
          compare details, and read honest reviews from people who&apos;ve been
          through them. No ads, no paid placements, no paywalls.
        </p>

        <p>
          The classical music world is small. The people navigating it, young
          singers and instrumentalists trying to figure out where to spend their
          summers, their money, and their energy, are making decisions that
          genuinely shape their careers. They should be able to make those
          decisions with good information.
        </p>

        <h2 className="pt-4 text-xl font-bold text-slate-900">
          What You Can Do Here
        </h2>

        <p>
          <strong className="text-slate-900">Browse and filter programs</strong>{" "}
          by instrument, category, location, tuition, and scholarship
          availability. Every listing includes the details that actually matter
          when you&apos;re deciding where to apply: what it costs, where it is,
          when the deadlines are, and what the audition process looks like.
        </p>

        <p>
          <strong className="text-slate-900">Read and write reviews. </strong>{" "}
          If you&apos;ve attended a program, your experience is valuable. A
          five-star rating is useful. A paragraph about what the coaching was
          like, whether the housing was livable, or how the program treated its
          participants is worth more than any brochure.
        </p>

        <p>
          <strong className="text-slate-900">
            Submit and edit program information.
          </strong>{" "}
          The site is built like a wiki. Anyone can add a program. Anyone can
          update a listing. If you notice something outdated or inaccurate, fix
          it. Every edit is versioned, so nothing is lost and bad information
          can be corrected quickly.
        </p>

        <p>
          <strong className="text-slate-900">Report problems.</strong> If
          something looks wrong or inappropriate, flag it. The community keeps
          this directory honest.
        </p>

        <h2 className="pt-4 text-xl font-bold text-slate-900">
          Built by the Community, for the Community
        </h2>

        <p>
          This is not a platform run by a company trying to sell access to young
          musicians. It&apos;s a resource maintained by the people who use it.
          The model is simple: trust the community first, moderate when needed.
          Classical musicians, voice teachers, program administrators. These are
          thoughtful people who care about accuracy. The edit history and
          reporting system are there as safety nets, but the foundation is
          trust.
        </p>

        <p>
          The directory started with a handful of verified programs, each one
          researched and fact-checked against official sources. It will grow
          because people contribute to it. That&apos;s the idea.
        </p>

        <h2 className="pt-4 text-xl font-bold text-slate-900">
          Where This Is Going
        </h2>

        <p>
          Young Artist Community starts with Young Artist Programs, but
          that&apos;s not where it has to end. Graduate programs in classical
          music and opera face the same information problem. The same scattered
          websites, the same reliance on word of mouth. Opening the directory to
          cover those programs is a natural next step.
        </p>

        <p>
          Verified reviews with aggregate scores would also make a real
          difference. Right now, anyone can post a review any amount of times
          and all of them are weighed equally. It would be easy to review bomb
          in favor of or against any program. Please, do not do this, but the
          eventual plan would be to give reviews from people confirmed to have
          attended a program a verified tag and compute their score separately.
          Aggregate scoring across verified alumni would give prospective
          applicants something much more reliable to work with.
        </p>

        <p>
          All of this depends on community interest and involvement. The
          platform is built to grow with its users. If people show up,
          contribute, and find it useful, the scope grows with them.
        </p>

        <h2 className="pt-4 text-xl font-bold text-slate-900">
          Who Built This
        </h2>

        <p>
          My name is John Moorman. I&apos;m a software engineer based in Berlin.
          Before I wrote code for a living, I spent ten years training as an
          opera singer. I know this community because I am part of it, even if
          my career has taken a different route.
        </p>

        <p>
          I built this because I wanted it to exist when I was a student, and
          because the people going through that process right now deserve better
          tools than what&apos;s available. The site is free to use and will
          stay that way.
        </p>

        <p>
          If you have questions, suggestions, or want to get involved, reach out
          at{" "}
          <a
            href="mailto:john@johnmoorman.com"
            className="font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            john@johnmoorman.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
