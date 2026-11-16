import { useState, useEffect } from "react";
import {
  Globe, Phone, MapPin, Clock, ShieldCheck,
  AlertCircle, ShieldAlert, X, Loader2,
  ArrowLeft, Share2, Image as ImageIcon, Mail, Instagram, Facebook, Youtube, Twitter, Send
} from "lucide-react";
import { toast } from "sonner";
import {
  getPublicStoreProfile, submitStoreClaim, submitStoreReport,
  getUserPanelBaseUrl, StoreListing
} from "../../api/api";
import { WhatsAppIcon } from "../common/WhatsAppIcon";
import icon from "../../assets/icon.png";
import "../../styles/public-store.css";


const getSocialIconPub = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return <Instagram size={15} style={{ color: "#c13584" }} />;
  if (p.includes("facebook")) return <Facebook size={15} style={{ color: "#1877f2" }} />;
  if (p.includes("youtube")) return <Youtube size={15} style={{ color: "#dc2626" }} />;
  if (p.includes("twitter") || p === "x") return <Twitter size={15} style={{ color: "#0f172a" }} />;
  if (p.includes("telegram")) return <Send size={15} style={{ color: "#0284c7" }} />;
  if (p.includes("whatsapp")) return <WhatsAppIcon size={15} />;
  return <Globe size={15} style={{ color: "#4C0F2D" }} />;
};

/* Helper: Format date as [DATE/MONTH/YEAR] (DD/MM/YYYY) */
const formatDateDMY = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return "Recently";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "Recently";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

interface PublicStoreProfilePageProps {
  slug?: string;
  onNavigateBack?: () => void;
}

