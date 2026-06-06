import type { InquiryOut } from "../../types";

interface InquiryListProps {
  inquiries: InquiryOut[];
  propertyTitle: string;
}

export function InquiryList({ inquiries, propertyTitle }: InquiryListProps) {
  return (
    <div className="mt-4 space-y-2 rounded-xl p-4" style={{ background: "var(--surface-container-low)" }}>
      <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>
        Inquiries ({inquiries.length})
      </h4>
      {inquiries.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--outline)" }}>No inquiries yet for this listing.</p>
      ) : (
        inquiries.map((inq) => (
          <div key={inq.inquiry_id} className="rounded-xl p-4 text-sm"
            style={{ background: "var(--surface-container-lowest)" }}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <p className="font-bold" style={{ color: "var(--on-surface)" }}>{inq.name}</p>
              <div className="flex gap-1.5 shrink-0">
                <a href={`tel:${inq.phone}`}
                  className="rounded-lg px-2 py-1 text-[10px] font-bold"
                  style={{ background: "rgba(59,130,246,0.1)", color: "#2563eb" }}>
                  📞 Call
                </a>
                <a href={`https://wa.me/91${inq.phone}?text=${encodeURIComponent(`Hi ${inq.name}, thanks for your inquiry about "${propertyTitle}" on NearMyColleges!`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="rounded-lg px-2 py-1 text-[10px] font-bold"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
                  💬 WhatsApp
                </a>
              </div>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--outline)" }}>{inq.phone}</p>
            {inq.message && <p className="mt-1" style={{ color: "var(--on-surface-variant)" }}>{inq.message}</p>}
            <p className="mt-1 text-xs" style={{ color: "var(--outline)" }}>
              {new Date(inq.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
