import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, Eye, Pencil, Trash2, CheckCircle2, AlertTriangle,
  Loader2, RefreshCw, X, Globe, Phone, MapPin,
  Clock, ShieldCheck, ShieldAlert, ImagePlus, Camera,
  Building2, Tag, AlertCircle, Sparkles, Check, ExternalLink,
  RotateCcw, Mail, Share2, ChevronDown, ChevronUp, Sliders, Instagram, Facebook, Youtube, Twitter, Send
} from "lucide-react";
import { toast } from "sonner";
import {
  StoreListing, StoreGalleryItem, StoreOfferItem, StoreClaimItem, StoreReportItem,
  getAdminStoreListings, getAdminStoreById, createAdminStoreListing,
  updateAdminStoreListing, deleteAdminStoreListing, toggleAdminStorePublish,
  toggleAdminStoreVerification, deleteAdminStoreGalleryImage,
  addAdminStoreOffer, deleteAdminStoreOffer, getAdminStoreClaims,
  updateAdminStoreClaim, getAdminStoreReports, updateAdminStoreReport,
  submitStoreClaim, submitStoreReport, getUserPanelStoreUrl
} from "../../api/api";
import { WhatsAppIcon } from "../common/WhatsAppIcon";
import "../../styles/store-listings.css";

const PRESET_CATEGORIES = [
  "Gold", "Diamond", "Polki", "Kundan", "Bridal", "Antique",
  "Temple Jewellery", "Silver", "Platinum", "Gemstones", "Daily Wear"
];

const SOCIAL_PLATFORMS = [
  { id: "instagram", name: "Instagram", placeholder: "https://instagram.com/storename" },
  { id: "facebook", name: "Facebook", placeholder: "https://facebook.com/storename" },
  { id: "youtube", name: "YouTube", placeholder: "https://youtube.com/@storename" },
  { id: "twitter", name: "X (Twitter)", placeholder: "https://x.com/storename" },
  { id: "pinterest", name: "Pinterest", placeholder: "https://pinterest.com/storename" },
  { id: "linkedin", name: "LinkedIn", placeholder: "https://linkedin.com/company/storename" },
  { id: "telegram", name: "Telegram", placeholder: "https://t.me/storename" },
  { id: "whatsapp_channel", name: "WhatsApp Channel", placeholder: "https://whatsapp.com/channel/..." },
  { id: "threads", name: "Threads", placeholder: "https://threads.net/@storename" },
  { id: "snapchat", name: "Snapchat", placeholder: "https://snapchat.com/add/storename" },
  { id: "other", name: "Other Profile", placeholder: "https://..." }
];

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

interface DaySchedule {
  open: string;
  close: string;
  is_closed: boolean;
}

const DEFAULT_DAYWISE_HOURS: Record<string, DaySchedule> = {
  Monday: { open: "10:00 AM", close: "08:30 PM", is_closed: false },
  Tuesday: { open: "10:00 AM", close: "08:30 PM", is_closed: false },
  Wednesday: { open: "10:00 AM", close: "08:30 PM", is_closed: false },
  Thursday: { open: "10:00 AM", close: "08:30 PM", is_closed: false },
  Friday: { open: "10:00 AM", close: "08:30 PM", is_closed: false },
  Saturday: { open: "10:00 AM", close: "08:30 PM", is_closed: false },
  Sunday: { open: "10:00 AM", close: "08:30 PM", is_closed: true }
};



const getSocialIconPreview = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return <Instagram size={14} style={{ color: "#c13584" }} />;
  if (p.includes("facebook")) return <Facebook size={14} style={{ color: "#1877f2" }} />;
  if (p.includes("youtube")) return <Youtube size={14} style={{ color: "#dc2626" }} />;
  if (p.includes("twitter") || p === "x") return <Twitter size={14} style={{ color: "#0f172a" }} />;
  if (p.includes("telegram")) return <Send size={14} style={{ color: "#0284c7" }} />;
  if (p.includes("whatsapp")) return <WhatsAppIcon size={14} />;
  return <Globe size={14} style={{ color: "#4C0F2D" }} />;
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