export function PublicStoreProfilePage({ slug: propSlug, onNavigateBack }: PublicStoreProfilePageProps) {
  const userPanelUrl = getUserPanelBaseUrl();
  // Extract slug from URL if not passed in props
  const slug = propSlug || window.location.pathname.replace(/^\/(store|stores)\//i, '').replace(/\/$/, '');

  const [store, setStore] = useState<StoreListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeGalleryImg, setActiveGalleryImg] = useState<string | null>(null);

  // Claim form state
  const [claimName, setClaimName] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimEmail, setClaimEmail] = useState("");
  const [claimProofType, setClaimProofType] = useState("GSTIN / Business Registration Certificate");
  const [claimGstinOrDoc, setClaimGstinOrDoc] = useState("");
  const [showOptionalUpload, setShowOptionalUpload] = useState(false);
  const [claimFile, setClaimFile] = useState<File | null>(null);
  const [claimNotes, setClaimNotes] = useState("");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Report form state
  const [reportType, setReportType] = useState("Incorrect Phone / WhatsApp");
  const [reportDesc, setReportDesc] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    if (!slug) {
      setError("No store slug provided");
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getPublicStoreProfile(slug);
        setStore(res.data);
      } catch (err: any) {
        console.error("Failed to load store profile:", err);
        setError(err?.response?.data?.message || "Store listing not found or is currently unavailable.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [slug]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: store?.store_name || "Jewellers Paradise Store",
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Store link copied to clipboard!");
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    if (!claimName.trim() || !claimPhone.trim() || !claimEmail.trim()) {
      toast.error("Please fill in your name, phone, and email.");
      return;
    }

    if (claimProofType.includes("GST") && !claimGstinOrDoc.trim() && !claimFile) {
      toast.error("Please enter your 15-digit GSTIN number or attach your certificate.");
      return;
    }

    if (claimProofType.includes("Visiting Card") && !claimFile && !claimGstinOrDoc.trim()) {
      toast.error("Please upload a photo of your business visiting card.");
      return;
    }

    setIsSubmittingClaim(true);
    try {
      const fd = new FormData();
      fd.append("claimantName", claimName.trim());
      fd.append("claimantPhone", claimPhone.trim());
      fd.append("claimantEmail", claimEmail.trim());
      fd.append("proofType", claimProofType);
      if (claimGstinOrDoc.trim()) {
        fd.append("gstin", claimGstinOrDoc.trim().toUpperCase());
        fd.append("documentLinkOrGstin", claimGstinOrDoc.trim().toUpperCase());
      }
      if (claimNotes.trim()) fd.append("notes", claimNotes.trim());
      if (claimFile) fd.append("proofDocument", claimFile);

      await submitStoreClaim(store.id, fd);
      toast.success("Claim submitted successfully! Our team will review your ownership proof.");
      setIsClaimModalOpen(false);
      setClaimName("");
      setClaimPhone("");
      setClaimEmail("");
      setClaimGstinOrDoc("");
      setClaimFile(null);
      setClaimNotes("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit claim request. Please try again.");
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    if (!reportDesc.trim()) {
      toast.error("Please describe what information is incorrect.");
      return;
    }

    setIsSubmittingReport(true);
    try {
      await submitStoreReport(store.id, {
        reportType,
        description: reportDesc,
        reportedByEmail: reportEmail || undefined,
      });
      toast.success("Thank you! Your correction report has been sent to our verification team.");
      setIsReportModalOpen(false);
      setReportDesc("");
      setReportEmail("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pub-page-wrapper" style={{ alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={36} className="sl-spinner" style={{ color: "#4C0F2D", marginBottom: "16px" }} />
        <p style={{ fontWeight: 600, color: "#735e69", fontSize: "15px" }}>Loading jewellery store profile…</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="pub-page-wrapper">
        <header className="pub-header">
          <div className="pub-header-inner">
            <div className="pub-brand" onClick={() => window.location.href = "/"}>
              <img src={icon} alt="Jewellers Paradise" className="pub-brand-logo" />
              <span className="pub-brand-name">JEWELLERS PARADISE</span>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: "600px", margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
          <div style={{ width: "70px", height: "70px", borderRadius: "50%", backgroundColor: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <AlertCircle size={36} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", color: "#4C0F2D", marginBottom: "10px" }}>
            Store Listing Not Found
          </h2>
          <p style={{ color: "#735e69", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
            {error || "The requested jewellery store listing may have been moved, unpublished, or the link may be incorrect."}
          </p>
          <button
            onClick={() => {
              if (onNavigateBack) onNavigateBack();
              else window.location.href = "/";
            }}
            className="pub-cta-btn call"
            style={{ display: "inline-flex", margin: "0 auto" }}
          >
            <ArrowLeft size={16} /> Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Active offers filter (hide expired)
  const activeOffers = (store.offers || []).filter((o) => {
    if (!o.is_active) return false;
    if (o.end_date) {
      return new Date(o.end_date).getTime() >= new Date().setHours(0, 0, 0, 0);
    }
    return true;
  });

  return (
    <div className="pub-page-wrapper">
      {/* ── Top Header ── */}
      <header className="pub-header">
        <div className="pub-header-inner">
          <div className="pub-brand" onClick={() => window.location.href = "/"}>
            <img src={icon} alt="Jewellers Paradise" className="pub-brand-logo" />
            <span className="pub-brand-name">JEWELLERS PARADISE</span>
          </div>

          <nav className="pub-nav-links">
            <a href={`${userPanelUrl}/`} className="pub-nav-link">Home</a>
            <a href={`${userPanelUrl}/stores`} className="pub-nav-link">Stores</a>
            <a href={`${userPanelUrl}/offers`} className="pub-nav-link">Offers</a>
            <button
              onClick={handleShare}
              className="pub-nav-link"
              style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              title="Share store link"
            >
              <Share2 size={15} /> Share
            </button>
          </nav>
        </div>
      </header>

      {/* ── Store Cover Hero Banner ── */}
      <div className="pub-hero-banner">
        {store.cover_photo_url ? (
          <>
            <div
              className="pub-hero-banner-ambient"
              style={{ backgroundImage: `url(${store.cover_photo_url})` }}
            />
            <img
              src={store.cover_photo_url}
              alt={store.store_name}
              className="pub-hero-banner-img"
            />
          </>
        ) : (
          <div className="pub-hero-banner-fallback" />
        )}
        <div className="pub-hero-overlay" />
      </div>

      {/* ── Main Profile Container ── */}
      <main className="pub-main-container">
        <div className="pub-profile-card">
          {/* Store Identity Header */}
          <div className="pub-store-header">
            <div className="pub-identity-left">
              <div className="pub-logo-box">
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.store_name} />
                ) : (
                  <span style={{ fontSize: "28px", fontWeight: 700, color: "#4C0F2D" }}>
                    {store.store_name.charAt(0)}
                  </span>
                )}
              </div>

              <div>
                <div className="pub-title-row">
                  <h1 className="pub-store-title">{store.store_name}</h1>
                  {store.is_verified && (
                    <span className="pub-verified-badge" title="Verified by Jewellers Paradise team">
                      <ShieldCheck size={14} style={{ color: "#b4860b" }} /> Verified Jeweller
                    </span>
                  )}
                </div>

                <p className="pub-loc-text">
                  {store.store_type === "ONLINE" ? (
                    <>
                      <Globe size={15} style={{ color: "#2563eb", flexShrink: 0 }} />
                      <strong>Online Store</strong>
                      {store.city && store.city !== "Online" ? ` • Based in ${store.city}, ${store.state || ""}` : ` • Delivering Pan-${store.country || "India"}`}
                    </>
                  ) : (
                    <>
                      <MapPin size={15} style={{ color: "#dc2626", flexShrink: 0 }} />
                      <strong>{store.address}</strong> • {store.city}, {store.state}, {store.country || "India"} {store.pincode ? `- ${store.pincode}` : ""}
                    </>
                  )}
                </p>

                {store.categories && store.categories.length > 0 && (
                  <div className="pub-cats-wrap">
                    {store.categories.map((c, i) => (
                      <span key={i} className="pub-cat-pill">{c}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ textAlign: "right", fontSize: "12px", color: "#8a7b82" }}>
              <span>Listing updated: {store.updated_at ? formatDateDMY(store.updated_at) : "Recently"}</span>
            </div>
          </div>

          {/* ── CUSTOMER CONTACT CTAs (Website, Directions, Call, WhatsApp, Email) ── */}
          <div className="pub-cta-grid">
            <a
              href={store.website || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`pub-cta-btn website ${!store.website ? "disabled" : ""}`}
              style={!store.website ? { opacity: 0.5, pointerEvents: "none" } : {}}
            >
              <Globe size={18} />
              <span>Visit Website</span>
            </a>

            {store.store_type !== "ONLINE" && (
              <a
                href={
                  store.google_maps_link ||
                  `https://maps.google.com/?q=${encodeURIComponent(`${store.store_name} ${store.address} ${store.city}`)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="pub-cta-btn directions"
              >
                <MapPin size={18} style={{ color: "#dc2626" }} />
                <span>Get Directions</span>
              </a>
            )}

            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="pub-cta-btn call"
              >
                <Phone size={18} style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff" }}>Call Store</span>
              </a>
            )}

            {(store.whatsapp || store.phone) && (
              <a
                href={
                  store.whatsapp
                    ? `https://wa.me/${store.whatsapp.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(store.store_name)}%2C%20I%20found%20your%20store%20on%20JewellersParadise.`
                    : `https://wa.me/${store.phone ? store.phone.replace(/[^0-9]/g, '') : ''}?text=Hi%20${encodeURIComponent(store.store_name)}%2C%20I%20found%20your%20store%20on%20JewellersParadise.`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="pub-cta-btn whatsapp"
              >
                <WhatsAppIcon size={18} style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff" }}>WhatsApp Store</span>
              </a>
            )}

            {(store.email || (store.emails && store.emails.length > 0)) && (
              <a
                href={`mailto:${store.email || store.emails?.[0]}`}
                className="pub-cta-btn call"
                style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)" }}
              >
                <Mail size={18} style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff" }}>Email Store</span>
              </a>
            )}
          </div>

          {/* ── Info Grid: About, Operating Hours & Contact/Social Details ── */}
          <div className="pub-info-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            <div className="pub-section-card">
              <h3 className="pub-section-title">About the Jeweller</h3>
              <p className="pub-desc-p">
                {store.short_description || "Welcome to our store on Jewellers Paradise. Visit us to explore hallmark jewellery, latest designs, and certified collections."}
              </p>

              {/* Social Channels in About card if available */}
              {store.social_links && Object.keys(store.social_links).length > 0 && (
                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #ebdbe2" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#8a7b82", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                    Official Social Profiles
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {Object.entries(store.social_links).map(([platform, url]) => {
                      if (!url) return null;
                      return (
                        <a
                          key={platform}
                          href={url.startsWith("http") ? url : `https://${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "5px 10px",
                            borderRadius: "8px",
                            backgroundColor: "#fdfbfc",
                            border: "1px solid #ebdbe2",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#4C0F2D",
                            textDecoration: "none"
                          }}
                        >
                          {getSocialIconPub(platform)}
                          <span style={{ textTransform: "capitalize" }}>{platform.replace(/_/g, ' ')}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pub-section-card">
              <h3 className="pub-section-title">
                <Clock size={17} style={{ color: "#b4860b" }} /> Store Hours & Weekly Off
              </h3>
              <div className="pub-details-list">
                <div className="pub-detail-row">
                  <span className="pub-detail-label">Timings:</span>
                  <span className="pub-detail-val">
                    {store.opening_hours ||
                      (store.opening_time && store.closing_time
                        ? `${store.opening_time} - ${store.closing_time}`
                        : "10:00 AM - 08:30 PM")}
                  </span>
                </div>
                <div className="pub-detail-row">
                  <span className="pub-detail-label">Weekly Off:</span>
                  {(() => {
                    const holidays = (store.weekly_holidays && store.weekly_holidays.length > 0)
                      ? store.weekly_holidays.join(", ")
                      : (store.weekly_holiday || store.weekly_off);
                    const isClosed = holidays && holidays !== "None" && !holidays.toLowerCase().includes("open all");
                    return (
                      <span className="pub-detail-val" style={{ color: isClosed ? "#dc2626" : "#059669", fontWeight: 700 }}>
                        {isClosed ? holidays : "Open All 7 Days"}
                      </span>
                    );
                  })()}
                </div>

                {/* Daywise breakdown if present */}
                {store.daywise_hours && (
                  <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #ebdbe2" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#8a7b82", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                      Daily Schedule Breakdown:
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "4px" }}>
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                        const s = (store.daywise_hours as any)?.[day];
                        if (!s) return null;
                        return (
                          <div
                            key={day}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "11px",
                              padding: "3px 6px",
                              borderRadius: "4px",
                              backgroundColor: s.is_closed ? "#fee2e2" : "#f0fdf4",
                              color: s.is_closed ? "#991b1b" : "#166534"
                            }}
                          >
                            <strong>{day.slice(0, 3)}:</strong>
                            <span>{s.is_closed ? "Closed" : `${s.open} - ${s.close}`}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Contact numbers */}
                {(store.phone || (store.phones && store.phones.length > 0)) && (
                  <div className="pub-detail-row" style={{ marginTop: "8px" }}>
                    <span className="pub-detail-label">Phone:</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
                      {(store.phones && store.phones.length > 0 ? store.phones : [store.phone!]).filter(Boolean).map((ph, idx) => (
                        <a key={idx} href={`tel:${ph.replace(/[^0-9+]/g, '')}`} style={{ color: "#4C0F2D", textDecoration: "none", fontWeight: 600 }}>
                          {ph}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email addresses */}
                {(store.email || (store.emails && store.emails.length > 0)) && (
                  <div className="pub-detail-row">
                    <span className="pub-detail-label">Email:</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
                      {(store.emails && store.emails.length > 0 ? store.emails : [store.email!]).map((em, idx) => (
                        <a key={idx} href={`mailto:${em}`} style={{ color: "#1e3a8a", textDecoration: "none", fontWeight: 600 }}>
                          {em}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Active Offers Section ── */}
          {activeOffers.length > 0 && (
            <div className="pub-section-card" style={{ marginBottom: "28px" }}>
              <h3 className="pub-section-title" style={{ color: "#92400e" }}>
                🎁 Exclusive Store Offers ({activeOffers.length})
              </h3>
              <div className="pub-offers-grid">
                {activeOffers.map((offer) => (
                  <div key={offer.id} className="pub-offer-card">
                    {offer.discount_label && (
                      <span className="pub-offer-discount">{offer.discount_label}</span>
                    )}
                    <h4 className="pub-offer-title">{offer.title}</h4>
                    {offer.description && (
                      <p className="pub-offer-desc">{offer.description}</p>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {offer.end_date && (
                        <span className="pub-offer-validity">
                          📅 Valid Until: {formatDateDMY(offer.end_date)}
                        </span>
                      )}
                      {offer.terms && (
                        <span style={{ fontSize: "11px", color: "#a16207" }}>
                          📜 Terms: {offer.terms}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Photo Gallery Section ── */}
          {store.gallery && store.gallery.length > 0 && (
            <div className="pub-section-card" style={{ marginBottom: "28px" }}>
              <h3 className="pub-section-title">
                <ImageIcon size={18} style={{ color: "#4C0F2D" }} /> Store & Jewellery Gallery
              </h3>
              <div className="pub-gallery-grid">
                {store.gallery.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => setActiveGalleryImg(g.image_url)}
                    className="pub-gallery-thumb"
                  >
                    <img src={g.image_url} alt={g.caption || store.store_name} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Mandatory Legal Disclaimer Card ── */}
          <div className="pub-disclaimer-box">
            <div className="pub-disclaimer-header">
              <ShieldAlert size={16} /> Important Customer Discovery Notice
            </div>
            <p className="pub-disclaimer-text">
              “JewellersParadise is a jewellery offers discovery platform. Purchases and enquiries are handled directly by the jeweller. Please confirm offer availability and terms with the store.”
            </p>
          </div>

          {/* ── Ownership & Error Reporting Secondary Bar ── */}
          <div className="pub-secondary-bar">
            <button
              onClick={() => setIsClaimModalOpen(true)}
              className="pub-sec-link"
            >
              🏢 Own this store? Claim or update this listing
            </button>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="pub-sec-link report"
            >
              🚩 Report incorrect details
            </button>
          </div>
        </div>
      </main>

      {/* ── Gallery Lightbox Modal ── */}
      {activeGalleryImg && (
        <div
          onClick={() => setActiveGalleryImg(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.88)",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            cursor: "zoom-out",
          }}
        >
          <img
            src={activeGalleryImg}
            alt="Store Gallery"
            style={{ maxWidth: "90%", maxHeight: "85vh", borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
          />
        </div>
      )}

      {/* ── Claim Store Modal ── */}
      {isClaimModalOpen && (
        <div className="sl-modal-overlay">
          <div className="sl-modal-card" style={{ maxWidth: "560px" }}>
            <div className="sl-modal-header">
              <div className="sl-modal-title-row">
                <ShieldCheck size={20} style={{ color: "#fef08a" }} />
                <h3 className="sl-modal-title">Claim Store Ownership</h3>
              </div>
              <button onClick={() => setIsClaimModalOpen(false)} className="sl-modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim}>
              <div className="sl-modal-body">
                <p style={{ fontSize: "13px", color: "#6b5860", margin: 0, lineHeight: 1.5 }}>
                  Are you the owner or authorized representative of <strong>{store.store_name}</strong>? Submit your details and ownership verification proof below.
                </p>

                <div className="sl-field">
                  <label className="sl-label">Your Full Name <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={claimName}
                    onChange={(e) => setClaimName(e.target.value)}
                    className="sl-input"
                  />
                </div>

                <div className="sl-grid-2">
                  <div className="sl-field">
                    <label className="sl-label">Phone Number <span className="req">*</span></label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={claimPhone}
                      onChange={(e) => setClaimPhone(e.target.value)}
                      className="sl-input"
                    />
                  </div>

                  <div className="sl-field">
                    <label className="sl-label">Business Email <span className="req">*</span></label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. owner@jewellers.com"
                      value={claimEmail}
                      onChange={(e) => setClaimEmail(e.target.value)}
                      className="sl-input"
                    />
                  </div>
                </div>

                <div className="sl-field">
                  <label className="sl-label">Proof of Business Ownership <span className="req">*</span></label>
                  <select
                    value={claimProofType}
                    onChange={(e) => {
                      setClaimProofType(e.target.value);
                      setClaimGstinOrDoc("");
                      setClaimFile(null);
                      setShowOptionalUpload(false);
                    }}
                    className="sl-select"
                  >
                    <option value="GSTIN / Business Registration Certificate">GSTIN / Business Registration Certificate</option>
                    <option value="Business Card / Visiting Card">Visiting Card / Store Letterhead</option>
                    <option value="BIS Hallmark Registration">BIS Hallmark License / Certificate</option>
                    <option value="Store Lease / Utility Bill">Store Utility Bill / Lease Agreement</option>
                    <option value="Google Drive / Cloud Link">Google Drive / Cloud Document Link</option>
                  </select>
                </div>

                {/* ── Dynamic Input Field based on Selected Proof ── */}
                {claimProofType === "GSTIN / Business Registration Certificate" && (
                  <div className="sl-field">
                    <label className="sl-label">
                      Enter 15-Digit GSTIN Number <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="e.g. 29AAAAA0000A1Z5"
                      value={claimGstinOrDoc}
                      onChange={(e) => setClaimGstinOrDoc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      className="sl-input"
                      style={{ textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, fontFamily: "monospace", fontSize: "14px" }}
                    />
                    <div style={{ marginTop: "5px", display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "#065f46", backgroundColor: "#ecfdf5", padding: "6px 10px", borderRadius: "6px", border: "1px solid #a7f3d0" }}>
                      <span>✓ <strong>No file upload needed!</strong> You can simply provide your GST number. Admin will verify it directly on the government GST portal.</span>
                    </div>

                    <div style={{ marginTop: "10px" }}>
                      {!showOptionalUpload ? (
                        <button
                          type="button"
                          onClick={() => setShowOptionalUpload(true)}
                          style={{ background: "none", border: "none", color: "#781846", fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline" }}
                        >
                          + Or attach GST Certificate document / PDF (Optional)
                        </button>
                      ) : (
                        <div style={{ marginTop: "8px", padding: "10px", backgroundColor: "#faf6f8", border: "1px dashed #d9c4ce", borderRadius: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#4c0f2d" }}>Attach GST Document (PDF / Image)</span>
                            <button
                              type="button"
                              onClick={() => { setShowOptionalUpload(false); setClaimFile(null); }}
                              style={{ background: "none", border: "none", color: "#dc2626", fontSize: "11px", cursor: "pointer" }}
                            >
                              Remove
                            </button>
                          </div>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setClaimFile(e.target.files[0]);
                            }}
                            className="sl-input"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {claimProofType === "Business Card / Visiting Card" && (
                  <div className="sl-field">
                    <label className="sl-label">
                      Upload Visiting Card Photo (JPG, PNG) <span className="req">*</span>
                    </label>
                    <input
                      type="file"
                      required
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setClaimFile(e.target.files[0]);
                      }}
                      className="sl-input"
                    />
                    <span style={{ fontSize: "11.5px", color: "#8a7b82", marginTop: "4px", display: "block" }}>
                      Please snap or upload a clear photo of your showroom business card or company letterhead showing your designation.
                    </span>
                    {claimFile && (
                      <div style={{ marginTop: "6px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 8px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "6px", fontSize: "11.5px", color: "#065f46", fontWeight: 600 }}>
                        <span>✓ Attached: {claimFile.name} ({(claimFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    )}
                  </div>
                )}

                {claimProofType === "BIS Hallmark Registration" && (
                  <div className="sl-field">
                    <label className="sl-label">
                      BIS Hallmark License Number or Certificate <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HM/C - 7894561 or Hallmark Certificate"
                      value={claimGstinOrDoc}
                      onChange={(e) => setClaimGstinOrDoc(e.target.value)}
                      className="sl-input"
                    />
                    <span style={{ fontSize: "11.5px", color: "#8a7b82", marginTop: "4px", display: "block" }}>
                      Enter your Bureau of Indian Standards (BIS) hallmark center license number.
                    </span>
                  </div>
                )}

                {claimProofType === "Store Lease / Utility Bill" && (
                  <div className="sl-field">
                    <label className="sl-label">
                      Upload Electricity Bill or Lease Agreement (PDF/Image) <span className="req">*</span>
                    </label>
                    <input
                      type="file"
                      required
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setClaimFile(e.target.files[0]);
                      }}
                      className="sl-input"
                    />
                    <span style={{ fontSize: "11.5px", color: "#8a7b82", marginTop: "4px", display: "block" }}>
                      Accepted formats: PDF, JPG, PNG showing the showroom's registered address.
                    </span>
                  </div>
                )}

                {claimProofType === "Google Drive / Cloud Link" && (
                  <div className="sl-field">
                    <label className="sl-label">
                      Google Drive / Cloud Document Link <span className="req">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://drive.google.com/file/d/..."
                      value={claimGstinOrDoc}
                      onChange={(e) => setClaimGstinOrDoc(e.target.value)}
                      className="sl-input"
                    />
                    <span style={{ fontSize: "11.5px", color: "#8a7b82", marginTop: "4px", display: "block" }}>
                      Ensure link sharing permissions are set to "Anyone with the link can view".
                    </span>
                  </div>
                )}

                <div className="sl-field">
                  <label className="sl-label">Additional Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Any details to help us verify your request..."
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                    className="sl-textarea"
                  />
                </div>
              </div>

              <div className="sl-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="sl-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClaim}
                  className="sl-btn-primary"
                  style={{ color: "#ffffff" }}
                >
                  {isSubmittingClaim ? "Submitting…" : "Submit Claim Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Report Incorrect Details Modal ── */}
      {isReportModalOpen && (
        <div className="sl-modal-overlay">
          <div className="sl-modal-card" style={{ maxWidth: "520px" }}>
            <div className="sl-modal-header" style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)" }}>
              <div className="sl-modal-title-row">
                <AlertCircle size={20} style={{ color: "#fef08a" }} />
                <h3 className="sl-modal-title">Report Incorrect Details</h3>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="sl-modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReport}>
              <div className="sl-modal-body">
                <p style={{ fontSize: "13px", color: "#6b5860", margin: 0, lineHeight: 1.5 }}>
                  Notice wrong contact info, outdated offers, or an incorrect location for <strong>{store.store_name}</strong>? Please let us know so we can update it immediately.
                </p>

                <div className="sl-field">
                  <label className="sl-label">Issue Type <span className="req">*</span></label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="sl-select"
                  >
                    <option value="Incorrect Phone / WhatsApp">Incorrect Phone / WhatsApp</option>
                    <option value="Wrong Address or Pin on Map">Wrong Address or Pin on Map</option>
                    <option value="Store Closed or Moved">Store Closed or Moved</option>
                    <option value="Expired Offer Still Showing">Expired Offer Still Showing</option>
                    <option value="Other">Other Discrepancy</option>
                  </select>
                </div>

                <div className="sl-field">
                  <label className="sl-label">Describe the Correction Needed <span className="req">*</span></label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. The phone number is missing a digit, the correct number is..."
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    className="sl-textarea"
                  />
                </div>

                <div className="sl-field">
                  <label className="sl-label">Your Email <span className="opt">(optional, for follow-up)</span></label>
                  <input
                    type="email"
                    placeholder="e.g. yourname@gmail.com"
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                    className="sl-input"
                  />
                </div>
              </div>

              <div className="sl-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="sl-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="sl-btn-primary"
                  style={{ backgroundColor: "#991b1b", color: "#ffffff" }}
                >
                  {isSubmittingReport ? "Sending…" : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Public Footer ── */}
      <footer className="pub-footer">
        <p style={{ margin: "0 0 6px 0", fontWeight: 700, color: "#4C0F2D" }}>
          JEWELLERS PARADISE — Premium Jewellery Offers Discovery Platform
        </p>
        <p style={{ margin: 0, color: "#9c828e" }}>
          © 2026 Jewellers Paradise. All rights reserved. Direct store listings managed by platform editorial team.
        </p>
      </footer>
    </div>
  );
}
