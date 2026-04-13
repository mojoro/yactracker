import Link from "next/link";
import type { Program } from "@/lib/types";

function formatTuition(n: number | null): string | null {
  if (n === null) return null;
  if (n === 0) return "Free";
  return `$${n.toLocaleString("en-US")}`;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  const year = `'${String(d.getFullYear()).slice(-2)}`;
  return `${month} ${day}, ${year}`;
}

function formatAppFee(n: number | null): string | null {
  if (n === null) return null;
  if (n === 0) return "Free";
  return `$${n.toLocaleString("en-US")}`;
}

function AddLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group/add inline-flex items-center gap-0.5 text-tag-700 cursor-pointer transition-colors hover:text-brand-600"
    >
      <span>&mdash;</span>
      <span className="max-w-0 overflow-hidden opacity-0 group-hover/add:max-w-[3ch] group-hover/add:opacity-100 transition-all duration-150 text-xs font-medium">
        Add
      </span>
    </Link>
  );
}

export function ProgramCard({ program }: { program: Program }) {
  const locationText =
    program.locations.length > 0
      ? program.locations.map((l) => `${l.city}, ${l.country}`).join(" / ")
      : "Location TBD";

  const shownInstruments = program.instruments.slice(0, 3);
  const extraInstruments = program.instruments.length - shownInstruments.length;

  const shownCategories = program.categories.slice(0, 3);
  const extraCategories = program.categories.length - shownCategories.length;

  const hasRating = program.review_count > 0 && program.average_rating !== null;
  const editHref = `/programs/${program.slug}/edit`;

  const tuitionText = formatTuition(program.tuition);
  const appFeeText = formatAppFee(program.application_fee);
  const deadlineText = formatDate(program.application_deadline);

  return (
    <article className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 transition hover:shadow-md hover:-translate-y-0.5">
      {shownCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {shownCategories.map((c) => (
            <span
              key={c.id}
              className="rounded-full bg-tag-50 px-2.5 py-0.5 text-xs font-medium text-tag-700"
            >
              {c.name}
            </span>
          ))}
          {extraCategories > 0 && (
            <span className="rounded-full bg-tag-50 px-2.5 py-0.5 text-xs font-medium text-tag-700">
              +{extraCategories}
            </span>
          )}
        </div>
      )}

      <h2 className="text-base font-semibold text-slate-900 leading-snug mt-2">
        <Link
          href={`/programs/${program.slug}`}
          className="hover:text-brand-600 transition-colors"
        >
          {program.name}
        </Link>
      </h2>

      <p className="text-sm text-slate-500 mt-1">
        {program.locations.length > 0 ? (
          locationText
        ) : (
          <AddLink href={editHref} />
        )}
      </p>

      {shownInstruments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {shownInstruments.map((i) => (
            <span
              key={i.id}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
            >
              {i.name}
            </span>
          ))}
          {extraInstruments > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              +{extraInstruments}
            </span>
          )}
        </div>
      )}

      <div className="sm:mb-4 mb-3" />

      {/* Desktop: single row */}
      <div className="hidden sm:flex items-center justify-between sm:mt-auto sm:pt-4 sm:border-t sm:border-slate-200">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="inline-flex items-center gap-1 font-medium text-slate-900">
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-3.5 w-3.5 text-slate-400"
              aria-hidden="true"
            >
              <path d="M7.70177 1.36758C7.89214 1.28502 8.10821 1.28502 8.29858 1.36758C10.397 2.27761 12.4042 3.35793 14.3029 4.59105C14.548 4.75028 14.6783 5.03746 14.6367 5.32682C14.5951 5.61618 14.3891 5.85498 14.109 5.93866C12.1038 6.53768 10.1751 7.31422 8.34107 8.25008C8.12694 8.35934 7.87341 8.35934 7.65928 8.25008C7.03364 7.93083 6.39698 7.63012 5.75002 7.34867V6.80657C6.58634 6.33143 7.44297 5.88795 8.31827 5.47777C8.69334 5.302 8.85491 4.85546 8.67914 4.48039C8.50338 4.10531 8.05683 3.94375 7.68176 4.11951C6.63525 4.60993 5.61447 5.14603 4.62198 5.72525C4.39164 5.85967 4.25002 6.10631 4.25002 6.37301V6.73785C3.47668 6.44405 2.69006 6.17727 1.8913 5.93866C1.6112 5.85498 1.40524 5.61618 1.36362 5.32682C1.322 5.03746 1.4523 4.75028 1.69747 4.59105C3.59612 3.35793 5.60336 2.27761 7.70177 1.36758Z" />
              <path d="M4.25002 8.34775C3.71965 8.1356 3.18252 7.93682 2.63904 7.75185C2.46449 8.73026 2.32464 9.72067 2.22082 10.7218C2.18598 11.0578 2.38004 11.3756 2.69483 11.4981C2.87032 11.5664 3.04499 11.6363 3.21883 11.7078C3.04706 11.9465 2.85382 12.1744 2.6391 12.3892C2.34621 12.682 2.34621 13.1569 2.6391 13.4498C2.932 13.7427 3.40687 13.7427 3.69976 13.4498C4.04924 13.1003 4.35406 12.723 4.61419 12.325C4.15544 12.1076 3.6902 11.9018 3.21883 11.7078C3.90636 10.7527 4.25001 9.62721 4.25002 8.5001V8.34775Z" />
              <path d="M7.60299 13.9591C6.64228 13.3592 5.64461 12.8131 4.61419 12.325C5.27965 11.3067 5.65275 10.1531 5.73335 8.98392C6.15287 9.17619 6.56767 9.37701 6.97754 9.58616C7.61992 9.91395 8.38051 9.91395 9.02289 9.58616C10.4151 8.87576 11.8641 8.26144 13.3614 7.75183C13.536 8.73024 13.6758 9.72066 13.7797 10.7218C13.8145 11.0578 13.6204 11.3756 13.3057 11.4981C11.5856 12.1674 9.94367 12.9936 8.39748 13.9591C8.1544 14.1109 7.84608 14.1109 7.60299 13.9591Z" />
            </svg>
            {tuitionText ?? <AddLink href={editHref} />}
          </span>
          {program.offers_scholarship && (
            <span className="rounded-full bg-success-50 px-1.5 py-0.5 text-[10px] font-semibold text-success-700">
              Aid
            </span>
          )}
          <span className="mx-0.5 text-slate-300">|</span>
          <span className="inline-flex items-center gap-1 text-slate-500 whitespace-nowrap">
            <svg
              viewBox="4 3 24 26"
              fill="currentColor"
              className="h-3.5 w-3.5 text-slate-400"
              aria-hidden="true"
            >
              <path d="M21.71,27.51H5.56v-19H8.9A.5.5,0,0,0,9.4,8V4.49H21.71V5.9h1V4a.5.5,0,0,0-.5-.5H8.49a.49.49,0,0,0-.36.15L4.7,7.07a.5.5,0,0,0-.14.35V8h0V28a.5.5,0,0,0,.5.5H22.21a.5.5,0,0,0,.5-.5V20.62h-1ZM8.4,4.78V7.46H5.72Z" />
              <path d="M27.43,8.56a.51.51,0,0,0-.24-.3l-3-1.7a.5.5,0,0,0-.38,0,.47.47,0,0,0-.3.23L16.07,19.87a.46.46,0,0,0-.06.23l-.11,3.67a.51.51,0,0,0,.25.45.54.54,0,0,0,.25.06.48.48,0,0,0,.26-.07l3.07-1.92a.58.58,0,0,0,.17-.18L27.38,8.94A.5.5,0,0,0,27.43,8.56ZM19.09,21.5l-2.16,1.36.07-2.6,6-10.6,2.11,1.2ZM25.63,10l-2.11-1.2.63-1.11,2.11,1.2Z" />
              <rect x="8.04" y="10.33" width="10.33" height="2" rx="1" />
              <rect x="8.04" y="14.42" width="7.57" height="2" rx="1" />
              <rect x="8.04" y="18.66" width="4.82" height="2" rx="1" />
            </svg>
            {appFeeText ?? <AddLink href={editHref} />}
          </span>
          <span className="mx-0.5 text-slate-300">|</span>
          <span className="inline-flex items-center gap-1 text-slate-500">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              className="h-3.5 w-3.5 text-slate-400"
              aria-hidden="true"
            >
              <circle
                cx="8"
                cy="8"
                r="6.5"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M8 4.5V8l2.5 1.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {deadlineText ?? <AddLink href={editHref} />}
          </span>
        </div>
        <div className="text-sm">
          {hasRating ? (
            <span className="inline-flex items-center gap-1">
              <span className="text-accent-500">&#9733;</span>
              <span className="font-medium text-slate-700">
                {program.average_rating!.toFixed(1)}
              </span>
              <span className="text-slate-400">({program.review_count})</span>
            </span>
          ) : (
            <Link
              href="/reviews/new"
              className="font-medium text-tag-700 hover:text-brand-600 transition-colors"
            >
              + Review
            </Link>
          )}
        </div>
      </div>

      {/* Mobile: two rows with rating centered on right */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 sm:hidden text-sm mt-auto pt-2.5 border-t border-slate-200">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 font-medium text-slate-900">
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-3.5 w-3.5 text-slate-400"
              aria-hidden="true"
            >
              <path d="M7.70177 1.36758C7.89214 1.28502 8.10821 1.28502 8.29858 1.36758C10.397 2.27761 12.4042 3.35793 14.3029 4.59105C14.548 4.75028 14.6783 5.03746 14.6367 5.32682C14.5951 5.61618 14.3891 5.85498 14.109 5.93866C12.1038 6.53768 10.1751 7.31422 8.34107 8.25008C8.12694 8.35934 7.87341 8.35934 7.65928 8.25008C7.03364 7.93083 6.39698 7.63012 5.75002 7.34867V6.80657C6.58634 6.33143 7.44297 5.88795 8.31827 5.47777C8.69334 5.302 8.85491 4.85546 8.67914 4.48039C8.50338 4.10531 8.05683 3.94375 7.68176 4.11951C6.63525 4.60993 5.61447 5.14603 4.62198 5.72525C4.39164 5.85967 4.25002 6.10631 4.25002 6.37301V6.73785C3.47668 6.44405 2.69006 6.17727 1.8913 5.93866C1.6112 5.85498 1.40524 5.61618 1.36362 5.32682C1.322 5.03746 1.4523 4.75028 1.69747 4.59105C3.59612 3.35793 5.60336 2.27761 7.70177 1.36758Z" />
              <path d="M4.25002 8.34775C3.71965 8.1356 3.18252 7.93682 2.63904 7.75185C2.46449 8.73026 2.32464 9.72067 2.22082 10.7218C2.18598 11.0578 2.38004 11.3756 2.69483 11.4981C2.87032 11.5664 3.04499 11.6363 3.21883 11.7078C3.04706 11.9465 2.85382 12.1744 2.6391 12.3892C2.34621 12.682 2.34621 13.1569 2.6391 13.4498C2.932 13.7427 3.40687 13.7427 3.69976 13.4498C4.04924 13.1003 4.35406 12.723 4.61419 12.325C4.15544 12.1076 3.6902 11.9018 3.21883 11.7078C3.90636 10.7527 4.25001 9.62721 4.25002 8.5001V8.34775Z" />
              <path d="M7.60299 13.9591C6.64228 13.3592 5.64461 12.8131 4.61419 12.325C5.27965 11.3067 5.65275 10.1531 5.73335 8.98392C6.15287 9.17619 6.56767 9.37701 6.97754 9.58616C7.61992 9.91395 8.38051 9.91395 9.02289 9.58616C10.4151 8.87576 11.8641 8.26144 13.3614 7.75183C13.536 8.73024 13.6758 9.72066 13.7797 10.7218C13.8145 11.0578 13.6204 11.3756 13.3057 11.4981C11.5856 12.1674 9.94367 12.9936 8.39748 13.9591C8.1544 14.1109 7.84608 14.1109 7.60299 13.9591Z" />
            </svg>
            {tuitionText ?? <AddLink href={editHref} />}
          </span>
          {program.offers_scholarship && (
            <span className="rounded-full bg-success-50 px-1.5 py-0.5 text-[10px] font-semibold text-success-700">
              Aid
            </span>
          )}
        </div>
        <div className="row-span-2 flex items-center self-center">
          {hasRating ? (
            <span className="inline-flex items-center gap-1">
              <span className="text-accent-500">&#9733;</span>
              <span className="font-medium text-slate-700">
                {program.average_rating!.toFixed(1)}
              </span>
              <span className="text-slate-400">({program.review_count})</span>
            </span>
          ) : (
            <Link
              href="/reviews/new"
              className="font-medium text-tag-700 hover:text-brand-600 transition-colors"
            >
              + Review
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="inline-flex items-center gap-1 text-slate-500 whitespace-nowrap">
            <svg
              viewBox="4 3 24 26"
              fill="currentColor"
              className="h-3.5 w-3.5 text-slate-400"
              aria-hidden="true"
            >
              <path d="M21.71,27.51H5.56v-19H8.9A.5.5,0,0,0,9.4,8V4.49H21.71V5.9h1V4a.5.5,0,0,0-.5-.5H8.49a.49.49,0,0,0-.36.15L4.7,7.07a.5.5,0,0,0-.14.35V8h0V28a.5.5,0,0,0,.5.5H22.21a.5.5,0,0,0,.5-.5V20.62h-1ZM8.4,4.78V7.46H5.72Z" />
              <path d="M27.43,8.56a.51.51,0,0,0-.24-.3l-3-1.7a.5.5,0,0,0-.38,0,.47.47,0,0,0-.3.23L16.07,19.87a.46.46,0,0,0-.06.23l-.11,3.67a.51.51,0,0,0,.25.45.54.54,0,0,0,.25.06.48.48,0,0,0,.26-.07l3.07-1.92a.58.58,0,0,0,.17-.18L27.38,8.94A.5.5,0,0,0,27.43,8.56ZM19.09,21.5l-2.16,1.36.07-2.6,6-10.6,2.11,1.2ZM25.63,10l-2.11-1.2.63-1.11,2.11,1.2Z" />
              <rect x="8.04" y="10.33" width="10.33" height="2" rx="1" />
              <rect x="8.04" y="14.42" width="7.57" height="2" rx="1" />
              <rect x="8.04" y="18.66" width="4.82" height="2" rx="1" />
            </svg>
            {appFeeText ?? <AddLink href={editHref} />}
          </span>
          <span className="mx-0.5 text-slate-300">|</span>
          <span className="inline-flex items-center gap-1 text-slate-500">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              className="h-3.5 w-3.5 text-slate-400"
              aria-hidden="true"
            >
              <circle
                cx="8"
                cy="8"
                r="6.5"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M8 4.5V8l2.5 1.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {deadlineText ?? <AddLink href={editHref} />}
          </span>
        </div>
      </div>
    </article>
  );
}