/* ─── Image Dropzone Component ─── */
function DropZone({
  id, preview, onFile, onRemove, label, required, hint = "Click to upload"
}: {
  id: string; preview: string | null; onFile: (f: File) => void;
  onRemove?: () => void; label: string; required?: boolean; hint?: string;
}) {
  return (
    <div className="sl-field">
      <label className="sl-label">
        {label}
        {required ? <span className="req">*</span> : <span className="opt">(optional)</span>}
      </label>
      <input
        type="file"
        accept="image/*"
        id={id}
        style={{ display: "none" }}
        onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
      />
      <label htmlFor={id} className="sl-dropzone">
        {preview ? (
          <>
            <img src={preview} alt={label} className="sl-dropzone-preview" />
            <div className="sl-dropzone-overlay">
              <Camera size={18} />
              <span>Change Photo</span>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "12px",
              backgroundColor: "#f5e8ef", color: "#4C0F2D",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <ImagePlus size={20} />
            </div>
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#3b202c" }}>{label}</span>
            <span style={{ fontSize: "11px", color: "#8a7b81" }}>{hint}</span>
          </div>
        )}
      </label>
      {preview && onRemove && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
          className="sl-remove-img-btn"
          title="Remove photo"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT: StoreListingsManagement
   ═══════════════════════════════════════════════════════════════ */
export function StoreListingsManagement() {
  const [stores, setStores] = useState<StoreListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedCity, setSelectedCity] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [verifiedFilter, setVerifiedFilter] = useState<boolean>(false);

  // Modals & Drawers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreListing | null>(null);
  const [previewStore, setPreviewStore] = useState<StoreListing | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoreListing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Claims & Reports modal
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [claims, setClaims] = useState<StoreClaimItem[]>([]);
  const [reports, setReports] = useState<StoreReportItem[]>([]);
  const [requestsTab, setRequestsTab] = useState<"claims" | "reports">("claims");

  // Customer preview interaction modals
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimName, setClaimName] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimEmail, setClaimEmail] = useState("");
  const [claimProofType, setClaimProofType] = useState("GST Certificate");
  const [claimNotes, setClaimNotes] = useState("");
  const [claimProofFile, setClaimProofFile] = useState<File | null>(null);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState("Wrong Phone/Contact");
  const [reportDesc, setReportDesc] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Form State
  const [formStoreName, setFormStoreName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategories, setFormCategories] = useState<string[]>([]);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formCountry, setFormCountry] = useState("India");
  const [formPincode, setFormPincode] = useState("");
  const [formMapsLink, setFormMapsLink] = useState("");

  const [formPhone, setFormPhone] = useState("");
  const [formPhones, setFormPhones] = useState<string[]>([""]);
  const [formEmails, setFormEmails] = useState<string[]>([""]);
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formSocialLinks, setFormSocialLinks] = useState<Array<{ platform: string; url: string }>>([
    { platform: "instagram", url: "" },
    { platform: "facebook", url: "" }
  ]);

  const [formOpeningHours, setFormOpeningHours] = useState("10:00 AM - 08:30 PM");
    const [formWeeklyHolidays, setFormWeeklyHolidays] = useState<string[]>(["Sunday"]);
  const [formDaywiseHours, setFormDaywiseHours] = useState<Record<string, DaySchedule>>(DEFAULT_DAYWISE_HOURS);
  const [isDaywiseCustom, setIsDaywiseCustom] = useState(false);

  // Dynamic Multi-Field Helpers
  const addPhoneField = () => setFormPhones((prev) => [...prev, ""]);
  const updatePhoneField = (index: number, val: string) => {
    setFormPhones((prev) => prev.map((p, i) => (i === index ? val : p)));
    if (index === 0) setFormPhone(val);
  };
  const removePhoneField = (index: number) => {
    setFormPhones((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      const res = updated.length > 0 ? updated : [""];
      setFormPhone(res[0]);
      return res;
    });
  };

  const addEmailField = () => setFormEmails((prev) => [...prev, ""]);
  const updateEmailField = (index: number, val: string) =>
    setFormEmails((prev) => prev.map((e, i) => (i === index ? val : e)));
  const removeEmailField = (index: number) =>
    setFormEmails((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length > 0 ? updated : [""];
    });

  const addSocialField = () =>
    setFormSocialLinks((prev) => [...prev, { platform: "youtube", url: "" }]);
  const updateSocialPlatform = (index: number, platform: string) =>
    setFormSocialLinks((prev) => prev.map((s, i) => (i === index ? { ...s, platform } : s)));
  const updateSocialUrl = (index: number, url: string) =>
    setFormSocialLinks((prev) => prev.map((s, i) => (i === index ? { ...s, url } : s)));
  const removeSocialField = (index: number) =>
    setFormSocialLinks((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length > 0 ? updated : [{ platform: "instagram", url: "" }];
    });

  const toggleWeeklyHoliday = (day: string) => {
    setFormWeeklyHolidays((prev) => {
      const exists = prev.includes(day);
      const next = exists ? prev.filter((d) => d !== day) : [...prev, day];
      setFormWeeklyHoliday(next.length > 0 ? next.join(", ") : "None");
      // Sync daywise hours closed state
      setFormDaywiseHours((currentHours) => {
        const copy = { ...currentHours };
        if (copy[day]) {
          copy[day] = { ...copy[day], is_closed: !exists };
        }
        return copy;
      });
      return next;
    });
  };

  const clearWeeklyHolidays = () => {
    setFormWeeklyHolidays([]);
    setFormDaywiseHours((currentHours) => {
      const copy = { ...currentHours };
      Object.keys(copy).forEach((day) => {
        copy[day] = { ...copy[day], is_closed: false };
      });
      return copy;
    });
  };

  const updateDaySchedule = (day: string, field: "open" | "close" | "is_closed", value: any) => {
    setFormDaywiseHours((prev) => {
      const updated = {
        ...prev,
        [day]: {
          ...(prev[day] || { open: "10:00 AM", close: "08:30 PM", is_closed: false }),
          [field]: value
        }
      };
      // Auto-sync weekly holidays if is_closed changed
      if (field === "is_closed") {
        setFormWeeklyHolidays((holidays) => {
          if (value && !holidays.includes(day)) return [...holidays, day];
          if (!value && holidays.includes(day)) return holidays.filter((d) => d !== day);
          return holidays;
        });
      }
      return updated;
    });
  };

  const applyStandardHoursToAllOpen = () => {
    const parts = formOpeningHours.split("-");
    const openTime = parts[0]?.trim() || "10:00 AM";
    const closeTime = parts[1]?.trim() || "08:30 PM";
    setFormDaywiseHours(() => {
      const updated: Record<string, DaySchedule> = {};
      DAYS_OF_WEEK.forEach((day) => {
        const isClosed = formWeeklyHolidays.includes(day);
        updated[day] = {
          open: openTime,
          close: closeTime,
          is_closed: isClosed
        };
      });
      return updated;
    });
    toast.success("Standard hours applied to all open days!");
  };

  const [formStatus, setFormStatus] = useState<"DRAFT" | "PUBLISHED" | "UNPUBLISHED">("DRAFT");
  const [formIsVerified, setFormIsVerified] = useState(false);

  // Private Admin Audit Fields
  const [formInfoSource, setFormInfoSource] = useState("");
  const [formStoreContact, setFormStoreContact] = useState("");
  const [formPhotoPermissions, setFormPhotoPermissions] = useState("");
  const [formInternalNotes, setFormInternalNotes] = useState("");

  // Media files
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);

  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingGallery, setExistingGallery] = useState<StoreGalleryItem[]>([]);

  // Offers in store
  const [existingOffers, setExistingOffers] = useState<StoreOfferItem[]>([]);
  const [newOfferTitle, setNewOfferTitle] = useState("");
  const [newOfferDesc, setNewOfferDesc] = useState("");
  const [newOfferStart, setNewOfferStart] = useState("");
  const [newOfferEnd, setNewOfferEnd] = useState("");
  const [newOfferTerms, setNewOfferTerms] = useState("");
  const [newOfferPoster, setNewOfferPoster] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─── Fetch All Stores ─── */
  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminStoreListings();
      setStores(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("Admin session expired. Please re-login with password 'Admin@496'.");
      } else {
        toast.error("Failed to load store listings");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const [cRes, rRes] = await Promise.all([
        getAdminStoreClaims(),
        getAdminStoreReports(),
      ]);
      setClaims(cRes.data);
      setReports(rRes.data);
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchStores();
    fetchRequests();
  }, []);

  /* ─── Unique Cities list for filter ─── */
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    stores.forEach((s) => {
      if (s.city) set.add(s.city.trim());
    });
    return Array.from(set).sort();
  }, [stores]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== "" ||
      selectedCategory !== "ALL" ||
      selectedCity !== "ALL" ||
      statusFilter !== "ALL" ||
      verifiedFilter
    );
  }, [searchQuery, selectedCategory, selectedCity, statusFilter, verifiedFilter]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedCity("ALL");
    setStatusFilter("ALL");
    setVerifiedFilter(false);
  };

  /* ─── Filtered Stores ─── */
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
      const matchesVerified = !verifiedFilter || s.is_verified;
      const matchesCategory =
        selectedCategory === "ALL" ||
        (s.categories && s.categories.some((c) => c.toLowerCase() === selectedCategory.toLowerCase()));
      const matchesCity =
        selectedCity === "ALL" ||
        (s.city && s.city.toLowerCase() === selectedCity.toLowerCase());

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        s.store_name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        (s.slug && s.slug.toLowerCase().includes(q));

      return matchesStatus && matchesVerified && matchesCategory && matchesCity && matchesSearch;
    });
  }, [stores, statusFilter, verifiedFilter, selectedCategory, selectedCity, searchQuery]);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    return {
      total: stores.length,
      published: stores.filter((s) => s.status === "PUBLISHED").length,
      drafts: stores.filter((s) => s.status === "DRAFT").length,
      verified: stores.filter((s) => s.is_verified).length,
    };
  }, [stores]);

  /* ─── Create Sample Demo Store (1-Click Test) ─── */
  const handleCreateDemoStore = async () => {
    setIsSubmitting(true);
    const fd = new FormData();
    const demoSlug = `tanishq-indiranagar-${Math.floor(100 + Math.random() * 900)}`;
    fd.append("storeName", "Tanishq Jewellers — Indiranagar Flagship");
    fd.append("slug", demoSlug);
    fd.append(
      "shortDescription",
      "India's most trusted luxury jewellery house featuring exquisite 22K Hallmarked Gold, Solitaire Diamonds, and Bridal Polki collections with lifetime exchange guarantee."
    );
    fd.append("categories", JSON.stringify(["Gold", "Diamond", "Bridal", "Polki"]));
    fd.append("address", "Plot No. 542, CMH Road, 1st Stage, Indiranagar");
    fd.append("city", "Bangalore");
    fd.append("state", "Karnataka");
    fd.append("pincode", "560038");
    fd.append("googleMapsLink", "https://maps.google.com/?q=Tanishq+Indiranagar+Bangalore");
    fd.append("phone", "+91 9845012345");
    fd.append("whatsapp", "+91 9845012345");
    fd.append("website", "https://www.tanishq.co.in");
    fd.append("socialLinks", JSON.stringify({ instagram: "https://instagram.com/tanishqjewellery", facebook: "https://facebook.com/tanishq" }));
    fd.append("openingHours", "10:30 AM - 08:30 PM");
    fd.append("weeklyHoliday", "None");
    fd.append("status", "PUBLISHED");
    fd.append("isVerified", "true");
    fd.append("infoSource", "Official Brand Partner Network");
    fd.append("storeContact", "Store Manager: Mr. Rajesh Sharma (+91 9845012345)");
    fd.append("photoPermissions", "Direct Brand Showroom Approval");
    fd.append("internalNotes", "Verified GSTIN and trade license. Flagship showroom verified on 14 Oct 2026.");
    fd.append("coverPhotoUrl", "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80");

    try {
      const res = await createAdminStoreListing(fd);
      toast.success("Demo store 'Tanishq Jewellers' created successfully!");
      setStores((prev) => [res.data, ...prev]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create demo store");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Open Create Modal ─── */
  const handleOpenCreate = () => {
    setEditingStore(null);
    setFormStoreName("");
    setFormSlug("");
    setFormDescription("");
    setFormCategories(["Gold", "Diamond"]);
    setFormAddress("");
    setFormCity("");
    setFormState("");
    setFormCountry("India");
    setFormPincode("");
    setFormMapsLink("");
    setFormPhone("");
    setFormPhones([""]);
    setFormEmails([""]);
    setFormWhatsapp("");
    setFormWebsite("");
    setFormSocialLinks([
      { platform: "instagram", url: "" },
      { platform: "facebook", url: "" }
    ]);
    setFormOpeningHours("10:00 AM - 08:30 PM");
    setFormWeeklyHolidays(["Sunday"]);
    setFormDaywiseHours(DEFAULT_DAYWISE_HOURS);
    setIsDaywiseCustom(false);
    setFormStatus("DRAFT");
    setFormIsVerified(false);
    setFormInfoSource("");
    setFormStoreContact("");
    setFormPhotoPermissions("");
    setFormInternalNotes("");
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(false);
    setCoverFile(null);
    setCoverPreview(null);
    setRemoveCover(false);
    setGalleryFiles([]);
    setExistingGallery([]);
    setExistingOffers([]);
    setIsFormOpen(true);
  };

  /* ─── Open Edit Modal ─── */
  const handleOpenEdit = async (store: StoreListing) => {
    setEditingStore(store);
    try {
      const res = await getAdminStoreById(store.id);
      const s = res.data;
      setFormStoreName(s.store_name || "");
      setFormSlug(s.slug || "");
      setFormDescription(s.short_description || "");
      setFormCategories(s.categories || []);
      setFormAddress(s.address || "");
      setFormCity(s.city || "");
      setFormState(s.state || "");
      setFormCountry(s.country || "India");
      setFormPincode(s.pincode || "");
      setFormMapsLink(s.google_maps_link || "");
      setFormPhone(s.phone || "");

      // Multiple phones
      if (s.phones && Array.isArray(s.phones) && s.phones.length > 0) {
        setFormPhones(s.phones);
      } else if (s.phone) {
        setFormPhones([s.phone]);
      } else {
        setFormPhones([""]);
      }

      // Multiple emails
      if (s.emails && Array.isArray(s.emails) && s.emails.length > 0) {
        setFormEmails(s.emails);
      } else if (s.email) {
        setFormEmails([s.email]);
      } else {
        setFormEmails([""]);
      }

      setFormWhatsapp(s.whatsapp || "");
      setFormWebsite(s.website || "");

      // Multiple social links
      if (s.social_links && typeof s.social_links === "object" && Object.keys(s.social_links).length > 0) {
        setFormSocialLinks(
          Object.entries(s.social_links).map(([k, v]) => ({
            platform: k,
            url: String(v || "")
          }))
        );
      } else {
        setFormSocialLinks([
          { platform: "instagram", url: "" },
          { platform: "facebook", url: "" }
        ]);
      }

      setFormOpeningHours(s.opening_hours || "10:00 AM - 08:30 PM");

      // Multiple weekly holidays
      if (s.weekly_holidays && Array.isArray(s.weekly_holidays) && s.weekly_holidays.length > 0) {
        setFormWeeklyHolidays(s.weekly_holidays);
        } else if (s.weekly_holiday && s.weekly_holiday !== "None") {
        const parsed = s.weekly_holiday.split(",").map((x) => x.trim()).filter(Boolean);
        setFormWeeklyHolidays(parsed);
        } else {
        setFormWeeklyHolidays([]);
        }

      // Daywise hours
      if (s.daywise_hours && typeof s.daywise_hours === "object" && Object.keys(s.daywise_hours).length > 0) {
        const merged: Record<string, DaySchedule> = { ...DEFAULT_DAYWISE_HOURS };
        DAYS_OF_WEEK.forEach((d) => {
          const custom = (s.daywise_hours as any)?.[d];
          if (custom) {
            merged[d] = {
              open: custom.open || DEFAULT_DAYWISE_HOURS[d]?.open || "10:00 AM",
              close: custom.close || DEFAULT_DAYWISE_HOURS[d]?.close || "08:30 PM",
              is_closed: Boolean(custom.is_closed),
            };
          }
        });
        setFormDaywiseHours(merged);
        setIsDaywiseCustom(true);
      } else {
        setFormDaywiseHours(DEFAULT_DAYWISE_HOURS);
        setIsDaywiseCustom(false);
      }
      setFormStatus((s.status as any) || "DRAFT");
      setFormIsVerified(s.is_verified);
      setFormInfoSource(s.info_source || "");
      setFormStoreContact(s.store_contact || "");
      setFormPhotoPermissions(s.photo_permissions || "");
      setFormInternalNotes(s.internal_notes || "");
      setLogoFile(null);
      setLogoPreview(s.logo_url || null);
      setRemoveLogo(false);
      setCoverFile(null);
      setCoverPreview(s.cover_photo_url || null);
      setRemoveCover(false);
      setGalleryFiles([]);
      setExistingGallery(s.gallery || []);
      setExistingOffers(s.offers || []);
      setIsFormOpen(true);
    } catch {
      toast.error("Failed to load store details");
    }
  };

  /* ─── Category Toggle ─── */
  const toggleCategory = (cat: string) => {
    setFormCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleAddCustomCategory = () => {
    if (customCategoryInput.trim() && !formCategories.includes(customCategoryInput.trim())) {
      setFormCategories((prev) => [...prev, customCategoryInput.trim()]);
      setCustomCategoryInput("");
    }
  };

  /* ─── Save Store (Create or Update) ─── */
  const handleSaveStore = async (targetStatus?: "DRAFT" | "PUBLISHED") => {
    if (!formStoreName.trim()) return toast.error("Store Name is required");
    if (!formAddress.trim()) return toast.error("Address is required");
    if (!formCity.trim()) return toast.error("City is required");
    if (!formState.trim()) return toast.error("State is required");
    if (!formPincode.trim()) return toast.error("PIN code is required");
    if (!formPhone.trim()) return toast.error("Business Phone is required");

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("storeName", formStoreName.trim());
    if (formSlug.trim()) fd.append("slug", formSlug.trim());
    fd.append("shortDescription", formDescription.trim());
    fd.append("categories", JSON.stringify(formCategories));
    fd.append("address", formAddress.trim());
    fd.append("city", formCity.trim());
    fd.append("state", formState.trim());
    fd.append("country", formCountry.trim() || "India");
    fd.append("pincode", formPincode.trim());
    if (formMapsLink.trim()) fd.append("googleMapsLink", formMapsLink.trim());

    // Clean multiple phones
    const validPhones = formPhones.map((p) => p.trim()).filter(Boolean);
    const primaryPhone = validPhones[0] || formPhone.trim();
    fd.append("phone", primaryPhone);
    fd.append("phones", JSON.stringify(validPhones));

    // Clean multiple emails
    const validEmails = formEmails.map((e) => e.trim()).filter(Boolean);
    if (validEmails.length > 0) {
      fd.append("email", validEmails[0]);
      fd.append("emails", JSON.stringify(validEmails));
    }

    if (formWhatsapp.trim()) fd.append("whatsapp", formWhatsapp.trim());
    if (formWebsite.trim()) fd.append("website", formWebsite.trim());

    // Multiple social links
    const socialMap: Record<string, string> = {};
    formSocialLinks.forEach((item) => {
      const url = item.url.trim();
      if (url && item.platform) {
        socialMap[item.platform] = url;
      }
    });
    fd.append("socialLinks", JSON.stringify(socialMap));

    // Working hours & daywise schedule
    if (formOpeningHours.trim()) fd.append("openingHours", formOpeningHours.trim());
    if (isDaywiseCustom) {
      fd.append("daywiseHours", JSON.stringify(formDaywiseHours));
    }

    // Weekly holidays (multiple days)
    const holidays = formWeeklyHolidays.filter(Boolean);
    fd.append("weeklyHolidays", JSON.stringify(holidays));
    fd.append("weeklyHoliday", holidays.length > 0 ? holidays.join(", ") : "None");

    const finalStatus = targetStatus || formStatus;
    fd.append("status", finalStatus);
    fd.append("isVerified", formIsVerified ? "true" : "false");

    // Private admin audit
    if (formInfoSource.trim()) fd.append("infoSource", formInfoSource.trim());
    if (formStoreContact.trim()) fd.append("storeContact", formStoreContact.trim());
    if (formPhotoPermissions.trim()) fd.append("photoPermissions", formPhotoPermissions.trim());
    if (formInternalNotes.trim()) fd.append("internalNotes", formInternalNotes.trim());

    if (logoFile) fd.append("logo", logoFile);
    if (coverFile) fd.append("coverPhoto", coverFile);
    if (removeLogo) fd.append("removeLogo", "true");
    if (removeCover) fd.append("removeCover", "true");

    galleryFiles.forEach((file) => {
      fd.append("gallery", file);
    });

    try {
      if (editingStore) {
        const res = await updateAdminStoreListing(editingStore.id, fd);
        toast.success(finalStatus === "PUBLISHED" ? "Store published successfully!" : "Store listing updated!");
        setStores((prev) => prev.map((s) => (s.id === editingStore.id ? res.data : s)));
      } else {
        const res = await createAdminStoreListing(fd);
        toast.success(finalStatus === "PUBLISHED" ? "Store published successfully!" : "Draft store listing saved!");
        setStores((prev) => [res.data, ...prev]);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save store listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Delete Store ─── */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAdminStoreListing(deleteTarget.id);
      toast.success("Store listing removed");
      setStores((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete store listing");
    } finally {
      setIsDeleting(false);
    }
  };

  /* ─── Quick Toggle Publish ─── */
  const handleTogglePublish = async (store: StoreListing) => {
    const nextStatus = store.status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";
    try {
      await toggleAdminStorePublish(store.id, nextStatus);
      toast.success(nextStatus === "PUBLISHED" ? `"${store.store_name}" is now live!` : `"${store.store_name}" unpublished`);
      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? { ...s, status: nextStatus } : s))
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  /* ─── Quick Toggle Verification ─── */
  const handleToggleVerification = async (store: StoreListing) => {
    const nextVerified = !store.is_verified;
    try {
      await toggleAdminStoreVerification(store.id, nextVerified);
      toast.success(nextVerified ? `Verified Jeweller badge assigned!` : `Verification badge removed`);
      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? { ...s, is_verified: nextVerified } : s))
      );
    } catch {
      toast.error("Failed to update verification");
    }
  };

  /* ─── Remove Gallery Image ─── */
  const handleDeleteGalleryImage = async (imageId: number) => {
    if (!editingStore) return;
    try {
      await deleteAdminStoreGalleryImage(editingStore.id, imageId);
      toast.success("Image removed from gallery");
      setExistingGallery((prev) => prev.filter((g) => g.id !== imageId));
    } catch {
      toast.error("Failed to delete image");
    }
  };

  /* ─── Add Store Offer ─── */
  const handleAddOffer = async () => {
    if (!editingStore) return;
    if (!newOfferTitle.trim()) return toast.error("Offer title is required");

    const fd = new FormData();
    fd.append("title", newOfferTitle.trim());
    if (newOfferDesc.trim()) fd.append("description", newOfferDesc.trim());
    if (newOfferStart) fd.append("startDate", newOfferStart);
    if (newOfferEnd) fd.append("endDate", newOfferEnd);
    if (newOfferTerms.trim()) fd.append("terms", newOfferTerms.trim());
    fd.append("isActive", "true");
    if (newOfferPoster) fd.append("poster", newOfferPoster);

    try {
      const res = await addAdminStoreOffer(editingStore.id, fd);
      toast.success("Offer attached to store!");
      setExistingOffers((prev) => [res.data, ...prev]);
      setNewOfferTitle("");
      setNewOfferDesc("");
      setNewOfferStart("");
      setNewOfferEnd("");
      setNewOfferTerms("");
      setNewOfferPoster(null);
    } catch {
      toast.error("Failed to add offer");
    }
  };

  /* ─── Delete Store Offer ─── */
  const handleDeleteOffer = async (offerId: number) => {
    try {
      await deleteAdminStoreOffer(offerId);
      toast.success("Offer removed");
      setExistingOffers((prev) => prev.filter((o) => o.id !== offerId));
    } catch {
      toast.error("Failed to delete offer");
    }
  };

  /* ─── Submit Claim from Customer Preview ─── */
  const handleSubmitCustomerClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewStore) return;
    if (!claimName.trim() || !claimPhone.trim() || !claimEmail.trim()) {
      return toast.error("Name, Phone, and Email are required");
    }

    setIsSubmittingClaim(true);
    const fd = new FormData();
    fd.append("claimantName", claimName.trim());
    fd.append("claimantPhone", claimPhone.trim());
    fd.append("claimantEmail", claimEmail.trim());
    fd.append("proofType", claimProofType);
    if (claimNotes.trim()) fd.append("notes", claimNotes.trim());
    if (claimProofFile) fd.append("proofDocument", claimProofFile);

    try {
      await submitStoreClaim(previewStore.id, fd);
      toast.success("Claim submitted successfully! Admin will review your verification details.");
      setIsClaimModalOpen(false);
      setClaimName("");
      setClaimPhone("");
      setClaimEmail("");
      setClaimNotes("");
      setClaimProofFile(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit claim request");
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  /* ─── Submit Correction Report from Customer Preview ─── */
  const handleSubmitCustomerReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewStore) return;
    if (!reportDesc.trim()) {
      return toast.error("Please describe the incorrect details");
    }

    setIsSubmittingReport(true);
    try {
      await submitStoreReport(previewStore.id, {
        reportType,
        description: reportDesc.trim(),
        reportedByEmail: reportEmail.trim() || undefined,
      });
      toast.success("Report submitted. Thank you for helping keep store details accurate!");
      setIsReportModalOpen(false);
      setReportDesc("");
      setReportEmail("");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit correction report");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="sl-container">
      {/* ── Header ── */}
      <div className="sl-header">
        <div className="sl-title-group">
          <div className="sl-title-row">
            <h1 className="sl-main-title">Store Listings</h1>
            <span className="sl-badge-pill">Admin-Managed</span>
          </div>
          <p className="sl-subtitle">
            Create, verify, and manage jewellery store profiles with contact CTAs, galleries, and active offers.
          </p>
        </div>

        <div className="sl-actions-row">
          <button
            onClick={() => setIsRequestsModalOpen(true)}
            className="sl-btn-secondary"
            title="Review ownership claims and correction reports"
          >
            <ShieldAlert size={15} />
            <span>Claims & Reports</span>
            {(claims.length > 0 || reports.length > 0) && (
              <span className="sl-badge-count">
                {claims.length + reports.length}
              </span>
            )}
          </button>

          <button
            onClick={fetchStores}
            className="sl-btn-secondary"
            title="Reload latest listings"
          >
            <RefreshCw size={14} className={isLoading ? "sl-spinner" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="sl-btn-primary"
            title="Create a new store profile directly"
            style={{ color: "#ffffff" }}
          >
            <Plus size={16} style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: 700 }}>Add Store Listing</span>
          </button>
        </div>
      </div>

      {/* ── Stats Summary Bar ── */}
      <div className="sl-stats-grid">
        <div className="sl-stat-card plum">
          <div className="sl-stat-info">
            <span className="sl-stat-label">Total Listings</span>
            <span className="sl-stat-value">{stats.total}</span>
            <span className="sl-stat-sub">Database registered</span>
          </div>
          <div className="sl-stat-icon-wrap plum">
            <Building2 size={22} />
          </div>
        </div>

        <div className="sl-stat-card emerald">
          <div className="sl-stat-info">
            <span className="sl-stat-label">Live & Published</span>
            <span className="sl-stat-value" style={{ color: "#059669" }}>{stats.published}</span>
            <span className="sl-stat-sub" style={{ color: "#059669" }}>Publicly discoverable</span>
          </div>
          <div className="sl-stat-icon-wrap emerald">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="sl-stat-card amber">
          <div className="sl-stat-info">
            <span className="sl-stat-label">Drafts (Pending)</span>
            <span className="sl-stat-value" style={{ color: "#d97706" }}>{stats.drafts}</span>
            <span className="sl-stat-sub" style={{ color: "#d97706" }}>Incomplete details</span>
          </div>
          <div className="sl-stat-icon-wrap amber">
            <Clock size={22} />
          </div>
        </div>

        <div className="sl-stat-card gold">
          <div className="sl-stat-info">
            <span className="sl-stat-label">Verified Jewellers</span>
            <span className="sl-stat-value" style={{ color: "#b4860b" }}>{stats.verified}</span>
            <span className="sl-stat-sub" style={{ color: "#b4860b" }}>Trust badge granted</span>
          </div>
          <div className="sl-stat-icon-wrap gold">
            <ShieldCheck size={22} />
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="sl-filter-card">
        <div className="sl-search-box">
          <Search size={16} className="sl-search-icon" />
          <input
            type="text"
            placeholder="Search stores by name, city, state, phone, or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sl-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="sl-search-clear-btn"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="sl-filter-actions">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="sl-toolbar-select"
            title="Filter by jewellery category"
          >
            <option value="ALL">All Categories</option>
            {PRESET_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* City Filter */}
          {availableCities.length > 0 && (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="sl-toolbar-select"
              title="Filter by city"
            >
              <option value="ALL">All Cities</option>
              {availableCities.map((ct) => (
                <option key={ct} value={ct}>{ct}</option>
              ))}
            </select>
          )}

          {/* Status Pills */}
          <div className="sl-status-pills">
            {(["ALL", "PUBLISHED", "DRAFT", "UNPUBLISHED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`sl-pill-btn ${statusFilter === st ? "active" : ""}`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Verified Only Toggle */}
          <button
            onClick={() => setVerifiedFilter(!verifiedFilter)}
            className={`sl-verified-toggle-btn ${verifiedFilter ? "active" : ""}`}
            title="Show only stores with Verified Jeweller status"
          >
            <ShieldCheck size={14} style={{ color: verifiedFilter ? "#b4860b" : "#9c828e" }} />
            <span>Verified Only</span>
          </button>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="sl-clear-filters-btn"
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Table & Content Container ── */}
      <div className="sl-table-container">
        {isLoading ? (
          <div className="sl-loading-box">
            <Loader2 size={32} className="sl-spinner" />
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Loading jewellery store listings…</span>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="sl-empty-state">
            <div className="sl-empty-icon-circle">
              <Building2 size={36} />
            </div>
            <h3 className="sl-empty-title">No store listings found</h3>
            <p className="sl-empty-desc">
              {hasActiveFilters
                ? "No stores match your current filters. Try resetting your search filters or clearing options."
                : "Get started by adding your first admin-managed jewellery store listing, or generate a sample demo store to test."}
            </p>
            <div className="sl-empty-actions">
              {hasActiveFilters ? (
                <button
                  onClick={handleResetFilters}
                  className="sl-btn-secondary"
                >
                  <RotateCcw size={14} /> Clear All Filters
                </button>
              ) : (
                <>
                  <button
                    onClick={handleOpenCreate}
                    className="sl-btn-primary"
                    style={{ color: "#ffffff" }}
                  >
                    <Plus size={16} style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff", fontWeight: 700 }}>Add Store Listing</span>
                  </button>
                  <button
                    onClick={handleCreateDemoStore}
                    disabled={isSubmitting}
                    className="sl-btn-demo"
                  >
                    <Sparkles size={14} style={{ color: "#8c6800" }} />
                    <span style={{ color: "#8c6800", fontWeight: 700 }}>+ Create Demo Store</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="sl-table-scroll">
            <table className="sl-table">
              <thead>
                <tr>
                  <th style={{ minWidth: "190px" }}>Store Identity</th>
                  <th style={{ minWidth: "140px" }}>Location</th>
                  <th style={{ minWidth: "120px" }}>Categories</th>
                  <th style={{ minWidth: "115px" }}>Verification</th>
                  <th style={{ minWidth: "95px" }}>Status</th>
                  <th style={{ minWidth: "85px" }}>Last Updated</th>
                  <th style={{ minWidth: "125px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.map((store) => (
                  <tr key={store.id}>
                    {/* Store Identity */}
                    <td>
                      <div className="sl-store-cell">
                        <div
                          className="sl-store-avatar"
                          onClick={() => setPreviewStore(store)}
                          style={{ cursor: "pointer" }}
                          title="Click to preview store profile"
                        >
                          {store.logo_url ? (
                            <img src={store.logo_url} alt={store.store_name} />
                          ) : store.cover_photo_url ? (
                            <img src={store.cover_photo_url} alt={store.store_name} />
                          ) : (
                            <Building2 size={22} style={{ color: "#b8849a" }} />
                          )}
                        </div>
                        <div className="sl-store-details">
                          <div className="sl-store-name-row">
                            <span
                              className="sl-store-name"
                              onClick={() => setPreviewStore(store)}
                              title="Click to preview customer profile"
                            >
                              {store.store_name}
                            </span>
                            {store.is_verified && (
                              <span title="Verified Jeweller" className="sl-verified-icon">
                                <ShieldCheck size={15} />
                              </span>
                            )}
                          </div>
                          <span className="sl-store-slug">/{store.slug}</span>
                          {/* Store Quick Contact Row */}
                          <div className="sl-store-contact-row">
                            {store.phone && (
                              <a
                                href={`tel:${store.phone}`}
                                className="sl-phone-chip"
                                title={`Call: ${store.phone}`}
                              >
                                <Phone size={11} className="sl-phone-icon" />
                                <span>{store.phone}</span>
                              </a>
                            )}
                            <div className="sl-quick-icons-group">
                              {store.whatsapp && (
                                <a
                                  href={`https://wa.me/${store.whatsapp.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="sl-quick-icon-btn whatsapp"
                                  title={`WhatsApp: ${store.whatsapp}`}
                                >
                                  <WhatsAppIcon size={13} />
                                </a>
                              )}
                              {store.website && (
                                <a
                                  href={store.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="sl-quick-icon-btn website"
                                  title={`Visit Website: ${store.website}`}
                                >
                                  <Globe size={13} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td>
                      <div style={{ fontWeight: 700, color: "#2d161d", fontSize: "13px" }}>
                        {store.city}, {store.state}
                      </div>
                      <div style={{ fontSize: "11px", color: "#8a7b81", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {store.address}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                        <span style={{ fontSize: "10px", backgroundColor: "#f3f4f6", color: "#4b5563", padding: "1px 5px", borderRadius: "4px" }}>
                          PIN: {store.pincode}
                        </span>
                        {store.google_maps_link && (
                          <a
                            href={store.google_maps_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "11px", color: "#dc2626", display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: 600, textDecoration: "none" }}
                            title="View on Google Maps"
                          >
                            <MapPin size={11} /> Directions
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Categories */}
                    <td>
                      <div className="sl-cat-badge-wrap">
                        {store.categories?.slice(0, 3).map((c, idx) => (
                          <span key={idx} className="sl-cat-badge">
                            {c}
                          </span>
                        ))}
                        {(store.categories?.length || 0) > 3 && (
                          <span className="sl-cat-more" title={store.categories?.slice(3).join(", ")}>
                            +{(store.categories?.length || 0) - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Verification Toggle */}
                    <td>
                      <button
                        onClick={() => handleToggleVerification(store)}
                        className={`sl-badge-toggle ${store.is_verified ? "verified" : "unverified"}`}
                        title="Click to toggle Verified Jeweller status"
                      >
                        <ShieldCheck size={13} style={{ color: store.is_verified ? "#b4860b" : "#9ca3af" }} />
                        <span>{store.is_verified ? "Verified Jeweller" : "Unverified"}</span>
                      </button>
                    </td>

                    {/* Status Toggle */}
                    <td>
                      <button
                        onClick={() => handleTogglePublish(store)}
                        className={`sl-badge-toggle ${
                          store.status === "PUBLISHED" ? "published" : store.status === "DRAFT" ? "draft" : "unpublished"
                        }`}
                        title="Click to toggle status between Published / Unpublished"
                      >
                        <span className={`sl-status-dot ${
                          store.status === "PUBLISHED" ? "green" : store.status === "DRAFT" ? "amber" : "gray"
                        }`} />
                        <span>{store.status}</span>
                      </button>
                    </td>

                    {/* Updated At */}
                    <td style={{ fontSize: "11.5px", color: "#8a7b81", whiteSpace: "nowrap" }}>
                      {store.updated_at ? formatDateDMY(store.updated_at) : "-"}
                    </td>

                    {/* Row Actions */}
                    <td>
                      <div className="sl-row-actions">
                        <button
                          onClick={() => setPreviewStore(store)}
                          className="sl-icon-btn"
                          title="Preview Customer Store Profile Modal"
                        >
                          <Eye size={15} />
                        </button>

                        <a
                          href={getUserPanelStoreUrl(store.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="sl-icon-btn"
                          title={`Open Live Store Page on User Panel (${getUserPanelStoreUrl(store.slug)})`}
                          style={{ color: "#7b1a4a", textDecoration: "none" }}
                        >
                          <ExternalLink size={15} />
                        </a>

                        <button
                          onClick={() => handleOpenEdit(store)}
                          className="sl-icon-btn"
                          title="Edit Store Listing"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() => setDeleteTarget(store)}
                          className="sl-icon-btn delete"
                          title="Delete Store Listing"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: Create / Edit Store Listing
          ═══════════════════════════════════════════════════════════ */}
      {isFormOpen && (
        <div className="sl-modal-overlay">
          <div className="sl-modal-card">
            {/* Header */}
            <div className="sl-modal-header">
              <div className="sl-modal-title-row">
                <Building2 size={20} style={{ color: "#fef08a" }} />
                <h3 className="sl-modal-title">
                  {editingStore ? `Edit Store: ${editingStore.store_name}` : "Create Admin-Managed Store Listing"}
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="sl-modal-close-btn">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="sl-modal-body">
              {/* SECTION 1: Identity & Categorization */}
              <div className="sl-form-section">
                <div className="sl-section-heading">
                  <span className="sl-section-title">
                    <Sparkles size={16} style={{ color: "#d4af37" }} />
                    1. Store Identity & Categorization
                  </span>
                </div>

                <div className="sl-grid-2">
                  <div className="sl-field">
                    <label className="sl-label">
                      Store Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tanishq Jewellers"
                      value={formStoreName}
                      onChange={(e) => {
                        setFormStoreName(e.target.value);
                        if (!editingStore && !formSlug) {
                          const s = e.target.value.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
                          setFormSlug(s);
                        }
                      }}
                      className="sl-input"
                    />
                  </div>

                  <div className="sl-field">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                      <label className="sl-label">
                        Store URL Handle (Slug) <span className="req">*</span>
                      </label>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#6b5860", backgroundColor: "#fbf2f6", padding: "2px 8px", borderRadius: "6px", border: "1px solid #ebdbe2" }}>
                        🔗 /store/{formSlug || "your-store-handle"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <div style={{ display: "flex", flex: 1, alignItems: "center", border: "1px solid #dfcdd6", borderRadius: "10px", backgroundColor: "#ffffff", overflow: "hidden" }}>
                        <span style={{ padding: "0 10px", fontSize: "12px", color: "#8c7882", backgroundColor: "#faf5f8", borderRight: "1px solid #ebdbe2", height: "100%", display: "flex", alignItems: "center", userSelect: "none", fontWeight: 600 }}>
                          store/
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. tanishq-indiranagar"
                          value={formSlug}
                          onChange={(e) => setFormSlug(e.target.value)}
                          className="sl-input"
                          style={{ border: "none", borderRadius: 0, padding: "10px 12px" }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (formStoreName) {
                            const s = formStoreName.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
                            setFormSlug(s);
                          }
                        }}
                        className="sl-btn-secondary"
                        style={{ padding: "8px 12px", fontSize: "11.5px", height: "40px" }}
                        title="Auto-regenerate slug from Store Name"
                      >
                        🪄 Auto
                      </button>
                    </div>
                    <span style={{ fontSize: "11px", color: "#8c7882", marginTop: "2px" }}>
                      Public web address for this store listing. Auto-filled as you type the name, or edit manually.
                    </span>
                  </div>
                </div>

                <div className="sl-field">
                  <label className="sl-label">Short Description</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description about the jewellery house, heritage, collections, hallmark purity..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="sl-textarea"
                  />
                </div>

                <div className="sl-field">
                  <label className="sl-label">Jewellery Categories</label>
                  <div className="sl-cat-select-wrap">
                    {PRESET_CATEGORIES.map((cat) => {
                      const selected = formCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`sl-cat-select-pill ${selected ? "selected" : ""}`}
                          style={{
                            backgroundColor: selected ? "#4C0F2D" : "#ffffff",
                            borderColor: selected ? "#4C0F2D" : "#dfcdd6",
                            color: selected ? "#ffffff" : "#4a323d",
                            boxShadow: selected ? "0 3px 10px rgba(76, 15, 45, 0.3)" : "none",
                          }}
                        >
                          {selected && <Check size={13} style={{ color: "#fef08a" }} />}
                          <span style={{ color: selected ? "#ffffff" : "#4a323d", fontWeight: selected ? 700 : 500 }}>
                            {cat}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", gap: "8px", maxWidth: "340px" }}>
                    <input
                      type="text"
                      placeholder="Add custom category..."
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomCategory();
                        }
                      }}
                      className="sl-input"
                      style={{ height: "36px" }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCategory}
                      className="sl-btn-secondary"
                      style={{ padding: "6px 14px", height: "36px" }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Branding & Media */}
              <div className="sl-form-section">
                <div className="sl-section-heading">
                  <span className="sl-section-title">
                    <Camera size={16} style={{ color: "#4C0F2D" }} />
                    2. Store Branding & Photos
                  </span>
                </div>

                <div className="sl-grid-2">
                  <DropZone
                    id="form-logo"
                    preview={logoPreview}
                    onFile={(f) => { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); setRemoveLogo(false); }}
                    onRemove={() => { setLogoFile(null); setLogoPreview(null); setRemoveLogo(true); }}
                    label="Store Logo"
                    hint="Square PNG/JPG icon"
                  />

                  <DropZone
                    id="form-cover"
                    preview={coverPreview}
                    onFile={(f) => { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); setRemoveCover(false); }}
                    onRemove={() => { setCoverFile(null); setCoverPreview(null); setRemoveCover(true); }}
                    label="Cover Banner Photo"
                    hint="Landscape 16:9 showroom photo"
                  />
                </div>

                {/* Photo Gallery */}
                <div className="sl-field">
                  <label className="sl-label">
                    Store & Collection Photo Gallery <span className="opt">(multi-image showroom photos)</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    id="form-gallery"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files) {
                        setGalleryFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
                      }
                    }}
                  />
                  <label
                    htmlFor="form-gallery"
                    className="sl-dropzone"
                    style={{ minHeight: "80px", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#4C0F2D", fontWeight: 700, fontSize: "13px" }}>
                      <ImagePlus size={18} />
                      <span>Upload Store & Collection Gallery Photos</span>
                    </div>
                  </label>

                  {/* Existing gallery images */}
                  {existingGallery.length > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#6b5860" }}>
                        Existing Gallery ({existingGallery.length}):
                      </span>
                      <div className="sl-gallery-grid">
                        {existingGallery.map((g) => (
                          <div key={g.id} className="sl-gallery-thumb">
                            <img src={g.image_url} alt="Gallery" />
                            <button
                              type="button"
                              onClick={() => handleDeleteGalleryImage(g.id)}
                              className="sl-gallery-delete-btn"
                              title="Delete photo"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Queued new gallery files */}
                  {galleryFiles.length > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669" }}>
                        New Photos Queued to Upload ({galleryFiles.length}):
                      </span>
                      <div className="sl-gallery-grid">
                        {galleryFiles.map((f, i) => (
                          <div key={i} className="sl-gallery-thumb" style={{ borderColor: "#10b981" }}>
                            <img src={URL.createObjectURL(f)} alt={f.name} />
                            <button
                              type="button"
                              onClick={() => setGalleryFiles((prev) => prev.filter((_, idx) => idx !== i))}
                              className="sl-gallery-delete-btn"
                              style={{ opacity: 1 }}
                              title="Remove"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: Address, Location & Google Maps Link */}
              <div className="sl-form-section">
                <div className="sl-section-heading">
                  <span className="sl-section-title">
                    <MapPin size={16} style={{ color: "#4C0F2D" }} />
                    3. Address, Location & Google Maps Link
                  </span>
                </div>

                <div className="sl-field">
                  <label className="sl-label">
                    Full Street Address <span className="req">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Shop/Showroom No., Commercial Complex, Main Road..."
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="sl-textarea"
                  />
                </div>

                <div className="sl-grid-2">
                  <div className="sl-field">
                    <label className="sl-label">
                      City <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Coimbatore"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="sl-input"
                    />
                  </div>

                  <div className="sl-field">
                    <label className="sl-label">
                      State <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tamil Nadu"
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      className="sl-input"
                    />
                  </div>

                  <div className="sl-field">
                    <label className="sl-label">Country</label>
                    <input
                      type="text"
                      placeholder="e.g. India"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      className="sl-input"
                    />
                  </div>

                  <div className="sl-field">
                    <label className="sl-label">
                      PIN Code <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 641001"
                      value={formPincode}
                      onChange={(e) => setFormPincode(e.target.value)}
                      className="sl-input"
                    />
                  </div>
                </div>

                <div className="sl-field">
                  <label className="sl-label">
                    Google Maps Link <span className="opt">(powers "Get Directions" customer CTA)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/?q=..."
                    value={formMapsLink}
                    onChange={(e) => setFormMapsLink(e.target.value)}
                    className="sl-input"
                  />
                </div>
              </div>

              {/* SECTION 4: Contact (Multiple Phones, Emails, WhatsApp, Website & Multiple Social Handles) */}
              <div className="sl-form-section">
                <div className="sl-section-heading">
                  <span className="sl-section-title">
                    <Phone size={16} style={{ color: "#4C0F2D" }} />
                    4. Phone Numbers, Email Addresses, Website & Social Handles
                  </span>
                </div>

                {/* Multiple Phone Numbers */}
                <div className="sl-field">
                  <label className="sl-label">
                    Phone Numbers <span className="req">*</span> <span className="opt">(First number is primary call CTA)</span>
                  </label>
                  <div className="sl-dynamic-list">
                    {formPhones.map((ph, idx) => (
                      <div key={idx} className="sl-dynamic-row">
                        <input
                          type="text"
                          placeholder={idx === 0 ? "Primary Business Phone (e.g. +91 9876543210) *" : `Alternative Phone #${idx + 1}`}
                          value={ph}
                          onChange={(e) => updatePhoneField(idx, e.target.value)}
                          className="sl-input"
                        />
                        {formPhones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhoneField(idx)}
                            className="sl-btn-icon-del"
                            title="Remove this phone number"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addPhoneField}
                      className="sl-btn-add-item"
                    >
                      <Plus size={13} /> + Add Another Phone Number
                    </button>
                  </div>
                </div>

                {/* Multiple Emails */}
                <div className="sl-field">
                  <label className="sl-label">
                    Email Addresses <span className="opt">(Multiple showroom emails supported)</span>
                  </label>
                  <div className="sl-dynamic-list">
                    {formEmails.map((em, idx) => (
                      <div key={idx} className="sl-dynamic-row">
                        <input
                          type="email"
                          placeholder={idx === 0 ? "Primary Email (e.g. contact@jewellers.com)" : `Secondary Email #${idx + 1}`}
                          value={em}
                          onChange={(e) => updateEmailField(idx, e.target.value)}
                          className="sl-input"
                        />
                        {formEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmailField(idx)}
                            className="sl-btn-icon-del"
                            title="Remove this email address"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addEmailField}
                      className="sl-btn-add-item"
                    >
                      <Plus size={13} /> + Add Another Email Address
                    </button>
                  </div>
                </div>

                <div className="sl-grid-2">
                  <div className="sl-field">
                    <label className="sl-label">
                      WhatsApp Number <span className="opt">(powers WhatsApp CTA, include country code)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={formWhatsapp}
                      onChange={(e) => setFormWhatsapp(e.target.value)}
                      className="sl-input"
                    />
                  </div>

                  <div className="sl-field">
                    <label className="sl-label">
                      Website URL <span className="opt">(powers "Visit Website" CTA)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://jeweller.com"
                      value={formWebsite}
                      onChange={(e) => setFormWebsite(e.target.value)}
                      className="sl-input"
                    />
                  </div>
                </div>

                {/* Multiple Social Network Profiles */}
                <div className="sl-field" style={{ marginTop: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <label className="sl-label">
                      Social Network Profiles <span className="opt">(Instagram, Facebook, YouTube, X, Pinterest, LinkedIn, etc.)</span>
                    </label>
                    <span style={{ fontSize: "11px", color: "#8a7b81" }}>Add as many platforms as needed</span>
                  </div>
                  <div className="sl-dynamic-list">
                    {formSocialLinks.map((item, idx) => {
                      const platformInfo = SOCIAL_PLATFORMS.find((p) => p.id === item.platform) || {
                        placeholder: "https://..."
                      };
                      return (
                        <div key={idx} className="sl-social-row">
                          <select
                            value={item.platform}
                            onChange={(e) => updateSocialPlatform(idx, e.target.value)}
                            className="sl-select"
                          >
                            {SOCIAL_PLATFORMS.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="url"
                            placeholder={platformInfo.placeholder}
                            value={item.url}
                            onChange={(e) => updateSocialUrl(idx, e.target.value)}
                            className="sl-input"
                          />
                          <button
                            type="button"
                            onClick={() => removeSocialField(idx)}
                            className="sl-btn-icon-del"
                            title="Remove this social link"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={addSocialField}
                      className="sl-btn-add-item"
                    >
                      <Plus size={13} /> + Add Social Network Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 5: Operating Hours & Multi-Day Weekly Holidays */}
              <div className="sl-form-section">
                <div className="sl-section-heading">
                  <span className="sl-section-title">
                    <Clock size={16} style={{ color: "#4C0F2D" }} />
                    5. Operating Hours & Weekly Off
                  </span>
                </div>

                {/* Multi-Day Weekly Off Pills */}
                <div className="sl-field">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <label className="sl-label">
                      Weekly Off Days <span className="opt">(Select one or multiple days store is closed)</span>
                    </label>
                    {formWeeklyHolidays.length > 0 && (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#4C0F2D" }}>
                        Selected: {formWeeklyHolidays.join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="sl-pills-row">
                    <button
                      type="button"
                      onClick={clearWeeklyHolidays}
                      className={`sl-day-pill all-open ${formWeeklyHolidays.length === 0 ? "active" : ""}`}
                    >
                      {formWeeklyHolidays.length === 0 ? <Check size={12} /> : null} Open 7 Days (No Weekly Off)
                    </button>
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => {
                      const isActive = formWeeklyHolidays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleWeeklyHoliday(day)}
                          className={`sl-day-pill ${isActive ? "active" : ""}`}
                        >
                          {isActive ? <Check size={12} /> : null} {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Standard Operating Hours */}
                <div className="sl-grid-2" style={{ alignItems: "flex-end" }}>
                  <div className="sl-field">
                    <label className="sl-label">Standard Operating Hours</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:00 AM - 08:30 PM"
                      value={formOpeningHours}
                      onChange={(e) => setFormOpeningHours(e.target.value)}
                      className="sl-input"
                    />
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setIsDaywiseCustom(!isDaywiseCustom)}
                      className="sl-btn-secondary"
                      style={{ flex: 1, padding: "10px 14px", fontSize: "12px" }}
                    >
                      <Sliders size={14} />
                      <span>{isDaywiseCustom ? "Hide Day-wise Hours" : "Customize Day-wise Hours"}</span>
                      {isDaywiseCustom ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Daywise Operating Hours Grid */}
                {isDaywiseCustom && (
                  <div className="sl-daywise-box">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ebdbe2", paddingBottom: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#4C0F2D" }}>
                        Day-by-Day Working Hours Breakdown:
                      </span>
                      <button
                        type="button"
                        onClick={applyStandardHoursToAllOpen}
                        className="sl-btn-add-item"
                        style={{ margin: 0, padding: "4px 8px", fontSize: "11px" }}
                      >
                        ⚡ Apply Standard Hours to Open Days
                      </button>
                    </div>

                    {DAYS_OF_WEEK.map((day) => {
                      const schedule = formDaywiseHours[day] || {
                        open: "10:00 AM",
                        close: "08:30 PM",
                        is_closed: formWeeklyHolidays.includes(day)
                      };
                      return (
                        <div key={day} className="sl-day-row">
                          <span className="sl-day-label">{day}</span>
                          <button
                            type="button"
                            onClick={() => updateDaySchedule(day, "is_closed", !schedule.is_closed)}
                            className={`sl-day-toggle ${schedule.is_closed ? "closed" : "open"}`}
                          >
                            {schedule.is_closed ? "Closed (Off)" : "Open"}
                          </button>
                          {!schedule.is_closed ? (
                            <>
                              <input
                                type="text"
                                placeholder="Open: 10:00 AM"
                                value={schedule.open}
                                onChange={(e) => updateDaySchedule(day, "open", e.target.value)}
                                className="sl-input"
                                style={{ padding: "6px 10px", fontSize: "12px" }}
                              />
                              <input
                                type="text"
                                placeholder="Close: 08:30 PM"
                                value={schedule.close}
                                onChange={(e) => updateDaySchedule(day, "close", e.target.value)}
                                className="sl-input"
                                style={{ padding: "6px 10px", fontSize: "12px" }}
                              />
                            </>
                          ) : (
                            <span style={{ gridColumn: "span 2", fontSize: "12px", color: "#991b1b", fontStyle: "italic" }}>
                              Showroom closed on this day (Weekly off)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 6: Offers with Validity Dates & Terms (Auto-Expiry Supported) */}
              {editingStore && (
                <div className="sl-form-section">
                  <div className="sl-section-heading">
                    <span className="sl-section-title">
                      <Tag size={16} style={{ color: "#4C0F2D" }} />
                      6. Store Offers & Discounts (Auto-Expiry Supported)
                    </span>
                    <span style={{ fontSize: "11px", color: "#8a7b81" }}>
                      Expired offers auto-hide from customer view
                    </span>
                  </div>

                  {/* Add Offer Box */}
                  <div style={{ backgroundColor: "#ffffff", border: "1px solid #ebdbe2", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#4C0F2D" }}>Add New Store Offer:</span>
                    <div className="sl-grid-2">
                      <input
                        type="text"
                        placeholder="Offer Title (e.g. 20% Off Diamond Jewellery Making Charges) *"
                        value={newOfferTitle}
                        onChange={(e) => setNewOfferTitle(e.target.value)}
                        className="sl-input"
                      />
                      <input
                        type="text"
                        placeholder="Offer Short Details / Description"
                        value={newOfferDesc}
                        onChange={(e) => setNewOfferDesc(e.target.value)}
                        className="sl-input"
                      />
                    </div>
                    <div className="sl-grid-3">
                      <div className="sl-field">
                        <label className="sl-label">Start Date</label>
                        <input
                          type="date"
                          value={newOfferStart}
                          onChange={(e) => setNewOfferStart(e.target.value)}
                          className="sl-input"
                        />
                      </div>
                      <div className="sl-field">
                        <label className="sl-label">Valid Until (Expiry)</label>
                        <input
                          type="date"
                          value={newOfferEnd}
                          onChange={(e) => setNewOfferEnd(e.target.value)}
                          className="sl-input"
                        />
                      </div>
                      <div className="sl-field">
                        <label className="sl-label">Terms & Conditions</label>
                        <input
                          type="text"
                          placeholder="e.g. On purchases above ₹50,000"
                          value={newOfferTerms}
                          onChange={(e) => setNewOfferTerms(e.target.value)}
                          className="sl-input"
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleAddOffer}
                        className="sl-btn-primary"
                        style={{ padding: "8px 18px", fontSize: "12px" }}
                      >
                        <Plus size={14} /> Attach Offer
                      </button>
                    </div>
                  </div>

                  {/* Existing Offers */}
                  {existingOffers.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                      {existingOffers.map((offer) => {
                        const isExpired = offer.end_date && new Date(offer.end_date) < new Date();
                        return (
                          <div
                            key={offer.id}
                            className={`sl-form-offer-item ${isExpired ? "expired" : ""}`}
                          >
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontWeight: 700, fontSize: "13px", color: "#2d161d" }}>{offer.title}</span>
                                <span className={`sl-offer-meta-badge ${isExpired ? "expired" : "active"}`}>
                                  {isExpired ? "EXPIRED (HIDDEN FROM CUSTOMERS)" : "ACTIVE"}
                                </span>
                              </div>
                              {offer.description && (
                                <p style={{ fontSize: "12px", color: "#6b5860", margin: "2px 0 0 0" }}>{offer.description}</p>
                              )}
                              <div style={{ fontSize: "11px", color: "#8a7b81", marginTop: "4px", display: "flex", gap: "12px" }}>
                                {offer.end_date && (
                                  <span>📅 Valid Until: <strong>{new Date(offer.end_date).toLocaleDateString()}</strong></span>
                                )}
                                {offer.terms && <span>📜 Terms: {offer.terms}</span>}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteOffer(offer.id)}
                              className="sl-icon-btn delete"
                              title="Delete offer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 7: Private Internal Audit & Provenance [Strictly Admin Only] */}
              <div className="sl-form-section audit">
                <div className="sl-section-heading">
                  <span className="sl-section-title">
                    <ShieldAlert size={16} style={{ color: "#b45309" }} />
                    7. Private Internal Audit & Provenance (Admin Only)
                  </span>
                  <span style={{ fontSize: "10px", fontWeight: 700, backgroundColor: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "4px" }}>
                    🔒 Strictly Private — Never Shown to Customers
                  </span>
                </div>

                <div className="sl-grid-3">
                  <div className="sl-field">
                    <label className="sl-label">Information Source</label>
                    <input
                      type="text"
                      placeholder="e.g. Field Visit, Store Manager, Trade Fair"
                      value={formInfoSource}
                      onChange={(e) => setFormInfoSource(e.target.value)}
                      className="sl-input"
                    />
                  </div>

                  <div className="sl-field">
                    <label className="sl-label">Store Contact Person & Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. Rajesh (Owner) 987..."
                      value={formStoreContact}
                      onChange={(e) => setFormStoreContact(e.target.value)}
                      className="sl-input"
                    />
                  </div>

                  <div className="sl-field">
                    <label className="sl-label">Photo Permissions</label>
                    <input
                      type="text"
                      placeholder="e.g. Direct Owner Consent, Public Domain"
                      value={formPhotoPermissions}
                      onChange={(e) => setFormPhotoPermissions(e.target.value)}
                      className="sl-input"
                    />
                  </div>
                </div>

                <div className="sl-field">
                  <label className="sl-label">Internal Verification Notes & Approval</label>
                  <textarea
                    rows={2}
                    placeholder="Private team notes: verification call date, documents checked, approval notes..."
                    value={formInternalNotes}
                    onChange={(e) => setFormInternalNotes(e.target.value)}
                    className="sl-textarea"
                  />
                </div>
              </div>

              {/* SECTION 8: Verification & Publication Status */}
              <div className="sl-form-section" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={formIsVerified}
                    onChange={(e) => setFormIsVerified(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "#4C0F2D" }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "14px", color: "#2d161d" }}>
                      <ShieldCheck size={17} style={{ color: "#b4860b" }} />
                      Display "Verified Jeweller" Badge
                    </div>
                    <span style={{ fontSize: "11px", color: "#8a7b81" }}>
                      Only show badge after internal verification is completed by our team.
                    </span>
                  </div>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#4C0F2D" }}>Listing Status:</span>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="sl-select"
                    style={{ width: "auto", fontWeight: 700 }}
                  >
                    <option value="DRAFT">DRAFT (Incomplete / Pending)</option>
                    <option value="PUBLISHED">PUBLISHED (Live on Platform)</option>
                    <option value="UNPUBLISHED">UNPUBLISHED (Hidden)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sl-modal-footer">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="sl-btn-secondary"
              >
                <span style={{ color: "#4C0F2D", fontWeight: 600 }}>Cancel</span>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveStore("DRAFT")}
                  className="sl-btn-secondary"
                  style={{ borderColor: "#fde68a", backgroundColor: "#fffbeb", color: "#92400e" }}
                >
                  <span style={{ color: "#92400e", fontWeight: 700 }}>
                    {isSubmitting ? "Saving…" : "Save as Draft"}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveStore("PUBLISHED")}
                  className="sl-btn-primary"
                  style={{ color: "#ffffff" }}
                >
                  {isSubmitting ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ffffff" }}>
                      <Loader2 size={15} className="sl-spinner" style={{ color: "#ffffff" }} /> Saving…
                    </span>
                  ) : (
                    <span style={{ color: "#ffffff", fontWeight: 700 }}>Publish Listing</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: Customer Profile Live Preview
          ═══════════════════════════════════════════════════════════ */}
      {previewStore && (
        <div className="sl-modal-overlay">
          <div className="sl-modal-card" style={{ maxWidth: "840px" }}>
            {/* Header bar */}
            <div className="sl-modal-header" style={{ padding: "14px 20px" }}>
              <div className="sl-modal-title-row">
                <Eye size={17} style={{ color: "#fef08a" }} />
                <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#ffffff" }}>
                  Customer Live Profile Preview
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <a
                  href={getUserPanelStoreUrl(previewStore.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sl-preview-open-userpanel-btn"
                  title="Open this store profile page on the customer User Panel website"
                >
                  <span>Open on User Panel</span>
                  <ExternalLink size={13} />
                </a>
                <button onClick={() => setPreviewStore(null)} className="sl-modal-close-btn">
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Profile Content */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {/* Cover Banner */}
              <div className="sl-preview-banner">
                {previewStore.cover_photo_url ? (
                  <>
                    <div
                      className="sl-preview-banner-ambient"
                      style={{ backgroundImage: `url(${previewStore.cover_photo_url})` }}
                    />
                    <img
                      src={previewStore.cover_photo_url}
                      alt={previewStore.store_name}
                      className="sl-preview-banner-main"
                    />
                  </>
                ) : (
                  <div className="sl-preview-banner-fallback" />
                )}
                <div className="sl-preview-banner-overlay" />
              </div>

              {/* Store Details Box */}
              <div className="sl-preview-content">
                <div className="sl-preview-card">
                  {/* Hero identity row matching Screenshot 3 */}
                  <div className="sl-preview-store-header">
                    <div className="sl-preview-identity-left">
                      <div className="sl-preview-logo-box">
                        {previewStore.logo_url ? (
                          <img src={previewStore.logo_url} alt={previewStore.store_name} />
                        ) : (
                          <Building2 size={36} style={{ color: "#b8849a" }} />
                        )}
                      </div>
                      <div className="sl-preview-title-block">
                        <div className="sl-preview-title-row">
                          <h2 className="sl-preview-title">{previewStore.store_name}</h2>
                          {previewStore.is_verified && (
                            <span className="sl-badge-toggle verified" style={{ cursor: "default" }}>
                              <ShieldCheck size={14} style={{ color: "#b4860b" }} />
                              <span>Verified Jeweller</span>
                            </span>
                          )}
                        </div>
                        <p className="sl-preview-loc-text">
                          <MapPin size={14} style={{ color: "#dc2626", flexShrink: 0 }} />
                          <span>
                            <strong>{previewStore.address}</strong> • {previewStore.city}, {previewStore.state}, {previewStore.country || "India"} {previewStore.pincode ? `- ${previewStore.pincode}` : ""}
                          </span>
                        </p>
                        {previewStore.categories && previewStore.categories.length > 0 && (
                          <div className="sl-preview-cats-wrap">
                            {previewStore.categories.map((c, i) => (
                              <span key={i} className="sl-cat-badge">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sl-preview-meta-right">
                      <span className={`sl-badge-toggle ${previewStore.status === "PUBLISHED" ? "published" : "draft"}`}>
                        <span className={`sl-status-dot ${previewStore.status === "PUBLISHED" ? "green" : "amber"}`} />
                        {previewStore.status}
                      </span>
                      <span className="sl-preview-updated-date">
                        Listing updated: {previewStore.updated_at ? formatDateDMY(previewStore.updated_at) : "Recently"}
                      </span>
                    </div>
                  </div>

                  {/* ── CUSTOMER CONTACT CTAs (Website, Directions, Call, WhatsApp, Email) ── */}
                  <div className="sl-cta-grid" style={{ gridTemplateColumns: (previewStore.email || (previewStore.emails && previewStore.emails.length > 0)) ? "repeat(auto-fit, minmax(130px, 1fr))" : undefined }}>
                    <a
                      href={previewStore.website || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`sl-cta-btn website ${!previewStore.website ? "disabled" : ""}`}
                      style={!previewStore.website ? { opacity: 0.5, pointerEvents: "none" } : {}}
                    >
                      <Globe size={16} />
                      <span>Visit Website</span>
                    </a>

                    <a
                      href={
                        previewStore.google_maps_link ||
                        `https://maps.google.com/?q=${encodeURIComponent(`${previewStore.store_name} ${previewStore.address} ${previewStore.city}`)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sl-cta-btn directions"
                    >
                      <MapPin size={16} style={{ color: "#dc2626" }} />
                      <span>Get Directions</span>
                    </a>

                    <a
                      href={`tel:${previewStore.phone}`}
                      className="sl-cta-btn call"
                    >
                      <Phone size={16} />
                      <span>Call Store</span>
                    </a>

                    <a
                      href={
                        previewStore.whatsapp
                          ? `https://wa.me/${previewStore.whatsapp.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(previewStore.store_name)}%2C%20I%20found%20your%20store%20on%20JewellersParadise.`
                          : `https://wa.me/${previewStore.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(previewStore.store_name)}%2C%20I%20found%20your%20store%20on%20JewellersParadise.`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sl-cta-btn whatsapp"
                    >
                      <WhatsAppIcon size={16} />
                      <span>WhatsApp Store</span>
                    </a>

                    {(previewStore.email || (previewStore.emails && previewStore.emails.length > 0)) && (
                      <a
                        href={`mailto:${previewStore.email || previewStore.emails?.[0]}`}
                        className="sl-cta-btn email"
                        style={{ backgroundColor: "#ffffff", border: "1px solid #ebdbe2", color: "#4C0F2D" }}
                      >
                        <Mail size={16} style={{ color: "#4C0F2D" }} />
                        <span>Email Store</span>
                      </a>
                    )}
                  </div>

                  {/* About Store Description */}
                  {previewStore.short_description && (
                    <div style={{ marginBottom: "20px" }}>
                      <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#47303d", margin: 0 }}>
                        {previewStore.short_description}
                      </p>
                    </div>
                  )}

                                {/* ── Comprehensive Details Grid: Address, Contacts, Schedule & Socials ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px", marginBottom: "22px" }}>
                  {/* Card 1: Address & Country */}
                  <div style={{ backgroundColor: "#fdfbfc", border: "1px solid #ebdbe2", borderRadius: "12px", padding: "14px" }}>
                    <span style={{ fontWeight: 800, fontSize: "12px", color: "#4C0F2D", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <MapPin size={14} style={{ color: "#dc2626" }} /> Showroom Location
                    </span>
                    <p style={{ fontSize: "13px", color: "#47303d", margin: "0 0 4px 0", fontWeight: 500 }}>
                      {previewStore.address}
                    </p>
                    <p style={{ fontSize: "12.5px", color: "#7a636f", margin: 0 }}>
                      <strong>{previewStore.city}</strong>, {previewStore.state}, <strong>{previewStore.country || "India"}</strong> {previewStore.pincode ? `- ${previewStore.pincode}` : ""}
                    </p>
                  </div>

                  {/* Card 2: Contact Numbers & Email Addresses */}
                  <div style={{ backgroundColor: "#fdfbfc", border: "1px solid #ebdbe2", borderRadius: "12px", padding: "14px" }}>
                    <span style={{ fontWeight: 800, fontSize: "12px", color: "#4C0F2D", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <Phone size={14} style={{ color: "#b4860b" }} /> Contact Phone & Email
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {/* Phones list */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", fontSize: "12.5px" }}>
                        <span style={{ color: "#8a7b81", fontSize: "11px", fontWeight: 700 }}>PHONE:</span>
                        {(previewStore.phones && previewStore.phones.length > 0 ? previewStore.phones : [previewStore.phone]).map((ph, idx) => (
                          <a
                            key={idx}
                            href={`tel:${ph.replace(/[^0-9+]/g, '')}`}
                            style={{ color: "#4C0F2D", fontWeight: 600, textDecoration: "none", backgroundColor: "#fbf0f4", padding: "2px 6px", borderRadius: "4px" }}
                          >
                            {ph}
                          </a>
                        ))}
                      </div>

                      {/* Emails list */}
                      {(previewStore.email || (previewStore.emails && previewStore.emails.length > 0)) && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", fontSize: "12.5px", marginTop: "3px" }}>
                          <span style={{ color: "#8a7b81", fontSize: "11px", fontWeight: 700 }}>EMAIL:</span>
                          {(previewStore.emails && previewStore.emails.length > 0 ? previewStore.emails : [previewStore.email!]).map((em, idx) => (
                            <a
                              key={idx}
                              href={`mailto:${em}`}
                              style={{ color: "#1e3a8a", fontWeight: 600, textDecoration: "none", backgroundColor: "#eff6ff", padding: "2px 6px", borderRadius: "4px" }}
                            >
                              {em}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Operating Hours & Weekly Off with Daywise breakdown */}
                  <div style={{ backgroundColor: "#fdfbfc", border: "1px solid #ebdbe2", borderRadius: "12px", padding: "14px", gridColumn: "span 1" }}>
                    <span style={{ fontWeight: 800, fontSize: "12px", color: "#4C0F2D", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <Clock size={14} style={{ color: "#059669" }} /> Opening Hours & Weekly Off
                    </span>
                    <p style={{ fontSize: "13px", color: "#47303d", margin: "0 0 4px 0" }}>
                      Standard: <strong>{previewStore.opening_hours || "10:00 AM - 08:30 PM"}</strong>
                    </p>
                    <p style={{ fontSize: "12.5px", color: "#7a636f", margin: "0 0 6px 0" }}>
                      Weekly Holiday: <strong style={{ color: (previewStore.weekly_holidays && previewStore.weekly_holidays.length > 0) || (previewStore.weekly_holiday && previewStore.weekly_holiday !== "None") ? "#dc2626" : "#059669" }}>
                        {previewStore.weekly_holidays && previewStore.weekly_holidays.length > 0
                          ? previewStore.weekly_holidays.join(", ")
                          : (previewStore.weekly_holiday || "None (Open 7 Days)")}
                      </strong>
                    </p>

                    {/* Daywise Breakdown if available */}
                    {previewStore.daywise_hours && (
                      <div style={{ marginTop: "8px", borderTop: "1px dashed #ebdbe2", paddingTop: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#8a7b81", display: "block", marginBottom: "4px" }}>
                          DAY-BY-DAY SCHEDULE:
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "4px" }}>
                          {DAYS_OF_WEEK.map((d) => {
                            const sched = (previewStore.daywise_hours as any)?.[d];
                            if (!sched) return null;
                            return (
                              <div
                                key={d}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "11px",
                                  padding: "3px 6px",
                                  borderRadius: "4px",
                                  backgroundColor: sched.is_closed ? "#fee2e2" : "#f0fdf4",
                                  color: sched.is_closed ? "#991b1b" : "#166534"
                                }}
                              >
                                <strong>{d.slice(0, 3)}:</strong>
                                <span>{sched.is_closed ? "Off" : `${sched.open} - ${sched.close}`}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 4: Social Network Profiles */}
                  {previewStore.social_links && Object.keys(previewStore.social_links).length > 0 && (
                    <div style={{ backgroundColor: "#fdfbfc", border: "1px solid #ebdbe2", borderRadius: "12px", padding: "14px" }}>
                      <span style={{ fontWeight: 800, fontSize: "12px", color: "#4C0F2D", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                        <Share2 size={14} style={{ color: "#7c3aed" }} /> Social Network Channels
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {Object.entries(previewStore.social_links).map(([platform, url]) => {
                          if (!url) return null;
                          const found = SOCIAL_PLATFORMS.find((p) => p.id === platform);
                          const name = found ? found.name : platform;
                          return (
                            <a
                              key={platform}
                              href={url.startsWith("http") ? url : `https://${url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                backgroundColor: "#ffffff",
                                border: "1px solid #ebdbe2",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                color: "#4C0F2D",
                                textDecoration: "none",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                              }}
                            >
                              {getSocialIconPreview(platform)}
                              <span>{name}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Photo Gallery Grid */}
                {previewStore.gallery && previewStore.gallery.length > 0 && (
                  <div style={{ marginBottom: "24px" }}>
                    <h4 style={{ fontFamily: "var(--sl-font-heading)", fontSize: "16px", color: "#4C0F2D", margin: "0 0 10px 0" }}>
                      Showroom & Collection Gallery
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                      {previewStore.gallery.map((g) => (
                        <div key={g.id} style={{ height: "90px", borderRadius: "12px", overflow: "hidden", border: "1px solid #ebdbe2" }}>
                          <img src={g.image_url} alt="Gallery item" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Offers (Expired Offers are Automatically Hidden in Customer View) */}
                {previewStore.offers && previewStore.offers.length > 0 && (
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <h4 style={{ fontFamily: "var(--sl-font-heading)", fontSize: "16px", color: "#4C0F2D", margin: 0 }}>
                        Active Showroom Offers
                      </h4>
                      <span style={{ fontSize: "11px", color: "#8a7b81" }}>
                        Confirmed with Jeweller
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {previewStore.offers
                        .filter((o) => !o.end_date || new Date(o.end_date) >= new Date())
                        .map((offer) => (
                          <div
                            key={offer.id}
                            style={{
                              backgroundColor: "#ffffff",
                              border: "1px solid #ebdbe2",
                              borderRadius: "14px",
                              padding: "16px",
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              boxShadow: "0 2px 8px rgba(76, 15, 45, 0.04)"
                            }}
                          >
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontWeight: 800, fontSize: "14px", color: "#4C0F2D" }}>{offer.title}</span>
                                <span className="sl-offer-meta-badge active">OFFER LIVE</span>
                              </div>
                              {offer.description && (
                                <p style={{ fontSize: "13px", color: "#47303d", margin: "4px 0" }}>{offer.description}</p>
                              )}
                              <div style={{ fontSize: "11.5px", color: "#8a7b81", display: "flex", gap: "14px", marginTop: "6px" }}>
                                {offer.end_date && <span>📅 Valid Until: <strong>{new Date(offer.end_date).toLocaleDateString()}</strong></span>}
                                {offer.terms && <span>📜 Terms: {offer.terms}</span>}
                              </div>
                            </div>
                            <Tag size={20} style={{ color: "#d4af37", flexShrink: 0 }} />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* ── MANDATORY LISTING DISCLAIMER ── */}
                <div className="sl-disclaimer-card">
                  <div className="sl-disclaimer-header">
                    <AlertCircle size={16} />
                    <span>Listing Disclaimer</span>
                  </div>
                  <p style={{ margin: 0, fontStyle: "italic" }}>
                    “JewellersParadise is a jewellery offers discovery platform. Purchases and enquiries are handled directly by the jeweller. Please confirm offer availability and terms with the store.”
                  </p>
                </div>

                {/* Secondary Customer Links */}
                <div className="sl-secondary-links-row">
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(true)}
                    className="sl-text-link"
                    style={{ background: "none", border: "none", padding: 0 }}
                  >
                    Own this store? Claim or update this listing
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="sl-text-link muted"
                    style={{ background: "none", border: "none", padding: 0 }}
                  >
                    Report incorrect details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: Customer "Claim or Update This Store" Dialog
          ═══════════════════════════════════════════════════════════ */}
      {isClaimModalOpen && previewStore && (
        <div className="sl-modal-overlay">
          <div className="sl-modal-card" style={{ maxWidth: "520px" }}>
            <div className="sl-modal-header">
              <div className="sl-modal-title-row">
                <ShieldCheck size={18} style={{ color: "#fde68a" }} />
                <h3 className="sl-modal-title">Claim Store Listing</h3>
              </div>
              <button onClick={() => setIsClaimModalOpen(false)} className="sl-modal-close-btn">
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmitCustomerClaim} className="sl-modal-body">
              <p style={{ fontSize: "12px", color: "#6b5860", margin: 0 }}>
                Are you the official owner or representative of <strong>{previewStore.store_name}</strong>?
                Submit your claim to manage details and publish exclusive offers directly.
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
                  <label className="sl-label">Official Phone <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    value={claimPhone}
                    onChange={(e) => setClaimPhone(e.target.value)}
                    className="sl-input"
                  />
                </div>

                <div className="sl-field">
                  <label className="sl-label">Work Email <span className="req">*</span></label>
                  <input
                    type="email"
                    required
                    placeholder="owner@jeweller.com"
                    value={claimEmail}
                    onChange={(e) => setClaimEmail(e.target.value)}
                    className="sl-input"
                  />
                </div>
              </div>

              <div className="sl-field">
                <label className="sl-label">Verification Proof Type</label>
                <select
                  value={claimProofType}
                  onChange={(e) => setClaimProofType(e.target.value)}
                  className="sl-select"
                >
                  <option value="GST Certificate">GST Certificate</option>
                  <option value="Shop & Establishment License">Shop & Establishment License</option>
                  <option value="Electricity / Utility Bill">Electricity / Utility Bill</option>
                  <option value="Visiting Card / Letterhead">Visiting Card / Letterhead</option>
                </select>
              </div>

              <div className="sl-field">
                <label className="sl-label">
                  Upload Proof Document / Card <span className="opt">(PDF, JPG, PNG — Max 10MB)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
                  onChange={(e) => setClaimProofFile(e.target.files?.[0] || null)}
                  className="sl-input"
                  style={{ padding: "6px" }}
                />
                <span style={{ fontSize: "11px", color: "#8a7b82", marginTop: "3px", display: "block" }}>
                  Accepted formats: <strong>PDF (.pdf)</strong>, <strong>JPG (.jpg, .jpeg)</strong>, <strong>PNG (.png)</strong>, <strong>WebP</strong> (e.g. GST Certificate, Trade License, Shop Act, or Business Card).
                </span>
                {claimProofFile && (
                  <div style={{ marginTop: "6px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 8px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "6px", fontSize: "11.5px", color: "#065f46", fontWeight: 600 }}>
                    <span>✓ Selected: {claimProofFile.name} ({(claimProofFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>

              <div className="sl-field">
                <label className="sl-label">Additional Verification Notes</label>
                <textarea
                  rows={2}
                  placeholder="Tell our verification team about your role..."
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  className="sl-textarea"
                />
              </div>

              <div className="sl-modal-footer" style={{ margin: "8px -24px -24px -24px" }}>
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
                >
                  {isSubmittingClaim ? "Submitting…" : "Submit Claim Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: Customer "Report Incorrect Details" Dialog
          ═══════════════════════════════════════════════════════════ */}
      {isReportModalOpen && previewStore && (
        <div className="sl-modal-overlay">
          <div className="sl-modal-card" style={{ maxWidth: "500px" }}>
            <div className="sl-modal-header">
              <div className="sl-modal-title-row">
                <AlertTriangle size={18} style={{ color: "#fde68a" }} />
                <h3 className="sl-modal-title">Report Incorrect Details</h3>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="sl-modal-close-btn">
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmitCustomerReport} className="sl-modal-body">
              <p style={{ fontSize: "12px", color: "#6b5860", margin: 0 }}>
                Spotted outdated or inaccurate information on <strong>{previewStore.store_name}</strong>?
                Let our team know and we will verify and correct it promptly.
              </p>

              <div className="sl-field">
                <label className="sl-label">Issue Category <span className="req">*</span></label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="sl-select"
                >
                  <option value="Wrong Phone / Contact">Wrong Phone / Contact</option>
                  <option value="Incorrect Address or PIN">Incorrect Address or PIN</option>
                  <option value="Store Permanently Closed">Store Permanently Closed</option>
                  <option value="Wrong Operating Hours">Wrong Operating Hours</option>
                  <option value="Expired or Inaccurate Offer">Expired or Inaccurate Offer</option>
                  <option value="Other Inaccuracy">Other Inaccuracy</option>
                </select>
              </div>

              <div className="sl-field">
                <label className="sl-label">Details of the Correction <span className="req">*</span></label>
                <textarea
                  required
                  rows={3}
                  placeholder="Please describe what information is incorrect and provide the accurate details if known..."
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="sl-textarea"
                />
              </div>

              <div className="sl-field">
                <label className="sl-label">Your Email <span className="opt">(optional, for confirmation)</span></label>
                <input
                  type="email"
                  placeholder="you@domain.com"
                  value={reportEmail}
                  onChange={(e) => setReportEmail(e.target.value)}
                  className="sl-input"
                />
              </div>

              <div className="sl-modal-footer" style={{ margin: "8px -24px -24px -24px" }}>
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
                >
                  {isSubmittingReport ? "Submitting…" : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: Claims & Reports Management (Admin)
          ═══════════════════════════════════════════════════════════ */}
      {isRequestsModalOpen && (
        <div className="sl-modal-overlay">
          <div className="sl-modal-card" style={{ maxWidth: "760px" }}>
            <div className="sl-modal-header">
              <div className="sl-modal-title-row">
                <ShieldAlert size={18} style={{ color: "#fef08a" }} />
                <h3 className="sl-modal-title">Store Claims & Correction Reports</h3>
              </div>
              <button onClick={() => setIsRequestsModalOpen(false)} className="sl-modal-close-btn">
                <X size={17} />
              </button>
            </div>

            {/* Tabs */}
            <div className="sl-req-tabs">
              <button
                onClick={() => setRequestsTab("claims")}
                className={`sl-req-tab-btn ${requestsTab === "claims" ? "active" : ""}`}
              >
                Ownership Claims ({claims.length})
              </button>
              <button
                onClick={() => setRequestsTab("reports")}
                className={`sl-req-tab-btn ${requestsTab === "reports" ? "active" : ""}`}
              >
                Detail Correction Reports ({reports.length})
              </button>
            </div>

            {/* List */}
            <div className="sl-modal-body" style={{ minHeight: "260px" }}>
              {requestsTab === "claims" ? (
                claims.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "50px 20px", color: "#8a7b81" }}>
                    <ShieldCheck size={36} style={{ color: "#d4af37", margin: "0 auto 8px auto" }} />
                    <p style={{ fontWeight: 600, fontSize: "14px" }}>No ownership claim requests pending.</p>
                  </div>
                ) : (
                  claims.map((c) => (
                    <div key={c.id} className="sl-req-card">
                      <div className="sl-req-card-header">
                        <span className="sl-req-store-name">
                          Store: {c.store?.store_name || `Store #${c.store_id}`}
                        </span>
                        <span className={`sl-req-status-badge ${c.status.toLowerCase()}`}>
                          {c.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#3b202c" }}>
                        Claimant: <strong>{c.claimant_name}</strong> • Phone: <a href={`tel:${c.claimant_phone}`}>{c.claimant_phone}</a> • Email: <a href={`mailto:${c.claimant_email}`}>{c.claimant_email}</a>
                      </div>
                      {/* Formatted Proof Document Section */}
                      {(c.proof_type || c.proof_doc_url) && (
                        <div className="sl-proof-card">
                          <div className="sl-proof-header">
                            📋 Proof Type: <strong>{c.proof_type || "Business Verification"}</strong>
                          </div>
                          {c.proof_doc_url && (() => {
                            const url = c.proof_doc_url.trim();
                            const isGstin = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(url) || (url.length === 15 && !url.includes("/") && !url.includes("."));
                            const isPdf = /\.pdf($|\?)/i.test(url) || url.includes("application/pdf");
                            const isImage = /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url) || url.includes("/image/upload");
                            const isDrive = url.includes("drive.google.com") || url.includes("dropbox.com") || url.includes("onedrive");

                            if (isGstin) {
                              return (
                                <div className="sl-proof-gstin-box">
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span className="sl-gstin-badge">GSTIN Format</span>
                                    <code className="sl-gstin-code">{url.toUpperCase()}</code>
                                  </div>
                                  <a
                                    href="https://services.gst.gov.in/services/searchtpbypan"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="sl-proof-link-btn gstin"
                                    title="Verify GSTIN on official Government GST portal"
                                  >
                                    <span>Verify on GST Portal</span>
                                    <ExternalLink size={12} />
                                  </a>
                                </div>
                              );
                            }

                            if (isPdf) {
                              const filename = url.split('/').pop()?.split('?')[0] || "Verification_Document.pdf";
                              return (
                                <div className="sl-proof-file-box">
                                  <div className="sl-proof-file-info">
                                    <span className="sl-file-icon pdf">PDF</span>
                                    <div>
                                      <div className="sl-proof-filename">{filename}</div>
                                      <span className="sl-proof-file-format">Adobe Acrobat Portable Document</span>
                                    </div>
                                  </div>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="sl-proof-link-btn"
                                  >
                                    <span>View PDF Document</span>
                                    <ExternalLink size={12} />
                                  </a>
                                </div>
                              );
                            }

                            if (isImage) {
                              const filename = url.split('/').pop()?.split('?')[0] || "Proof_Image";
                              return (
                                <div className="sl-proof-file-box">
                                  <div className="sl-proof-file-info">
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                      <img src={url} alt="Proof" className="sl-proof-img-thumb" />
                                    </a>
                                    <div>
                                      <div className="sl-proof-filename">{filename}</div>
                                      <span className="sl-proof-file-format">Image Document (JPG/PNG/WebP)</span>
                                    </div>
                                  </div>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="sl-proof-link-btn"
                                  >
                                    <span>View Full Image</span>
                                    <ExternalLink size={12} />
                                  </a>
                                </div>
                              );
                            }

                            return (
                              <div className="sl-proof-file-box">
                                <div className="sl-proof-file-info">
                                  <span className="sl-file-icon link">{isDrive ? "CLOUD" : "LINK"}</span>
                                  <div>
                                    <div className="sl-proof-filename">{url}</div>
                                    <span className="sl-proof-file-format">{isDrive ? "Google Drive / Cloud Folder" : "External Document Link"}</span>
                                  </div>
                                </div>
                                <a
                                  href={url.startsWith("http") ? url : `https://${url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="sl-proof-link-btn"
                                >
                                  <span>Open Document Link</span>
                                  <ExternalLink size={12} />
                                </a>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      {c.notes && (
                        <div style={{ fontSize: "12px", color: "#8a7b81", fontStyle: "italic", backgroundColor: "#fdfbfc", padding: "6px 10px", borderRadius: "8px" }}>
                          "{c.notes}"
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <button
                          onClick={async () => {
                            await updateAdminStoreClaim(c.id, { status: "APPROVED", adminNotes: "Approved by Admin team" });
                            toast.success("Claim approved!");
                            fetchRequests();
                          }}
                          className="sl-btn-primary"
                          style={{ padding: "6px 14px", fontSize: "12px", backgroundColor: "#059669" }}
                        >
                          Approve Claim
                        </button>
                        <button
                          onClick={async () => {
                            await updateAdminStoreClaim(c.id, { status: "REJECTED", adminNotes: "Proof insufficient" });
                            toast.success("Claim rejected");
                            fetchRequests();
                          }}
                          className="sl-btn-secondary"
                          style={{ padding: "6px 14px", fontSize: "12px", color: "#dc2626", borderColor: "#fecaca" }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : reports.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px 20px", color: "#8a7b81" }}>
                  <CheckCircle2 size={36} style={{ color: "#059669", margin: "0 auto 8px auto" }} />
                  <p style={{ fontWeight: 600, fontSize: "14px" }}>No correction reports pending.</p>
                </div>
              ) : (
                reports.map((r) => (
                  <div key={r.id} className="sl-req-card">
                    <div className="sl-req-card-header">
                      <span className="sl-req-store-name">
                        Store: {r.store?.store_name || `Store #${r.store_id}`}
                      </span>
                      <span className={`sl-req-status-badge ${r.status.toLowerCase()}`}>
                        {r.report_type}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#3b202c" }}>
                      {r.description}
                    </div>
                    {r.reported_by_email && (
                      <div style={{ fontSize: "11.5px", color: "#8a7b81" }}>
                        Submitted by: {r.reported_by_email}
                      </div>
                    )}
                    <div style={{ marginTop: "4px" }}>
                      <button
                        onClick={async () => {
                          await updateAdminStoreReport(r.id, { status: "RESOLVED", adminNotes: "Details verified and updated" });
                          toast.success("Report marked resolved!");
                          fetchRequests();
                        }}
                        className="sl-btn-primary"
                        style={{ padding: "6px 14px", fontSize: "12px", backgroundColor: "#059669" }}
                      >
                        Mark as Resolved
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="sl-modal-overlay">
          <div className="sl-modal-card" style={{ maxWidth: "420px", padding: "24px", textAlign: "center" }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "16px",
              backgroundColor: "#fee2e2", color: "#dc2626",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px auto"
            }}>
              <AlertTriangle size={28} />
            </div>
            <h3 style={{ fontFamily: "var(--sl-font-heading)", fontSize: "18px", color: "#2d161d", margin: "0 0 8px 0" }}>
              Delete Store Listing?
            </h3>
            <p style={{ fontSize: "13px", color: "#8a7b81", margin: "0 0 20px 0", lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>"{deleteTarget.store_name}"</strong>? This will permanently remove its profile, gallery photos, and active offers.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              <button
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="sl-btn-secondary"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="sl-btn-primary"
                style={{ backgroundColor: "#dc2626" }}
              >
                {isDeleting ? "Deleting…" : "Yes, Delete Listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
